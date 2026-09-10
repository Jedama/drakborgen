// Playable fight: Siger vs. Giant Spider. Everything below is a direct
// application of what's been designed across this whole conversation --
// curve-based resolution (one composed curve per landed hit, rolled once,
// whose y-value IS the % of the defender's max HP removed -- no separate
// damage math after the roll), a real Windup/Travel/Execution/Recovery
// timeline simulated between both sides rather than a single windup-race
// comparison, trip punishing the next attack, parry shifting the incoming
// curve toward Armor rather than running its own damage formula.

// --- Characters ---

// hands: which weapon is held where -- cards name their weapon, and a
// lookup finds which hand it's in. dominantHand: -1 (fully left) to +1
// (fully right), 0 = ambidextrous. 0.25 is a slight lean, not a real
// commitment -- Siger's practiced with both hands, his off-hand just isn't
// quite as sharp. shieldSide: the buckler covers that side of him better,
// independent of which card is incoming.
//
// baseCurve is this character's OWN body/armor: how they respond to being
// struck, independent of whatever is doing the striking. Miss/Graze/Armor/
// Hit/Precision are always in that order (Precision is also the last band --
// its own endY right at x=100 IS the ceiling, no separate Max point needed);
// the x-width of each band is
// "how easy is it to land a hit of that quality on this body," and the
// y-value is "how much of my max HP a hit of that quality removes, at full
// weapon lethality." Siger is unarmored: a small Armor band (there's just
// not much to catch a blade), and Hit is reached fairly early and already
// hurts a lot. The spider's chitin is the opposite of that: a huge Armor
// band (most attacks just hit the shell), and Hit itself is compressed --
// toughness means even a hit that finds flesh does comparatively little,
// not that it's hard to find. This entirely replaces the old flat
// momentumResist/impulseResist stats -- armor lives in curve shape now.
const siger = {
  name: "Siger", hp: 100, maxHp: 100, speed: 60, strength: 65, weight: 75,
  hands: { right: "axe", left: "buckler" }, dominantHand: 0.25, shieldSide: "left",
  // Each named point is where that band BEGINS (see expandBands below,
  // which turns this plain list into full start/end pairs right before a
  // roll consumes it) -- this is still just one x/y per boundary, same
  // shape as always. `endY`, when set, is the value the band rises TO
  // across its own span before the next transition. Hit climbs hard through
  // its own band. Armor mostly holds -- "about equally bad the whole way
  // through" -- but not dead flat: blows still carry shock, and different
  // spots on even the armored parts absorb it a little differently, so it
  // gets a modest rise, nowhere near Hit's. No separate terminal point for
  // the absolute ceiling either -- Precision IS the last band, so its own
  // `endY` right at x=100 already means "the best a hit here can ever do."
  // Whether Precision itself is flat or rising varies by character/weapon;
  // Siger's own body doesn't have a strong opinion either way, so it gets a
  // small taper into that ceiling rather than a hard flat or a hard climb.
  // Graze rises toward whatever Armor's own start-value is (an endY of its
  // own, not just sitting flat at 0 the whole band) so the jump into Armor
  // is a small one, not a cliff -- devastation trends upward through Graze,
  // it doesn't hold at zero and then leap.
  baseCurve: [
    { name: "Graze", x: 12, y: 0, endY: 15, slope: 0 },
    { name: "Armor", x: 22, y: 20, endY: 28, slope: 0 },
    { name: "Hit", x: 42, y: 70, endY: 90 },
    // Precision is deliberately narrow -- it's the heart, the throat, the
    // eye -- rare no matter how the rest of the curve gets stretched. An
    // ordinary solid connection (Hit) covers most of the roll range instead.
    { name: "Precision", x: 88, y: 95, endY: 100, slope: 0.2 },
  ],
};
const spider = {
  name: "Giant Spider", hp: 80, maxHp: 80, speed: 80, strength: 50, weight: 300,
  baseCurve: [
    { name: "Graze", x: 18, y: 0, endY: 18, slope: 0 },
    { name: "Armor", x: 55, y: 25, endY: 32, slope: 0 },
    { name: "Hit", x: 75, y: 45, endY: 60 },
    { name: "Precision", x: 90, y: 75, endY: 100, slope: 0.2 },
  ],
};

// Real spatial units now, not small abstract steps -- a standard room is
// roughly 100x100, so distance is sticky and lives on that same scale.
// MELEE_RANGE is a display/reference constant only -- since Momentum Hack
// and the timing simulation, the real "am I close enough" gate is each
// card's own `reach`, not this.
let distance = 0;
const MAX_DISTANCE = 100; // the far wall/door -- reaching it is an escape
const DEFAULT_DISTANCE = 80; // a fresh fight starts across the room, not adjacent
const MELEE_RANGE = 5;

// Speed drives both the timing simulation's travel rate (see the Timing
// simulation section) and everything else weight/speed already fed into.
// Reference point is Siger's own speed, so his own movement reads as the
// 1.0x baseline -- the spider (speed 80) already covers noticeably more
// ground per tick than that, which is just its established "fast" trait
// doing something concrete.
const REFERENCE_SPEED = siger.speed;
function speedMultiplier(speed) { return speed / REFERENCE_SPEED; }
// Reposition distance and ordinary melee's old "farther out is worse"
// curve penalty both now fall out of the real timing simulation itself
// (see the Timing simulation section) instead of being separate flat
// formulas -- how far a repositioning card actually moves, and whether an
// attack even reaches its target in time, are both just outcomes of that
// simulation now. sqrt keeps its diminishing-returns shape for the one
// place distance still scales a bonus directly: how much extra momentum a
// charge earns from however much ground it actually covered.
const MOMENTUM_HACK_DISTANCE_FACTOR = 3; // bonus momentum on Momentum Hack, per unit of sqrt(distance covered)

// Weight drives Momentum generation (mass in motion) the way Strength drives
// a technique's own force -- a heavier body throws more momentum into a
// body-driven hit, at the same devastation roll. Reference point is Siger's
// own weight, so his own attacks read as the 1.0x baseline.
const REFERENCE_WEIGHT = 75;
function weightMultiplier(weight) { return weight / REFERENCE_WEIGHT; }

// Real physics: momentum is mass times velocity, not a number a card just
// carries. A character's own body has a momentum-generating CAPACITY --
// Weight x Speed -- and each card only channels some fraction of it into
// the actual hit (a full-body shove channels most of it; a light limb
// strike barely any). Reference is Siger's own body at 1.0x/1.0x, so
// BASE_MOMENTUM_CAPACITY is literally "how much momentum Siger's own body
// can generate," and every card's momentumFactor is relative to that.
const BASE_MOMENTUM_CAPACITY = 20;
function momentumCapacity(character) {
  return weightMultiplier(character.weight) * speedMultiplier(character.speed) * BASE_MOMENTUM_CAPACITY;
}

// Whether a landed hit disrupts an opponent still mid-Windup is now gated
// by the ACTUAL rolled outcome, not a pre-roll momentum guess -- the timing
// simulation only decides whether the opponent had even started Execution
// yet (see classifyLanding); this decides whether the hit that got there
// first actually did enough to knock them off whatever they were doing.
// Armor holding, or just being built to tank it, lets the disrupted card
// go through anyway.
const DISRUPT_DEVASTATION_THRESHOLD = 30; // % devastation needed to cancel an opponent's still-in-progress Windup
const CLASH_LATE_PENALTY_SCALE = 0.4; // whichever side of a clash lands later eats a curve penalty scaled by the gap

