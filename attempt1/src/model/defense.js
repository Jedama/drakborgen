// What stops the blow: how worn protection combines, and what gets past it.

import { K } from "./constants.js";
import { combineFraction, classMixed, clamp01, readySplit } from "./stats.js";

/**
 * Aggregate a set of protection pieces (armor, shields, natural plating) into
 * one effective defence against a given damage-class mix.
 *
 * Coverage and Bulk combine as probabilistic unions -- two pieces covering half
 * each cover three quarters, not all of it. Everything else is averaged
 * weighted by coverage, since a piece that covers more of you is more likely to
 * be the one a blow meets.
 */
/**
 * How much of a piece's coverage applies against a blow arriving from a given
 * side, -100..100 in the DEFENDER's frame.
 *
 * A shield is on one side of you; it was never a general-purpose coverage
 * number. Body armour has no side and covers everywhere. SIDE_MIN is what a
 * side-mounted piece is still worth on the wrong side -- not zero, because you
 * can turn into it.
 *
 * This is what makes a two-arc card resolvable: a buckler cannot meet a
 * horizontal cut from both directions at once, and that falls out of geometry
 * rather than needing the shield to be "spent" on one of them.
 */
export function sideFactor(pieceSide, landingSide = 0) {
  if (!pieceSide) return 1;
  const align = (pieceSide * (landingSide / 100) + 1) / 2;   // 1 aligned, 0 opposite
  return K.SIDE_MIN + (1 - K.SIDE_MIN) * align;
}

export function protection(pieces = [], classMix = { blunt: 1 }, landingSide = 0) {
  const eff = pieces.map((a) => ({ piece: a, coverage: a.coverage * sideFactor(a.side, landingSide) }));
  const totalCoverage = eff.reduce((s, e) => s + e.coverage, 0);
  const weighted = (get) =>
    totalCoverage === 0 ? 0 : eff.reduce((s, e) => s + e.coverage * get(e.piece), 0) / totalCoverage;

  return {
    pieces,
    coverage: combineFraction(eff.map((e) => e.coverage)),
    // Bulk and mass are what you are WEARING -- they do not care which side the
    // blow came from. Only interception does.
    bulk:     combineFraction(pieces.map((a) => a.bulk ?? 0)),
    mass:     pieces.reduce((s, a) => s + (a.mass ?? 0), 0),
    hardness: weighted((a) => a.hardness ?? 0),
    spread:   weighted((a) => a.spread ?? 0),
    gaps:     weighted((a) => a.gaps ?? 0),
    resist:   weighted((a) => classMixed(a.resist, classMix)),
  };
}

/**
 * Coverage after a precise attacker goes looking for the gaps, and after any
 * bracing.
 *
 * `gaps` is a property of the ARMOR, not a global: plate leaves an armpit and a
 * visor slit (0.12), a shield can simply be gone around (0.40), chitin has
 * almost none. Without that, a precise attacker erodes plate and quilted cloth
 * equally, which is wrong.
 *
 * Bracing converts evasion into coverage -- it is exactly the act of no longer
 * trying to not-be-there and instead trying to have-armor-there.
 */
/**
 * `guardReady` is READINESS, 0-1 (§5.13): how able this body is, right now, to
 * interpose SOMETHING. Not a shield, not armour -- an arm, a raised weapon, a
 * turned shoulder. An unarmed man can still cover his vitals; a man swinging a
 * two-hander with everything he has cannot, whatever he is wearing.
 *
 * Worn Coverage is what you are carrying; readiness is whether you are in a
 * position to use it. So readiness lifts coverage toward complete rather than
 * scaling it -- at zero you get exactly the passive protection you are wearing,
 * and at one you are actively covering.
 */
export function effectiveCoverage(coverage, gaps, placementQuality, guardReady = 0) {
  const { under, over } = readySplit(guardReady);
  const found = coverage * (1 - gaps * placementQuality);
  // Two closings of the same gap. The first is being ABLE to cover; the second is
  // having known where to cover. §5.13b.
  const braced = found + (1 - found) * K.BRACE_GAIN * under;
  return braced + (1 - braced) * K.READY_COVER * over;
}

/**
 * Did it get through? A single number in [0,1] on purpose: if a dedicated
 * armor-penetration system arrives later it replaces this one expression and
 * nothing else in the model changes.
 */
export function penetration(m, concentration, hardness, resist) {
  const drive = m * concentration * K.PEN_K;
  const R = K.HARD_K * hardness * resist;
  return R <= 0 ? 1 : drive / (drive + R);
}

/**
 * What transmits THROUGH armor it did not penetrate. This is the "mass punches
 * through regardless" idea, derived rather than added as a flat bonus -- it is
 * why blocking a much heavier attacker's weapon does not save you from the body
 * behind it, and why plate (high Spread) beats mail (low Spread) against a mace
 * at similar Hardness.
 *
 * ANTICIPATION ABSORBS SHOCK. §5.13b. This is the one place readiness reaches the
 * HEIGHT of the curve rather than the width of a band, and it is what makes "the
 * shock of impact won't be as bad" true rather than merely plausible: a set body
 * meets the blow with structure, and a caught one has it dumped into them. Shock
 * is the only honest hook for it -- anticipation does not make steel harder, so it
 * has no business touching `penetration`.
 *
 * Only the part ABOVE 1 counts. The opposite claim -- that a loose body takes
 * shock WORSE -- is true and deliberately not modelled here: below 1 the defender
 * is already losing coverage (a busy shield hand is no shield) and Guard band
 * width, and charging the same slackness a third time in the height would be
 * double-counting dressed as realism.
 */
export function shockLeak(m, spread, guardReady = 1) {
  const { over } = readySplit(guardReady);
  const L = K.SHOCK_K * m * (1 - spread) / (1 + m);
  return Math.max(0, L * (1 - K.READY_SHOCK * over));
}
