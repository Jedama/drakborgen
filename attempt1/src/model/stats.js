// Raw sheet stats -> the numbers the rest of the pipeline actually uses.
//
// Two separate costs of gear, because they are two separate things:
//   Encumbrance is WEIGHT  -- it slows you down and tires you.
//   Bulk is SHAPE          -- it stops you bending.
// Plate is heavy but well articulated; a large shield is light but blocks a
// whole side. Neither collapses into the other.

import { K } from "./constants.js";

export const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Probabilistic union: two pieces covering 50% each cover 75%, not 100%. */
export function combineFraction(values) {
  return 1 - values.reduce((p, v) => p * (1 - v), 1);
}

/** Carried mass against a Strength-derived capacity. A ratio of real kilograms. */
export function encumbrance(bodyMass, strength, wornMass) {
  if (wornMass <= 0) return 0;
  return wornMass / (K.CARRY_K * strength * Math.cbrt(bodyMass));
}

/**
 * An off hand is penalised more than a dominant hand is rewarded, and
 * clumsiness costs more than weakness -- pass HAND_PREC or HAND_STR as `k`.
 */
export function handFactor(dominantHand, offhand, k) {
  const alignment = offhand ? -(dominantHand ?? 0) : (dominantHand ?? 0);
  return alignment >= 0
    ? 1 + alignment * k * K.BONUS_SHARE
    : 1 + alignment * k;
}

/**
 * THE FUNNEL. The single place an authored sheet value becomes an effective one.
 * Nothing downstream ever reads a raw stat -- it reads this, which is what makes a
 * new degradation source a change in ONE function rather than everywhere. If a
 * fifth state ever arrives, widen this; never add a second funnel beside it.
 *
 * Two tiers come out, and the split matters:
 *
 *   .capable   gear-adjusted but CONDITION-FREE -- what this body can do at all.
 *              Encumbrance and Bulk are in it, because armour is a fact about you
 *              for the whole fight. Exhaustion, Pain and Dread are not.
 *   top level  .capable after condition. What you can do RIGHT NOW.
 *
 * Exertion cost reads `.capable` and the turn budget reads the top level, so a
 * condition enters the exertion economy exactly ONCE. Before that split, Pain both
 * shrank the budget and raised every card's cost, and the two multiplied -- one fact
 * counted twice, which is what made being hurt feel unsurvivable rather than bad.
 * Capability sets the cost; condition sets the budget.
 *
 * The states arrive ALREADY RESISTED: Composure damps how much Dread accumulates and
 * PainTolerance damps how much Pain does, at accumulation time. This applies them, it
 * does not re-resist them.
 *
 *   Exhaustion   overspent the turn budget
 *   Pain         hurt (design notes 10)
 *   Adrenaline   MASKS Pain rather than reducing it -- the wound is the wound, you
 *                just cannot feel it yet. Costs Precision, because fine motor
 *                control is the first thing adrenaline takes. It is a deferral: it
 *                burns Stamina while up, and when it fades the masked Pain simply
 *                lands, which needs no mechanic at all.
 *   Dread        frightened (design notes 11) -- narrower: it costs you the presence
 *                of mind to spot an opening, not your legs.
 *
 * `mindless` zeroes Pain, Dread and Adrenaline here rather than at every call site,
 * so the immunity is impossible to forget. No mind to frighten, nothing to hurt, no
 * endocrine system to flood.
 */