// A card's `direction` is -100..100, from the DEFENDER's point of view --
// negative lands on their left, positive on their right. 0 means the attack
// has no lateral identity at all (a straight thrust, an overhead cleave),
// and stays fully neutral against everything below. Cards whose side varies
// every time carry `directional: true` instead of a fixed value; roll one
// at play time.
function rollDirection() { return Math.random() < 0.5 ? -100 : 100; }

// Which hand (if any) a character has a given weapon in.
function handOf(character, weapon) {
  if (!character.hands) return null;
  for (const [hand, w] of Object.entries(character.hands)) if (w === weapon) return hand;
  return null;
}

// -1..1 slider, hand sign right=+1/left=-1. Positive alignment means this
// weapon is in the favored hand (small bonus); negative means it's in the
// off-hand (a bigger penalty -- an off-hand is usually worse than the
// dominant one is better). A character with no hands/dominantHand, or a
// card with no weapon, is simply unaffected.
const DOMINANT_HAND_BONUS_RATE = 0.05;
const OFFHAND_PENALTY_RATE = 0.10;
function handDominanceModifier(character, weapon) {
  const hand = handOf(character, weapon);
  if (!hand || !character.dominantHand) return 0;
  const alignment = character.dominantHand * (hand === "right" ? 1 : -1);
  return alignment >= 0 ? alignment * DOMINANT_HAND_BONUS_RATE : alignment * OFFHAND_PENALTY_RATE;
}

// The same small hand-dominance modifier touches windup (favored hand is a
// touch quicker) and curve position (favored hand is a touch more accurate)
// -- "most things, by a tiny amount," applied through one shared number
// rather than separately-tuned ones.
function effectiveWindup(character, card) {
  return (card.windup ?? 0) * (1 - handDominanceModifier(character, card.weapon));
}
function handCurveShift(character, card) {
  const mod = handDominanceModifier(character, card.weapon);
  return mod === 0 ? 0 : -mod * 20; // small: the mod itself is already +-0.05/0.10 max
}

// Buckler in the left hand blocks left-side attacks better and right-side
// ones worse, scaling smoothly with how much the incoming attack actually
// favors one side -- a dead-straight thrust (direction 0) is fully neutral.
const SHIELD_FAVORED_MAX = 5;
const SHIELD_OFFSIDE_MAX = 12;
function shieldSideShift(character, incomingDirection) {
  if (!character.shieldSide || incomingDirection == null) return 0;
  const shieldSign = character.shieldSide === "left" ? -1 : 1;
  const alignment = incomingDirection * shieldSign; // -100..100, positive favors the shield
  return alignment >= 0 ? -(alignment / 100) * SHIELD_FAVORED_MAX : -(alignment / 100) * SHIELD_OFFSIDE_MAX;
}

// --- Curve engine (Fritsch-Carlson monotone cubic Hermite) ---

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function computeTangents(points) {
  const n = points.length;
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    m[i] = dx === 0 ? 0 : dy / dx;
  }
  const t = new Array(n);
  // A point can author its own tangent (how fast devastation is changing
  // right at that point) instead of the auto-averaged one -- this is the
  // actual knob for giving each band its own character (Armor easing in
  // gently, Hit climbing hard through its span, Precision tapering toward
  // the ceiling at its own end) while the whole thing stays one smooth
  // curve, not separate shapes stitched together. The Fritsch-Carlson
  // limiter right below still runs over whatever ends up here, so an
  // authored slope can never cause an actual overshoot -- it can only get
  // pulled closer to what was asked for.
  for (let i = 0; i < n; i++) {
    if (points[i].slope != null) { t[i] = points[i].slope; continue; }
    if (i === 0) { t[i] = m[0]; continue; }
    if (i === n - 1) { t[i] = m[n - 2]; continue; }
    t[i] = m[i - 1] === 0 || m[i] === 0 || (m[i - 1] > 0) !== (m[i] > 0)
      ? 0 : (m[i - 1] + m[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i];
    if (a < 0) t[i] = 0;
    if (b < 0) t[i + 1] = 0;
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[i] = tau * a * m[i];
      t[i + 1] = tau * b * m[i];
    }
  }
  return t;
}

function buildSpline(points) {
  const t = computeTangents(points);
  const n = points.length;
  return function (x) {
    if (x <= points[0].x) return points[0].y;
    if (x >= points[n - 1].x) return points[n - 1].y;
    let i = 0;
    while (i < n - 2 && x > points[i + 1].x) i++;
    const x0 = points[i].x, x1 = points[i + 1].x;
    const y0 = points[i].y, y1 = points[i + 1].y;
    const h = x1 - x0, s = (x - x0) / h;
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    return h00 * y0 + h10 * h * t[i] + h01 * y1 + h11 * h * t[i + 1];
  };
}

// Generic point editor for the composed-curve pipeline below: nudges named
// points' x and/or y (dx/dy, additive) or rescales y by a multiplier
// (yScale), then keeps the point list monotonic in x. This is the whole
// point of the redesign -- every physical factor (weapon lethality,
// momentum, strength, movement, a block, hand dominance, ...) is just one
// call into this, on whichever named point(s) it actually affects, and they
// all compose freely because they all just edit points on one shared list.
// x is intentionally NOT clamped to [0,100] here -- a roll is always 0-100,
// but the CURVE'S OWN points don't need to stay inside that range to still
// be meaningful. If a big shift pushes a point past 100, that band simply
// becomes unreachable by any real roll, which is exactly what "this is now
// much harder to land" should mean. Clamping each point back into [0,100]
// independently was the actual bug: a big shift would crush Armor/Hit/
// Precision/Max together at the x=100 wall, and any roll that DID clear the
// (also-shifted) Graze threshold would then always read as max-tier,
// regardless of how well it actually rolled. Only y is a real percentage
// and stays bounded.
function editPoints(points, edits) {
  let out = points.map((p) => ({ ...p }));
  for (const edit of edits) {
    const names = Array.isArray(edit.names) ? edit.names : [edit.names];
    out = out.map((p) => {
      if (!names.includes(p.name)) return p;
      let y = p.y;
      // endYOnly: for a point like Graze, whose start-y HAS to stay pinned
      // at 0 (buildSpline uses it as the flat value for the whole Miss
      // zone below the point -- touching it here would make Miss stop
      // meaning "definitely 0%"), but whose endY should still scale with
      // weapon lethality/momentum same as every other band's.
      if (!edit.endYOnly) {
        if (edit.yScale != null) y = y * edit.yScale;
        if (edit.dy) y = y + edit.dy;
      }
      const x = edit.dx ? p.x + edit.dx : p.x;
      // endY (a band's internal rise target -- see expandBands) rides along
      // with the same y-edits as y itself, so weaponPower/momentum/strength
      // scale a band's internal climb proportionally instead of leaving it
      // fixed while the band's start value moves out from under it.
      let endY = p.endY;
      if (endY != null) {
        if (edit.yScale != null) endY = endY * edit.yScale;
        if (edit.dy) endY = endY + edit.dy;
        endY = clamp(endY, 0, 100);
      }
      return { name: p.name, x, y: clamp(y, 0, 100), slope: p.slope, endY };
    });
  }
  for (let i = 1; i < out.length; i++) {
    if (out[i].x <= out[i - 1].x) out[i].x = out[i - 1].x + 0.01;
  }
  return out;
}

// A handful of things shift a whole curve sideways by the same amount,
// regardless of which named point it is -- "this roll needs to be N points
// better across the board to connect the same way it would have otherwise."
// Catch-up penalties, trip/stagger carryover, and hand dominance are all
// this; none of them touch how DEVASTATING a given zone is, only how hard
// that zone is to reach.
function shiftCurveX(points, xShift) {
  if (!xShift) return points;
  return editPoints(points, [{ names: points.map((p) => p.name), dx: xShift }]);
}

