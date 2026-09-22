// Motion profiles. Content, no logic.
//
// A profile is a MOTION, not a card and not a weapon -- "horizontal weapon
// strike", "jumping overhead weapon strike". One entry serves an axe, a sword
// and a chair leg, because the mass term does all the differentiating: the same
// motion with heavier steel produces a longer tau and therefore longer phases,
// with no second entry and no per-weapon tuning.
//
// The library is fixed and deliberately generic. A card names one and may nudge
// individual phases (see cards.js `phaseNudge`); it never redefines the shape.
// That is what keeps one tuning pass over ~40 entries moving every card at once.
//
// Each phase is { w, driver }:
//
//   swing  (default)  w x tau -- tau = TEMPO_K / v_weapon, so this phase gets
//                     slower with a heavier weapon and faster with a stronger
//                     arm. Almost everything is this.
//   fixed             w ticks flat. For motion the body does not power: airtime
//                     is gravity's business, and a jump hangs just as long for a
//                     knight as for a duelist. Catching your breath is likewise
//                     a real duration that has nothing to do with swing speed.
//   pace              distance / (Pace_eff x MoveFactor). Travel only.
//
// Weights are in tau. Ordinary adult with a 1.3 kg arming sword is tau ~= 58
// ticks, so 1.0 is a little over half a second of motion for them.

const swing = (w) => ({ w, driver: "swing" });
const fixed = (w) => ({ w, driver: "fixed" });
const pace  = { w: 1, driver: "pace" };
const none  = { w: 0, driver: "fixed" };

export const PROFILES = {
  // --- Thrusting -----------------------------------------------------------
  shortJab: {
    name: "Short jab",
    windup: swing(0.4), travel: none, execution: swing(0.3), recovery: swing(0.4),
    note: "The fastest thing anyone can do with a point. Almost nothing to see coming.",
  },
  thrust: {
    name: "Straight thrust",
    windup: swing(0.7), travel: none, execution: swing(0.4), recovery: swing(0.6),
    note: "Linear, so execution is short -- the point is either there or it isn't.",
  },
  lunge: {
    name: "Lunge",
    windup: swing(1.0), travel: pace, execution: swing(0.6), recovery: swing(1.2),
    note: "A thrust with the body committed behind it. Travels, and the recovery is the price of having left your feet.",
  },

  // --- Cutting -------------------------------------------------------------
  guardedPoke: {
    name: "Guarded poke",
    windup: swing(0.5), travel: none, execution: swing(0.3), recovery: swing(0.2),
    note: "Barely a commitment at all. The natural home for a Bluff -- near-free to abandon.",
  },
  horizontalStrike: {
    name: "Horizontal weapon strike",
    windup: swing(1.3), travel: none, execution: swing(0.7), recovery: swing(1.0),
    note: "The workhorse. A long execution because the arc sweeps through space rather than arriving at a point.",
  },
  diagonalStrike: {
    name: "Diagonal weapon strike",
    windup: swing(1.5), travel: none, execution: swing(0.7), recovery: swing(1.1),
    note: "Slightly more to gather than a flat cut, and slightly more to unwind.",
  },
  risingStrike: {
    name: "Rising weapon strike",
    windup: swing(1.6), travel: none, execution: swing(0.6), recovery: swing(1.3),
    note: "Fighting gravity on the way up, which shows in the windup and worse in the recovery.",
  },
  overheadStrike: {
    name: "Overhead weapon strike",
    windup: swing(2.2), travel: none, execution: swing(0.8), recovery: swing(1.6),
    note: "Gravity helps the blow and punishes the miss. A big, readable tell.",
  },
  wideSwing: {
    name: "Wide weapon swing",
    windup: swing(2.6), travel: none, execution: swing(1.0), recovery: swing(2.0),
    note: "A haymaker. The longest execution in the library -- it is genuinely hard to be nowhere near it.",
  },
  jumpingOverhead: {
    name: "Jumping overhead weapon strike",
    windup: swing(3.0), travel: fixed(45), execution: swing(1.0), recovery: swing(2.4),
    note: "The airtime is FIXED -- gravity does not care how strong you are. Everything else scales, and the recovery is the worst in the library.",
    // TODO: no card uses this yet, and shouldn't until the fall pays for itself.
    // Momentum's body term is Mass x Pace_eff x MoveFactor x Drive, and Pace is
    // HORIZONTAL ground speed -- a fall has no representation in the model at
    // all. So this profile is currently slower, costlier and no harder-hitting
    // than a standing overhead: strictly worse. Half the fix is authorable
    // already (a jump commits more body, so Drive goes up); the missing half is
    // the fall. ~0.22 s of falling is ~2.2 m/s, comparable to the knight's
    // encumbered Pace of 2.4, so it roughly doubles the body term. Wanted: a
    // profile that declares airtime also yields a fall velocity, and v_body
    // takes the greater of pace-driven and fall-driven. Serves `charge` and any
    // leaping monster too. See combat-model.md section 9.
  },

  // --- Body ----------------------------------------------------------------
  bodyCheck: {
    name: "Body check",
    windup: swing(0.35), travel: none, execution: swing(0.20), recovery: swing(0.40),
    note: "Shoulder or shield. Very short weights, because a shove is not swung through an arc -- but tau still carries the shield's real mass, so a heavier shield is a slower bash.",
  },
  charge: {
    name: "Running charge",
    windup: swing(0.6), travel: pace, execution: swing(0.6), recovery: swing(1.4),
    note: "Windup completes during travel (section 06), so the ground is crossed ready. The recovery is what makes a whiffed charge so expensive.",
  },

  // --- No strike -----------------------------------------------------------
  stepClose: {
    name: "Step in",
    windup: fixed(8), travel: pace, execution: none, recovery: fixed(6),
    note: "Ordinary footwork. Costs no exertion worth counting and no swing tempo at all.",
  },
  stepAway: {
    name: "Step out",
    windup: fixed(8), travel: pace, execution: none, recovery: fixed(6),
    note: "The same motion outbound. Whether it opens the gap depends on what the other side is doing that exchange.",
  },
  breath: {
    name: "Take a breath",
    windup: none, travel: none, execution: fixed(70), recovery: none,
    note: "FIXED, because a lung is not a sword -- gathering yourself takes as long as it takes. No exertion, no payoff, and no defence while it happens. The purest card in the game.",
  },
  set: {
    name: "Set yourself",
    windup: fixed(18), travel: none, execution: fixed(55), recovery: fixed(22),
    note: "FIXED throughout, because getting your weight behind a shield is not a swing -- Strength does not make you brace faster, and a heavy shield does not make you brace slower once it is already up. The real windup is short and the HOLD is the point: this is the only profile whose Execution is what you actually want.",
  },
};

export const profileOf = (card) => PROFILES[card.profile];
