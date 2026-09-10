// One exchange: two locked SEQUENCES, one shared clock.
//
// Both sides play an ordered list of cards. A card chains off the previous
// card's recovery, which means the schedule is DISCOVERED as it runs rather
// than precomputed -- lodging lengthens a recovery, so an axe that buries
// itself costs you tempo three cards later. That only exists once there is a
// "later", which is why sequences had to come before any of this could be
// tuned.
//
// What the loop carries between cards, and why none of it is authored:
//
//   Guard position   each hand is left wherever its arc finished. The next
//                    card's windup is scaled by how far that is from where IT
//                    starts (timing.js carryCost). No card ever names another --
//                    it only knows where the body already is, which is what
//                    design notes 09 demands of combos.
//   Footing          a card that threw your mass leaves your base out of line
//                    too. Drive again.
//   Hand concurrency A card using a DIFFERENT hand may begin while the previous
//                    one is still unwinding; the same hand must wait for the
//                    unwind to finish. Not a discount -- limbs overlapping,
//                    the same principle as windup completing during travel.
//                    Alternating hands genuinely interleaves, and two-weapon
//                    fighting is mechanically distinct with no rule for it.
//
// Two consequences, precise and different:
//   Disrupt    cancels the CARD in flight. A hard enough hit landing before the
//              opponent's windup finished (design notes 07).
//   Interrupt  cancels the REST OF THE SEQUENCE, and it is the topple check
//              (section 5.8) rather than a severity threshold -- so a heavy
//              blunt blow puts someone out where an equally damaging thrust
//              does not, and a wide-based creature is genuinely hard to stop.
//
// Still deliberately NOT here:
//   Reactions        the state classification below is exactly what a trigger
//                    will read, but no window opens and no cards are drawn.
//   Contested closing  distance is FIXED for the whole exchange.
//
// The clock is ticks, 100 to the second.

import { K } from "./constants.js";
import { effectiveStats, bodyReach, stability, toppleChance } from "./stats.js";
import { protection } from "./defense.js";
import { phases, lodgeRecovery, exertionCost, exertionBudget, occupancy, carryCost, followThrough } from "./timing.js";
import { profileOf } from "../data/profiles.js";
import { handsUsed } from "../data/cards.js";
import { GUARD, guardDistance, landingSide, along } from "../data/arcs.js";
import { weaponOf } from "../data/fighters.js";
import { composeCurve, rollOn } from "./resolve.js";

/**
 * Reach at a point through the Execution window, as a fraction of full.
 *
 * Rises, HOLDS, falls. The hold is the whole point: a real swing sweeps at near
 * full extension for a good part of its arc, and modelling that as a single
 * instant of peak reach is what made the old prototype's tick size decide
 * outcomes. With a plateau there is no knife edge to step over.
 */
export function reachFraction(elapsed, duration, ramp = K.EXEC_RAMP) {
  if (duration <= 0) return 1;
  const f = elapsed / duration;
  if (f < 0 || f > 1) return 0;
  if (f < ramp) return f / ramp;
  if (f > 1 - ramp) return (1 - f) / ramp;
  return 1;
}

// --- One side ---------------------------------------------------------------

/**
 * A combatant with a locked sequence. Everything fixed at lock-in lives here;
 * everything discovered at resolution is added by the loop.
 *
 * Exertion is totalled now because it is committed now -- time is not, which is
 * the invariant the whole turn structure rests on.
 */
export function prepareSide({ fighter, cards, commitments = [], armor = [], exhaustion = 0, pain = 0, structure = 0, dread = 0, adrenaline = 0 }) {
  const prot = protection(armor);
  const eff = effectiveStats(fighter, {
    wornMass: prot.mass, bulk: prot.bulk, exhaustion, pain, structure, dread, adrenaline,
  });
  const spent = cards.reduce((s, c) => s + exertionCost(c, eff), 0);
  return {
    fighter, armor, exhaustion, pain, structure, dread, adrenaline, eff,
    cards, commitments: cards.map((_, i) => commitments[i] ?? 0),
    budget: exertionBudget(eff),
    spent,
    stability: stability(fighter, prot.mass),
    // Both hands start centred. MID_CENTRE is the grid's hub, which is
    // why a sequence that returns to centre is cheap to continue from.
    handPos: { main: GUARD.MID_CENTRE, off: GUARD.MID_CENTRE },
    handFree: { main: 0, off: 0 },
    cursor: 0, lastDrive: 0,
    interrupted: false, interruptedAt: null,
    steps: [], contacts: [],
  };
}

