// Content, no logic.
//
// Three scales, chosen by what each stat IS:
//   real units    mass (kg), size (m), pace (m/s)
//   fractions     solidity, redundancy -- a true proportion, 0-1
//   human ratios  agility, strength, precision, reflexes, improvisation, stamina,
//                 composure, painTolerance, toughness -- 1.0 is an ordinary adult,
//                 ~2.0 the best human alive, monsters wherever they need to be.
//                 Unbounded above.
//
//   mainHand    what is in each hand. Cards name no weapon of their own -- a
//   offHand     card is a motion, applied to whatever the named hand holds. A
//               shield counts as a held item, so a bash swings its real mass.
//   toughness   PER DAMAGE CLASS, not a scalar. This is where the skeleton
//               fantasy lives: bone shatters under a mace and barely notices a
//               puncture, with no armor involved.
//   solidity    fraction of the silhouette that is damageable matter. Flesh 1.0;
//               a skeleton is mostly air between struts.
//   redundancy  if this thing loses its single most important part, is it
//               finished? Human 0 (one heart). A three-headed dragon ~0.6, a
//               hydra ~0.85, a slime 1.0. NOT the same question as toughness:
//               a hydra can be soft and still not die to a perfect blow.
//   vitalSuit   which damage class actually exploits a vital hit. A pierce to a
//               throat beats a bludgeon; a bludgeon to a skull beats a pierce.

import { armorSet, heldItem, ARMOR } from "./gear.js";

export const FIGHTERS = {
  duelist: {
    name: "Duelist",
    mass: 68, size: 1.78, pace: 4.2,
    agility: 1.7, strength: 0.9, precision: 1.8,
    reflexes: 1.6, improvisation: 1.5, stamina: 1.2,
    composure: 1.4, painTolerance: 1.1,
    dominantHand: 0.8,
    toughness: { blunt: 1.0, pierce: 1.0, slash: 0.95 },
    solidity: 1.0, redundancy: 0.0,
    vitalSuit: { blunt: 0.9, pierce: 1.2, slash: 1.0 },
    mainHand: "rapier", offHand: null,
    armor: ["gambeson"],
    cards: ["thrust", "lunge", "quickCut", "slash", "backslash", "takeBreath"],
    flags: [],
  },

  knight: {
    name: "Knight",
    mass: 85, size: 1.80, pace: 3.6,
    agility: 0.7, strength: 1.4, precision: 1.1,
    reflexes: 1.0, improvisation: 0.85, stamina: 1.5,
    composure: 1.3, painTolerance: 1.6,
    dominantHand: 0.9,
    toughness: { blunt: 1.1, pierce: 1.0, slash: 1.05 },
    solidity: 1.0, redundancy: 0.0,
    vitalSuit: { blunt: 0.9, pierce: 1.2, slash: 1.0 },
    mainHand: "armingSword", offHand: "heaterShield",
    armor: ["fullPlate", "heaterShield"],
    cards: ["quickCut", "slash", "backslash", "fullSwing", "thrust", "overhead", "diagonalHack", "risingCut", "shieldBash", "takeBreath"],
    flags: [],
  },

  skeleton: {
    name: "Skeleton",
    mass: 35, size: 1.75, pace: 3.3,
    agility: 0.9, strength: 0.75, precision: 0.65,
    reflexes: 0.7, improvisation: 0.2, stamina: 1.0,
    // mindless: no Composure or PainTolerance value can express immunity on a
    // x-human scale, and none needs to -- the flag does it.
    composure: 1.0, painTolerance: 1.0,
    dominantHand: 0.5,
    toughness: { blunt: 0.5, pierce: 2.5, slash: 1.3 },
    solidity: 0.25, redundancy: 0.45,
    vitalSuit: { blunt: 1.4, pierce: 0.3, slash: 0.8 },
    mainHand: "rustedSword", offHand: "woodShield",
    armor: ["woodShield"],
    cards: ["slash", "backslash", "thrust", "overhead"],
    flags: ["mindless", "undead"],
  },
};

/**
 * Worn protection, with side-mounted pieces tagged. A shield is on the off hand,
 * and which side that is depends on handedness -- so a shield covers its own
 * side well and the far side poorly, and two blows arriving from opposite sides
 * cannot both be met by it. See defense.js sideFactor().
 */
export const armorOf = (fighter) => {
  const offSide = (fighter.dominantHand ?? 0) >= 0 ? -1 : 1;
  return armorSet(...fighter.armor).map((piece) =>
    piece && fighter.offHand && piece === ARMOR[fighter.offHand]
      ? { ...piece, side: offSide }
      : piece);
};

/**
 * What this fighter is holding. Cards name no weapon of their own -- the same
 * Slash is a keen arming sword in the knight's hand and a rusted one in the
 * skeleton's, and that difference is entirely mass and Sharpness.
 */
export const weaponOf = (fighter, hand = "main") =>
  heldItem(hand === "off" ? fighter.offHand : fighter.mainHand);
