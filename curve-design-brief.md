# Damage curve — design brief for a dedicated conversation

> ## SUPERSEDED — historical record
>
> **This document describes a system that no longer exists.** It is kept because it
> is the best statement of what the curve was *supposed* to do, and because the
> numbered expectations in "Every concrete expectation stated so far" were used
> directly as the spec for the replacement. Read it for intent, not for mechanism.
>
> Everything it describes as "current" is gone: hand-authored `baseCurve` points,
> `weaponPower`, `momentumFactor`, `expandBands`, `TRANSITION_WIDTH`,
> `buildParryCurve`, and the monotone cubic spline. That code still exists in
> `script.js`, which is retained as legacy and is not part of the build.
>
> **The answer is `combat-model.md`.** Every open question at the bottom of this
> brief was resolved there:
>
> | This brief asked | Answer |
> |---|---|
> | Is point-by-point authoring the right level of control? | No. Nothing about the curve is authored; widths and heights are computed from stats. |
> | Is continuity compatible with bands feeling distinct? | Yes. Bands are continuous by construction (each starts where the last ended); distinctness comes from width and rise placement, not from vertical jumps. |
> | Should band widths be derived relationally? | Yes. The five bands partition one budget, so narrowing one widens another. |
> | Should Buckler Parry stay a bespoke exception? | No. It is the `braced` flag, which converts evasion into coverage. No special-case curve exists. |
> | What is the felt difference between Armor, Hit and Precision? | They are now Guard, Wound and Vital, defined in `combat-model.md` §3. |
> | Do all bands need to exist on every curve? | No. Any band may be zero-width, with no flags — an unarmoured target has no Guard, a slime has no meaningful Vital. |
>
> The two structural bugs recorded below (a 2-point Hermite segment cannot delay a
> rise; a point's own value must stay separate from its role as a domain boundary)
> are both moot — there is no spline and no shared point list. They are worth
> reading only as a record of why the old parameterisation kept failing.

## Why this document exists

This is a prototype combat game (`C:\repos\claude_drakborgen`, plain JS — `script.js`). One piece of it, the **damage-resolution curve**, has been reworked something like a dozen times across a much longer design conversation, and every numeric tuning pass has run into the same wall: fixing one complaint (a jump here, a band too wide there) creates or re-exposes another. The most recent attempt was told "still quite awful" after a fix that was itself correcting a previous fix. That's a signal the underlying *parameterization* — not the specific numbers — is probably wrong, and it deserves a conversation of its own rather than more patching inside a much larger session.

This document is written so that conversation can start from the accumulated intent, not from scratch. It is **not** asking for the current numbers to be defended — it's handing over every concrete example given so far about what the curve *should* do, plus the current mechanism, so a fresh mathematical pass can either fix the parameterization or replace it.

## The core idea (keep this — it's not in question)

A "hit" is resolved by:
1. Rolling one uniform random number, 0–100 (`roll`).
2. Evaluating a smooth curve at that roll. The curve's y-value **is** the % of the defender's max HP removed — directly, no further math afterward.
3. The curve is composed fresh per hit from: the defender's own body/armor (a `baseCurve` they own), the attacker's weapon lethality (`weaponPower`, rescales the y-ceiling), the attacker's momentum (weight×speed×card factor; adds a flat y-bonus to some bands, since mass "punches through" regardless of what's in the way — this is a load-bearing idea, keep it), the attacker's strength (a smaller y-bonus), and context (hand dominance, timing penalties — small x-shifts).

Nobody wants to abandon "one curve, one roll, y = %HP directly." What's in question is **how the curve's shape (which named bands exist, how wide each is, how their y-values relate to each other and connect) should be parameterized and placed.**

## Current mechanism (as of this handoff)

