// Does the model do what it says it does?
//
// Every check here encodes a DESIGN STATEMENT, not an implementation detail. If a
// check fails, either the model is wrong or the statement is -- and the statement
// is written out in full so you can tell which.
//
// This exists because of a real bug: with the Vital anchor clamped at 100, a
// flicked quickCut killed MORE often than a committed fullSwing. That is a pure
// monotonicity violation -- raise the commitment, lethality goes down -- and it
// sat in the model unnoticed through a dozen tuning passes because nothing ever
// asked "does turning this up turn that up".
//
// Three kinds of check:
//
//   MONOTONE   turn one stat up, assert a measured quantity moves the right way
//              and that the ones it should not touch stay put.
//   DEGENERATE take a stat to zero and assert the band it governs vanishes. These
//              are the "unarmoured unconscious target" family, and they are where
//              the model's edges actually live.
//   INVARIANT  things that must hold for EVERY curve the game can produce.

import { composeCurve } from "../model/resolve.js";
import { severityAt, BANDS } from "../model/curve.js";
import { FIGHTERS, armorOf, weaponOf } from "../data/fighters.js";
import { CARDS } from "../data/cards.js";
import { landingSide } from "../data/arcs.js";
import { ARMOR } from "../data/gear.js";

/**
 * A deliberately BORING baseline: an ordinary adult, no armour, an ordinary blow.
 * Every ratio stat sits at 1.0, so a change of 1.0 in anything is a change of
 * exactly "one ordinary person's worth", and the saturating terms all sit at
 * their 0.5 anchor. Nothing here is a real character.
 */
export const PLAIN = {
  mass: 70, size: 1.75, pace: 3.5,
  agility: 1, strength: 1, precision: 1,
  reflexes: 1, improvisation: 1, stamina: 1,
  composure: 1, painTolerance: 1,
  dominantHand: 0,
  toughness: { blunt: 1, pierce: 1, slash: 1 },
  solidity: 1, redundancy: 0,
  vitalSuit: { blunt: 1, pierce: 1, slash: 1 },
  mainHand: "armingSword", offHand: null,
  armor: [], cards: [], flags: [],
};

/** One curve, from a baseline plus whatever the check wants changed. */
export function probe({ att = {}, def = {}, card = "slash", armor = [], ...rest } = {}) {
  const attacker = { ...PLAIN, ...att };
  const defender = { ...PLAIN, ...def };
  const c = CARDS[card], arc = c.arcs[0];
  const r = composeCurve({
    attacker, defender, card: c,
    weapon: weaponOf(attacker, arc.hand === "off" ? "off" : "main"),
    attackerArmor: [], defenderArmor: armor,
    arc, landingSide: landingSide(arc), hand: arc.hand, ...rest,
  });

  // Sampled, not analytic: meanSeverity integrates without the output clamp and
  // reads high once an anchor exceeds 100.
  let mean = 0, lethal = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const s = severityAt(r.curve, (i + 0.5) * 100 / N);
    mean += s / N;
    if (s >= 85) lethal += 100 / N;
  }
  return {
    miss: r.curve.widths[0], graze: r.curve.widths[1], guard: r.curve.widths[2],
    wound: r.curve.widths[3], vital: r.curve.widths[4],
    sFull: r.sFull, sGuard: r.sGuard, vitalAnchor: r.curve.ys[5],
    evasion: r.evasion, placement: r.placement, momentum: r.momentum.m,
    tau: r.timing.tau, telegraph: r.timing.telegraph, exertion: r.exertion,
    mean, lethal, curve: r.curve,
  };
}

// --- The checks -------------------------------------------------------------

const UP = "rises", DOWN = "falls", FLAT = "does not move";

/**
 * Each entry: a design statement, a change, and what that change must do.
 * `expect` names measured fields and the direction they must move.
 */
