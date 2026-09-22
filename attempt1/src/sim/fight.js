// A whole fight: turns until somebody is out of it.
//
// This is the instrument, not the game. Everything below lock-in is real -- the
// exchange, the carry, the conditions, the spiral -- but there is no DRAW, so
// cards are chosen by a script or a crude appetite rather than from a hand. That
// makes this a test harness, and it is the first thing that can answer a
// question like "does fast beat slow" or "how many turns does a fight last",
// which no amount of staring at one exchange ever could.
//
// It is also what finally CALLS the between-turn dynamics. painAfter,
// adrenalineAfter and adrenalineBurn have all been written, correct and inert,
// with nothing to run them.
//
// KNOWN BLIND SPOTS. Read every number out of here with both in mind:
//
//   NO REACTIONS. This is the big one. Every attack lands unopposed -- there is no
//   dodging, no reactive stance, no flexibility, nothing that makes a blow simply
//   NOT connect. So fights measured here are far shorter and far more lethal than
//   they will be, and any conclusion of the form "this kills too fast" is
//   measuring the absence of section 07 rather than the damage model.
//
//   NO DRAW. Pain and Dread cannot poison the hand (design notes 10, 11), which is
//   a large part of how bad being wounded is meant to feel -- so this is also
//   somewhat optimistic about the wounded side.

import { K } from "../model/constants.js";
import { effectiveStats, painAfter, structureAfter, harmOf, decisive,
         adrenalineAfter, adrenalineBurn, clamp01 } from "../model/stats.js";
import { protection } from "../model/defense.js";
import { exertionCost, exertionBudget } from "../model/timing.js";
import { prepareSide, runExchange } from "../model/exchange.js";
import { composeCurve } from "../model/resolve.js";
import { landingSide } from "../data/arcs.js";
import { armorOf, weaponOf } from "../data/fighters.js";

/** A combatant across a whole fight. Everything that survives a turn lives here. */
export function makeCombatant(fighter, cardPool) {
  return {
    fighter, armor: armorOf(fighter), pool: cardPool,
    pain: 0, structure: 0, dread: 0, adrenaline: 0, exhaustion: 0,
    out: null,            // "decisive" | "spent" | null
    history: [],
  };
}

function effOf(c) {
  const prot = protection(c.armor);
  return effectiveStats(c.fighter, {
    wornMass: prot.mass, bulk: prot.bulk,
    exhaustion: c.exhaustion, pain: c.pain, structure: c.structure,
    dread: c.dread, adrenaline: c.adrenaline,
  });
}

// --- Choosing cards ---------------------------------------------------------
//
// Stand-ins for the draw. A chooser sees its own combatant and its opponent and
// returns an ordered sequence. When the draw exists these are replaced by the
// player's hand and by a monster's actual decision, and nothing else changes.

/** Fill the budget with whatever comes to hand. Honest, and good for statistics. */
export function randomChooser(rng = Math.random) {
  return (self) => {
    const eff = effOf(self);
    const budget = exertionBudget(eff);
    const seq = [];
    let spent = 0;
    for (let guard = 0; guard < 12; guard++) {
      const affordable = self.pool.filter((c) => spent + exertionCost(c, eff) <= budget);
      if (!affordable.length) break;
      const pick = affordable[Math.floor(rng() * affordable.length)];
      seq.push(pick);
      spent += exertionCost(pick, eff);
    }
    return seq;
  };
}

/**
 * Appetite: take the best severity per point of exertion, against THIS opponent.
 *
 * Crude -- it weighs no tempo, no carry, no defence, and never chooses to leave.
 * But it is enough to run a fight to completion, and it means the numbers reflect
 * two sides actually trying rather than flailing.
 */
export function greedyChooser() {
  return (self, foe) => {
    const eff = effOf(self);
    const budget = exertionBudget(eff);
    const foeEff = effOf(foe);

    const value = (card) => {
      const arc = card.arcs?.[0];
      if (!arc) return 0;
      const w = weaponOf(self.fighter, arc.hand === "off" ? "off" : "main");
      const r = composeCurve({
        attacker: self.fighter, defender: foe.fighter, card, weapon: w,
        attackerArmor: self.armor, defenderArmor: foe.armor,
        arc, landingSide: landingSide(arc), hand: arc.hand,
        exhaustion: self.exhaustion, pain: self.pain, dread: self.dread, adrenaline: self.adrenaline,
        defenderExhaustion: foe.exhaustion, defenderPain: foe.pain,
        defenderDread: foe.dread, defenderAdrenaline: foe.adrenaline,
      });
      return r.meanSeverity / Math.max(0.5, exertionCost(card, eff));
    };

    const ranked = [...self.pool].filter((c) => c.arcs?.length)
      .sort((x, y) => value(y) - value(x));
    const seq = [];
    let spent = 0;
    for (const card of cycle(ranked, 8)) {
      const cost = exertionCost(card, eff);
      if (spent + cost > budget) continue;
      seq.push(card);
      spent += cost;
    }
    return seq.length ? seq : ranked.slice(0, 1);
  };
}

function* cycle(list, times) {
  for (let i = 0; i < times; i++) for (const x of list) yield x;
}

// --- One turn ---------------------------------------------------------------

/**
 * Everything that happens between the end of one exchange and the start of the
 * next. This is the only place the fight's state actually moves.
 */