- A curve is a list of named points, in x-order: typically `Graze`, `Armor`, `Hit`, `Precision`. (There used to be a `Max` point too; it was removed — `Precision` is now always the last band, and its own ceiling value **is** the max, reached at x=100.)
- Each point has:
  - `x`: 0–100 (a roll), where this band *begins*.
  - `y`: the devastation (% HP) at that x.
  - `endY` (optional): the devastation this band rises *to* by the time it hands off to the next band. If omitted, the band is flat (`endY = y`).
  - `slope` (optional): an authored derivative at that exact point, fed into the spline's tangent calculation (see below). If omitted, the tangent is auto-averaged from neighboring points.
- Before rolling, every point-list gets run through `expandBands()`, which turns each single point into a **start/end pair**: the point as authored is the band's start; a second point (same name, so zone-lookup still reports one band) is placed a fixed, narrow `TRANSITION_WIDTH` (currently 2 units) before the *next* band's start, holding `endY`. The **last** band's own end point sits exactly at x=100 (no gap left for a "next" band). This is what makes a band's *interior* shape (flat or rising) independent of the *transition* into the next band (always narrow).
- The point list is then handed to a **monotone cubic Hermite spline** (Fritsch–Carlson limiter, so authored slopes can never cause an actual overshoot past neighboring points — they just get pulled back toward something monotonic-safe if too aggressive).
- `zoneLabel(points, x)` reports which band a given x falls in, by simple threshold walking.
- Below the first point's x, `buildSpline` clamps to that first point's own y — this is deliberately how "total miss" (0%) works: it's not a special case, it's just what's below the curve's leftmost defined point. **If you don't want a "total miss" to be possible at all, you push that leftmost point to a negative x** (no roll is ever negative, so nothing can ever fall below it) — this trick is already used once (see Buckler Parry below) and may be relevant more broadly.

### Two structural bugs already found and fixed, worth knowing so they aren't rediscovered

1. **A 2-point cubic Hermite segment cannot "delay" a rise no matter what tangents you give it** — it reaches ~50% of its total rise by the segment's midpoint, always. Wanting a band to look "flat for most of its width, then jump right at the boundary" is *mathematically impossible* with a single point per band, regardless of authored slope. This is why bands are now start/end *pairs* (see above) — the flatness lives in the pair's own two points (both holding the same y), and the *jump* lives in the separate, narrow transition segment to the next band's start.
2. **A point's own edited values must stay separated from that point's role as a domain boundary.** Concretely: `Graze`'s start-y has to stay pinned at exactly 0, because `buildSpline` uses it as the constant value for the entire "total miss" zone below it. When Graze was given an `endY` that scales with weapon/momentum (so the *climb into Armor* scales appropriately), a first attempt let that same edit touch Graze's start-y too — which would have made "total miss" stop meaning 0%. Fixed with an `endYOnly` edit flag. Keep this constraint in mind for any redesign: whichever point anchors "nothing happened yet" must never have its own baseline y-value moved by anything.

### Current numbers (Siger, as of this handoff — spider is analogous, wider bands, chitin flavor)

```js
baseCurve: [
  { name: "Graze",     x: 12, y: 0,  endY: 15 },
  { name: "Armor",     x: 22, y: 20, endY: 28 },
  { name: "Hit",       x: 42, y: 70, endY: 90 },
  { name: "Precision", x: 88, y: 95, endY: 100 },
]
```
`weaponPower` (0–100ish) multiplies Armor/Hit/Precision's y (and endY) proportionally. Momentum adds a flat y-bonus to Graze/Armor/Hit/Precision's endY-or-y (a full-power hit "punches through" everywhere) and narrows Precision's x (heavy momentum is hard to fine-tune). Strength adds a smaller flat y-bonus to Hit/Precision only.

### Buckler Parry — the one curve that abandoned this pipeline entirely

