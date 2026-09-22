// Throwaway scaffolding. Nothing here ports to Unity -- it exists to make the
// model in src/model visible and pokeable. All the maths lives behind
// composeCurve(); this file only builds inputs for it and draws its output.

import { K } from "../model/constants.js";
import { composeCurve } from "../model/resolve.js";
import { BANDS, severityAt, derivedDrifts } from "../model/curve.js";
import { FIGHTERS, armorOf, weaponOf } from "../data/fighters.js";
import { CARDS } from "../data/cards.js";
import { GUARD_NAME, landingSide } from "../data/arcs.js";


const clone = (o) => JSON.parse(JSON.stringify(o));

// The rail edits AGGREGATE protection, so collapse a defender's pieces into one
// synthetic piece first. protection() over a single piece returns exactly these
// values back, so the model sees no difference.
function flattenArmor(pieces) {
  const total = pieces.reduce((s, a) => s + a.coverage, 0) || 1;
  const w = (get) => pieces.reduce((s, a) => s + a.coverage * get(a), 0) / total;
  const resist = {};
  for (const c of ["blunt", "pierce", "slash"]) resist[c] = w((a) => a.resist?.[c] ?? 1);
  return {
    name: pieces.map((p) => p.name).join(" + ") || "Unprotected",
    coverage: 1 - pieces.reduce((p, a) => p * (1 - a.coverage), 1),
    bulk:     1 - pieces.reduce((p, a) => p * (1 - (a.bulk ?? 0)), 1),
    mass: pieces.reduce((s, a) => s + (a.mass ?? 0), 0),
    hardness: w((a) => a.hardness), spread: w((a) => a.spread), gaps: w((a) => a.gaps),
    resist,
  };
}

const PRESETS = [
  { id: "d-k", att: "duelist",  def: "knight",   card: "thrust",
    note: "Coverage 0.95 means Guard owns most of the axis. What Precision 1.8 buys is the sliver of Wound and Vital past it — the armpit and the visor." },
  { id: "k-d", att: "knight",   def: "duelist",  card: "slash",
    note: "Hits far harder, and the telegraph is no longer a number on the card — Strength 1.4 against 1.3 kg of steel is what sets it. Agility 1.7 gets that long to work." },
  { id: "k-d-oh", att: "knight", def: "duelist", card: "overhead",
    note: "The same arm and the same steel, a bigger motion: τ is identical, the profile is not. Watch Total and Recovery against the Slash — that recovery is what a defender is baiting." },
  { id: "d-s", att: "duelist",  def: "skeleton", card: "thrust",
    note: "Solidity 0.25 would leave a blind rapier at 2% engagement. Aiming at the bone recovers most of it — and Redundancy 0.45 blunts the Vital payoff." },
  { id: "k-s", att: "knight",   def: "skeleton", card: "shieldBash",
    note: "The right tool: blunt, a wide footprint Solidity can't dodge, and bone is half as tough against it. The Vital band is the skull." },
  { id: "s-k", att: "skeleton", def: "knight",   card: "slash",
    note: "The SAME Slash card the knight throws — and against plate it does almost nothing. Weaker arm, heavier-for-him blade, Sharpness 0.75. One card, two entirely different weapons." },
  { id: "s-d", att: "skeleton", def: "duelist",  card: "slash",
    note: "That same Slash against no armour at all. τ 73 means the duelist reads it coming for 95 ticks, so Miss and Graze do most of the defending here — not the gambeson." },
  { id: "k-d-qc", att: "knight", def: "duelist", card: "quickCut",
    note: "The SAME horizontal profile as the Slash at effort 0.55. Windup and recovery shrink together, momentum drops, and it costs half as much. Compare against Full swing." },
  { id: "k-d-fs", att: "knight", def: "duelist", card: "fullSwing",
    note: "And at effort 1.45. Slower to gather, far longer to unwind, harder-hitting, and it hands the duelist a much longer telegraph. One profile, three cards." },
  { id: "d-d", att: "duelist",  def: "duelist",  card: "lunge",
    note: "A lunge puts real body mass behind the point — momentum triples against an unarmoured target." },
];

const state = {};

