// Phase durations, exertion cost, and reaction windows.
//
// The one idea here: every phase length is a multiple of a single quantity,
// TEMPO (tau), which is how long this fighter takes to move this weapon through
// a unit of motion. Tau is derived from v_weapon -- the SAME v_weapon that
// momentum() uses. That is the whole point. A heavy weapon in a weak hand is
// slow AND hard-hitting because those are one physical fact read twice, so a
// card cannot author a long windup without also earning the momentum that
// justifies it. Nothing needs balancing against anything.
//
// Which stat drives which phase, and deliberately no more than that:
//
//   Windup     tau, scaled by the card's Effort, shortened by commitment
//   Travel     distance / Pace -- a rate, not a duration
//   Execution  tau, essentially unmodified. The arc takes as long as the steel
//              takes; this is the phase nobody gets to manipulate.
//   Recovery   tau, scaled by Effort, lengthened by commitment, by an item that
//              is hard to stop, and at resolution by a blow that buried itself.
//
// Agility, Precision and Reflexes drive NOTHING here. Agility owns evasion,
// Precision owns placement, Reflexes owns reaction latency. The moment one stat
// shortens a windup and widens a Miss, no tuning pass can converge -- that was
// the failure mode this whole model is organised to avoid.
//
// Exhaustion needs no term of its own: it is already inside Strength_eff (so
// tau lengthens) and Pace_eff (so travel lengthens). Every phase stretches, as
// section 08 of the design notes says it should, without being told to.

import { K } from "./constants.js";

export const COMMITMENT = { bluff: -1, uncommitted: 0, committed: 1 };

/**
 * Ticks per unit of motion. 100 ticks = one second.
 *
 * Reuses v_weapon = SWING_K x Strength_eff / (Mass + M0) from attack.js rather
 * than recomputing it, so the two can never drift apart.
 */
export function tempo(strengthEff, weaponMass = 0) {
  const vWeapon = K.SWING_K * strengthEff / (weaponMass + K.M0);
  return { vWeapon, tau: K.TEMPO_K / vWeapon };
}

/** One phase's length in ticks, given its declared driver. */
function phaseTicks(phase, { tau, travelTicks }) {
  if (!phase || !phase.w) return 0;
  switch (phase.driver) {
    case "fixed": return phase.w;
    case "pace":  return phase.w * travelTicks;
    default:      return phase.w * tau;
  }
}

/**
 * The four phase durations for one card thrown by one fighter, in ticks.
 *
 * `distance` is the live gap in metres; travel is what it costs to cross it at
 * this card's own pace, which is zero for the overwhelming majority of melee
 * cards because they are thrown from inside reach already.
 *
 * Windup runs CONCURRENTLY with travel (design notes section 06), so the pair
 * costs max(windup, travel), not their sum -- a charge crosses the ground ready
 * to strike rather than arriving and then winding up. `telegraph` is that same
 * concurrent span, because it is exactly how long the defender had to read it.
 */
export function phases({
  profile, strengthEff, paceEff, weaponMass = 0, recoverability = 0.5,
  distance = 0, moveFactor = 1, commitment = 0, effort = 1, carry = 1, nudge = {},
}) {
  const { tau, vWeapon } = tempo(strengthEff, weaponMass);
  const closingSpeed = Math.max(0.1, paceEff * moveFactor);
  const travelTicks = (distance / closingSpeed) * 100;   // seconds -> ticks
  const ctx = { tau, travelTicks };

  // Effort and commitment are orthogonal and both belong here. Effort is
  // AUTHORED -- a flick and a full swing are the same profile committed
  // differently, and it lengthens the gather AND the unwind together, paying
  // for both with power. Commitment is CHOSEN at play time and trades one
  // against the other: sooner to start, longer to stop.
  const windup = phaseTicks(profile.windup, ctx)
    * effort * carry * (1 - K.COMMIT_WINDUP * commitment) * (nudge.windup ?? 1);
  const travel = phaseTicks(profile.travel, ctx) * (nudge.travel ?? 1);
  const execution = phaseTicks(profile.execution, ctx) * (nudge.execution ?? 1);
  const recovery = phaseTicks(profile.recovery, ctx)
    * effort
    * (1 + K.COMMIT_RECOVER * commitment)
    * (1 + K.RECOV_K * (1 - recoverability))
    * (nudge.recovery ?? 1);

  const ready = Math.max(windup, travel);
  return {
    tau, vWeapon, effort, carry, windup, travel, execution, recovery,
    ready,                              // when the blow can begin
    telegraph: ready,                   // what the defender got to read
    total: ready + execution + recovery,
    active: ready + execution,          // committed and not yet unwinding
  };
}