/** Everything a card needs once we know when it starts and what it carries. */
function beginCard(side, distance, now) {
  const card = side.cards[side.cursor];
  const commitment = side.commitments[side.cursor];
  const hands = handsUsed(card);
  const primary = card.arcs?.[0]?.hand ?? "main";
  const weapon = weaponOf(side.fighter, primary === "off" ? "off" : "main");
  const prot = protection(side.armor, card.classMix ?? {});
  const eff = effectiveStats(side.fighter, {
    wornMass: prot.mass, bulk: prot.bulk,
    exhaustion: side.exhaustion, pain: side.pain, structure: side.structure, dread: side.dread,
    adrenaline: side.adrenaline,
    offhand: primary === "off",
  });

  // Carry is a relationship BETWEEN cards. The opening card of a sequence has
  // no predecessor, so it is neutral -- it has not earned a discount, and the
  // whole calibration is anchored on an uncarried card.
  const carry = (side.steps.length && card.arcs?.length)
    ? carryCost(side.handPos[primary === "both" ? "main" : primary],
                card.arcs[0].from, side.lastDrive, guardDistance)
    : 1;

  const t = phases({
    profile: profileOf(card),
    strengthEff: eff.strength, paceEff: eff.pace,
    weaponMass: weapon?.mass ?? 0,
    recoverability: weapon?.recoverability ?? 0.5,
    distance, moveFactor: card.moveFactor, commitment,
    effort: card.effort ?? 1, carry, nudge: card.phaseNudge,
  });

  const arcs = (card.arcs ?? []).map((a) => {
    const w = weaponOf(side.fighter, a.hand === "off" ? "off" : "main");
    return {
      arc: a, hand: a.hand, weapon: w,
      reach: bodyReach(side.fighter.size) + (w?.reach ?? 0),
      landingSide: landingSide(a),
      landTick: null, whiffed: false,
    };
  });

  const step = {
    index: side.cursor, card, commitment, carry, eff, weapon, hands, arcs,
    start: now, phases: t, recovery: t.recovery, total: t.total,
    cancelled: false,
  };

  side.steps.push(step);
  for (const h of hands) side.handFree[h] = now + t.total;
  return step;
}

/** The most recently started card, whether or not it has finished. */
const lastStep = (side) => side.steps[side.steps.length - 1] ?? null;

/** Steps still on the clock at time t -- more than one, when hands overlap. */
export function inFlight(side, t) {
  return side.steps.filter((s) => !(s.cancelled && t >= s.cancelledAt)
                               && t >= s.start && t < s.start + s.total);
}

/**
 * When may this side's next card begin?
 *
 * One rule, two behaviours: you cannot start before the card in flight is past
 * its own Execution, and you cannot use a hand that is still swinging. So a
 * DIFFERENT hand may begin during the previous card's unwind, while the SAME
 * hand must wait for that unwind to finish. Alternating hands genuinely
 * interleaves; chaining one hand genuinely queues.
 */
function earliestStart(side) {
  if (side.interrupted || side.cursor >= side.cards.length) return Infinity;
  let t = 0;
  for (const h of handsUsed(side.cards[side.cursor])) t = Math.max(t, side.handFree[h]);
  const prev = lastStep(side);
  if (prev) t = Math.max(t, prev.start + prev.phases.active);
  return t;
}

// --- Occupancy and guard ----------------------------------------------------

/**
 * How tied up this side is at time t -- the defensive cost of doing anything.
 * Between cards, and after the sequence ends, it is zero: a fighter standing
 * with nothing queued is genuinely harder to hit, which is a real counterweight
 * to under-queueing that nobody had to author.
 */
export function occupancyAt(side, t) {
  let worst = 0;
  for (const step of side.steps) {
    if (step.cancelled && t >= step.cancelledAt) continue;
    const local = t - step.start;
    if (local < 0 || local >= step.total) continue;
    worst = Math.max(worst, occupancy(local, { ...step.phases, total: step.total }, {
      drive: step.card.drive,
      effort: step.card.effort ?? 1,
      commitment: step.commitment,
      recoverability: step.weapon?.recoverability ?? 0.5,
    }));
  }
  return worst;
}

