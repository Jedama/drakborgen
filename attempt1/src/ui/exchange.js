// Throwaway scaffolding, same as workbench.js -- it exists to make
// src/model/exchange.js visible and pokeable. All the logic lives behind
// prepareSide() / runExchange(); this file only builds sequences and draws them
// against one clock.

import { FIGHTERS, armorOf } from "../data/fighters.js";
import { CARDS } from "../data/cards.js";
import { nearestGuardName } from "../data/arcs.js";
import { exertionCost, exertionBudget } from "../model/timing.js";
import { effectiveStats } from "../model/stats.js";
import { protection } from "../model/defense.js";
import { prepareSide, runExchange, occupancyAt, classifyAt, busyHands } from "../model/exchange.js";

const PRESETS = [
  { id: "chain", aF: "duelist", aC: ["thrust", "thrust", "thrust", "thrust"],
    bF: "knight", bC: ["overhead", "overhead"],
    note: "Four thrusts against two overheads. The thrust chains for free — MID_CENTRE to MID_CENTRE, zero carry either way — while each overhead has to lift the sword back up from LOW_CENTRE." },
  { id: "carry", aF: "knight", aC: ["slash", "backslash", "slash"],
    bF: "duelist", bC: ["lunge", "thrust"],
    note: "Slash → Backslash → Slash: each one starts exactly where the last one finished, so every carry is free. Swap the middle card for another Slash and watch the windups grow." },
  { id: "bad-carry", aF: "knight", aC: ["overhead", "overhead", "overhead"],
    bF: "duelist", bC: ["thrust", "thrust", "thrust"],
    note: "The same card three times. Each overhead ends at LOW_CENTRE and the next needs HIGH_CENTRE, so every windup after the first pays full carry." },
  { id: "hands", aF: "knight", aC: ["slash", "shieldBash", "slash"],
    bF: "skeleton", bC: ["slash", "slash"],
    note: "Alternating hands. The bash uses the off hand, so it begins while the sword is still unwinding — and it spends the shield to throw it, leaving that side open." },
  { id: "topple", aF: "knight", aC: ["shieldBash", "overhead"],
    bF: "skeleton", bC: ["slash", "slash", "slash"],
    note: "A 5 kg shield into a 35 kg skeleton. Stability 0.50 against the knight's 1.63 — if the bash lands well it interrupts the whole remaining sequence, not just the card." },
  { id: "reach", aF: "knight", aC: ["slash", "slash"],
    bF: "duelist", bC: ["thrust", "thrust"], distance: 1.7,
    note: "At 1.70 m the knight's 1.62 m of reach never crosses the gap, so every card whiffs while the rapier's 1.81 m keeps arriving." },
];

const state = { aF: "duelist", aC: ["thrust", "thrust", "thrust", "thrust"],
                aPain: 0, bPain: 0, aAdren: 0, bAdren: 0,
                bF: "knight", bC: ["overhead", "overhead"],
                distance: 1.0, aCommit: 0, bCommit: 0, note: null, presetId: null, seed: 1 };

// Deterministic per render, so the timeline holds still while you read it and
// only moves when you ask for a new roll.
function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

function sideOf(fKey, cardKeys, commit, pain, adrenaline) {
  const f = FIGHTERS[fKey];
  return prepareSide({
    fighter: f, armor: armorOf(f),
    cards: cardKeys.map((k) => CARDS[k]),
    commitments: cardKeys.map(() => commit),
    pain, adrenaline,
  });
}

function build() {
  const a = sideOf(state.aF, state.aC, state.aCommit, state.aPain, state.aAdren);
  const b = sideOf(state.bF, state.bC, state.bCommit, state.bPain, state.bAdren);
  return runExchange({ a, b, distance: state.distance, rng: makeRng(state.seed) });
}

// --- Drawing ----------------------------------------------------------------

const PHASE_ALPHA = { windup: 0.14, execution: 0.46, recovery: 0.26 };