function loadPreset(preset) {
  const A = FIGHTERS[preset.att], D = FIGHTERS[preset.def], card = clone(CARDS[preset.card]);
  const dArmor = flattenArmor(armorOf(D));
  Object.assign(state, {
    presetId: preset.id, note: preset.note,
    attacker: clone(A), defender: clone(D), card,
    weapon: clone(weaponOf(A, card.arcs?.[0]?.hand === "off" ? "off" : "main")) ?? null,
    attackerArmor: armorOf(A).map(clone),
    defenderArmor: [dArmor],
    evadeReady: 1, guardReady: 0, offhand: false,
    commitment: 0, distance: 0,
    // Drifts start at their derived values and are then free to drag.
    overrides: {
      riseGuard: K.RISE_GUARD, riseWound: K.RISE_WOUND, riseVital: K.RISE_VITAL,
      softness: K.SOFTNESS, softGain: K.SOFT_GAIN,
      ...(({ guard, wound, vital }) => ({ driftGuard: guard, driftWound: wound, driftVital: vital }))(
        derivedDrifts({ spread: dArmor.spread, redundancy: D.redundancy })),
    },
  });
}

const path = {
  get: (p) => p.split(".").reduce((o, k) => o?.[k], state),
  set: (p, v) => {
    const keys = p.split("."), last = keys.pop();
    keys.reduce((o, k) => o[k], state)[last] = v;
  },
};

const CONTROLS = [
  { title: "Attacker", tag: () => state.attacker.name, items: [
    { p: "attacker.precision", l: "Precision (×human)", min: .1, max: 6,  step: .05, d: 2 },
    { p: "attacker.strength",  l: "Strength (×human)",  min: .2, max: 8,  step: .05, d: 2 },
    { p: "attacker.pace",      l: "Pace (m/s)",         min: .5, max: 14, step: .1,  d: 1 },
  ], toggle: { key: "offhand", label: "Off hand" } },

  { title: "Card", tag: () => `${state.weapon?.name ?? "Unarmed"} (${state.card.arcs?.[0]?.hand ?? "—"}) — ${state.card.name}`, classSeg: true, items: [
    { p: "card.drive",         l: "Drive",              min: 0,   max: 1, step: .01, d: 2 },
    { p: "card.concentration", l: "Concentration",      min: .02, max: 1, step: .01, d: 2 },
    { p: "card.aim",           l: "Aim",                min: 0,   max: 1, step: .01, d: 2 },
    { p: "card.effort",        l: "Effort (flick … full)", min: .3, max: 1.8, step: .05, d: 2 },

    // Telegraph is derived now, so what's adjustable is commitment and the gap.
    // -1 bluff, 0 uncommitted, +1 committed.
    { p: "commitment",         l: "Commitment (−1 bluff … +1 committed)", min: -1, max: 1, step: .05, d: 2 },
    { p: "distance",           l: "Distance (m)",       min: 0,   max: 14, step: .1, d: 1 },
  ]},

  { title: "Defender", tag: () => state.defender.name, items: [
    { p: "defender.agility",          l: "Agility (×human)",     min: 0,   max: 5,   step: .05, d: 2 },
    { p: "defender.solidity",         l: "Solidity",             min: .05, max: 1,   step: .01, d: 2 },
    { p: "defender.redundancy",       l: "Redundancy",           min: 0,   max: 1,   step: .01, d: 2 },
    { p: "defenderArmor.0.coverage",  l: "Coverage",             min: 0,   max: .99, step: .01, d: 2 },
    { p: "defenderArmor.0.gaps",      l: "Gaps",                 min: 0,   max: 1,   step: .01, d: 2 },
    { p: "defenderArmor.0.hardness",  l: "Hardness (1 = plate)", min: 0,   max: 2.5, step: .01, d: 2 },
    { p: "defenderArmor.0.spread",    l: "Spread",               min: 0,   max: 1,   step: .01, d: 2 },
    { p: "evadeReady", l: "Evade readiness (0 helpless … 1 free)", min: 0, max: 1, step: .05, d: 2 },
    { p: "guardReady", l: "Guard readiness (0 none … 1 covering up)", min: 0, max: 1, step: .05, d: 2 },
  ] },

  { title: "Band shape", tag: () => "", items: [
    { p: "overrides.riseGuard",  l: "Guard rise (from its end)",   min: .05, max: 1,  step: .01,  d: 2 },
    { p: "overrides.riseWound",  l: "Wound rise (from its start)", min: .05, max: 1,  step: .01,  d: 2 },
    { p: "overrides.riseVital",  l: "Vital rise (from its start)", min: .05, max: 1,  step: .01,  d: 2 },
    { p: "overrides.driftGuard", l: "Guard drift ← Spread",        min: 0,   max: .5, step: .005, d: 3 },
    { p: "overrides.driftWound", l: "Wound drift ← Redundancy",    min: 0,   max: .5, step: .005, d: 3 },
    { p: "overrides.driftVital", l: "Vital drift ← Redundancy",    min: 0,   max: .6, step: .005, d: 3 },
    { p: "overrides.softness",   l: "Softness (rolls)",            min: .05, max: 4,  step: .05,  d: 2 },
    { p: "overrides.softGain",   l: "Runway gain ← rise size",   min: 0,   max: 3,  step: .05,  d: 2 },
  ]},
];