/** Which hands are busy swinging right now -- a busy shield hand is no shield. */
export function busyHands(side, t) {
  const busy = new Set();
  for (const step of side.steps) {
    if (step.cancelled && t >= step.cancelledAt) continue;
    const local = t - step.start;
    if (local < 0 || local >= step.total) continue;
    for (const h of step.hands) busy.add(h);
  }
  return busy;
}

/**
 * The defender's protection as it stands at this instant: the shield drops out
 * if the hand holding it is busy. A shield BASH therefore spends the shield to
 * throw it, and is undefended on that side while it happens -- emergent, with
 * no rule authored.
 */
function liveArmor(side, t) {
  if (!side.fighter.offHand) return side.armor;
  return busyHands(side, t).has("off")
    ? side.armor.filter((p) => p.side == null)
    : side.armor;
}

// --- Classification ---------------------------------------------------------

/**
 * What the opponent was DOING when this landed. Names a state, never a
 * consequence -- disrupt and interrupt are consequences, and they mean
 * different scopes.
 *
 *   idle        nothing in flight
 *   gathering   their Execution hadn't begun. The disrupt window.
 *   executing   both windows open at once
 *   recovering  landed into their unwind. The exchange this system is built
 *               around: bait the commitment, hit the aftermath.
 *   finished    already done, no overlap
 */
export function classifyAt(side, t) {
  for (const step of side.steps) {
    if (step.cancelled && t >= step.cancelledAt) continue;
    const local = t - step.start;
    if (local < 0 || local >= step.total) continue;
    if (local < step.phases.ready) return "gathering";
    if (local < step.phases.active) return "executing";
    return "recovering";
  }
  const started = side.steps.some((s) => t >= s.start);
  return started ? "finished" : "idle";
}

// --- The loop ---------------------------------------------------------------

export function runExchange({ a, b, distance = K.MELEE_GAP, tick = 1, rng = Math.random, maxTicks = 4000 }) {
  const sides = { a, b };
  const other = { a: b, b: a };
  const log = [];
  let t = 0;

  const allDone = () =>
    ["a", "b"].every((k) => {
      const s = sides[k];
      const noneLeft = s.interrupted || s.cursor >= s.cards.length;
      return noneLeft && inFlight(s, t).length === 0;
    });

  while (t <= maxTicks) {
    // 1. Retire finished cards, leaving each hand where its arc ended. This is
    //    the carry: the next card that wants that hand starts from here.
    for (const k of ["a", "b"]) {
      for (const step of sides[k].steps) {
        if (step.retired || t < step.start + step.total) continue;
        step.retired = true;
        if (step.cancelled) continue;
        for (const arc of step.arcs) {
          // Where the blade actually finished, which is not where it aimed to if
          // something stopped it. A whiffed or unresolved arc completes.
          sides[k].handPos[arc.hand === "both" ? "main" : arc.hand] = arc.endPos ?? arc.arc.to;
        }
      }
    }

    // 2. Start whatever may start now. More than one card can be on the clock
    //    at once when they use different hands.
    for (const k of ["a", "b"]) {
      const s = sides[k];
      if (s.interrupted || s.cursor >= s.cards.length) continue;
      if (t < earliestStart(s)) continue;
      const step = beginCard(s, distance, t);
      s.cursor += 1;
      s.lastDrive = step.card.drive;
      log.push({ t, side: k, event: "begin", card: step.card.name, carry: step.carry,
                 hand: step.arcs[0]?.hand ?? null });
    }

    // 3. Landings. Each ARC is its own contact -- two blades arriving are two
    //    things that could kill you, not one averaged one.
    for (const k of ["a", "b"]) {
      const s = sides[k], d = other[k];
      for (const step of inFlight(s, t)) {
        const local = t - step.start;
        if (local < step.phases.ready) continue;
        const elapsed = local - step.phases.ready;

        for (const arc of step.arcs) {
          if (arc.landTick !== null || arc.whiffed) continue;
          if (elapsed > step.phases.execution) {
            arc.whiffed = true;
            log.push({ t, side: k, event: "whiff", card: step.card.name, reach: arc.reach, gap: distance });
            continue;
          }
          if (reachFraction(elapsed, step.phases.execution) * arc.reach < distance) continue;

          arc.landTick = t;
          const contact = resolveContact({ attacker: s, defender: d, step, arc, distance, t, rng });
          s.contacts.push(contact);
          log.push({ t, side: k, event: "land", card: step.card.name, hand: arc.hand,
                     band: contact.band, severity: contact.severity, against: contact.against });

          // Lodging lengthens THIS card's recovery, which delays everything
          // after it. Discovered now, never at lock-in.
          if (contact.band !== "Miss") {
            step.recovery = lodgeRecovery(step.phases.recovery, contact.penetration,
                                          contact.concentration, arc.weapon?.recoverability ?? 0.5);
            step.total = step.phases.active + step.recovery;
            for (const h of step.hands) s.handFree[h] = Math.max(s.handFree[h], step.start + step.total);
          }

          applyConsequences({ defender: d, defenderKey: k === "a" ? "b" : "a", contact, t, log });
        }
      }
    }

    if (allDone()) break;
    t += tick;
  }

  return { distance, ticks: t, log, a, b, turnLength: t };
}

