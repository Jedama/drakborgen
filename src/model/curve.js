// The curve itself: how wide each band is, how high it reaches, what shape it
// has inside, and how it is evaluated.
//
// Nothing here is authored per character. Five widths and five height anchors
// are computed from stats; the band shapes come from what each band MEANS.

import { K } from "./constants.js";
import { clamp01 } from "./stats.js";

export const BANDS = ["Miss", "Graze", "Guard", "Wound", "Vital"];

// --- Widths -----------------------------------------------------------------

/**
 * Two stages, and the order matters. Stage one asks whether the blow connected
 * at all; stage two asks, given that it connected, where it landed.
 *
 * Collapsing these into a single residual was a real bug: with Wound as the
 * leftover of everything, bracing a knight WIDENED Wound, because the
 * probability freed by removing Miss had nowhere else to go.
 *
 * Returns widths in roll units, summing to 100.
 */
export function bandWidths({ evasion, placement, coverageEff, guardReady = 0 }) {
  const E = evasion, p = placement;

  // Stage 1 -- did it connect? At low evasion nearly all of it is partial
  // (grazes); at high evasion it becomes clean misses. One expression, no split
  // parameter. The imprecision term is what lets Graze survive bracing: a
  // defender who is covering up can still be hit badly.
  const miss = K.EV_MAX * E * E;
  const graze = K.EV_MAX * (E - E * E) + K.GRAZE_BASE * (1 - p);
  const connected = Math.max(0.03, 1 - miss - graze);

  // Stage 2 -- given it connected, where? Vital stays narrow by construction.
  // Note Redundancy does NOT appear here: it sets the payoff and the shape, not
  // the width.
  // Guard readiness narrows Vital: covering up is exactly the act of putting
  // something between a blow and the parts of you that end fights. Graded, not a
  // flag -- a partly-free arm covers partly.
  const vital = connected * K.VITAL_MAX * p ** K.VITAL_EXP * (1 - K.GUARD_VITALS * clamp01(guardReady));
  const rest = connected - vital;

  // What doesn't meet armor meets flesh. Coverage means exactly that.
  return [miss, graze, rest * coverageEff, rest * (1 - coverageEff), vital].map((v) => v * 100);
}

/** Cumulative band boundaries: 6 values from 0 to 100. */
export function boundaries(widths) {
  const xs = [0];
  for (const w of widths) xs.push(xs[xs.length - 1] + w);
  xs[xs.length - 1] = 100;
  return xs;
}

/** Which band a given roll falls in. */
export function bandAt(xs, x) {
  for (let i = 0; i < 5; i++) if (x <= xs[i + 1]) return BANDS[i];
  return BANDS[4];
}

// --- Heights ----------------------------------------------------------------

/**
 * Six anchors, because each band starts where the previous one ended. That one
 * rule is what makes the band shapes emerge instead of needing to be authored:
 * Graze climbs off zero toward Guard's opening, Guard is nearly flat because
 * its two anchors sit close together, and Wound climbs hard because its span
 * from "only just past the guard" to "a clean connection" is large by
 * construction.
 */
export function heightAnchors({ sFull, sGuard, redundancy = 0, vitalSuit = 1 }) {
  const graze = Math.max(K.GRAZE_FRAC * sFull, sGuard * K.GRAZE_JOIN);
  const guard = Math.max(graze, sGuard * (1 + K.GUARD_RISE));
  const wound = Math.max(sFull, guard * 1.02);            // monotonicity guard
  // NOT clamped to 100, deliberately. The surplus above the ceiling is not waste --
  // it is the WIDTH OF THE LETHAL PLATEAU. A blow at raw 103 is lethal across a
  // sliver of the axis; one at raw 288 is lethal across a third of it. severityAt()
  // clamps the OUTPUT, so capping here pre-empted a cap that already exists, and
  // collapsed every overwhelming blow into "reaches 100 at x=100 and nowhere else".
  //
  // It also inverted technique: once two anchors both clamp to 100, the only thing
  // separating them is Vital WIDTH, which comes from `aim` -- so a flicked quickCut
  // (aim 0.85) killed more often than a committed fullSwing (aim 0.70).
  const vital = Math.max(wound, sFull * (1 + K.VITAL_GAIN * (1 - redundancy) * vitalSuit));
  return [0, 0, graze, guard, wound, vital];
}

