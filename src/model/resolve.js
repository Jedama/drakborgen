// The whole pipeline in one call: stats and gear in, a curve out, one roll
// against it. The roll's y-value IS the severity -- the percentage of the
// SEVERITY of the blow. There is no health pool -- at the top of the curve it ends the
// fight, and below that it inflicts a condition that degrades stats (design notes 10).
// Nothing is computed afterward.

import { K } from "./constants.js";
import { effectiveStats, placement, evasionOpportunity, classMixed, clamp01 } from "./stats.js";
import { momentum, bite, engagement } from "./attack.js";
import { protection, effectiveCoverage, penetration, shockLeak } from "./defense.js";
import { bandWidths, heightAnchors, bandShapes, buildCurve, severityAt, meanSeverity, bandAt } from "./curve.js";
import { phases, lodgeRecovery, exertionCost } from "./timing.js";
import { profileOf } from "../data/profiles.js";

/**
 * Build the curve for one attacker / card / defender combination.
 *
 * Returns the curve plus every intermediate, because tools need to show the
 * working and the game only needs `.curve`.
 */
export function composeCurve({
  attacker, defender, card, weapon,
  attackerArmor = [], defenderArmor = [],
  exhaustion = 0, pain = 0, structure = 0, dread = 0, adrenaline = 0,
  defenderExhaustion = 0, defenderPain = 0, defenderStructure = 0,
  defenderDread = 0, defenderAdrenaline = 0,
  offhand = false, braced = false,
  distance = 0, commitment = 0, defenderOccupancy = 0, carry = 1,
  arc = null, landingSide = 0, hand = null,
  overrides = {},
}) {
  const classMix = card.classMix;
  const effort = card.effort ?? 1;

  // A card names a HAND, not a weapon. The off hand is clumsier and slightly
  // weaker (handFactor), and it is usually holding something different -- for
  // the knight, a shield, whose real mass now reaches tempo.
  const usingOffHand = offhand || hand === "off";

  // Sharpness IS Concentration. The card authors what the TECHNIQUE
  // concentrates -- a thrust always concentrates more than a cut -- and the
  // held item scales it, so one Slash comes out keen in a knight's hand and
  // blunt in a skeleton's with no second card.
  const sharpness = weapon?.sharpness ?? 1;
  const concentration = clamp01(card.concentration * sharpness);

  const aProt = protection(attackerArmor, classMix);
  // The defender's protection is resolved AGAINST THE SIDE THIS ARC LANDS ON.
  // A shield is on one side of them; body armour is not.
  const dProt = protection(defenderArmor, classMix, landingSide);

  const aEff = effectiveStats(attacker, { wornMass: aProt.mass, bulk: aProt.bulk, exhaustion, pain, structure, dread, adrenaline, offhand: usingOffHand });
  const dEff = effectiveStats(defender, { wornMass: dProt.mass, bulk: dProt.bulk, exhaustion: defenderExhaustion, pain: defenderPain, structure: defenderStructure, dread: defenderDread, adrenaline: defenderAdrenaline });

  // Phase durations first, because the telegraph the defender gets to read is
  // Windup and Travel running concurrently -- a derived quantity, not a number
  // authored on the card. Exhaustion lengthens it for free: it is already inside
  // Strength_eff and Pace_eff.
  const timing = phases({
    profile: profileOf(card),
    strengthEff: aEff.strength,
    paceEff: aEff.pace,
    weaponMass: weapon?.mass ?? 0,
    recoverability: weapon?.recoverability ?? 0.5,
    distance, moveFactor: card.moveFactor, commitment, effort, carry,
    nudge: card.phaseNudge,
  });

  const p = placement(aEff.precision, card.aim);
  const evasion = evasionOpportunity(dEff.agility, timing.telegraph, braced, defenderOccupancy);

  const mom = momentum({
    bodyMass: attacker.mass,
    wornMass: aProt.mass,
    paceEff: aEff.pace,
    drive: card.drive,
    moveFactor: card.moveFactor,
    strengthEff: aEff.strength, effort,
    weaponMass: weapon?.mass ?? 0,
  });

  const eng = engagement(concentration, defender.solidity, p);
  const B = bite(mom.m, concentration);
  const toughness = classMixed(defender.toughness, classMix);
  const sFull = 100 * (B * eng.effective) / (B * eng.effective + K.TOUGH_K * toughness);

  const pen = penetration(mom.m, concentration, dProt.hardness, dProt.resist);
  const leak = shockLeak(mom.m, dProt.spread);
  const sGuard = sFull * (pen + (1 - pen) * leak);

  const coverageEff = effectiveCoverage(dProt.coverage, dProt.gaps, p, braced);
  const widths = bandWidths({ evasion, placement: p, coverageEff, braced });
  const anchors = heightAnchors({
    sFull, sGuard,
    redundancy: defender.redundancy ?? 0,
    vitalSuit: classMixed(defender.vitalSuit, classMix),
  });
  const shape = bandShapes({ spread: dProt.spread, redundancy: defender.redundancy ?? 0, overrides });
  const curve = buildCurve({
    widths, anchors, shape,
    softness: overrides.softness ?? K.SOFTNESS,
    softGain: overrides.softGain ?? K.SOFT_GAIN,
  });

  return {
    curve,
    attackerEff: aEff, defenderEff: dEff,
    attackerProtection: aProt, defenderProtection: dProt,
    placement: p, evasion, momentum: mom, engagement: eng, bite: B,
    toughness, sFull, penetration: pen, shockLeak: leak, sGuard, coverageEff,
    meanSeverity: meanSeverity(curve),
    timing, exertion: exertionCost(card, aEff), concentration, sharpness,
    effort, hand, arc, landingSide, defenderOccupancy, carry,
  };
}

/** One roll against an already-built curve. */
export function rollOn(curve, rng = Math.random) {
  const roll = rng() * 100;
  return { roll, severity: severityAt(curve, roll), band: bandAt(curve.xs, roll) };
}

/**
 * Compose and roll in one step.
 *
 * The roll is also where recovery gets its final length: a blow that buried
 * itself takes longer to free. Exertion was committed at lock-in and does not
 * move -- only the time does. That asymmetry is what makes turn length emergent
 * rather than budgeted.
 */
export function resolveHit(setup, rng = Math.random) {
  const composed = composeCurve(setup);
  const rolled = rollOn(composed.curve, rng);
  const connected = rolled.band !== "Miss";
  const recovery = connected
    ? lodgeRecovery(composed.timing.recovery, composed.penetration,
                    composed.concentration, setup.weapon?.recoverability ?? 0.5)
    : composed.timing.recovery;
  return {
    ...composed, ...rolled,
    timing: { ...composed.timing, recovery, total: composed.timing.active + recovery },
  };
}
