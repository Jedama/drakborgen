// Techniques. Content, no logic.
//
// A card is a MOTION, thrown along one or more ARCS. It names no weapon -- each
// arc names a HAND, and that hand swings whatever it happens to be holding,
// exactly as the card names a profile rather than four tick counts. That is
// what makes one Slash shareable between a knight and a skeleton.
//
//   profile        which motion this is, from profiles.js. All four phase
//                  durations derive from it plus the wielder's Strength and the
//                  held item's mass -- never authored here.
//   arcs           where the weapon travels, from arcs.js. One entry for almost
//                  everything; TWO for a genuine dual-wield move; hand "both"
//                  for a two-hander, which then occupies both hands and leaves
//                  no shield and no free-hand overlap. Each arc resolves as its
//                  own contact -- two blades arriving are two things that could
//                  kill you, not one averaged one.
//   effort         how much of the motion is committed. 1.0 is the profile as
//                  written; 0.55 is a flick of the same shape, 1.45 everything
//                  you have. Linear in windup, recovery, Drive and exertion;
//                  sub-linear in blade speed; Execution untouched.
//   phaseNudge     optional per-phase multiplier for the rare card that must
//                  deviate from its profile even after effort. Sparingly.
//   exertion       what the motion demands at effort 1.0. What it costs depends
//                  on the body attempting it (see `demands`).
//   demands        which stat the exertion leans on: "strength", "agility", or
//                  null for cards that lean on nothing.
//   drive          how much of the body's own motion goes in, at effort 1.0.
//                  Also how much it puts your base out of position, for both
//                  occupancy and carry -- one field, three honest jobs.
//   concentration  how focused the TECHNIQUE is. The held item's Sharpness
//                  scales it; a rusted blade blunts every card at once.
//   aim            how much of the wielder's Precision applies AT THE MOMENT OF
//                  CONTACT. A steered thrust ~1.0, a wild swing ~0.5.
//   classMix       sums to 1. A morningstar is { blunt: 0.75, pierce: 0.25 }.
//
// There is deliberately no `windup`, no `weapon` and no `direction`. All three
// were hand-authored numbers sitting on top of derived ones that already
// contained the answer.

import { arc } from "./arcs.js";