/**
 * Recovery lengthens when the blow buries itself -- an axe in a ribcage.
 * Applied AFTER the roll, never at lock-in: exertion is committed when the card
 * is played, time is discovered when it plays out. That asymmetry is why turn
 * length is emergent rather than budgeted.
 */
export function lodgeRecovery(recovery, penetration, concentration, recoverability = 0.5) {
  return recovery * (1 + K.LODGE_K * penetration * concentration * (1 - recoverability));
}

// --- Exertion ---------------------------------------------------------------

/**
 * A card's authored exertion is what the MOTION demands; what it costs depends
 * on the body attempting it. A chandelier is cheap for a strong back and
 * ruinous for a weak one, from one authored number and no per-character table.
 *
 * Effort scales it too: a fuller swing of the same motion is more tiring.
 *
 * `demands` names the stat the card leans on -- "strength", "agility", or null
 * for cards that lean on nothing (a step, a breath).
 */
export function exertionCost(card, eff) {
  const base = (card.exertion ?? 0) * (card.effort ?? 1);
  if (!base || !card.demands) return base;
  // CAPABILITY, not condition. The chandelier is cheap for a strong BACK -- a fact
  // about what kind of body this is, not about how much is left in it today. How
  // much is left is the budget's job. Reading the conditioned stat here made Pain
  // enter the exertion economy twice, and the two multiplied.
  const from = eff.capable ?? eff;
  const stat = Math.max(0.1, from[card.demands] ?? 1);
  return base * (1 + K.EXERT_GAIN * (1 / stat - 1));
}

/**
 * The per-turn allowance. Stamina 1.5 lands on 37.5.
 *
 * Reads Stamina_eff from the funnel rather than taking Exhaustion separately, so
 * there is one path for degradation instead of two that could disagree -- and Pain
 * now shrinks the budget too, because being hurt tires you, with nothing added here
 * to say so.
 */
export function exertionBudget(eff) {
  return K.STAMINA_K * (eff.stamina ?? 1);
}

// --- Reaction windows -------------------------------------------------------

/**
 * Salience: how much a thing that just happened should make someone want to
 * change their plan. Not a probability -- a score, compared against a threshold.
 *
 * An opponent entering Recovery is scaled highest on purpose. Baiting a heavy
 * commitment and punishing the unwind is the exchange this whole system exists
 * to produce, so the unwind has to be the loudest event on the timeline.
 */
export function salience(event) {
  switch (event.type) {
    case "recovery":
      // A long, hard-to-abort unwind. Measured in tempo units so a slow
      // fighter's recovery is genuinely more inviting than a fast one's.
      return K.SAL_RECOVERY * (1 - (event.recoverability ?? 0.5))
           * (event.recovery / Math.max(1, event.tau));
    case "incoming":
      // Scaled by how bad it would actually be, so a poke barely registers and
      // a committed overhead is impossible to ignore.
      return K.SAL_INCOMING * (event.expectedSeverity / 100);
    case "windup":
      return K.SAL_WINDUP * (event.windupRemaining / Math.max(1, event.tau));
    case "flee":
      return K.SAL_FLEE;
    default:
      return 0;
  }
}

/**
 * Does a window open, how many reaction cards does it offer, and how long until
 * it is usable?
 *
 * Improvisation sets the threshold -- whether the opening is noticed at all, and
 * how much is made of it. Reflexes sets the latency. Commitment and a weapon
 * that is hard to divert add conversion delay on top: an action already in
 * motion takes real time to become a different one.
 *
 * An empty sequence is not powerlessness. A combatant with nothing left to
 * execute is watching rather than acting, and everything reads louder.
 */
export function reactionWindow({
  event, improvisationEff = 1, reflexesEff = 1,
  commitment = 0, recoverability = 0.5, tau = 50, reactive = false,
}) {
  const S = salience(event) * (reactive ? K.REACTIVE_GAIN : 1);
  const threshold = K.IMPROV_K / Math.max(0.1, improvisationEff);
  const margin = S - threshold;
  if (margin <= 0) return { open: false, salience: S, threshold, margin, draws: 0, latency: Infinity };

  const draws = Math.min(K.DRAW_MAX, 1 + Math.floor(margin / K.DRAW_STEP));
  const conversion = K.COMMIT_DELAY * Math.max(0, commitment) * (1 - recoverability) * tau;
  return {
    open: true, salience: S, threshold, margin, draws,
    latency: K.REACT_BASE / Math.max(0.1, reflexesEff) + conversion,
  };
}