// Below the first defined point (Graze), nothing has happened yet -- a
// total miss. There's no separate (0,0) anchor point for that anymore: it
// added nothing Graze's own y=0 didn't already give for free, and it forced
// an artificial 0 tangent right at Graze, which is exactly the kind of kink
// a smooth curve shouldn't have.
function zoneLabel(points, x) {
  if (x < points[0].x) return "Miss";
  for (let i = 0; i < points.length - 1; i++) {
    if (x < points[i + 1].x) return points[i].name;
  }
  return points[points.length - 1].name;
}

// A single point's tangent can't delay a rise across a wide band -- a
// 2-knot cubic Hermite segment reaches ~50% of its total rise by the
// midpoint no matter what the tangents are, that's just what the math does.
// Getting an actual "flat within the band, sharp jump entering the next
// one" shape needs a second point. This expands every named boundary into
// a start/end pair: the point AS AUTHORED is where its band begins, and a
// second point (same name, so zoneLabel and every by-name modifier still
// see one band) gets placed a fixed, narrow TRANSITION_WIDTH before the
// NEXT band starts, holding this band's own y by default -- or `endY` if
// the point wants to visibly rise across its own span instead of staying
// flat (Hit does; most bands don't). Everything upstream of this (base
// curves, composeDamageCurve's edits, PARRY_THRESHOLDS) still authors and
// edits the plain one-point-per-boundary list exactly as before; this is
// the one place it gets expanded, right before the roll that consumes it.
const TRANSITION_WIDTH = 2;
// No separate terminal "Max" point -- the LAST band (Precision, typically)
// just owns the tail all the way to x=100 itself: its `endY` (or its own y,
// if left flat) right at 100 IS the ceiling. Every other band still ends a
// narrow TRANSITION_WIDTH before the next one starts; the last band has no
// next one to leave room for, so its own end sits exactly at 100.
function expandBands(points, transitionWidth = TRANSITION_WIDTH) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    out.push({ name: p.name, x: p.x, y: p.y, slope: p.slope });
    const isLast = i === points.length - 1;
    const nextX = isLast ? 100 : points[i + 1].x;
    if (nextX > p.x) {
      // Never eat more than half an unusually narrow gap -- otherwise the
      // "_end" point would land BEFORE its own band's start (e.g. Buckler
      // Parry's thresholds pack Hit/Precision within half a unit of each
      // other, far narrower than the default transition width).
      const gap = nextX - p.x;
      const t = isLast ? 0 : Math.min(transitionWidth, gap / 2);
      const endY = p.endY != null ? p.endY : p.y;
      out.push({ name: p.name, x: nextX - t, y: endY, slope: p.slope });
    }
  }
  return out;
}

function rollOnCurve(points) {
  const curve = expandBands(points);
  const roll = Math.random() * 100;
  const devastation = buildSpline(curve)(roll);
  return { roll, devastation, zone: zoneLabel(curve, roll), curve };
}

// --- Damage curve composition ---
//
// One curve per landed hit, rolled once: the y-value IS the % of the
// defender's max HP removed. Nothing further happens to it -- no separate
// momentum/impulse arithmetic afterward. Instead, every physical quantity
// shapes the curve BEFORE that single roll:
//   - weapon lethality rescales the y-ceiling at Armor/Hit/Precision (and
//     Precision's own endY, the true ceiling) -- a punch cannot reach the
//     same devastation an axe can, no matter the roll.
//   - momentum (mass in motion) adds a flat y-bonus at Armor/Hit/Precision --
//     it partially punches through *regardless* of what's in the way (armor,
//     a raised shield), which is also why blocking a weapon's tip doesn't
//     stop a much heavier body from still crashing into you. The tradeoff:
//     a lot of momentum is hard to fine-tune right before impact, so it also
//     narrows the Precision band (pushes Precision's x higher).
//   - strength adds a flat y-bonus at Hit/Precision -- muscle behind a
//     technique that actually connects.
//   - everything else (hand dominance, catch-up penalties, trip/stagger
//     carryover, an active block) is a whole-curve x-shift, same mechanism
//     as before, just no longer bundled with a y-bonus.
const REFERENCE_STRENGTH = siger.strength;
const MOMENTUM_Y_SCALE = 0.3; // momentum punches partway through even a block/armor
const STRENGTH_Y_SCALE = 0.3; // muscle behind a landed technique
const MOMENTUM_PRECISION_NARROW_SCALE = 0.15; // heavy momentum is hard to fine-tune right before impact
// Playing Buckler Parry means Siger blocks -- but the shield stops the
// WEAPON specifically (a claw's own cutting edge), not the mass behind it.
// A huge spider's whole body slamming into a raised shield doesn't care
// that the shield is there, and Siger isn't dodging either -- he's braced
// for exactly this, so there's no "missed entirely" outcome at all here,
// only a question of how much gets through. This is a dedicated curve, not
// the normal weaponPower/precision pipeline (that pipeline is for a clean
// unblocked hit, which this specifically isn't): Armor's own point sits at
// a deeply negative x -- structurally unreachable as a total miss, since
// no roll is ever negative -- and spans nearly the whole roll range at a
// flat baseline driven by momentum alone. Hit is the claws finding a real
// gap around the shield's edge on top of that baseline; Precision (very
// narrow -- a near-perfect angle) is a genuine clean connection despite
// the block. Loose first-cut numbers, not exact targets.
const PARRY_ARMOR_X = -60;
const PARRY_HIT_X = 91;
const PARRY_PRECISION_X = 98.5;
const PARRY_MOMENTUM_SCALE = 0.5; // fraction of raw momentum that becomes the Armor-zone baseline when blocked
const PARRY_HIT_BONUS = 20; // how much the claws add on top of that baseline once they find a gap
const PARRY_PRECISION_Y = 50; // a genuine clean connection despite the block

function buildParryCurve(rawMomentum, xShift) {
  const armorY = rawMomentum * PARRY_MOMENTUM_SCALE;
  return [
    { name: "Armor", x: PARRY_ARMOR_X + xShift, y: armorY, slope: 0 },
    { name: "Hit", x: PARRY_HIT_X + xShift, y: armorY + PARRY_HIT_BONUS, endY: armorY + PARRY_HIT_BONUS + 5 },
    { name: "Precision", x: PARRY_PRECISION_X + xShift, y: PARRY_PRECISION_Y, endY: PARRY_PRECISION_Y + 5, slope: 0.2 },
  ];
}

// A secondary band is a second, independent question asked of the SAME
// roll the primary curve already used -- "did this also land somewhere
// that matters for a different reason?" -- without changing what the
// primary curve says about damage. Riposte lives on Buckler Parry (the
// defender's card, watching the attacker's own roll for an opening); a
// future Daze or Maim band would live on an attacker's weapon instead,
// watching their own roll against the defender. Same mechanism either way.
// Note for later: a band still has to make sense against who it's being
// checked against (no Bleed band ever fires against a skeleton) -- not
// implemented yet since nothing exercises it, but keep it in mind once a
// second band type actually exists.
function inBand(band, roll) {
  return band != null && roll >= band.min && roll <= band.max;
}