const ALPHA = [0.05, 0.12, 0.21, 0.33, 0.50];

function draw(result) {
  const { curve } = result;
  const W = 760, H = 380, L = 46, Rp = 16, T = 14, Bm = 62;
  const px = (x) => L + (x / 100) * (W - L - Rp);
  const py = (y) => H - Bm - (y / 100) * (H - Bm - T);
  const o = [`<rect x="${L}" y="${T}" width="${W - L - Rp}" height="${H - Bm - T}" fill="var(--plot-bg)" rx="3"/>`];

  for (let i = 0; i < 5; i++) {
    const x0 = px(curve.xs[i]), x1 = px(curve.xs[i + 1]);
    if (x1 - x0 < 0.4) continue;
    o.push(`<rect x="${x0.toFixed(1)}" y="${T}" width="${(x1 - x0).toFixed(1)}" height="${H - Bm - T}" fill="rgb(var(--band) / ${ALPHA[i]})"/>`);
    if (i > 0) o.push(`<line x1="${x0.toFixed(1)}" y1="${T}" x2="${x0.toFixed(1)}" y2="${H - Bm}" stroke="rgb(var(--band) / .35)" stroke-width="1"/>`);
    if (x1 - x0 > 30) o.push(`<text x="${((x0 + x1) / 2).toFixed(1)}" y="${T + 17}" text-anchor="middle" font-family="IBM Plex Sans" font-size="11" letter-spacing="1.2" fill="var(--ink-3)">${BANDS[i].toUpperCase()}</text>`);
  }
  for (let v = 0; v <= 100; v += 25) {
    o.push(`<line x1="${L}" y1="${py(v)}" x2="${W - Rp}" y2="${py(v)}" stroke="var(--rule)" stroke-width="1" ${v ? 'stroke-dasharray="2 4"' : ""}/>`);
    o.push(`<text x="${L - 9}" y="${py(v) + 4}" text-anchor="end" font-family="IBM Plex Mono" font-size="11" fill="var(--ink-3)">${v}</text>`);
  }
  for (let v = 0; v <= 100; v += 20)
    o.push(`<text x="${px(v)}" y="${H - Bm + 17}" text-anchor="middle" font-family="IBM Plex Mono" font-size="11" fill="var(--ink-3)">${v}</text>`);
  o.push(`<text x="${L - 9}" y="${T - 2}" text-anchor="end" font-family="IBM Plex Sans" font-size="10" letter-spacing="1.1" fill="var(--ink-3)">SEV</text>`);
  o.push(`<text x="${px(50)}" y="${H - Bm + 34}" text-anchor="middle" font-family="IBM Plex Sans" font-size="10.5" letter-spacing="1.3" fill="var(--ink-3)">ROLL — PLACEMENT QUALITY</text>`);

  let d = "";
  for (let i = 0; i <= 600; i++) {
    const x = (i / 600) * 100;
    d += (i ? "L" : "M") + px(x).toFixed(1) + " " + py(severityAt(curve, x)).toFixed(1);
  }
  o.push(`<path d="${d}L${px(100).toFixed(1)} ${py(0)}L${px(0).toFixed(1)} ${py(0)}Z" fill="var(--accent)" opacity=".10"/>`);
  o.push(`<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`);

  // Hollow: anchors are targets the curve aims at and rounds past, not points
  // it is obliged to touch.
  for (let i = 1; i < 6; i++) {
    if (i < 5 && curve.widths[i] < 1.2) continue;
    o.push(`<circle cx="${px(curve.xs[i]).toFixed(1)}" cy="${py(Math.min(100, curve.ys[i])).toFixed(1)}" r="3.2" fill="none" stroke="var(--accent)" stroke-width="1.4" opacity=".6"/>`);
  }

  const bw = W - L - Rp, byy = H - 26;
  for (let i = 0; i < 5; i++) {
    const x0 = L + (curve.xs[i] / 100) * bw, wdt = (curve.widths[i] / 100) * bw;
    if (wdt < 0.5) continue;
    o.push(`<rect x="${(x0 + 1).toFixed(1)}" y="${byy}" width="${Math.max(0.5, wdt - 2).toFixed(1)}" height="9" rx="2" fill="rgb(var(--band) / ${Math.max(.18, ALPHA[i] + .12)})"/>`);
    if (wdt > 42) o.push(`<text x="${(x0 + wdt / 2).toFixed(1)}" y="${byy + 22}" text-anchor="middle" font-family="IBM Plex Mono" font-size="10.5" fill="var(--ink-3)">${curve.widths[i].toFixed(1)}</text>`);
  }
  return o.join("");
}