function draw(r) {
  const W = 760, H = 300, L = 104, Rp = 16, T = 40, rowH = 30, gap = 74;
  const span = Math.max(r.ticks, 120);
  const px = (t) => L + (t / span) * (W - L - Rp);
  const o = [];

  for (let s = 0; s * 100 <= span; s++) {
    const x = px(s * 100);
    o.push(`<line x1="${x.toFixed(1)}" y1="${T - 14}" x2="${x.toFixed(1)}" y2="${H - 40}" stroke="var(--rule)" stroke-width="1" ${s ? 'stroke-dasharray="2 4"' : ""}/>`);
    o.push(`<text x="${x.toFixed(1)}" y="${T - 20}" text-anchor="middle" font-family="IBM Plex Mono" font-size="10.5" fill="var(--ink-3)">${s}s</text>`);
  }

  [["a", r.a], ["b", r.b]].forEach(([key, side], i) => {
    const y = T + i * (rowH + gap);
    o.push(`<text x="${L - 10}" y="${y + 13}" text-anchor="end" font-family="IBM Plex Sans" font-size="12" font-weight="600" fill="var(--ink)">${side.fighter.name}</text>`);
    o.push(`<text x="${L - 10}" y="${y + 27}" text-anchor="end" font-family="IBM Plex Sans" font-size="10.5" fill="var(--ink-3)">${side.spent.toFixed(1)} / ${side.budget.toFixed(0)} exertion</text>`);

    for (const step of side.steps) {
      // Off-hand cards ride a half-row lower, so overlapping limbs are visible
      // as overlap rather than as one confusing bar.
      const off = (step.arcs[0]?.hand === "off") ? rowH * 0.55 : 0;
      const end = step.cancelled ? step.cancelledAt : step.start + step.total;
      const segs = [
        [step.start, Math.min(end, step.start + step.phases.ready), "windup"],
        [step.start + step.phases.ready, Math.min(end, step.start + step.phases.active), "execution"],
        [step.start + step.phases.active, end, "recovery"],
      ];
      for (const [s0, s1, kind] of segs) {
        if (s1 - s0 <= 0.5) continue;
        o.push(`<rect x="${px(s0).toFixed(1)}" y="${y + off}" width="${(px(s1) - px(s0)).toFixed(1)}" height="${rowH}" rx="3" fill="rgb(var(--band) / ${PHASE_ALPHA[kind]})"/>`);
      }
      if (step.cancelled) {
        o.push(`<rect x="${px(step.cancelledAt).toFixed(1)}" y="${y + off}" width="${(px(step.start + step.total) - px(step.cancelledAt)).toFixed(1)}" height="${rowH}" rx="3" fill="none" stroke="var(--rule-2)" stroke-width="1" stroke-dasharray="3 3"/>`);
      }
      const mid = px(step.start) + (px(Math.min(end, step.start + step.total)) - px(step.start)) / 2;
      if (px(end) - px(step.start) > 40) {
        o.push(`<text x="${mid.toFixed(1)}" y="${y + off + 19}" text-anchor="middle" font-family="IBM Plex Sans" font-size="10" fill="var(--ink-2)">${step.card.name}</text>`);
      }
      if (step.carry !== 1) {
        o.push(`<text x="${px(step.start).toFixed(1)}" y="${y + off - 4}" font-family="IBM Plex Mono" font-size="9" fill="${step.carry > 1 ? "var(--ink-3)" : "var(--accent)"}">×${step.carry.toFixed(2)}</text>`);
      }
      for (const arc of step.arcs) {
        if (arc.landTick === null) continue;
        const x = px(arc.landTick);
        o.push(`<line x1="${x.toFixed(1)}" y1="${y + off - 6}" x2="${x.toFixed(1)}" y2="${y + off + rowH + 4}" stroke="var(--accent)" stroke-width="2"/>`);
        o.push(`<circle cx="${x.toFixed(1)}" cy="${(y + off - 6).toFixed(1)}" r="3" fill="var(--accent)"/>`);
      }
    }

    // Occupancy, traced across the whole turn.
    let occPath = "";
    for (let s = 0; s <= 140; s++) {
      const t = (s / 140) * span;
      occPath += (s ? "L" : "M") + px(t).toFixed(1) + " " + (y + rowH + 30 - occupancyAt(side, t) * 26).toFixed(1);
    }
    o.push(`<path d="${occPath}" fill="none" stroke="var(--accent)" stroke-width="1.4" opacity=".7"/>`);
    o.push(`<text x="${L - 10}" y="${y + rowH + 33}" text-anchor="end" font-family="IBM Plex Sans" font-size="9.5" fill="var(--accent)" opacity=".8">occupancy</text>`);

    if (side.interrupted) {
      o.push(`<text x="${px(side.interruptedAt).toFixed(1)}" y="${y + rowH + 48}" font-family="IBM Plex Sans" font-size="10.5" font-weight="600" fill="var(--accent)">interrupted</text>`);
    }
    const last = side.steps[side.steps.length - 1];
    const finished = last ? Math.min(last.start + last.total, r.ticks) : 0;
    if (r.ticks - finished > 20) {
      o.push(`<rect x="${px(finished).toFixed(1)}" y="${y}" width="${(px(r.ticks) - px(finished)).toFixed(1)}" height="${rowH}" rx="3" fill="none" stroke="var(--rule-2)" stroke-width="1" stroke-dasharray="2 4"/>`);
      o.push(`<text x="${((px(finished) + px(r.ticks)) / 2).toFixed(1)}" y="${y + 19}" text-anchor="middle" font-family="IBM Plex Sans" font-size="9.5" fill="var(--ink-3)">idle ${(r.ticks - finished).toFixed(0)}</text>`);
    }
  });

  o.push(`<text x="${L}" y="${H - 10}" font-family="IBM Plex Sans" font-size="10.5" letter-spacing="1.2" fill="var(--ink-3)">TURN LENGTH ${r.ticks} TICKS — ${(r.ticks / 100).toFixed(2)}s</text>`);
  return o.join("");
}