/**
 * A window is only worth anything if it opens before the thing it was reacting
 * to is over. Missing by a hair is a real and legible outcome -- you saw it and
 * were too committed to do anything about it.
 */
export function windowLandsInTime(window, ticksUntilEventCloses) {
  return window.open && window.latency <= ticksUntilEventCloses;
}

// --- Occupancy --------------------------------------------------------------

/**
 * How much your own action has you tied up at time t, 0-1.
 *
 * This is the defensive cost of doing anything, and none of it is authored.
 * The MAGNITUDE has two parts. Any real swing puts your torso and base into it
 * (Effort), and throwing your MASS on top of that commits you far more (Drive,
 * which already means precisely that). Commitment level scales the pair. The
 * SHAPE is how much of that commitment has actually happened yet:
 *
 *   Windup      rises as f^OCCUPY_RISE from a floor. Early windup is nearly
 *               free -- a swing you have only begun can still be abandoned --
 *               and the floor is the mind having committed before the body has.
 *   Execution   flat 1.0. At the apex there is no defending, full stop.
 *   Recovery    decays back toward the floor at a rate set by the weapon's
 *               Recoverability. A rapier sheds it fast; an axe carries its
 *               commitment through most of the unwind.
 *
 * Past `total` the card is over and you are free again.
 */
export function occupancy(t, phases, { drive = 0, effort = 1, commitment = 0, recoverability = 0.5 } = {}) {
  const magnitude = Math.min(1,
    (K.OCCUPY_MOTION + K.OCCUPY_BODY * drive) * effort * (1 + K.OCCUPY_COMMIT * commitment));
  if (magnitude <= 0) return 0;

  const { ready, execution } = phases;
  const recovery = phases.total - ready - execution;
  const floor = K.OCCUPY_FLOOR;
  let shape;

  if (t < 0 || t >= ready + execution + recovery) return 0;
  if (t < ready) {
    const f = ready > 0 ? t / ready : 1;
    shape = floor + (1 - floor) * f ** K.OCCUPY_RISE;
  } else if (t < ready + execution) {
    shape = 1;
  } else {
    const g = recovery > 0 ? (t - ready - execution) / recovery : 1;
    const p = K.OCCUPY_DECAY * recoverability + 0.5;
    shape = floor + (1 - floor) * (1 - g) ** p;
  }
  return magnitude * shape;
}

/**
 * What the previous card left you, as a windup multiplier for the next one.
 *
 * Two costs, both from things that already exist:
 *   BLADE   distance from where this hand was left to where this card needs it.
 *           The grid centre is the hub, so a card ending at MID_CENTRE is cheap
 *           to follow and a corner is committal.
 *   FOOTING a card that threw your MASS left your base out of position too,
 *           whatever the blade is doing -- Drive, again.
 *
 * No card ever names another. It only knows where your body already is, which
 * is what makes the combos emergent rather than authored.
 */
export function carryCost(handPos, arcFrom, previousDrive = 0, distanceFn) {
  const blade = handPos ? distanceFn(handPos, arcFrom) : 0;
  const footing = K.CARRY_FOOTING * previousDrive;
  const mismatch = Math.min(1, blade + footing);
  return K.CARRY_MIN + (K.CARRY_MAX - K.CARRY_MIN) * mismatch;
}

/**
 * How much of its arc the blade actually completed, and therefore where the hand
 * is left for the next card to carry from.
 *
 * Air completes the sweep. Flesh slows it, and a blade that stuck stops where it
 * stuck -- the same lodge term that lengthens the recovery, doing a second
 * honest job. Armour stops it outright, and hard steel throws the hands back
 * past where they began: below zero is a rebound, not an error.
 *
 * Penetration is what buys the sweep back in both cases, which is why a spike
 * through plate keeps travelling and a sword edge on plate does not.
 */
export function followThrough(band, penetration = 0, concentration = 0, recoverability = 0.5) {
  if (band === "Miss") return 1;
  if (band === "Graze") return K.FOLLOW_GRAZE;
  if (band === "Guard") {
    return -K.REBOUND + (K.FOLLOW_BODY + K.FOLLOW_PEN + K.REBOUND) * penetration;
  }
  const lodged = penetration * concentration * (1 - recoverability);
  return K.FOLLOW_BODY + K.FOLLOW_PEN * penetration - lodged;
}