/** One arc meeting one defender at one instant. */
function resolveContact({ attacker, defender, step, arc, distance, t, rng }) {
  const composed = composeCurve({
    attacker: attacker.fighter, defender: defender.fighter,
    card: step.card, weapon: arc.weapon,
    attackerArmor: attacker.armor, defenderArmor: liveArmor(defender, t),
    exhaustion: attacker.exhaustion, pain: attacker.pain, structure: attacker.structure, dread: attacker.dread,
    adrenaline: attacker.adrenaline, defenderAdrenaline: defender.adrenaline,
    defenderExhaustion: defender.exhaustion, defenderPain: defender.pain,
    defenderStructure: defender.structure,
    defenderDread: defender.dread,
    distance, commitment: step.commitment, carry: step.carry,
    arc: arc.arc, landingSide: arc.landingSide, hand: arc.hand,
    defenderOccupancy: occupancyAt(defender, t),
  });
  const rolled = rollOn(composed.curve, rng);

  // Topple is checked against the SAME roll, never a second one. Because the
  // axis is ordered by placement quality, "the top `topple` fraction" already
  // selects for well-placed blows.
  const follow = followThrough(rolled.band, composed.penetration,
                               composed.concentration, arc.weapon?.recoverability ?? 0.5);
  arc.followThrough = follow;
  arc.endPos = along(arc.arc, follow);

  const topple = toppleChance(composed.momentum.m, composed.penetration,
                              composed.defenderProtection.spread, defender.stability);
  return {
    ...composed, ...rolled, t, hand: arc.hand, card: step.card,
    followThrough: follow, endPos: arc.endPos,
    against: classifyAt(defender, t),
    topple, toppled: rolled.roll >= 100 * (1 - topple),
  };
}

/**
 * Disrupt cancels the CARD in flight; interrupt cancels the REST OF THE
 * SEQUENCE. Different scopes, different triggers, and an interrupt implies a
 * disrupt because whatever was in the air is gone too.
 */
function applyConsequences({ defender, defenderKey, contact, t, log }) {
  const cancelAllInFlight = () => {
    for (const step of inFlight(defender, t)) {
      if (step.cancelled) continue;
      step.cancelled = true;
      step.cancelledAt = t;
    }
  };

  // Interrupt is the topple check, not a damage threshold -- so a heavy blunt
  // blow puts someone out where an equally damaging thrust does not.
  if (contact.toppled && !defender.interrupted) {
    defender.interrupted = true;
    defender.interruptedAt = t;
    cancelAllInFlight();
    log.push({ t, side: defenderKey, event: "interrupt", topple: contact.topple });
    return;
  }
  if (contact.against === "gathering" && contact.severity >= K.DISRUPT_SEVERITY) {
    const caught = inFlight(defender, t).filter((s) => !s.cancelled && t < s.start + s.phases.ready);
    for (const step of caught) {
      step.cancelled = true;
      step.cancelledAt = t;
      log.push({ t, side: defenderKey, event: "disrupt", card: step.card.name });
    }
  }
}