// --- Shape ------------------------------------------------------------------

/**
 * Plateau tilt, derived from the defender. No plateau is dead flat, and each
 * band's tilt has an honest driver:
 *
 *   Guard <- Spread       armor that distributes an impact varies less spot to spot
 *   Wound <- Redundancy   a differentiated body varies more within an ordinary
 *                         wound; a slime is identical everywhere
 *   Vital <- Redundancy   spare vitals SPREAD the outcomes -- most of the band
 *                         is a replaceable one, only the top is the heart
 *
 * Redundancy pushing Wound and Vital in opposite directions is the point, and
 * it is what lets a three-headed dragon read correctly.
 */
export function derivedDrifts({ spread = 0, redundancy = 0 }) {
  return {
    guard: K.DRIFT_GUARD * (1 - spread),
    wound: K.DRIFT_WOUND * (1 - redundancy),
    vital: K.DRIFT_VITAL_BASE + K.DRIFT_VITAL_GAIN * redundancy,
  };
}

/**
 * Each band carries a rise fraction (what portion of its width the change
 * happens over), a direction, and a drift. Guard's back-loading against Wound's
 * front-loading is what produces the steep step at that boundary -- the brief's
 * original "flat through armor, then jump" -- with no transition mechanism.
 *
 * `overrides` lets a tool drive these by hand; nothing in the game does.
 */
export function bandShapes({ spread = 0, redundancy = 0, overrides = {} } = {}) {
  const d = derivedDrifts({ spread, redundancy });
  return [
    { rise: 1, at: "front", drift: 0 },
    { rise: 1, at: "front", drift: 0 },
    { rise: overrides.riseGuard ?? K.RISE_GUARD, at: "back",  drift: overrides.driftGuard ?? d.guard },
    { rise: overrides.riseWound ?? K.RISE_WOUND, at: "front", drift: overrides.driftWound ?? d.wound },
    { rise: overrides.riseVital ?? K.RISE_VITAL, at: "front", drift: overrides.driftVital ?? d.vital },
  ];
}

// --- Sampling ---------------------------------------------------------------

/**
 * The curve is defined by its DERIVATIVE, not by its own points.
 *
 * Reading the band table above, every band says exactly two things: a phase
 * change of a certain size, happening over a certain stretch at one end of the
 * band, and a drift spread across the whole of it. Each of those is one smooth
 * non-negative bump in the derivative, and severity is what you get by
 * integrating them.
 *
 * Everything the old polygon-plus-fillet version had to arrange falls out:
 * the curve is smooth everywhere because it has no corners to round; it is
 * monotone because every bump has non-negative area; the plateaus tilt on a
 * gentle S rather than a straight line; and a band's approach to the next one
 * lifts slightly because the next bump's tail reaches back over the boundary,
 * which is the continuity §5.6 asks for arriving on its own.
 *
 * `sigma` is a bump's standard deviation, so a rise happens over roughly the
 * +-2 sigma around its centre. Tying it to the rise span means the band shape
 * constants still govern; `SOFTNESS` is a floor under it, and is the one place
 * appearance and outcomes trade against each other -- see §5.7.
 */
export function riseEvents({ xs, ys, shape, softness = K.SOFTNESS, softGain = K.SOFT_GAIN }) {
  const ev = [];
  for (let i = 1; i < 5; i++) {
    const w = xs[i + 1] - xs[i], d = ys[i + 1] - ys[i];
    if (w <= 0 || d <= 0) continue;
    const { rise, at, drift } = shape[i];

    // A bigger rise earns a longer runway: the wider the gap between what the
    // armor stops and what the flesh takes, the wider the stretch of rolls
    // where you are partly through it. At softGain 0 this is off.
    const floor = softness * (1 + softGain * (d / 100));
    const span = Math.max(0.02, rise) * w;

    ev.push({
      area: (1 - drift) * d,
      at: at === "front" ? xs[i] + span / 2 : xs[i + 1] - span / 2,
      sigma: Math.max(floor, span / 4),
    });
    if (drift > 0) ev.push({ area: drift * d, at: (xs[i] + xs[i + 1]) / 2, sigma: Math.max(floor, w / 4) });
  }
  return ev;
}