Parrying (bracing behind a shield, not dodging) got its own bespoke curve (`buildParryCurve`), because the normal pipeline (built for a clean unblocked hit) didn't fit "the shield stops the weapon but not the mass behind it, and there's no way to just whiff entirely since you're not evading." Current shape:
```js
[
  { name: "Armor",     x: -60,  y: momentum*0.5,              },
  { name: "Hit",       x: 91,   y: (Armor.y)+20, endY: +5 more },
  { name: "Precision", x: 98.5, y: 50,           endY: 55      },
]
```
No `Graze` at all. Armor's x is deeply negative specifically so "Miss" is structurally unreachable (no roll is ever negative). Whether this should stay a special-cased exception, or whether the *general* curve system should be able to express "no possible miss, flat high baseline, narrow high tail" without a bespoke function, is itself one of the open questions below.

## Every concrete expectation stated so far, in rough chronological order

Use these as the actual spec — not the current numbers, which keep being adjusted trying (and failing) to satisfy all of them simultaneously.

1. **The five (four, now) bands represent a continuous spectrum of hit quality** — Graze (barely connected) → Armor (caught protection) → Hit (a real, solid connection) → Precision (a called shot — heart, throat, eye). Not discrete tiers; a smooth underlying reality that these names carve into readable zones.

2. **"The armor devastation shouldn't be rising continuously through the band. It should be about equally low the whole way through, and then jump up when it enters the hit band."** — first statement of wanting band-interior flatness distinct from a real transition. (Led to discovering the "2-point segment can't delay a rise" math limit above.)

3. **"Armor start and armor end don't need to be exactly the same. The damage can go up a bit, as blows still carry shock, and the shock's impact differs between spots."** — correction to #2: don't make Armor *perfectly* flat, a modest internal rise is more honest (shock varies by exactly where it lands even within "still mostly armor").

4. **"The hit band should rise during its span, not just jump at the boundaries."** — Hit specifically should show a real, visible climb across its own width — unlike Armor, which should barely move.

5. **"The precision band should be narrow by default, representing hitting the heart, throat, or anything else equally important. An ordinary solid connection (Hit) covers most of the roll range instead."** — Precision's *width* should be small no matter how everything else stretches; it's inherently rare.

6. **"Precision typically carries the best one can do. It is sometimes flat, sometimes not. But with this new system, we don't need a separate max point. Precision end is the max."** — confirmed removing the standalone `Max` point; Precision (the last band) owns the ceiling at its own end (x=100).

7. **"Something shifting the precision band's width would naturally need to move the other bands too. The transition between bands should probably always be narrow."** — two ideas: (a) band widths aren't independent, narrowing one *must* widen a neighbor since they all share the same 0–100 budget; (b) whatever happens *between* two bands (the handoff) should always be a short, sharp transition — the interesting shaping happens *inside* a band, not at its edges. This is the idea that produced the current start/end-pair + narrow-`TRANSITION_WIDTH` mechanism.

8. **"Do people carry their crossbows pre-loaded?"** context aside — not curve-related, skip.

9. **"Armor start and armor end don't need to be exactly the same... Also the graze end should probably be very close to armor start, usually."** — clarified *much* later to mean: **the DEVASTATION VALUE at graze's end should be close to armor's starting devastation value** (Y-continuity across the handoff), **not** that graze's *x-width* should be narrow. An earlier attempt misread this as "narrow the Graze band's width," which was explicitly called out as wrong. The actual ask: **"I meant graze end devastation should be close to armor start devastation, so graze devastation generally goes upward."** Graze should never be a flat 0 the whole way — it should climb toward whatever Armor's own opening value is, so the handoff is a small step, not a cliff.

10. **The "no chance of missing a braced target" rule — stated as a general principle, not a one-off**: *"There should be no chance of missing a target that isn't trying to dodge. That's like a general rule. If the attackee is preparing to take the hit, the attacker shouldn't miss for no reason. The graze band can still exist, representing a weak hit, but it should be weak."* This came from a concrete case: Siger braced behind a raised shield (Buckler Parry) against a leaping spider, and a bad roll produced a flat 0%-devastation "Miss." The objection: Miss/Graze-as-"didn't connect" should only be possible against a target that is *actually evading* (moving, dodging). A target that has committed to *bracing for* the hit should have a floor well above zero — total whiffs are a property of the attack not finding a moving target, not a property of "bad luck" against someone standing still on purpose.

