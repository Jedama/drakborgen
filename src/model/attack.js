// What the blow carries: momentum, bite, and whether there is anything there
// to hit.

import { K } from "./constants.js";

/**
 * Two sources, one quantity. The weapon's velocity in the target's frame is the
 * body's velocity plus the arm's velocity relative to the body, so they add: a
 * body slam is all p_body, a standing slash is all p_weapon, and a running
 * thrust is genuinely both.
 *
 * Swing speed saturating in weapon mass is physically right and useful -- a
 * heavier weapon carries more momentum but is swung more slowly, with
 * diminishing returns, until a weak enough wielder cannot swing it usefully.
 *
 * Worn mass counts toward the body term: an armoured charge really does hit
 * harder.
 */
export function momentum({ bodyMass, wornMass = 0, paceEff, drive, moveFactor = 1, strengthEff, weaponMass = 0, effort = 1 }) {
  // Effort is how much of the motion is actually committed. It puts more body
  // behind the blow linearly, and raises the blade's speed at contact
  // sub-linearly -- a longer gather does accelerate the edge further, but you
  // cannot double the speed by doubling the windup. This is the payoff half of
  // the trade whose cost is the longer windup and recovery in timing.js.
  const vBody = paceEff * moveFactor;                     // Pace is already m/s
  const pBody = (bodyMass + wornMass) * vBody * drive * effort;
  const vWeapon = K.SWING_K * strengthEff / (weaponMass + K.M0) * effort ** K.EFFORT_SWING;
  const pWeapon = weaponMass * vWeapon;
  const total = pBody + pWeapon;
  return { vBody, pBody, vWeapon, pWeapon, total, m: total / K.M_REF };
}

/** Momentum weighted by how concentrated it arrives. KAPPA keeps a blunt, */
/** zero-concentration blow from doing literally nothing.                  */
export function bite(m, concentration) {
  return m * (K.KAPPA + concentration);
}

/** Contact footprint. Concentration IS area: a point is tiny, a face is wide. */
export function footprint(concentration) {
  return K.A_K * (1 - concentration) ** 2 + K.A_MIN;
}

/**
 * The fraction of the blow that meets damageable matter.
 *
 * Against Solidity 1.0 this is exactly 1 and vanishes from everything
 * downstream. Against a skeleton it is what makes a blind rapier thrust
 * pointless -- but a skilled attacker is not swinging blind, they are putting
 * the point through an eye socket, so Precision recovers most of it. That
 * recovery is the whole difference between a fencer (dangerous) and a crossbow
 * (useless), and it lives entirely in the card's Aim.
 */
export function engagement(concentration, solidity, placementQuality) {
  const raw = 1 - (1 - solidity) ** footprint(concentration);
  return { raw, effective: raw + (1 - raw) * placementQuality * K.AIM_AT_MATTER };
}
