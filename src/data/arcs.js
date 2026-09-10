// Where a blow travels. Content, no logic.
//
// A card no longer carries a `direction` scalar. It carries one or more ARCS --
// where the weapon starts and where it finishes, in the ATTACKER's own frame,
// on a 3x3 grid. Two readable fields that replace one, and three things then
// derive from them instead of being authored:
//
//   Carry state   the arc's `to` IS where that hand is left. The next card's
//                 windup is scaled by how far that is from its own `from`.
//   Landing side  which side of the DEFENDER it arrives on (design notes 02),
//                 mirrored out of the arc. One source of truth, so the
//                 offensive arc and the defensive side can never disagree.
//   Gravity       a descending arc is helped and a rising one fought, straight
//                 off the sign of the vertical travel.
//
// A rising diagonal and a descending diagonal are the same mirror on y that
// Slash and Backslash are on x. Putting the vertical on the profile would have
// forced a near-duplicate profile for every up/down pair -- exactly the
// duplication that killing per-weapon cards removed.
//
// The centre of the grid is the hub: carry cost is distance, so a card that
// ends at MID_CENTRE is the cheapest thing to follow, and a corner is the most
// committal. That is why a thrust (MID_CENTRE -> MID_CENTRE, zero carry either
// way) is the most chainable action in the game -- and it is emergent, not
// authored.

export const GUARD = {
  HIGH_LEFT:   { x: -100, y:  100 },
  HIGH_CENTRE: { x:    0, y:  100 },
  HIGH_RIGHT:  { x:  100, y:  100 },
  MID_LEFT:    { x: -100, y:    0 },
  MID_CENTRE:  { x:    0, y:    0 },
  MID_RIGHT:   { x:  100, y:    0 },
  LOW_LEFT:    { x: -100, y: -100 },
  LOW_CENTRE:  { x:    0, y: -100 },
  LOW_RIGHT:   { x:  100, y: -100 },
};

export const GUARD_NAME = Object.fromEntries(
  Object.entries(GUARD).map(([k, v]) => [`${v.x},${v.y}`, k]));

/** Readable shorthand: arc("main", "HIGH_LEFT", "LOW_RIGHT"). */
export const arc = (hand, from, to) => ({ hand, from: GUARD[from], to: GUARD[to] });

/** Corner to corner, the longest travel on the grid. Normalises carry cost. */
export const MAX_GUARD_DISTANCE = Math.hypot(200, 200);

export function guardDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) / MAX_GUARD_DISTANCE;
}

/**
 * Which side of the DEFENDER this arc arrives on, -100..100.
 *
 * The LEADING EDGE, not the midpoint. A shield does not intercept where the
 * blade is deepest -- it intercepts where the blade arrives, and a sweep arrives
 * on the side it entered from. Weighted mostly toward `from`, with a nod to the
 * travel.
 *
 * Your right hand is opposite their left shoulder, hence the sign flip. And this
 * is what makes Slash and Backslash genuine opposites defensively rather than
 * just two carries: on the midpoint they both came out at 0, so the mirror pair
 * did nothing at all to a shield, which undercut the whole reason for arcs.
 */
export function landingSide(a) {
  return -(0.75 * a.from.x + 0.25 * a.to.x);
}

/** Downward travel, 0-1. A descending cut is helped by gravity; a rising one isn't. */
export function descent(a) {
  return Math.max(0, (a.from.y - a.to.y) / 200);
}

/** A point along an arc. `t` may exceed [0,1] -- a blocked blade rebounds past its start. */
export function along(a, t) {
  return { x: a.from.x + (a.to.x - a.from.x) * t,
           y: a.from.y + (a.to.y - a.from.y) * t };
}

/** Closest named guard, for reading an interpolated position back out. */
export function nearestGuardName(pt) {
  let best = null, bestD = Infinity;
  for (const [name, g] of Object.entries(GUARD)) {
    const d = Math.hypot(g.x - pt.x, g.y - pt.y);
    if (d < bestD) { bestD = d; best = name; }
  }
  return bestD < 1 ? best : `~${best}`;
}