function composeDamageCurve(defender, card, attacker, rawMomentum, contextXShift) {
  // Graze's endY (see baseCurve, "graze rises toward Armor's start") scales
  // with weapon lethality and momentum the same way everything else does --
  // endYOnly, since Graze's actual start-y has to stay pinned at 0 (it's
  // what the whole Miss zone below it reads as). Without this, a strong
  // weapon/heavy momentum would leave Graze's own ceiling fixed while
  // Armor's real start value moves out from under it, reopening the same
  // kind of gap the jump into Armor used to have.
  let points = editPoints(defender.baseCurve, [
    { names: ["Graze"], yScale: card.weaponPower / 100, endYOnly: true },
    { names: ["Armor", "Hit", "Precision"], yScale: card.weaponPower / 100 },
    // Precision's endY (the ceiling -- see baseCurve) rides along with this
    // too, via editPoints' endY handling, not just its own start y -- a
    // weak weapon or a low-momentum, high-strength attacker shouldn't be
    // able to leave the ceiling fixed while everything under it moves,
    // which is exactly the class of bug that let Precision pass Max back
    // when they were two separate points.
    { names: ["Graze"], dy: rawMomentum * MOMENTUM_Y_SCALE, endYOnly: true },
    { names: ["Armor", "Hit", "Precision"], dy: rawMomentum * MOMENTUM_Y_SCALE },
    { names: ["Precision"], dx: rawMomentum * MOMENTUM_PRECISION_NARROW_SCALE },
  ]);
  const strengthBonus = (attacker.strength - REFERENCE_STRENGTH) * STRENGTH_Y_SCALE;
  if (strengthBonus) points = editPoints(points, [{ names: ["Hit", "Precision"], dy: strengthBonus }]);
  if (contextXShift) points = shiftCurveX(points, contextXShift);
  return points;
}

// Shared tail: given a fully-built curve (composed normally, or restructured
// like Buckler Parry's below), roll once and turn that into damage.
function resolveRoll(defender, curve) {
  // rollOnCurve's own `curve` (the expanded, post-band curve it actually
  // rolled against) has to win here -- shadowing this function's own
  // pre-expansion `curve` parameter, not the other way around, or whatever
  // gets charted is the wrong shape even though the roll itself was correct.
  const { roll, devastation, zone, curve: shapedCurve } = rollOnCurve(curve);
  return {
    roll, devastation, zone, curve: shapedCurve,
    damage: defender.maxHp * (devastation / 100),
  };
}

function resolveHit(defender, card, attacker, rawMomentum, contextXShift) {
  const composed = composeDamageCurve(defender, card, attacker, rawMomentum, contextXShift);
  return resolveRoll(defender, composed);
}

// --- Cards ---
//
// weaponPower (how devastating this weapon/technique can possibly be) and
// momentumFactor (how much of the wielder's own momentum capacity this
// specific technique channels) still drive the damage curve exactly as
// before. New on top of that, for real timing (see the Timing simulation
// section below): `windup`, `execution`, `recovery` are real time-units (1
// second == 100 units); `reach` is how far this technique can actually
// connect from, on the same scale as `distance`; `movesSelf` marks a
// technique whose own motion carries it toward (or away from) the foe, so
// its Travel runs concurrently with its Windup instead of needing Travel to
// finish first, and `travelFactor` scales how fast that motion is relative
// to the character's own plain speed stat (1 = normal; Momentum Hack and
// Leap & Claw both push harder than that).
//
// Only Siger's four active cards and the spider's three are wired into the
// new timing simulation right now -- everything else below is commented
// out, not deleted, while the engine gets proven on a smaller set first.
const CARDS = {
  axeChop: {
    name: "Axe Chop (Right-to-Left)", owner: "siger", type: "attack", weapon: "axe",
    // Right-to-left, from Siger's own side -- lands on the DEFENDER's right.
    // Stationary -- no movesSelf -- so it only ever connects if the gap is
    // already closed, either because he was already in range or because
    // whatever the spider's doing brought the distance down on its own.
    damageType: "slashing", weaponPower: 90, momentumFactor: 0.4, direction: 100,
    windup: 45, reach: 8, execution: 35, recovery: 40,
  },
  bucklerParry: {
    // Already strapped to the arm, already up -- no real windup, and no
    // real recovery either: a shield doesn't need to be un-wound the way a
    // swing does. The incoming attack's own curve gets its thresholds
    // replaced wholesale (see PARRY_THRESHOLDS) rather than shifted -- see
    // the bucklerParry branch in resolveRound. The riposte opening is a
    // secondary band, not part of that curve at all: it doesn't have to
    // line up with where Armor itself ends (a hit can still land on the
    // shield without being clean enough to punish), it's just a separate
    // range checked against the same roll.
    name: "Buckler Parry", owner: "siger", type: "defense", weapon: "buckler", windup: 0, recovery: 0,
    secondaryBands: [{ name: "Parry", min: 4, max: 84 }],
  },
  // Not a playable card -- the reactive counter a clean parry opens up.
  // Deliberately weak: a quick rim-tap off an already-moving shield arm, not
  // a real committed swing. Low weaponPower keeps its ceiling low ("very low
  // devastation, but can cause mild damage or very mild disruption"); its
  // momentum still runs through the same generic Stagger check as anything
  // else, so against something lighter than the spider, this exact same
  // weak-looking riposte could still stagger it -- no special-casing needed
  // for that to fall out on its own.
  bucklerRiposte: {
    name: "Buckler Riposte", weapon: "buckler",
    damageType: "blunt", weaponPower: 18, momentumFactor: 0.4,
  },
  // lowChop, jumpingOverheadChop, bucklerSlam, sidestepLeft/Right and
  // laneShiftSlash are commented out below while the timing engine proves
  // itself on a smaller set -- their airborne/trip/lane interactions were
  // built for the old single-roll model and need rethinking against real
  // timing, not deleted, just not wired in yet.
  /*
  lowChop: {
    name: "Low Chop (Right-to-Left)", owner: "siger", type: "attack", weapon: "axe",
    damageType: "slashing", weaponPower: 65, momentumFactor: 0.25, windup: 5, direction: 100,
    tripThreshold: 70,
  },
  bucklerSlam: {
    name: "Buckler Slam", owner: "siger", type: "attack", weapon: "buckler",
    damageType: "blunt", weaponPower: 45, momentumFactor: 0.5, windup: 3, direction: 0,
  },
  */
  momentumHack: {
    // Rush the foe and put the run-up into the chop -- its momentum isn't a
    // fixed stat, it's computed from however much distance it actually
    // covers this exchange (see the simulation section). movesSelf: true
    // means Windup and Travel run concurrently -- he's already closing
    // while readying the swing, arriving with the axe already back and
    // ready, exactly like the worked examples.
    name: "Momentum Hack", owner: "siger", type: "attack", weapon: "axe",
    damageType: "slashing", weaponPower: 85, momentumFactor: 0.3, direction: 0,
    momentumFromDistance: true,
    windup: 60, reach: 8, execution: 35, recovery: 55, movesSelf: true, travelFactor: 1.3,
  },
  shoulderShove: {
    // No weapon -- pure body mass. High momentum, near-zero weaponPower
    // (there's no edge, nothing built to wound). Blunt. Deliberately weak
    // against the spider on purpose: even its best-case momentum never
    // gets close to the spider's stagger bar -- shouldering something this
    // much heavier just doesn't work. Its real job is a MUCH shorter
    // windup than a wide axe swing needs (no backswing to a body check),
    // so it can land -- and, if it lands hard, disrupt -- well before a
    // slower opponent's own windup finishes. Not obsolete just because the
    // disrupt mechanic itself got generalized: it's still the fastest tool
    // for reaching that window at all, and a full body's momentum hitting
    // a raised shield can matter more than a blade doing the same.
    name: "Shoulder Shove", owner: "siger", type: "attack",
    damageType: "blunt", weaponPower: 25, momentumFactor: 1.1, direction: 0,
    windup: 15, reach: 6, execution: 15, recovery: 25,
  },
  /*
  jumpingOverheadChop: {
    name: "Jumping Overhead Chop", owner: "siger", type: "attack", weapon: "axe", airborne: true,
    damageType: "slashing", weaponPower: 100, momentumFactor: 0.75, windup: 9, direction: 0,
  },
  sidestepLeft: {
    name: "Sidestep Left", owner: "siger", type: "reposition", windup: 2, evasive: true, direction: -100,
  },
  sidestepRight: {
    name: "Sidestep Right", owner: "siger", type: "reposition", windup: 2, evasive: true, direction: 100,
  },
  */
  leapClaw: {
    // High momentum (a whole body crashing down), modest weaponPower (claws
    // are real but not a refined cutting mechanism) -- still devastating
    // because momentum punches through regardless of what's in the way.
    // movesSelf: the leap itself is the approach; a big enough hit landed
    // on the spider before this connects (see the simulation section)
    // cancels it outright -- not a Stagger, no carryover, just this round's
    // leap never happening.
    name: "Leap & Claw", owner: "spider", type: "attack",
    damageType: "slashing", weaponPower: 70, momentumFactor: 0.3, airborne: true,
    windup: 50, reach: 10, execution: 30, recovery: 45, movesSelf: true, travelFactor: 1.6,
  },
  skitterBack: {
    // Tactical reposition, not a real escape attempt -- gains ground but
    // never ends the fight on its own, even if it caps out at the door.
    // The movement itself IS this card's active phase (see the simulation
    // section) -- there's nothing beyond the reposition to separately
    // travel toward, so windup is just the moment of pushing off.
    name: "Skitter Back", owner: "spider", type: "reposition",
    windup: 10, execution: 50, recovery: 15, movesSelf: true, travelFactor: 1.0,
  },
  flee: {
    // The real thing: a committed bolt straight for the door. Whether it
    // actually ends the fight depends on whether Siger gave chase (played an
    // attack, i.e. was pressing forward) this same exchange -- if he did,
    // the spider's cornered at the doorway and the fight continues; if he
    // wasn't pursuing (defending, repositioning, or holding), it's gone clean.
    name: "Flee", owner: "spider", type: "reposition",
    windup: 10, execution: 60, recovery: 20, movesSelf: true, travelFactor: 1.2,
  },
  /*
  laneShiftSlash: {
    name: "Lane-Shift Slash", owner: "spider", type: "attack", evasive: true, directional: true,
    damageType: "slashing", weaponPower: 50, momentumFactor: 0.0375, windup: 4,
  },
  */
};