export const CARDS = {
  // --- One profile, three efforts -------------------------------------------
  // Nothing differs between these but `effort` and what it drags with it.
  quickCut: {
    name: "Quick cut", profile: "horizontalStrike", effort: 0.55,
    arcs: [arc("main", "MID_RIGHT", "MID_CENTRE")],
    drive: 0.25, concentration: 0.60, aim: 0.85,
    classMix: { slash: 1 }, moveFactor: 1.0,
    exertion: 11, demands: "strength",
  },
  slash: {
    name: "Slash", profile: "horizontalStrike", effort: 1.0,
    arcs: [arc("main", "MID_RIGHT", "MID_LEFT")],
    drive: 0.25, concentration: 0.60, aim: 0.80,
    classMix: { slash: 1 }, moveFactor: 1.0,
    exertion: 11, demands: "strength",
  },
  backslash: {
    // The mirror. One profile, the arc reversed -- not a second library entry
    // and not a flag. It is also the natural follow-up to Slash, because Slash
    // leaves the hand exactly where this one starts.
    name: "Backslash", profile: "horizontalStrike", effort: 1.0,
    arcs: [arc("main", "MID_LEFT", "MID_RIGHT")],
    drive: 0.25, concentration: 0.60, aim: 0.80,
    classMix: { slash: 1 }, moveFactor: 1.0,
    exertion: 11, demands: "strength",
  },
  fullSwing: {
    name: "Full swing", profile: "horizontalStrike", effort: 1.45,
    arcs: [arc("main", "MID_RIGHT", "MID_LEFT")],
    drive: 0.25, concentration: 0.60, aim: 0.70,
    classMix: { slash: 1 }, moveFactor: 1.0,
    exertion: 11, demands: "strength",
  },

  // --- Thrusting ------------------------------------------------------------
  // MID_CENTRE to MID_CENTRE: zero carry in, zero carry out. Structurally the
  // most chainable action there is, which is exactly why fencers thrust.
  thrust: {
    name: "Thrust", profile: "thrust", effort: 1.0,
    arcs: [arc("main", "MID_CENTRE", "MID_CENTRE")],
    drive: 0.18, concentration: 0.92, aim: 1.00,
    classMix: { pierce: 1 }, moveFactor: 1.0,
    exertion: 6, demands: "strength",
  },
  lunge: {
    name: "Lunge", profile: "lunge", effort: 1.15,
    arcs: [arc("main", "MID_CENTRE", "MID_CENTRE")],
    drive: 0.45, concentration: 0.92, aim: 0.85,
    classMix: { pierce: 1 }, moveFactor: 1.4,
    exertion: 9, demands: "strength",
  },

  // --- Vertical -------------------------------------------------------------
  overhead: {
    name: "Overhead", profile: "overheadStrike", effort: 1.0,
    arcs: [arc("main", "HIGH_CENTRE", "LOW_CENTRE")],
    drive: 0.35, concentration: 0.60, aim: 0.75,
    classMix: { slash: 1 }, moveFactor: 1.0,
    exertion: 16, demands: "strength",
  },
  diagonalHack: {
    name: "Diagonal hack", profile: "diagonalStrike", effort: 1.1,
    arcs: [arc("main", "HIGH_RIGHT", "LOW_LEFT")],
    drive: 0.30, concentration: 0.60, aim: 0.78,
    classMix: { slash: 1 }, moveFactor: 1.0,
    exertion: 13, demands: "strength",
  },
  risingCut: {
    // Same shape as the hack, mirrored on y. Fights gravity on the way up, and
    // it is the natural answer to anything that left your hand low.
    name: "Rising cut", profile: "risingStrike", effort: 1.0,
    arcs: [arc("main", "LOW_LEFT", "HIGH_RIGHT")],
    drive: 0.28, concentration: 0.60, aim: 0.78,
    classMix: { slash: 1 }, moveFactor: 1.0,
    exertion: 12, demands: "strength",
  },

  // --- Off hand -------------------------------------------------------------
  shieldBash: {
    // Thrown with the off hand, so it swings whatever is strapped there, pays
    // the off-hand clumsiness penalty, and spends the shield to throw it --
    // leaving that side uncovered while it happens.
    name: "Shield bash", profile: "bodyCheck", effort: 1.0,
    arcs: [arc("off", "MID_LEFT", "MID_CENTRE")],
    drive: 0.60, concentration: 0.10, aim: 0.60,
    classMix: { blunt: 1 }, moveFactor: 1.1,
    exertion: 9, demands: "strength",
  },

  // --- Two arcs -------------------------------------------------------------
  crossSlash: {
    // Both blades, opposite diagonals, resolved as TWO contacts. Nothing prices
    // this by hand: both hands must travel to high corners (huge carry in), no
    // arm is left free and Drive is high (no guard, no evasion), and it finishes
    // with both hands in low corners -- the worst carry in the game. High risk,
    // high reward, self-pricing.
    //
    // Needs a fighter holding two weapons; none is statted yet. The structure
    // expresses it either way.
    name: "Cross slash", profile: "wideSwing", effort: 1.2,
    arcs: [arc("main", "HIGH_LEFT", "LOW_RIGHT"),
           arc("off",  "HIGH_RIGHT", "LOW_LEFT")],
    drive: 0.40, concentration: 0.60, aim: 0.65,
    classMix: { slash: 1 }, moveFactor: 1.0,
    exertion: 20, demands: "strength",
  },

  // --- No strike ------------------------------------------------------------
  takeBreath: {
    // No arcs, so no contact and no curve. It costs only time, and time is
    // priced by what the opponent does with it -- occupancy comes out at 45%
    // throughout, with no rule written for it. Scarcity in the deck is what
    // stops it being spammed.
    name: "Take a breath", profile: "breath", effort: 1.0,
    arcs: [],
    drive: 0, concentration: 0, aim: 0,
    classMix: {}, moveFactor: 1.0,
    exertion: 0, demands: null,
    effect: "recover",
  },
};

/** Which hands a card occupies. "both" occupies everything. */
export function handsUsed(card) {
  const hands = new Set();
  for (const a of card.arcs ?? []) {
    if (a.hand === "both") return new Set(["main", "off"]);
    hands.add(a.hand);
  }
  return hands;
}