/** Abramowitz & Stegun 7.1.26. Max error 1.5e-7 -- far below anything visible. */
function erf(x) {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
  const p = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return s * (1 - p * Math.exp(-a * a));
}
const normCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
const normPdf = (z) => Math.exp(-(z * z) / 2) / Math.sqrt(2 * Math.PI);

/**
 * Sum the events, then map the result affinely onto the axis so the bottom of
 * the axis is exactly the floor anchor and a roll of 100 is exactly the Vital
 * anchor. Both ends are pinned by construction rather than restored afterwards,
 * and since the map is affine and increasing it cannot disturb monotonicity.
 *
 * THE FLOOR IS NOT ALWAYS ZERO. §5.6b. The curve used to start at 0 by fiat, and
 * that was a hidden assumption rather than a design statement: it said "however
 * bad the roll, something can always go wrong for the attacker", which is a claim
 * about the DEFENDER, not about the axis. A total miss is severity 0 because a
 * total miss is nothing happening -- but when no miss and no graze can happen,
 * the worst roll on the axis is a blow that connected, and it should be scored
 * as one.
 *
 * So the floor is the low anchor of the lowest band that actually has room to
 * happen. Bands with zero width are stepped over: a band that cannot occur cannot
 * be the worst case. Where a Miss or a Graze is possible at all -- which is very
 * nearly always -- this lands on ys[1] = 0 and behaves exactly as before.
 *
 * There is no sample table. The curve is a closed-form expression of six-ish
 * terms, so it costs about the same to evaluate as it did to interpolate, has
 * no resolution to get wrong, and ports as arithmetic.
 */
export function buildCurve({ widths, anchors, shape, softness = K.SOFTNESS, softGain = K.SOFT_GAIN }) {
  const xs = boundaries(widths), ys = anchors;
  const events = riseEvents({ xs, ys, shape, softness, softGain });
  const sum = (x) => events.reduce((s, e) => s + e.area * normCdf((x - e.at) / e.sigma), 0);

  // Start at the Miss boundary -- the Miss band's interior is flat zero by
  // construction -- then step over any band that has no room to happen.
  let j = 1;
  while (j < 5 && widths[j] <= 0) j++;
  const x0 = xs[j], y0 = Math.max(0, Math.min(100, ys[j]));

  const base = sum(x0);
  const top = sum(100) - base;
  const gain = top > 1e-9 ? (ys[5] - y0) / top : 0;

  return { xs, ys, shape, widths, softness, softGain, events, x0, y0, gain, base, floorBand: BANDS[j] };
}

/** Severity at a given roll. */
export function severityAt(curve, x) {
  if (x <= curve.x0) return curve.y0;
  let s = 0;
  for (const e of curve.events) s += e.area * normCdf((x - e.at) / e.sigma);
  return Math.max(0, Math.min(100, curve.y0 + (s - curve.base) * curve.gain));
}

/**
 * Mean severity per landed hit -- the single dial governing fight length.
 *
 * Exact, not estimated: the integral of a normal CDF has a closed form, so the
 * mean of a sum of them does too. No sampling error to confuse a tuning pass.
 */
export function meanSeverity(curve) {
  const { events, x0, y0, base, gain } = curve;
  const antideriv = (x) => events.reduce((s, e) => {
    const z = (x - e.at) / e.sigma;
    return s + e.area * ((x - e.at) * normCdf(z) + e.sigma * normPdf(z));
  }, 0);
  // The floor covers the whole axis (y0·x0 below the start plus y0·(100−x0)
  // above it), so it enters as a flat term and the integral is unchanged.
  return y0 + (gain * (antideriv(100) - antideriv(x0) - base * (100 - x0))) / 100;
}