// Trip and Stagger used to live here as a boolean-per-side flag snapshotted
// at the start of a round and carried into the NEXT round as a flat curve
// penalty -- that framing assumed discrete, opaque per-round turns. It
// doesn't compose with a real tick timeline where actions start, land, and
// get interrupted at arbitrary moments within and across exchanges, so both
// are removed for now rather than left in a shape that no longer means
// anything. Revisit once status effects are redesigned against real time
// (a duration in ticks, not a next-round flag).
let gameOver = false;

function pickSpiderCard() {
  const hpRatio = spider.hp / spider.maxHp;
  if (hpRatio < 0.3 && Math.random() < 0.6) return "flee"; // real panic -> real escape attempt
  const r = Math.random();
  if (r < 0.55) return "leapClaw";
  if (r < 0.8) return "skitterBack";
  return "flee"; // small baseline chance even at full health
}

// --- Timing simulation (Windup / Travel / Execution / Recovery) ---
//
// Real time-units: 1 second == 100 units, so a half-second windup is just
// 50, directly comparable to a 0.1s jab (10) or a 1s swing (100). Distance
// is one shared, live number both sides can move each tick (if their card
// moves them) -- not a value computed for one side in isolation and
// compared against the other's afterward. That's what lets a pursuer's
// actual closing time depend on whether the target is simultaneously
// retreating, and lets an attack's Execution (a real window it could
// connect in, not an instant) find a moving target wherever it actually
// ends up, rather than assuming a fixed arrival that may never happen.
//
// Windup always starts at t=0 and just counts down, movement or not.
// Travel only exists for a `movesSelf` card, and runs CONCURRENTLY with
// Windup (not after it) -- exactly the "windup finishes during travel"
// case worked through by hand earlier. A movesSelf attacker keeps closing,
// tick by tick, for as long as it's still outside its own reach and hasn't
// started Execution yet; a reposition card (Skitter Back, Flee) has no
// "reach" concept at all -- its own movement away IS its active phase, for
// its own fixed execution duration, not gated by distance.
//
// Execution's reach is a triangular ramp -- zero at the start and end of
// the window, peaking at the card's own max reach at the midpoint -- since
// a real swing's arc only actually crosses a given point in space partway
// through its own motion, not the instant it begins. Every tick during
// Execution, that ramped reach is compared against whatever the CURRENT
// live distance is; the first tick it's cleared is when the hit lands. If
// the window closes without that ever happening, it's a genuine whiff --
// the target simply was not reachable in time, not a bad roll.
// TIME_TICK needs to be fine enough that the triangular reach ramp's own
// peak (a single continuous instant, at the exact midpoint of an Execution
// window) doesn't fall between two sampled ticks -- a coarse tick can
// straddle that peak and report a false whiff even when the continuous
// math would have connected by a hair. 0.5 costs nothing real here (a few
// thousand cheap iterations at most) and is fine enough that this doesn't
// come up in practice.
const TIME_TICK = 0.5;
const MAX_SIM_TICKS = 2000;
const BASE_TRAVEL_SPEED = 0.3; // distance-units per tick, at 1.0x speed and a 1.0x travelFactor
// A card without movesSelf isn't a committed lunge, but that doesn't mean
// the character is rooted to the spot either -- if the remaining gap is
// only a handful of units, an ordinary person still takes a step or two to
// actually reach, at plain walking pace, not the lunging travelFactor a
// real gap-closing card gets. If the gap is still large, they just don't
// bother without a real approach card -- a step or two, not a room crossing.
const MAX_ORDINARY_STEP = 15;

function travelRate(character, card) {
  if (!card.movesSelf) return 0;
  return BASE_TRAVEL_SPEED * speedMultiplier(character.speed) * (card.travelFactor ?? 1);
}

function makeActor(character, card) {
  return {
    character, card,
    windupDur: effectiveWindup(character, card),
    rate: travelRate(character, card),
    ordinaryRate: BASE_TRAVEL_SPEED * speedMultiplier(character.speed), // plain walking pace -- see MAX_ORDINARY_STEP
    isAttack: card.type === "attack",
    isReposition: card.type === "reposition",
    reach: card.reach ?? 0,
    execDur: card.execution ?? 0,
    windupElapsed: 0,
    moveElapsed: 0, // reposition only -- ticks actually spent moving so far
    distanceCovered: 0, // this actor's OWN contribution to closing, for Momentum Hack's bonus
    executing: false,
    execStartTick: null,
    execElapsed: 0,
    landed: false,
    landTick: null,
    whiffed: false, // execution window closed without ever landing
  };
}

// Reach at a given point through the execution window: 0 -> reach (at the
// midpoint) -> 0, linearly. A stationary target sitting anywhere inside the
// weapon's max reach gets caught somewhere on this ramp -- how far into the
// window depends only on how close they already are.
function rampReach(actor) {
  const half = actor.execDur / 2;
  if (half <= 0) return actor.reach;
  const frac = actor.execElapsed <= half ? actor.execElapsed / half : (actor.execDur - actor.execElapsed) / half;
  return actor.reach * clamp(frac, 0, 1);
}

