// Content, no logic. These become ScriptableObjects in Unity.
//
// Protection carries two separate costs: `mass` (kg, real -- what it weighs,
// which slows you and also adds to your own momentum) and `bulk` (0-1, how much
// the SHAPE stops you bending). Plate is heavy but well articulated; a big
// shield is light but blocks a whole side. Natural armor has bulk 0 -- chitin
// and bone restrict nothing.
//
// `gaps` is how exploitable the coverage is: how much a precise attacker can go
// around it rather than through it.
//
// `hardness` is anchored on materials, not on a human: 1.0 is hardened plate.

export const ARMOR = {
  gambeson: {
    name: "Gambeson",
    coverage: 0.25, hardness: 0.18, spread: 0.50, gaps: 0.50,
    mass: 3, bulk: 0.05,
    resist: { blunt: 1.1, pierce: 0.8, slash: 1.3 },
  },
  fullPlate: {
    name: "Full plate",
    coverage: 0.92, hardness: 1.00, spread: 0.80, gaps: 0.12,
    mass: 25, bulk: 0.20,
    resist: { blunt: 1.1, pierce: 2.5, slash: 2.2 },
  },
  heaterShield: {
    name: "Heater shield",
    coverage: 0.35, hardness: 0.70, spread: 0.55, gaps: 0.40,
    mass: 5, bulk: 0.25,
    // Also a HELD item -- see heldItem(). A shield bash swings this, so its
    // mass reaches tempo the same way a sword's does.
    reach: 0.30, recoverability: 0.85, sharpness: 1.00,
    resist: { blunt: 1.2, pierce: 1.8, slash: 1.6 },
  },
  woodShield: {
    name: "Wooden shield",
    coverage: 0.25, hardness: 0.35, spread: 0.35, gaps: 0.45,
    mass: 4, bulk: 0.15,
    reach: 0.25, recoverability: 0.80, sharpness: 1.00,
    resist: { blunt: 0.7, pierce: 1.2, slash: 1.1 },
  },
};

// There is deliberately no Lethality and no weaponPower. How hard it hits is
// mass x swing speed; how well it defeats protection is Concentration against
// Hardness; what it does once in is the damage class.
//
// Sharpness IS Concentration -- and it belongs HERE, not on the card. The card
// authors what the TECHNIQUE concentrates (a thrust always concentrates more
// than a cut, in anyone's hands with anything); the weapon scales it. That is
// what lets one Slash card be swung by a knight and a skeleton and come out
// keen in one hand and blunt in the other, instead of needing a near-duplicate
// card per weapon. A whetstone, rust, and weapon quality are one number moving.
// 1.0 is a well-kept edge.
export const WEAPONS = {
  rapier:      { name: "Rapier",       mass: 1.1, reach: 1.10, recoverability: 0.80, sharpness: 1.02 },
  armingSword: { name: "Arming sword", mass: 1.3, reach: 0.90, recoverability: 0.50, sharpness: 1.00 },
  rustedSword: { name: "Rusted sword", mass: 1.2, reach: 0.90, recoverability: 0.60, sharpness: 0.75 },
};

export const armorSet = (...keys) => keys.map((k) => ARMOR[k]);

/**
 * What is in a given hand. A shield is both armor and a held item -- it covers
 * a side AND it can be swung -- so this looks in both tables. That is why a
 * shield bash finally carries the shield's mass into its tempo instead of
 * coming out as fast as an empty-handed shove.
 */
export const heldItem = (key) => (key ? (WEAPONS[key] ?? ARMOR[key] ?? null) : null);