export function effectiveStats(fighter, {
  wornMass = 0, bulk = 0, offhand = false,
  exhaustion = 0, pain = 0, structure = 0, dread = 0, adrenaline = 0,
} = {}) {
  const numb = fighter.flags?.includes("mindless");
  const enc = encumbrance(fighter.mass, fighter.strength, wornMass);

  const adren = clamp01(numb ? 0 : adrenaline);
  // Adrenaline masks PAIN. It does not mask a broken bone -- you cannot feel your
  // way past a joint that no longer works.
  const felt = clamp01(numb ? 0 : pain) * (1 - K.ADREN_MASK * adren);
  const harm = Math.max(felt, clamp01(structure));
  const capacity = (1 - clamp01(exhaustion)) * (1 - harm);
  const rattled = 1 - clamp01(numb ? 0 : dread);
  const shake = 1 - K.ADREN_SHAKE * adren;

  // What this body can do, before condition. Gear only.
  const capable = {
    strength:  fighter.strength  * handFactor(fighter.dominantHand, offhand, K.HAND_STR),
    pace:      fighter.pace      * (1 - Math.min(0.9, enc * K.ENC_PACE)),
    agility:   fighter.agility   * (1 - Math.min(0.9, enc * K.ENC_AGI)) * (1 - bulk),
    precision: fighter.precision * (1 - bulk * K.BULK_PREC)
                                 * handFactor(fighter.dominantHand, offhand, K.HAND_PREC),
    reflexes:      fighter.reflexes ?? 1,
    improvisation: fighter.improvisation ?? 1,
    stamina:       fighter.stamina ?? 1,
  };

  return {
    encumbrance: enc, bulk, capacity, felt, harm, adrenaline: adren, capable,

    strength:  capable.strength  * capacity,
    pace:      capable.pace      * capacity,
    agility:   capable.agility   * capacity,
    // Adrenaline gives back the body and takes the hands. A fighter running on it is
    // faster, stronger, and placing worse -- a different character, not a buff.
    precision: capable.precision * capacity * shake,

    reflexes:      capable.reflexes      * capacity,
    // Dread touches Improvisation only: one stat, one job (design notes 11). And
    // adrenaline does not help here -- it makes you fast, not clever.
    improvisation: capable.improvisation * capacity * rattled,
    stamina:       capable.stamina       * capacity,

    // STATIC. Composure and PainTolerance describe the CHARACTER, not their current
    // situation, so nothing degrades them. That is also what keeps the feedback
    // damped: a resistance eroded by the thing it resists is a loop with no floor.
    composure:     fighter.composure ?? 1,
    painTolerance: fighter.painTolerance ?? 1,
  };
}

/**
 * Placement quality, 0-1. Saturating, so capability can be unbounded without
 * the curve running away: an ordinary adult sits at 0.5, and Precision 5 only
 * reaches 0.83. `aim` is how much of that applies at the moment of contact --
 * a steered thrust is 1.0, a loosed bolt is 0.15.
 */
export function placement(precisionEff, aim = 1) {
  return clamp01((precisionEff / (precisionEff + K.K_P)) * aim);
}

/**
 * Placement against a body that is not resisting. §5.5c.
 *
 * `placement()` above is placement UNDER PRESSURE. An ordinary adult saturates
 * at 0.5 not because his hand shakes but because the target is moving, flinching
 * and covering, and that ceiling is not real once the target stops doing those
 * things. Given all the time in the world and a body that will not move, you put
 * the point exactly where you meant to.
 *
 * So resistance RELEASES placement toward 1, in the same headroom form as
 * everything else in the model. This is what makes the coup de grace fall out of
 * the existing machinery instead of needing a rule: at zero resistance p goes to
 * 1, `GRAZE_BASE·(1−p)` goes to zero, and the Graze band closes on its own.
 *
 * Resistance is `max(evadeReady, guardReady)` -- is this body doing ANYTHING
 * about the blow? The max matters in both directions:
 *
 *   - A BRACED defender is low evadeReady, high guardReady. Taking the max keeps
 *     him fully resisting, so §5.5's "Graze survives bracing" still holds. Sum or
 *     average would have read bracing as half-helplessness.
 *   - It makes the (evadeReady 1, guardReady 0) default -- alert, not
 *     specifically covering up -- read as full resistance, so nothing that does
 *     not pass readiness changes at all.
 *
 * Helplessness therefore requires BOTH to be zero, which is the right bar: not
 * "cannot dodge", not "cannot block", but doing nothing whatsoever.
 *
 * Resistance SATURATES at 1 -- anticipation (§5.13b) buys nothing here. The
 * question this asks is binary in spirit, "is this body doing anything about the
 * blow", and once the answer is yes there is nothing further to say. Anticipation
 * already pays in four other places; letting it also degrade the attacker's
 * placement would be the same fact charged a fifth time.
 */
export function placedAgainst(p, evadeReady = 1, guardReady = 0) {
  const resistance = Math.max(clamp01(evadeReady), clamp01(guardReady));
  return clamp01(p + (1 - p) * K.AIM_UNRESISTED * (1 - resistance));
}