function buildRail() {
  document.getElementById("rail").innerHTML = CONTROLS.map((sec, si) => `
    <div class="grp">
      <div class="grp-h"><span>${sec.title}</span><em data-tag="${si}"></em></div>
      ${sec.classSeg ? `<div class="seg" id="clsSeg">${["slash", "pierce", "blunt"]
        .map((c) => `<button type="button" data-cls="${c}">${c}</button>`).join("")}</div>` : ""}
      ${sec.items.map((it) => `
        <div class="ctl">
          <label for="c_${it.p}">${it.l}</label><output id="o_${it.p}"></output>
          <input type="range" id="c_${it.p}" data-p="${it.p}" data-d="${it.d}"
                 min="${it.min}" max="${it.max}" step="${it.step}">
        </div>`).join("")}
      ${sec.toggle ? `<label class="toggle"><input type="checkbox" data-flag="${sec.toggle.key}"> ${sec.toggle.label}</label>` : ""}
    </div>`).join("");

  document.querySelectorAll("#rail input[type=range]").forEach((el) =>
    el.addEventListener("input", () => { path.set(el.dataset.p, parseFloat(el.value)); state.presetId = null; state.note = null; render(); }));
  document.querySelectorAll("#rail input[type=checkbox]").forEach((el) =>
    el.addEventListener("change", () => { state[el.dataset.flag] = el.checked; state.presetId = null; state.note = null; render(); }));
  document.querySelectorAll("#clsSeg button").forEach((b) =>
    b.addEventListener("click", () => { state.card.classMix = { [b.dataset.cls]: 1 }; state.presetId = null; state.note = null; render(); }));
}

function buildPresets() {
  document.getElementById("presets").innerHTML = PRESETS.map((p) =>
    `<button class="chip" type="button" data-p="${p.id}">${FIGHTERS[p.att].name} <span style="opacity:.6">→</span> ${FIGHTERS[p.def].name}${p.att === p.def ? " (mirror)" : ""}</button>`).join("");
  document.querySelectorAll("#presets .chip").forEach((b) =>
    b.addEventListener("click", () => { loadPreset(PRESETS.find((p) => p.id === b.dataset.p)); render(); }));
}