export const MONOTONE = [
  { says: "A more agile defender is harder to connect with cleanly",
    change: { def: { agility: 3 } },
    expect: { miss: UP, graze: UP, mean: DOWN } },

  { says: "A more precise attacker places better: more Vital, less Graze",
    change: { att: { precision: 3 } },
    expect: { vital: UP, graze: DOWN, mean: UP } },

  { says: "A stronger attacker swings faster and hits harder",
    change: { att: { strength: 3 } },
    expect: { sFull: UP, momentum: UP, tau: DOWN, mean: UP } },

  { says: "A tougher defender takes less from the same blow",
    change: { def: { toughness: { blunt: 3, pierce: 3, slash: 3 } } },
    expect: { sFull: DOWN, mean: DOWN } },

  { says: "Committing harder shortens the telegraph, so evasion falls",
    change: { commitment: 1 },
    expect: { telegraph: DOWN, evasion: DOWN, miss: DOWN } },

  { says: "A defender tied up in their own action cannot get out of the way",
    change: { defenderOccupancy: 0.9 },
    expect: { evasion: DOWN, miss: DOWN, mean: UP } },

  { says: "Being hurt makes you easier to hit",
    change: { defenderPain: 0.7 },
    expect: { evasion: DOWN, miss: DOWN, mean: UP } },

  { says: "Armour claims the middle of the axis as Guard",
    change: { armor: [ARMOR.fullPlate] },
    expect: { guard: UP, wound: DOWN, mean: DOWN } },

  // THE REGRESSION. This is the bug that motivated the whole file: with the Vital
  // anchor clamped, a flick out-killed a committed swing.
  //
  // It must run against a STRONG attacker and a SOFT target, because that is the
  // only regime where the bug existed -- both anchors have to exceed 100 before a
  // clamp at 100 can flatten the difference between them. Run against PLAIN it
  // passes even with the bug reinstated, which was the first thing this file
  // taught: a check outside the regime of the failure is not a check.
  { says: "REGRESSION -- a committed swing must out-kill a flick of the same motion",
    baseline: { att: { strength: 1.6 }, def: { toughness: { blunt: .6, pierce: .6, slash: .6 } }, card: "quickCut" },
    change: { card: "fullSwing" },
    expect: { lethal: UP, vitalAnchor: UP, momentum: UP } },
];

export const DEGENERATE = [
  { says: "A defender who cannot move at all is never missed",
    change: { def: { agility: 0 } },
    assert: (p) => p.miss < 0.001, shows: (p) => `miss ${p.miss.toFixed(3)}` },

  { says: "An unarmoured defender has no Guard band at all",
    change: { armor: [] },
    assert: (p) => p.guard < 0.001, shows: (p) => `guard ${p.guard.toFixed(3)}` },

  { says: "A braced defender has given up evading entirely",
    change: { braced: true },
    assert: (p) => p.evasion < 1e-9 && p.miss < 0.001,
    shows: (p) => `evasion ${p.evasion.toFixed(4)}, miss ${p.miss.toFixed(3)}` },

  { says: "Nothing worth aiming at means no Vital band",
    change: { def: { vitalSuit: { blunt: 0, pierce: 0, slash: 0 }, redundancy: 1 } },
    assert: (p) => p.vitalAnchor <= p.wound + 1e-6,
    shows: (p) => `vital anchor ${p.vitalAnchor.toFixed(1)} vs wound ${p.wound.toFixed(1)}` },

  // KNOWN FAILURES, kept visible on purpose. Both are the coup-de-grace case:
  // an unarmoured, helpless target. See combat-model.md 5.5b and severity-ceiling.md.
  { says: "KNOWN GAP -- a helpless target should not be grazed",
    change: { def: { agility: 0 } },
    assert: (p) => p.graze < 0.001,
    shows: (p) => `graze ${p.graze.toFixed(2)} -- GRAZE_BASE x (1-p) has no floor at p<1`,
    known: "Needs a `helpless` flag driving p -> 1, the mirror of `braced`." },

  { says: "KNOWN GAP -- an ordinary solid Wound should be able to kill",
    change: { att: { strength: 8 }, def: { toughness: { blunt: .2, pierce: .2, slash: .2 } } },
    assert: (p) => p.sFull >= 99.99,
    shows: (p) => `S_full ${p.sFull.toFixed(1)} -- saturating, asymptotic to 100`,
    known: "severity-ceiling.md 5.2, diagnosed and deliberately not applied." },
];