// --- Rail -------------------------------------------------------------------

const cardsFor = (fk) => FIGHTERS[fk].cards;

const effOf = (fKey, pain = 0, adrenaline = 0) => {
  const f = FIGHTERS[fKey], prot = protection(armorOf(f));
  return effectiveStats(f, { wornMass: prot.mass, bulk: prot.bulk, pain, adrenaline });
};

function costOf(fKey, cardKey, pain = 0, adrenaline = 0) {
  return exertionCost(CARDS[cardKey], effOf(fKey, pain, adrenaline));
}

function buildRail() {
  const opt = (v, l, sel) => `<option value="${v}"${v === sel ? " selected" : ""}>${l}</option>`;
  const side = (tag, fKey, cKey, commit, painKey, adrenKey) => {
    const f = FIGHTERS[state[fKey]];
    const seq = state[cKey];
    const spent = seq.reduce((s, k) => s + costOf(state[fKey], k, state[painKey], state[adrenKey]), 0);
    const budget = exertionBudget(effOf(state[fKey], state[painKey], state[adrenKey]));
    return `
    <div class="grp">
      <div class="grp-h"><span>Side ${tag.toUpperCase()}</span><em>${f.name}</em></div>
      <div class="sel">
        <label for="s_${fKey}">Fighter</label>
        <select id="s_${fKey}" data-k="${fKey}">
          ${Object.keys(FIGHTERS).map((k) => opt(k, FIGHTERS[k].name, state[fKey])).join("")}
        </select>
      </div>
      <div class="seq" data-seq="${cKey}">
        ${seq.map((k, i) => `<div class="seqrow"><span>${i + 1}. ${CARDS[k].name}</span>
           <em>${costOf(state[fKey], k, state[painKey], state[adrenKey]).toFixed(1)}</em>
           <button type="button" data-drop="${cKey}:${i}" aria-label="remove">×</button></div>`).join("")
          || `<div class="seqrow empty">nothing queued</div>`}
      </div>
      <div class="bar"><i style="width:${Math.min(100, (spent / budget) * 100).toFixed(1)}%;${spent > budget ? "background:var(--accent)" : ""}"></i></div>
      <div class="barlab"><span>${spent.toFixed(1)} / ${budget.toFixed(0)}</span><span>${spent > budget ? "overspent" : `${(budget - spent).toFixed(1)} left`}</span></div>
      <div class="sel">
        <label for="add_${cKey}">Add card</label>
        <select id="add_${cKey}" data-add="${cKey}">
          <option value="">—</option>
          ${cardsFor(state[fKey]).map((k) => opt(k, `${CARDS[k].name} (${costOf(state[fKey], k, state[painKey], state[adrenKey]).toFixed(1)})`, "")).join("")}
        </select>
      </div>
      <div class="ctl">
        <label for="c_${commit}">Commitment (−1 bluff … +1 committed)</label><output id="o_${commit}"></output>
        <input type="range" id="c_${commit}" data-k="${commit}" min="-1" max="1" step="0.05">
      </div>
      <div class="ctl">
        <label for="c_${painKey}">Pain (0 whole … 1 wrecked)</label><output id="o_${painKey}"></output>
        <input type="range" id="c_${painKey}" data-k="${painKey}" min="0" max="0.9" step="0.05">
      </div>
      <div class="ctl">
        <label for="c_${adrenKey}">Adrenaline (masks pain, shakes hands)</label><output id="o_${adrenKey}"></output>
        <input type="range" id="c_${adrenKey}" data-k="${adrenKey}" min="0" max="1" step="0.05">
      </div>
    </div>`;
  };

  document.getElementById("rail").innerHTML =
    side("a", "aF", "aC", "aCommit", "aPain", "aAdren") + side("b", "bF", "bC", "bCommit", "bPain", "bAdren") + `
    <div class="grp">
      <div class="grp-h"><span>Field</span><em></em></div>
      <div class="ctl">
        <label for="c_distance">Distance (m)</label><output id="o_distance"></output>
        <input type="range" id="c_distance" data-k="distance" min="0.4" max="3" step="0.05">
      </div>
      <button class="btn" id="reroll" type="button">Roll again</button>
    </div>`;

  const dirty = () => { state.presetId = null; state.note = null; };
  document.querySelectorAll("#rail select[data-k]").forEach((el) =>
    el.addEventListener("change", () => {
      state[el.dataset.k] = el.value;
      if (el.dataset.k === "aF") state.aC = state.aC.filter((c) => cardsFor(state.aF).includes(c));
      if (el.dataset.k === "bF") state.bC = state.bC.filter((c) => cardsFor(state.bF).includes(c));
      dirty(); buildRail(); render();
    }));
  document.querySelectorAll("#rail select[data-add]").forEach((el) =>
    el.addEventListener("change", () => {
      if (el.value) state[el.dataset.add].push(el.value);
      dirty(); buildRail(); render();
    }));
  document.querySelectorAll("#rail button[data-drop]").forEach((el) =>
    el.addEventListener("click", () => {
      const [k, i] = el.dataset.drop.split(":");
      state[k].splice(+i, 1);
      dirty(); buildRail(); render();
    }));
  document.querySelectorAll("#rail input[type=range]").forEach((el) => {
    el.value = state[el.dataset.k];
    el.addEventListener("input", () => { state[el.dataset.k] = parseFloat(el.value); dirty(); render(); });
  });
  document.getElementById("reroll").addEventListener("click", () => { state.seed = (state.seed * 7919 + 13) >>> 0; render(); });
}