// Advances one actor by one tick and returns its signed contribution to
// distance this tick (positive = closing, negative = retreating, 0 = holding).
function stepActor(actor, distance, dt, t) {
  if (actor.windupElapsed < actor.windupDur) actor.windupElapsed = Math.min(actor.windupDur, actor.windupElapsed + dt);
  if (actor.isReposition) {
    // The reposition itself only starts once the (brief) windup -- the
    // moment of pushing off -- is done, then runs for its own fixed
    // duration, moving away the whole time.
    if (actor.windupElapsed >= actor.windupDur && actor.moveElapsed < actor.execDur) {
      const step = Math.min(dt, actor.execDur - actor.moveElapsed);
      actor.moveElapsed += step;
      return actor.rate * step; // retreating widens distance
    }
    return 0;
  }
  if (!actor.isAttack) return 0;
  if (actor.executing) return 0; // committed to the swing in place, no more repositioning
  if (actor.windupElapsed >= actor.windupDur && distance <= actor.reach) {
    actor.executing = true; // ready AND in range -- Execution starts this tick
    actor.execStartTick = t;
    return 0;
  }
  if (actor.rate > 0 && distance > actor.reach) {
    const step = actor.rate * dt;
    actor.distanceCovered += step;
    return -step; // a committed lunge/charge -- always closes, no matter how far
  }
  const gap = distance - actor.reach;
  if (actor.rate === 0 && gap > 0 && gap <= MAX_ORDINARY_STEP) {
    // Ordinary footwork -- not a lunge, just closing a short remaining gap
    // at plain walking pace, capped so this never turns into chasing.
    const step = Math.min(actor.ordinaryRate * dt, gap);
    actor.distanceCovered += step;
    return -step;
  }
  return 0; // stationary, gap's too far to bother without a real approach card
}

// Advances Execution for an already-executing attacker and checks landing.
function checkLanding(actor, distance, t) {
  if (!actor.isAttack || !actor.executing || actor.landed || actor.whiffed) return;
  if (rampReach(actor) >= distance) {
    actor.landed = true;
    actor.landTick = t;
    return;
  }
  actor.execElapsed += TIME_TICK;
  if (actor.execElapsed >= actor.execDur) actor.whiffed = true;
}

// Runs the shared simulation for one exchange and returns both actors'
// outcomes plus the distance it settled at. This is the "uninterrupted
// baseline" pass only -- no reactions, no mid-sequence interruption yet;
// see the Commit & Bail doc's Section 07 for what's still deliberately not
// built here.
function simulateExchange(sigerCard, spiderCard, startDistance) {
  const sigerActor = makeActor(siger, sigerCard);
  const spiderActor = makeActor(spider, spiderCard);
  let distance = startDistance;
  let t = 0;
  const bothSettled = () =>
    (!sigerActor.isAttack || sigerActor.landed || sigerActor.whiffed) &&
    (!spiderActor.isAttack || spiderActor.landed || spiderActor.whiffed) &&
    (!sigerActor.isReposition || sigerActor.moveElapsed >= sigerActor.execDur) &&
    (!spiderActor.isReposition || spiderActor.moveElapsed >= spiderActor.execDur);
  while (t < MAX_SIM_TICKS && !bothSettled()) {
    t += TIME_TICK;
    distance += stepActor(sigerActor, distance, TIME_TICK, t) + stepActor(spiderActor, distance, TIME_TICK, t);
    distance = Math.max(0, distance);
    checkLanding(sigerActor, distance, t);
    checkLanding(spiderActor, distance, t);
  }
  return { distance, siger: sigerActor, spider: spiderActor, ticks: t };
}

// How a hit that landed relates to the OTHER side's own window, evaluated
// at the actual moment it landed (not the simulation's final state):
//   - "clear" -- the opponent wasn't attacking at all this exchange.
//   - "disrupt" -- the opponent hadn't even started Execution yet (still
//     winding up or still closing); whether it actually cancels their
//     action still depends on the damage it does, checked where this is used.
//   - "clash" -- the opponent's own Execution window was still OPEN at this
//     exact tick (started, and hasn't run out yet) -- both attacks connect.
//   - "sequential" -- the opponent's window already fully closed (they'd
//     already landed or whiffed) before this one landed. Checking only
//     whether Execution had STARTED, not whether it was still open, was the
//     actual bug here: an early hit landing well before a much slower
//     opponent even begins would otherwise get mislabeled "clash" once that
//     opponent's own window opens and closes long after, with no real
//     overlap between the two at all. Note this is evaluated AFTER the full
//     simulation already ran to completion, so opponentActor.execStartTick
//     (if set at all) is whenever it happened over the WHOLE exchange, not
//     necessarily before landTick -- landTick has to be checked against
//     BOTH ends of the window, not just whether one exists, or an early hit
//     landing well before a much slower opponent's window even opens would
//     wrongly read as "clash" just because that window eventually opens
//     and closes later, with zero real overlap.
function classifyLanding(landTick, opponentActor) {
  if (landTick == null) return null;
  if (!opponentActor.isAttack) return "clear";
  if (opponentActor.execStartTick == null || landTick < opponentActor.execStartTick) return "disrupt";
  if (landTick <= opponentActor.execStartTick + opponentActor.execDur) return "clash";
  return "sequential";
}