11. **The worked follow-up to #10 — the concrete numeric example to build from:** *"Should the whole big spider crashing into the shield with momentum be calculated into the plot? It probably should. Then quite high devastation regardless, no graze at all. And the hit band represents the claws hitting too, which deals more damage. The precision band would do even more, maybe 50? But be very very narrow, like 98 or 99."* This is the single most concrete spec given: for a momentum-heavy attacker vs. a braced (not dodging) defender —
    - No graze/miss possibility at all.
    - A **high, flat baseline** across nearly the entire roll range, driven by the attacker's raw momentum (the mass gets through regardless of the block).
    - A **Hit-equivalent band** layered on top representing the weapon (claws) also finding a gap — meaningfully higher than the baseline.
    - A **very narrow, very high Precision band** right at the top of the roll range (~98–99+) representing a clean hit despite the defense.

12. **Most recent reaction, after implementing #9 and #11 together:** *"Still quite awful... This still has graze band starting at like 20, and armor band very small compared to hit."* — i.e., even with Y-continuity fixed and the parry curve rebuilt around momentum, the **general (non-parry) curve's band proportions** still read wrong: Graze's climb tops out too early/too low relative to the rest, and Armor is disproportionately narrow next to Hit. This is the unresolved complaint this document exists to hand off.

## Open questions for the dedicated conversation

- **Is point-by-point hand-authoring (x, y, endY, slope per band) the right level of control at all**, or should curves be *generated* from a smaller set of meaningful character/weapon stats (e.g., "armor coverage %," "toughness," "weapon precision," "how rare is a called shot") rather than ~12–16 raw numbers hand-placed per curve? The repeated tuning failures suggest the current knobs may not map cleanly onto the intent.
- **Is "continuous, no big jumps anywhere" actually compatible with "each band should feel meaningfully, distinctly different"?** Full Y-continuity (item 9) pulls toward one smooth gradient; wanting Hit to clearly outclass Armor and Precision to clearly outclass Hit (item 11's "more," "even more") pulls toward real steps. These may need an explicit, stated tradeoff rather than trying to satisfy both maximally.
- **Should band widths be derived relationally** (e.g., "Precision is always the narrowest," "Armor width scales with a defender's actual armor coverage stat") **rather than independently authored absolute x-values** that happen to need manual rebalancing every time one band changes?
- **Should the Buckler Parry case (bespoke curve, no Graze, negative-x anchor) be a special exception**, or does it reveal that the *general* system needs a first-class way to express "some or all bands can be suppressed/skipped for this specific attacker-defender-context combination" (e.g., a `noMiss: true` idea, or a defender-posture flag that swaps in a different baseCurve shape) so this doesn't need its own hand-written function?
- **What is the actual felt difference, in words, between "Armor," "Hit," and "Precision" that the numbers need to encode?** E.g.: Armor = "you're basically fine, shock at most"; Hit = "a real wound, meaningfully dangerous"; Precision = "could end the fight." If there are target *ratios* in mind (Hit should feel ~Nx worse than Armor, etc.) those haven't been stated numerically yet and would help ground a fresh pass.
- **Do all four bands need to exist on every curve**, or is the right model "some bands may be degenerate/zero-width/absent depending on the matchup" (armor-less target has no real Armor band; a target with no vitals-equivalent has no real Precision band; a braced defender has no Graze at all)?

## Where to look in the code

`C:\repos\claude_drakborgen\script.js` — search for: `baseCurve` (Siger/Spider definitions), `editPoints`, `expandBands`, `buildSpline`/`computeTangents` (the spline engine itself — almost certainly does not need to change), `composeDamageCurve` (the per-hit assembly pipeline), `buildParryCurve` (the bespoke exception), `zoneLabel`, `rollOnCurve`. The `renderCurves`/`drawCurve` functions render the live chart shown in these screenshots, if visualizing new candidate shapes is useful during the redesign.