function render() {
  const r = composeCurve({
    attacker: state.attacker, defender: state.defender,
    card: state.card, weapon: state.weapon,
    attackerArmor: state.attackerArmor, defenderArmor: state.defenderArmor,
    evadeReady: state.evadeReady, guardReady: state.guardReady, offhand: state.offhand,
    distance: state.distance, commitment: state.commitment,
    arc: state.card.arcs?.[0]?.arc ?? state.card.arcs?.[0] ?? null,
    hand: state.card.arcs?.[0]?.hand ?? "main",
    landingSide: state.card.arcs?.[0] ? landingSide(state.card.arcs[0]) : 0,
    overrides: state.overrides,
  });
  const { curve } = r;

  document.getElementById("chart").innerHTML = draw(r);
  document.getElementById("ev").textContent = r.meanSeverity.toFixed(1) + "%";

  document.getElementById("bandrows").innerHTML = BANDS.map((b, i) => `
    <tr><td><span class="swatch" style="background:rgb(var(--band) / ${Math.max(.2, ALPHA[i] + .15)})"></span>${b}</td>
    <td>${curve.widths[i].toFixed(1)}</td><td>${curve.ys[i].toFixed(1)}%</td><td>${curve.ys[i + 1].toFixed(1)}%</td></tr>`).join("");

  const t = r.timing;
  document.getElementById("derived").innerHTML = [
    ["τ", t.tau.toFixed(1), `tempo, ticks per unit of motion (swing ${t.vWeapon.toFixed(1)} m/s)`],
    ["Windup", t.windup.toFixed(0), "ticks — shortened by commitment"],
    ["Travel", t.travel.toFixed(0), "ticks — concurrent with windup"],
    ["Execution", t.execution.toFixed(0), "ticks — the arc itself, unmodified"],
    ["Recovery", t.recovery.toFixed(0), "ticks — before lodging is known"],
    ["Total", t.total.toFixed(0), `ticks (${(t.total / 100).toFixed(2)} s) for the whole card`],
    ["Effort", r.effort.toFixed(2), `×windup, ×recovery, ×drive, ×exertion; blade speed ^${K.EFFORT_SWING}`],
    ["Exertion", r.exertion.toFixed(1), "against a Stamina-derived turn budget"],
    ["C_eff", r.concentration.toFixed(2), `technique ${state.card.concentration.toFixed(2)} × sharpness ${r.sharpness.toFixed(2)}`],
    ["Arc", arcLabel(state.card), `landing side ${r.landingSide.toFixed(0)} on the defender`],
    ["m", r.momentum.m.toFixed(2), "normalised momentum"],
    ["p", r.placement.toFixed(2), "effective precision × Aim"],
    ["E", r.evasion.toFixed(3), `evasion opportunity (telegraph ${t.telegraph.toFixed(0)})`],
    ["G", r.engagement.effective.toFixed(2), `engagement (blind ${r.engagement.raw.toFixed(2)})`],
    ["B", r.bite.toFixed(2), "bite"],
    ["P", r.penetration.toFixed(2), "penetration"],
    ["L", r.shockLeak.toFixed(3), "shock leak"],
    ["Coverage_eff", r.coverageEff.toFixed(2), "after gaps and bracing"],
    ["Softness", curve.softness.toFixed(2), "minimum rise runway, in rolls"],
    ["S_full", r.sFull.toFixed(1) + "%", "clean connection"],
    ["S_guard", r.sGuard.toFixed(1) + "%", "past protection"],
  ].map(([k, v, n]) => `<div class="drow"><span>${k}<small>${n}</small></span><b>${v}</b></div>`).join("");

  document.querySelectorAll("#rail input[type=range]").forEach((el) => {
    const v = path.get(el.dataset.p);
    el.value = v;
    document.getElementById("o_" + el.dataset.p).textContent = (+v).toFixed(+el.dataset.d);
  });
  document.querySelectorAll("#rail input[type=checkbox]").forEach((el) => (el.checked = !!state[el.dataset.flag]));
  document.querySelectorAll("#clsSeg button").forEach((b) =>
    b.setAttribute("aria-pressed", !!state.card.classMix[b.dataset.cls]));
  document.querySelectorAll("#presets .chip").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.p === state.presetId));
  document.querySelectorAll(".grp-h em").forEach((e) => (e.textContent = CONTROLS[+e.dataset.tag].tag()));

  document.getElementById("cap").textContent = state.note ||
    `${state.attacker.name} → ${state.defender.name}. Guard holds near ${curve.ys[2].toFixed(0)}% across ${curve.widths[2].toFixed(0)} of the axis, then Wound jumps to ${curve.ys[4].toFixed(0)}% within its first ${(state.overrides.riseWound * 100).toFixed(0)}% and plateaus there.`;
}

buildPresets();
buildRail();
loadPreset(PRESETS[0]);
render();

// Where the blow travels, for the derived panel. Guard positions read the way
// the historical guards do, which is the point of the 3x3 grid.
function arcLabel(card) {
  const a = card.arcs?.[0];
  if (!a) return "—";
  const name = (p) => GUARD_NAME[`${p.x},${p.y}`] ?? `${p.x},${p.y}`;
  return `${name(a.from)} → ${name(a.to)}`;
}