function settle(self, contactsTaken, spent, budget) {
  const severityTaken = contactsTaken.reduce((s, c) => s + c.severity, 0);
  const before = { pain: self.pain, structure: self.structure,
                   adrenaline: self.adrenaline, exhaustion: self.exhaustion };

  // Both channels accrue PER CONTACT, not on the turn's summed severity. Each
  // blow is a blow, and each meets the headroom left by the ones before it.
  // Summing first made two 40% hits land as 0.73 rather than 0.59, which was
  // enough to end most fights in a single turn.
  for (const c of contactsTaken) {
    self.pain = painAfter(self.pain, c.severity, self.fighter);
    self.structure = structureAfter(self.structure, c.severity, c.card?.classMix ?? {}, self.fighter);
  }

  self.adrenaline = adrenalineAfter(self.adrenaline, {
    severityTaken, dread: self.dread, inCombat: true,
    mindless: self.fighter.flags?.includes("mindless"),
  });

  // The energy economy's other half, finally. Overspending costs you next turn;
  // underspending banks a little, capped so it cannot be hoarded (section 08).
  const over = (spent - budget) / Math.max(1, budget);
  const exhaustionDelta = over > 0
    ? K.OVERSPEND_GAIN * over
    : -K.UNDERSPEND_RELIEF * Math.min(K.UNDERSPEND_CAP, -over);
  self.exhaustion = clamp01(self.exhaustion + exhaustionDelta + adrenalineBurn(self.adrenaline));

  return { before, after: { pain: self.pain, structure: self.structure,
                            harm: harmOf(self.pain, self.structure),
                            adrenaline: self.adrenaline, exhaustion: self.exhaustion } };
}

// --- The fight --------------------------------------------------------------

export function runFight({
  a, b, distance = K.MELEE_GAP, choose = greedyChooser(),
  rng = Math.random, maxTurns = 12,
}) {
  const turns = [];

  for (let n = 1; n <= maxTurns; n++) {
    if (a.out || b.out) break;

    const aCards = choose(a, b), bCards = choose(b, a);
    const sideA = prepareSide({ fighter: a.fighter, armor: a.armor, cards: aCards,
      exhaustion: a.exhaustion, pain: a.pain, structure: a.structure, dread: a.dread, adrenaline: a.adrenaline });
    const sideB = prepareSide({ fighter: b.fighter, armor: b.armor, cards: bCards,
      exhaustion: b.exhaustion, pain: b.pain, structure: b.structure, dread: b.dread, adrenaline: b.adrenaline });

    const ex = runExchange({ a: sideA, b: sideB, distance, rng });

    const dealtBy = (side) => side.contacts.reduce((s, c) => s + c.severity, 0);
    const worstBy = (side) => side.contacts.reduce((m, c) => Math.max(m, c.severity), 0);

    // A decisive blow simply ends it -- no pool to empty, no threshold to cross
    // twice. Checked before settling, because it does not matter how it would
    // have degraded them.
    if (decisive(worstBy(sideA))) b.out = "decisive";
    if (decisive(worstBy(sideB))) a.out = "decisive";

    const settleA = settle(a, sideB.contacts, sideA.spent, sideA.budget);
    const settleB = settle(b, sideA.contacts, sideB.spent, sideB.budget);

    // Not death. The point at which leaving is the only move left, which is the
    // outcome this design wants far more often than a corpse.
    if (!a.out && harmOf(a.pain, a.structure) >= K.PAIN_OUT) a.out = "spent";
    if (!b.out && harmOf(b.pain, b.structure) >= K.PAIN_OUT) b.out = "spent";

    turns.push({
      n, ticks: ex.ticks,
      a: { cards: aCards.map((c) => c.name), spent: sideA.spent, budget: sideA.budget,
           dealt: dealtBy(sideA), contacts: sideA.contacts.length,
           interrupted: sideA.interrupted, ...settleA },
      b: { cards: bCards.map((c) => c.name), spent: sideB.spent, budget: sideB.budget,
           dealt: dealtBy(sideB), contacts: sideB.contacts.length,
           interrupted: sideB.interrupted, ...settleB },
      log: ex.log,
    });
  }

  const winner = a.out && b.out ? "both" : a.out ? "b" : b.out ? "a" : null;
  return {
    turns, winner,
    outcome: winner === null ? "unresolved" : (a.out ?? b.out),
    a, b,
    // Fleeing is the outcome the design most wants and cannot yet produce:
    // no flee card exists, and nothing chooses to leave.
    ticks: turns.reduce((s, t) => s + t.ticks, 0),
  };
}

/**
 * N fights, for the questions that are statistical rather than visual. "Is
 * bash/cut/bash too strong" is not answerable by eye, and this is the first
 * thing in the project that can answer it at all.
 */
export function runBatch({ makeA, makeB, n = 200, ...opts }) {
  const results = { a: 0, b: 0, both: 0, unresolved: 0, decisive: 0, spent: 0, turns: [], ticks: [] };
  for (let i = 0; i < n; i++) {
    const f = runFight({ a: makeA(), b: makeB(), ...opts });
    results[f.winner ?? "unresolved"] += 1;
    if (f.outcome === "decisive" || f.outcome === "spent") results[f.outcome] += 1;
    results.turns.push(f.turns.length);
    results.ticks.push(f.ticks);
  }
  const median = (xs) => [...xs].sort((p, q) => p - q)[Math.floor(xs.length / 2)];
  const mean = (xs) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
  return {
    n, wins: { a: results.a, b: results.b, both: results.both, unresolved: results.unresolved },
    endedBy: { decisive: results.decisive, spent: results.spent },
    turns: { median: median(results.turns), mean: +mean(results.turns).toFixed(2),
             min: Math.min(...results.turns), max: Math.max(...results.turns) },
    seconds: { median: +(median(results.ticks) / 100).toFixed(2),
               mean: +(mean(results.ticks) / 100).toFixed(2) },
  };
}