/**
 * Readiness splits at 1. §5.13b.
 *
 *   under  0..1  how much of your normal capability you are in a position to use.
 *                This is what your own action takes away.
 *   over   0..1  ANTICIPATION. You knew it was coming and set yourself for it.
 *                Being merely unoccupied never gets you here -- `readinessAt`
 *                tops out at exactly 1 from occupancy alone, and only a card
 *                grant lifts it further.
 *
 * Every consumer reads `over` through a headroom term, so the entire 0..1 band
 * behaves exactly as it did before anticipation existed. That is deliberate: it
 * makes this change strictly additive, and it means a curve built without
 * readiness is not silently a curve built with bad readiness.
 */
export function readySplit(r) {
  const v = Math.max(0, Math.min(K.READY_MAX, r ?? 1));
  return { under: Math.min(1, v), over: Math.max(0, v - 1) };
}

/**
 * How much evasion the defender actually gets to use. This is where an attack's
 * SPEED becomes accuracy without any attacker accuracy stat existing: a shorter
 * telegraph gives Agility less to work with, so Miss and Graze narrow on their
 * own.
 *
 * `evadeReady` is READINESS, 0-1 (§5.13) -- how able this body is, right now, to
 * try to not-be-there. It is a state, not a capability: Agility says how well
 * you dodge, readiness says whether you are in any position to attempt it. A
 * troll with terrible Agility can still try; a man mid-lunge cannot, however
 * nimble he is; an unconscious one is at zero.
 *
 * This replaced a `braced` boolean. Bracing is not a different kind of thing --
 * it is simply low evadeReady and high guardReady, a point in a space rather
 * than a flag.
 *
 * Above 1 the readiness is ANTICIPATION, and it closes the gap toward a certain
 * miss rather than scaling Agility further. That is the honest shape: knowing the
 * blow is coming is exactly what lets a slow body get out of the way, so the
 * benefit must not be proportional to how nimble you already are.
 *
 * It also keeps E <= 1 for free, which the curve needs -- `graze` carries an
 * `E - E²` term that goes NEGATIVE above 1, and a negative band width is not a
 * tuning problem, it is a broken axis.
 */
export function evasionOpportunity(agilityEff, telegraph, evadeReady = 1) {
  const window = telegraph / (telegraph + K.K_T);
  const { under, over } = readySplit(evadeReady);
  const base = (agilityEff / (agilityEff + K.K_A)) * window * under;
  return base + (1 - base) * K.READY_EVADE * over;
}

/** Weighted sum over a damage-class mix, e.g. { blunt: 0.75, pierce: 0.25 }. */
export function classMixed(table, classMix, fallback = 1) {
  let out = 0;
  for (const [cls, share] of Object.entries(classMix)) {
    out += share * (table?.[cls] ?? fallback);
  }
  return out;
}

/**
 * Body reach from Size, rather than authored. An ordinary 1.78 m adult gets
 * 0.71 m of arm; add the held item's reach for the whole envelope. This is why
 * a rapier (1.10 m) genuinely outreaches an arming sword (0.90 m) by more than
 * the blade difference alone -- both arms are the same, so the blade is the
 * entire margin.
 */
export function bodyReach(size) {
  return K.REACH_K * size;
}

/**
 * Stability, normalised so an ordinary 70 kg / 1.75 m adult sits at 1.0.
 *
 * Footprint and centre-of-mass height fall out of Size for anything bipedal, so
 * this never needs authoring -- but both are overridable, which is what makes a
 * giant spider nearly untippable (wide base, low body) while a giant of the same
 * mass goes over easily. Worn mass counts: armour is ballast.
 */
export function stability(fighter, wornMass = 0) {
  const footprint = fighter.footprint ?? fighter.size * K.STAB_FOOT;
  const com = fighter.comHeight ?? fighter.size * K.STAB_COM;
  return K.STAB_K * (fighter.mass + wornMass) * footprint / com;
}

/**
 * Chance this blow puts them off their feet -- momentum actually transferred,
 * against Stability. Section 5.8.
 *
 * Checked against the SAME roll as severity, never a second one: because the
 * roll axis is ordered by placement quality, "the top `topple` fraction" already
 * self-selects for well-placed blows, and no extra gate is needed.
 */