function resolveRound(sigerKey) {
  if (gameOver) return;
  const sigerCard = CARDS[sigerKey];
  const spiderKey = pickSpiderCard();
  const spiderCard = CARDS[spiderKey];
  const lines = [];
  const curveEvents = [];
  let sigerDmgTaken = 0, spiderDmgTaken = 0;

  // Direction: fixed on cards with a side baked into their name (Axe Chop),
  // rolled fresh on cards whose side varies every time. The spider has no
  // hands/dominantHand, so hand-dominance effects are always 0 for it.
  const spiderDirection = spiderCard.directional ? rollDirection() : spiderCard.direction;
  if (spiderCard.directional) {
    lines.push(`(${spider.name}'s ${spiderCard.name} comes in from Siger's ${spiderDirection < 0 ? "left" : "right"}.)`);
  }

  if (sigerKey === "bucklerParry") {
    // Buckler Parry has no offensive timing of its own -- buildParryCurve
    // already decides whether/how the incoming attack reaches him, so this
    // path bypasses both the timing simulation and the normal damage
    // pipeline entirely.
    if (spiderCard.type === "attack") {
      const sideShift = shieldSideShift(siger, spiderDirection);
      if (sideShift !== 0) {
        lines.push(sideShift < 0
          ? `(Coming in on his shield side -- easier to catch.)`
          : `(Coming in on his weapon side -- the buckler doesn't cover that as well.)`);
      }
      if (spiderKey === "leapClaw" && distance > 0) {
        lines.push(`The leap itself closes the gap -- distance ${distance.toFixed(0)} -> 0.`);
        distance = 0;
      }
      const spiderRawMomentum = momentumCapacity(spider) * spiderCard.momentumFactor;
      const curve = buildParryCurve(spiderRawMomentum, sideShift);
      const hit = resolveRoll(siger, curve);
      sigerDmgTaken = hit.damage;
      curveEvents.push({ label: `${spider.name}'s ${spiderCard.name} -> ${siger.name} (parried)`, curve: hit.curve, roll: hit.roll, devastation: hit.devastation });
      lines.push(`Spider rolls ${hit.roll.toFixed(1)} -> ${hit.zone} (${hit.devastation.toFixed(0)}% devastation) -> ${hit.damage.toFixed(1)} damage.`);
      // Secondary band, not part of the curve above at all -- a completely
      // separate check against the same roll. Resolved as an ordinary,
      // deliberately weak attack in its own right (see bucklerRiposte).
      const parryBand = CARDS.bucklerParry.secondaryBands.find((b) => b.name === "Parry");
      if (inBand(parryBand, hit.roll)) {
        const riposteMomentum = momentumCapacity(siger) * CARDS.bucklerRiposte.momentumFactor;
        const riposte = resolveHit(spider, CARDS.bucklerRiposte, siger, riposteMomentum, handCurveShift(siger, CARDS.bucklerRiposte));
        spiderDmgTaken += riposte.damage;
        curveEvents.push({ label: `${siger.name}'s riposte -> ${spider.name}`, curve: riposte.curve, roll: riposte.roll, devastation: riposte.devastation });
        lines.push(`The shield eats it clean -- Siger's buckler rim catches the opening, rolls ${riposte.roll.toFixed(1)} -> ${riposte.zone} (${riposte.devastation.toFixed(0)}% devastation) -> ${riposte.damage.toFixed(1)} damage!`);
      }
    } else if (spiderKey === "skitterBack") {
      const sim = simulateExchange(sigerCard, spiderCard, distance);
      distance = sim.distance;
      lines.push(`The spider skitters back -- Siger's shield stays up for nothing. Distance now ${distance.toFixed(0)}.`);
    } else if (spiderKey === "flee") {
      distance = MAX_DISTANCE;
      gameOver = true;
      lines.push(`Siger isn't giving chase -- the spider bolts through the door and is gone. No damage taken; that's a win.`);
    }
  } else {
    // General case: both sides' cards run through the shared timeline --
    // see the Timing simulation section above for how Windup/Travel/
    // Execution actually interact and when (if ever) each side's attack
    // connects. This is the "uninterrupted baseline" pass only -- no
    // reactions, no mid-sequence interruption yet.
    const sim = simulateExchange(sigerCard, spiderCard, distance);
    distance = sim.distance;

    const sigerLands = sim.siger.isAttack && sim.siger.landed;
    const spiderLands = sim.spider.isAttack && sim.spider.landed;
    if (sim.siger.isAttack && sim.siger.whiffed) lines.push(`Siger's ${sigerCard.name} never finds the spider in time -- out of reach.`);
    if (sim.spider.isAttack && sim.spider.whiffed) lines.push(`${spider.name}'s ${spiderCard.name} never catches up to Siger -- out of reach.`);

    // Clash: both attacks' Execution windows were genuinely open at the same
    // time (checked properly via classifyLanding, not just "both happened to
    // land this exchange" -- an early hit landing well before a much slower
    // opponent's own window even opens isn't a clash just because that
    // opponent also eventually lands much later with no real overlap).
    // Whichever of the two lands a beat later has less of its own swing
    // still behind it.
    let sigerClashPenalty = 0, spiderClashPenalty = 0;
    let isClash = false, clashMessage = null;
    if (sigerLands && spiderLands) {
      isClash = sim.siger.landTick <= sim.spider.landTick
        ? classifyLanding(sim.spider.landTick, sim.siger) === "clash"
        : classifyLanding(sim.siger.landTick, sim.spider) === "clash";
    }
    if (isClash) {
      const gap = Math.abs(sim.siger.landTick - sim.spider.landTick);
      const penalty = gap * CLASH_LATE_PENALTY_SCALE;
      if (sim.siger.landTick > sim.spider.landTick) { sigerClashPenalty = penalty; clashMessage = `Both attacks are already committed by the time either lands -- a clash, Siger's landing a beat later.`; }
      else if (sim.spider.landTick > sim.siger.landTick) { spiderClashPenalty = penalty; clashMessage = `Both attacks are already committed by the time either lands -- a clash, ${spider.name}'s landing a beat later.`; }
      else clashMessage = `Both attacks are already committed by the time either lands -- a clean, even clash.`;
    }

    function landSiger(extraXShift) {
      let xShift = handCurveShift(siger, sigerCard) + extraXShift;
      let sigerRawMomentum = momentumCapacity(siger) * sigerCard.momentumFactor;
      if (sigerCard.momentumFromDistance) {
        const bonus = MOMENTUM_HACK_DISTANCE_FACTOR * weightMultiplier(siger.weight) * Math.sqrt(sim.siger.distanceCovered);
        lines.push(`(Rushing in, covering ${sim.siger.distanceCovered.toFixed(0)} units -- momentum ${sigerRawMomentum.toFixed(1)} -> ${(sigerRawMomentum + bonus).toFixed(1)}.)`);
        sigerRawMomentum += bonus;
      }
      const hit = resolveHit(spider, sigerCard, siger, sigerRawMomentum, xShift);
      spiderDmgTaken += hit.damage;
      curveEvents.push({ label: `${siger.name}'s ${sigerCard.name} -> ${spider.name}`, curve: hit.curve, roll: hit.roll, devastation: hit.devastation });
      lines.push(`Siger's ${sigerCard.name} lands (t=${sim.siger.landTick}) -> ${hit.zone} (${hit.devastation.toFixed(0)}% devastation, momentum ${sigerRawMomentum.toFixed(1)}) -> ${hit.damage.toFixed(1)} damage.`);
      return hit;
    }

    function landSpider(extraXShift) {
      let xShift = handCurveShift(spider, spiderCard) + extraXShift;
      const spiderRawMomentum = momentumCapacity(spider) * spiderCard.momentumFactor;
      const hit = resolveHit(siger, spiderCard, spider, spiderRawMomentum, xShift);
      sigerDmgTaken += hit.damage;
      curveEvents.push({ label: `${spider.name}'s ${spiderCard.name} -> ${siger.name}`, curve: hit.curve, roll: hit.roll, devastation: hit.devastation });
      lines.push(`${spider.name}'s ${spiderCard.name} lands (t=${sim.spider.landTick}) -> ${hit.zone} (${hit.devastation.toFixed(0)}% devastation, momentum ${spiderRawMomentum.toFixed(1)}) -> ${hit.damage.toFixed(1)} damage.`);
      return hit;
    }

    // Whichever side actually lands first gets rolled first -- and only
    // then can it possibly disrupt the other, and only if the other hadn't
    // even started Execution yet AND the hit did real damage (see
    // classifyLanding / DISRUPT_DEVASTATION_THRESHOLD). A hit that lands
    // but doesn't clear that bar (armor held, or the target's just built to
    // tank it) does its damage same as any other hit, but changes nothing
    // about whatever the other side was already doing.
    let sigerDisrupted = false, spiderDisrupted = false;
    const sigerFirst = sigerLands && (!spiderLands || sim.siger.landTick <= sim.spider.landTick);
    if (sigerFirst) {
      if (sigerLands) {
        const hit = landSiger(sigerClashPenalty);
        if (classifyLanding(sim.siger.landTick, sim.spider) === "disrupt" && hit.devastation >= DISRUPT_DEVASTATION_THRESHOLD) {
          spiderDisrupted = true;
          lines.push(`It lands hard enough to catch the spider still mid-motion -- its ${spiderCard.name} never comes together, cancelled.`);
        }
      }
      if (spiderLands && !spiderDisrupted) landSpider(spiderClashPenalty);
    } else {
      if (spiderLands) {
        const hit = landSpider(spiderClashPenalty);
        if (classifyLanding(sim.spider.landTick, sim.siger) === "disrupt" && hit.devastation >= DISRUPT_DEVASTATION_THRESHOLD) {
          sigerDisrupted = true;
          lines.push(`It lands hard enough to catch Siger still mid-windup -- his ${sigerCard.name} never comes together, cancelled.`);
        }
      }
      if (sigerLands && !sigerDisrupted) landSiger(sigerClashPenalty);
    }
    // Only actually frame it as a clash if it played out that way -- a
    // disrupt on either side means one side never got the chance to
    // connect at all, so there was no real clash, whatever the
    // uninterrupted baseline above would have looked like on its own.
    if (clashMessage && !sigerDisrupted && !spiderDisrupted) lines.push(clashMessage);

    // Reposition outcomes -- Skitter Back is tactical only, distance
    // already reflects it via the simulation above; Flee is the real
    // thing, and only ends the fight if Siger wasn't pressing an attack
    // this same exchange (whether or not that attack actually landed --
    // what matters for pursuit is that he committed to one).
    if (spiderKey === "skitterBack") {
      lines.push(`The spider skitters back out of easy reach. Distance now ${distance.toFixed(0)}.`);
    } else if (spiderKey === "flee") {
      if (sigerCard.type === "attack") {
        lines.push(`The spider bolts for the door, but Siger's pressing the attack -- it's cornered in the doorway. The fight goes on.`);
      } else {
        distance = MAX_DISTANCE;
        gameOver = true;
        lines.push(`Siger isn't giving chase -- the spider bolts through the door and is gone. No damage taken; that's a win.`);
      }
    }
  }

  siger.hp = clamp(siger.hp - sigerDmgTaken, 0, siger.maxHp);
  spider.hp = clamp(spider.hp - spiderDmgTaken, 0, spider.maxHp);

  renderAll();
  renderDistance();
  renderCurves(curveEvents);
  for (const line of lines) appendLog(line);

  // gameOver may already be true here from the escape check above -- don't
  // print a second, contradictory "wins" message on top of it, but always
  // disable the buttons once the fight is actually over for any reason.
  if (!gameOver && (siger.hp <= 0 || spider.hp <= 0)) {
    gameOver = true;
    appendLog(siger.hp <= 0 && spider.hp <= 0 ? "Both go down -- a mutual kill." :
      siger.hp <= 0 ? `${spider.name} wins.` : `${siger.name} wins.`);
  }
  if (gameOver) {
    document.querySelectorAll(".card-btn").forEach((b) => (b.disabled = true));
  }
}