export const INVARIANT = [
  { says: "The five band widths always partition the axis",
    check: (p) => Math.abs(p.miss + p.graze + p.guard + p.wound + p.vital - 100) < 1e-6 },
  { says: "The curve always begins at zero severity",
    check: (p) => severityAt(p.curve, 0) < 1e-9 },
  { says: "Severity never leaves 0..100",
    check: (p) => { for (let i = 0; i <= 1000; i++) {
      const s = severityAt(p.curve, i / 10); if (s < -1e-9 || s > 100 + 1e-9) return false; } return true; } },
  { says: "Severity never decreases as the roll improves",
    check: (p) => { let prev = -1;
      for (let i = 0; i <= 2000; i++) { const s = severityAt(p.curve, i / 20);
        if (s < prev - 1e-6) return false; prev = s; } return true; } },
  { says: "No band ever has negative width",
    check: (p) => [p.miss, p.graze, p.guard, p.wound, p.vital].every((w) => w >= -1e-9) },
];

// --- Running ----------------------------------------------------------------

const dir = (before, after) => {
  const d = after - before;
  if (Math.abs(d) < Math.max(1e-6, Math.abs(before) * 1e-4)) return FLAT;
  return d > 0 ? UP : DOWN;
};

export function runSanity() {
  const results = { monotone: [], degenerate: [], invariant: [], pass: 0, fail: 0 };

  for (const t of MONOTONE) {
    const before = probe(t.baseline ?? {});
    const after = probe({ ...(t.baseline ?? {}), ...t.change });
    const fails = [];
    for (const [field, want] of Object.entries(t.expect)) {
      const got = dir(before[field], after[field]);
      if (got !== want) fails.push(`${field} ${got}, expected ${want} (${before[field].toFixed(3)} → ${after[field].toFixed(3)})`);
    }
    results.monotone.push({ says: t.says, ok: !fails.length, fails });
    fails.length ? results.fail++ : results.pass++;
  }

  for (const t of DEGENERATE) {
    const p = probe(t.change);
    const ok = t.assert(p);
    results.degenerate.push({ says: t.says, ok, shows: t.shows(p), known: t.known });
    // A known gap is not a pass, but it is not a surprise either.
    if (!ok && !t.known) results.fail++; else if (ok) results.pass++;
  }

  // Invariants run against every matchup the game can currently produce.
  const cards = Object.keys(CARDS).filter((k) => CARDS[k].arcs?.length);
  const armours = [[], [ARMOR.gambeson], [ARMOR.fullPlate, ARMOR.heaterShield]];
  for (const t of INVARIANT) {
    const bad = [];
    for (const f of Object.keys(FIGHTERS)) for (const card of cards) for (const armor of armours) {
      const attacker = FIGHTERS[f];
      if (!attacker.cards.includes(card)) continue;
      for (const d of Object.keys(FIGHTERS)) {
        const p = probe({ att: attacker, def: FIGHTERS[d], card, armor });
        if (!t.check(p)) bad.push(`${f}/${card} → ${d} (${armor.length} pieces)`);
      }
    }
    results.invariant.push({ says: t.says, ok: !bad.length, bad: bad.slice(0, 4), count: bad.length });
    bad.length ? results.fail++ : results.pass++;
  }

  return results;
}

/** Plain-text report, for a console or a page. */
export function report(r = runSanity()) {
  const lines = [];
  const mark = (ok, known) => (ok ? "PASS" : known ? "GAP " : "FAIL");
  lines.push("MONOTONE — turn it up, does the right thing move?");
  for (const t of r.monotone) {
    lines.push(`  ${mark(t.ok)}  ${t.says}`);
    for (const f of t.fails) lines.push(`        ${f}`);
  }
  lines.push("", "DEGENERATE — take it to zero, does the band vanish?");
  for (const t of r.degenerate) {
    lines.push(`  ${mark(t.ok, t.known)}  ${t.says}`);
    lines.push(`        ${t.shows}`);
    if (t.known && !t.ok) lines.push(`        ${t.known}`);
  }
  lines.push("", "INVARIANT — must hold for every curve the game can produce");
  for (const t of r.invariant) {
    lines.push(`  ${mark(t.ok)}  ${t.says}${t.ok ? "" : `  (${t.count} violations, e.g. ${t.bad.join("; ")})`}`);
  }
  lines.push("", `${r.pass} passed, ${r.fail} failed, ${r.degenerate.filter((d) => d.known && !d.ok).length} known gaps.`);
  return lines.join("\n");
}