export function toppleChance(m, penetration, spread, stabilityNorm) {
  const transferred = m * (penetration + (1 - penetration) * (1 - spread));
  return transferred / (transferred + K.TOPPLE_K * Math.max(0.05, stabilityNorm));
}

/**
 * Adrenaline after one turn. Pure; nothing calls it yet, because there is no turn
 * loop -- but the dynamics belong beside the funnel that consumes them.
 *
 * Rises with what was done to you and with fear, falls on its own, and falls much
 * faster once the fighting stops. That last number is where the bill arrives: the
 * Pain it was masking lands in the corridor rather than in the room.
 */
export function adrenalineAfter(adrenaline, {
  severityTaken = 0, dread = 0, inCombat = true, mindless = false,
} = {}) {
  if (mindless) return 0;
  const fade = inCombat ? K.ADREN_FADE_FIGHT : K.ADREN_FADE_REST;
  const spike = K.ADREN_SPIKE * (severityTaken / 100) + K.ADREN_FEAR * clamp01(dread);
  return clamp01(adrenaline * (1 - fade) + spike);
}

/** What running on adrenaline costs in Exhaustion, per turn. */
export function adrenalineBurn(adrenaline) {
  return K.ADREN_BURN * clamp01(adrenaline);
}

/**
 * Pain after taking a blow. The one link between severity and condition.
 *
 * Accumulates into the REMAINING HEADROOM rather than adding, which is what keeps
 * this from being a health bar under another name: three 30% wounds give 0.29,
 * 0.50, 0.64 -- approaching 1 and never arriving. You cannot be ground to death by
 * grazes. A fight ends because a decisive blow landed, or because you got slow
 * enough that leaving was the only move.
 *
 * Redundancy damps it -- a hydra losing a head is not an injury that compounds --
 * and PainTolerance damps it, being the stat that exists for exactly this. Both are
 * already on the sheet. `mindless` feels none of it.
 */
export function painAfter(pain, severity, fighter) {
  if (fighter.flags?.includes("mindless")) return 0;
  const tol = Math.max(0.1, fighter.painTolerance ?? 1);
  const gain = K.PAIN_GAIN * (severity / 100) * (1 - (fighter.redundancy ?? 0)) / tol;
  return clamp01(pain + (1 - clamp01(pain)) * Math.max(0, gain));
}

/** Did that blow simply end it? */
export function decisive(severity) {
  return severity >= K.DECISIVE_SEVERITY;
}

/**
 * Structure after taking a blow -- the other accumulation channel.
 *
 * Pain governs the living; Structure governs things that do not feel it. It uses
 * the same headroom accumulation, but is resisted by **Toughness for the damage
 * class** rather than PainTolerance, and `mindless` does NOT zero it.
 *
 * That is what makes a skeleton beatable without making it soft: pierce meets
 * Toughness 2.5 and crawls, blunt meets 0.5 and comes apart. The right tool
 * works, the wrong one takes all day, and "run away" is a judgement about which
 * one you are holding.
 */
export function structureAfter(structure, severity, classMix, fighter) {
  // NEITHER Toughness NOR Redundancy appears here, and both omissions are
  // deliberate.
  //
  // Toughness is ALREADY IN THE SEVERITY -- it shapes S_full in the curve, which
  // is why a knight's blunt bash averages 46% against bone and a duelist's point
  // averages 10%. Dividing by it again reads the same resistance twice, and with a
  // 5x spread between {blunt 0.5} and {pierce 2.5} that made one tool instant and
  // the other useless.
  //
  // Redundancy answers "will losing the single most important part finish it",
  // which is the Vital band's question. Being taken apart piece by piece is a
  // different one.
  //
  // So what is left is simply: how much did that blow actually do.
  const gain = K.STRUCT_GAIN * (severity / 100);
  return clamp01(structure + (1 - clamp01(structure)) * Math.max(0, gain));
}

/**
 * How degraded you are, from both channels at once.
 *
 * The WORSE of the two, never their sum -- a blow that hurts and breaks you is
 * one blow, and adding both would count it twice. For a living thing Pain almost
 * always dominates; for a skeleton only Structure exists.
 */
export function harmOf(pain = 0, structure = 0) {
  return Math.max(clamp01(pain), clamp01(structure));
}