// --- Rendering ---

function renderHealthBar(id, char) {
  const pct = clamp((char.hp / char.maxHp) * 100, 0, 100);
  document.getElementById(id).innerHTML = `
    <div class="hp-name">${char.name}</div>
    <div class="hp-bar"><div class="hp-fill" style="width:${pct}%"></div></div>
    <div class="hp-num">${Math.max(0, char.hp).toFixed(0)} / ${char.maxHp}</div>`;
}

function renderAll() {
  renderHealthBar("sigerHealth", siger);
  renderHealthBar("spiderHealth", spider);
}

// Draws one composed curve into a canvas: the named points as small dots,
// the actual monotone spline through them, and the roll that was just made
// as a marker with a dashed line down to the x-axis -- so it's visible at a
// glance whether a roll landed in Graze, clipped Armor, or found Precision,
// and how the curve itself got bent to produce that.
//
// cssW/cssH are the LOGICAL size (what it looks like on screen); the canvas'
// actual pixel buffer is that times devicePixelRatio, with the context
// scaled back down, so it renders crisp on a high-DPI display instead of
// blurry. All drawing below happens in logical (cssW/cssH) coordinates.
//
// The spline itself is genuinely smooth everywhere -- what looked "discrete"
// was under-sampling: a transition band can be as narrow as 1-2 x-units
// (see expandBands), and walking the curve only at whole-integer x steps
// gave a 2-unit jump as few as 2-3 sample points, straight-line-connected --
// a real polyline artifact, not the curve's actual shape. Sampling densely
// and evenly in PIXEL space (not x-units) fixes that at any zoom: a narrow
// band still gets dozens of samples because it still spans real pixels.
function drawCurve(canvas, points, roll, devastation, cssW, cssH, dpr) {
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = cssW, h = cssH, pad = 30;
  const toPx = (x, y) => [pad + (x / 100) * (w - 2 * pad), h - pad - (y / 100) * (h - 2 * pad)];
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();

  const spline = buildSpline(points);
  ctx.strokeStyle = "#2b6cb0";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const plotWidth = w - 2 * pad;
  for (let px = 0; px <= plotWidth; px++) {
    const x = (px / plotWidth) * 100;
    const [, py] = toPx(x, spline(x));
    if (px === 0) ctx.moveTo(pad + px, py); else ctx.lineTo(pad + px, py);
  }
  ctx.stroke();

  ctx.fillStyle = "#999";
  ctx.font = "12px monospace";
  for (const p of points) {
    const [px, py] = toPx(p.x, p.y);
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(p.name, px + 4, py - 4);
  }

  const [rx, ry] = toPx(roll, devastation);
  ctx.strokeStyle = "#c0392b";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(rx, h - pad);
  ctx.lineTo(rx, ry);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.arc(rx, ry, 5, 0, Math.PI * 2);
  ctx.fill();
}

const CURVE_CANVAS_WIDTH = 380;
const CURVE_CANVAS_HEIGHT = 260;

function renderCurves(events) {
  const panel = document.getElementById("curvePanel");
  panel.innerHTML = "";
  if (events.length === 0) {
    panel.innerHTML = `<p class="curve-empty">Nothing rolled a curve this exchange.</p>`;
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  for (const event of events) {
    const card = document.createElement("div");
    card.className = "curve-card";
    card.innerHTML = `<div class="curve-title">${event.label} -- roll ${event.roll.toFixed(1)} -> ${event.devastation.toFixed(0)}%</div>`;
    const canvas = document.createElement("canvas");
    canvas.style.width = CURVE_CANVAS_WIDTH + "px";
    canvas.style.height = CURVE_CANVAS_HEIGHT + "px";
    canvas.width = CURVE_CANVAS_WIDTH * dpr;
    canvas.height = CURVE_CANVAS_HEIGHT * dpr;
    card.appendChild(canvas);
    panel.appendChild(card);
    drawCurve(canvas, event.curve, event.roll, event.devastation, CURVE_CANVAS_WIDTH, CURVE_CANVAS_HEIGHT, dpr);
  }
}

function renderDistance() {
  const pct = clamp((distance / MAX_DISTANCE) * 100, 0, 100);
  document.getElementById("distanceBar").innerHTML =
    `<div class="dist-label">Distance: ${distance.toFixed(0)} / ${MAX_DISTANCE} (door) -- melee range is ${MELEE_RANGE}</div>
     <div class="dist-track"><div class="dist-fill" style="width:${pct}%"></div></div>`;
}

function appendLog(text) {
  const log = document.getElementById("log");
  const li = document.createElement("li");
  li.textContent = text;
  log.prepend(li);
}

function newFight() {
  siger.hp = siger.maxHp;
  spider.hp = spider.maxHp;
  distance = DEFAULT_DISTANCE;
  gameOver = false;
  document.getElementById("log").innerHTML = "";
  document.querySelectorAll(".card-btn").forEach((b) => (b.disabled = false));
  renderAll();
  renderDistance();
  renderCurves([]);
  appendLog("A fresh fight begins.");
}

document.querySelectorAll(".card-btn").forEach((btn) => {
  btn.addEventListener("click", () => resolveRound(btn.dataset.card));
});
document.getElementById("newFightBtn").addEventListener("click", newFight);

newFight();