function buildPresets() {
  document.getElementById("presets").innerHTML = PRESETS.map((p) =>
    `<button class="chip" type="button" data-p="${p.id}">${p.aC.length}× ${CARDS[p.aC[0]].name} <span style="opacity:.6">vs</span> ${p.bC.length}× ${CARDS[p.bC[0]].name}</button>`).join("");
  document.querySelectorAll("#presets .chip").forEach((b) =>
    b.addEventListener("click", () => {
      const p = PRESETS.find((x) => x.id === b.dataset.p);
      Object.assign(state, { aF: p.aF, aC: [...p.aC], bF: p.bF, bC: [...p.bC],
                             distance: p.distance ?? 1.0, aCommit: 0, bCommit: 0,
                             note: p.note, presetId: p.id });
      buildRail(); render();
    }));
}

// --- Render -----------------------------------------------------------------

const guardOf = (pt) => nearestGuardName(pt);

function render() {
  const r = build();
  document.getElementById("timeline").innerHTML = draw(r);

  const dmg = (side) => side.contacts.reduce((s, c) => s + c.severity, 0);
  const da = dmg(r.a), db = dmg(r.b);
  const v = document.getElementById("verdict");
  v.textContent = `${da.toFixed(0)} — ${db.toFixed(0)}`;
  document.getElementById("verdictLab").textContent =
    `total severity dealt over ${(r.ticks / 100).toFixed(2)}s · ${r.a.contacts.length} and ${r.b.contacts.length} contacts`;

  document.getElementById("phaserows").innerHTML = [r.a, r.b].flatMap((side) =>
    side.steps.map((s) => `
      <tr><td>${side.fighter.name}<br><span style="color:var(--ink-3)">${s.card.name}${s.cancelled ? " (cut)" : ""}</span></td>
      <td>${s.start.toFixed(0)}</td>
      <td>${s.carry.toFixed(2)}</td>
      <td>${s.phases.ready.toFixed(0)}</td>
      <td>${s.total.toFixed(0)}</td>
      <td style="color:var(--ink-3)">${s.arcs.map((a) => guardOf(a.endPos ?? a.arc.to) + (a.followThrough != null && a.followThrough < 0.35 ? " ↺" : "")).join(" ") || "—"}</td></tr>`)).join("");

  const label = { land: "", disrupt: "disrupt", interrupt: "interrupt", whiff: "whiff", begin: "" };
  document.getElementById("log").innerHTML = r.log.map((e) => {
    if (e.event === "begin") return "";
    const who = (e.side === "a" ? r.a : r.b).fighter.name;
    if (e.event === "land")
      return `<div class="logline"><b>t=${e.t}</b> ${who}'s ${e.card} → ${e.band} ${e.severity.toFixed(1)}% <span class="tag ${e.against}">${e.against}</span></div>`;
    if (e.event === "whiff")
      return `<div class="logline"><b>t=${e.t}</b> ${who}'s ${e.card} never reaches <span class="tag whiff">${e.reach.toFixed(2)} m vs ${e.gap.toFixed(2)} m</span></div>`;
    if (e.event === "disrupt")
      return `<div class="logline"><b>t=${e.t}</b> ${who}'s ${e.card} cancelled <span class="tag gathering">disrupt</span></div>`;
    if (e.event === "interrupt")
      return `<div class="logline"><b>t=${e.t}</b> ${who} goes down — the rest of the sequence never happens <span class="tag recovering">interrupt ${(e.topple * 100).toFixed(0)}%</span></div>`;
    return "";
  }).join("") || `<div class="logline">Nothing connected.</div>`;

  document.querySelectorAll("#rail input[type=range]").forEach((el) => {
    el.value = state[el.dataset.k];
    document.getElementById("o_" + el.dataset.k).textContent = (+el.value).toFixed(2);
  });

  // Budget bars read the MODEL's own spent/budget rather than recomputing, so
  // Pain shrinking the allowance shows up here without a second code path.
  [r.a, r.b].forEach((side, i) => {
    const bar = document.querySelectorAll("#rail .bar i")[i];
    const lab = document.querySelectorAll("#rail .barlab")[i];
    if (!bar || !lab) return;
    const over = side.spent > side.budget;
    bar.style.width = `${Math.min(100, (side.spent / side.budget) * 100).toFixed(1)}%`;
    bar.style.background = over ? "var(--accent)" : "";
    lab.innerHTML = `<span>${side.spent.toFixed(1)} / ${side.budget.toFixed(0)}</span>` +
      `<span>${over ? "overspent" : `${(side.budget - side.spent).toFixed(1)} left`}</span>`;
  });
  document.querySelectorAll("#presets .chip").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.p === state.presetId));

  document.getElementById("cap").textContent = state.note ||
    `${r.a.fighter.name} queues ${r.a.cards.length} against ${r.b.fighter.name}'s ${r.b.cards.length}. Turn ran ${r.ticks} ticks.`;
}

buildPresets();
buildRail();
render();
