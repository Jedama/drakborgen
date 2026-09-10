# The severity axis cannot reach its own ceiling

**Status:** diagnosis + proposed change, not yet applied.
**Scope:** `src/model/curve.js`, `src/model/resolve.js`, `src/model/constants.js`.
**Written by:** a second pass over the model with fresh eyes and *without* the original
design context. Everything factual below was measured by running the model; everything
interpretive is flagged as such. Section 7 lists what I could not check.

---

## 1. The complaint that started it

> "Shove a broadsword straight through an unarmored person — they're dead. That's what
> I'm trying to convey. It doesn't need to hit a vital."

The model cannot currently express this. A knight's `fullSwing` into an unarmored
duelist ends the fight **1.3% of the time**, and the other 98.7% is a flat 61 severity.

That turned out not to be a tuning problem. There are two independent places where the
model is constructed so that the top of the severity axis is unreachable, and neither
can be fixed by moving constants.

---

## 2. Finding A — severity 100 is a measure-zero event, in every matchup

`heightAnchors()` caps the Vital anchor *before* the curve is built:

```js
// curve.js:72
const vital = Math.min(100, Math.max(wound, sFull * (1 + K.VITAL_GAIN * (1 - redundancy) * vitalSuit)));
```

`buildCurve()` then constructs a curve that arrives at that anchor at `x = 100`, by an
affine pin (`gain = ys[5] / top`). The rise events are normal CDFs, which approach their
area asymptotically. So the top value is attained at exactly one point and nowhere else.

Measured, knight `fullSwing` → unarmored duelist, with the Vital band artificially
widened to 25 units to rule out width as the cause:

```
roll 90       severity 99.317128
roll 95       severity 99.829605
roll 98       severity 99.956252
roll 99       severity 99.981317
roll 99.999   severity 99.999984
roll 100      severity 100.000000
```

`P(severity = 100) = 0` for every curve in the game. Widening the Vital band does not
help; it only makes the approach closer.

### 2a. A side effect worth knowing about

Because the cap is applied to the anchor, all the overshoot above 100 is discarded.
**14 of 36** main-hand matchups have their Vital anchor clamped to exactly 100 — including
all nine of the knight's cards against the duelist. At the top of the axis, a flicked
`quickCut` and a fully committed `fullSwing` are indistinguishable.

What is left telling them apart is Vital band *width*, which comes from Precision, and
which runs the wrong way:

```
knight/quickCut  -> duelist:  vital width 2.92   P(decisive) 1.52%
knight/fullSwing -> duelist:  vital width 1.89   P(decisive) 1.26%
```

The flick kills more often than the committed swing.

---

## 3. Finding B — an ordinary solid hit can never be lethal either

`S_full` — the Wound anchor, "a clean connection with the body" — has the same defect one
layer down. It is a saturating ratio:

```
S_full = 100 · (B·G) / (B·G + TOUGH_K · Toughness)
```

which asymptotes to 100 and never arrives. Writing `X = B·G` and `T = TOUGH_K · Toughness`:

```
S_full  50  needs X/T = 1.00
S_full  75  needs X/T = 3.00
S_full  85  needs X/T = 5.67
S_full  95  needs X/T = 19.00
S_full 100  needs X/T = infinity
```

Measured `X/T` for real blows against an unarmored duelist:

```
knight fullSwing   X/T = 1.54   ->  S_full 61
knight overhead    X/T = 1.44   ->  S_full 59
knight quickCut    X/T = 0.68   ->  S_full 40
duelist lunge      X/T = 3.07   ->  S_full 75
duelist thrust     X/T = 0.95   ->  S_full 49
```

Getting the knight's hardest swing to 85 requires hitting **3.7× harder**. That is not
reachable by tuning: quadrupling bite would invalidate the armor math (`P`, `L`), the
skeleton's Toughness table, and the Momentum calibration simultaneously.

**This is the direct cause of the original complaint.** The Wound band has no access to
the top of the axis, so an ordinary solid connection can never kill — which is precisely
the case the design wants to express.

---

## 4. Diagnosis

Both findings are the same modelling decision made twice: **a quantity that represents
"how bad is this" was given a form that cannot reach its own maximum.**

- Wound: asymptotic (`X/(X+T)`) — approaches 100, never arrives.
- Vital: clamped early (`min(100, …)`) — arrives at one point, discards the rest.

In both cases the information that would answer "how far past lethal was this blow"
exists upstream and is destroyed before it reaches the curve.

That surplus is not waste. **It is the width of the lethal plateau.** A blow at raw 103
should be lethal across a sliver of the roll axis; a blow at raw 205 should be lethal
across most of it. Discarding the overshoot is what collapses both into "reaches 100 at
x=100 only."

---

## 5. Proposed change

Two edits, same principle: *let the raw value overshoot 100, and cap at the output
instead of at the anchor.* `severityAt()` already clamps its return value, so the
output-side cap exists and is being pre-empted.

**5.1 — `curve.js:72`.** Drop the leading `Math.min(100, …)`. Let the Vital anchor carry
its true value (170, 238, 648 …). Nothing downstream needs to change.

**5.2 — `S_full` in `resolve.js`.** Replace the saturating ratio with one that reaches
100 at a finite bite-to-toughness ratio:

```
S_full = 100 · (B·G) / (LETHAL_RATIO · TOUGH_K · Toughness)      // capped at output
```

`LETHAL_RATIO` is one new authored constant with a plain-language meaning: **how many
times its own toughness must a blow carry to simply kill the thing.**

`S_guard` is a fraction of `S_full` and needs no change — armor keeps working by taking a
proportion, exactly as now.

### Choosing LETHAL_RATIO

`S_full` against an unarmored duelist:

| blow | X/T | now | L=1.25 | **L=1.5** | L=1.75 | L=2 |
|---|---|---|---|---|---|---|
| knight fullSwing | 1.54 | 61 | 100 | **100** | 88 | 77 |
| knight overhead | 1.44 | 59 | 100 | **96** | 82 | 72 |
| knight slash | 1.12 | 53 | 90 | **75** | 64 | 56 |
| knight quickCut | 0.68 | 40 | 54 | **45** | 39 | 34 |
| duelist lunge | 3.07 | 75 | 100 | **100** | 100 | 100 |
| duelist thrust | 0.95 | 49 | 76 | **64** | 54 | 48 |

`L = 1.5` is the value that satisfies the stated intent: the committed broadsword swing
kills an unarmored target, the flick does not. It is derived from *one* design statement,
not tuned across the game — see §7.

---

## 6. What both changes do, measured

`L = 1.5`, Vital clamp removed, all else untouched. `P100` is the share of the roll axis
reading exactly 100; `x@100` is the roll at which the lethal plateau begins.

```
case                            |        BEFORE         |            AFTER
                                | Sfl mean  P85  P100   | Sfl mean  P85   P100  x@100
knight fullSwing -> NAKED duel  |  61   51   1.3   0.0  | 100   79  73.5   68.5    31
knight quickCut  -> NAKED duel  |  40   36   1.5   0.0  |  45   40   2.2    1.7    98
duelist lunge    -> NAKED duel  |  75   66   4.2   0.0  | 100   85  82.2   81.2    19
duelist thrust   -> NAKED duel  |  49   44   4.0   0.0  |  64   55   5.5    5.2    95
knight fullSwing -> gambeson    |  61   43   1.3   0.0  | 100   71  53.2   42.0    58
knight quickCut  -> gambeson    |  40   29   1.5   0.0  |  45   32   2.2    1.7    98
duelist thrust   -> PLATE       |  49   17   4.6   0.0  |  64   21   6.2    5.8    94
duelist lunge    -> PLATE       |  75   32   4.1   0.0  | 100   70  17.9   16.2    84
knight fullSwing -> skeleton    |  31   24   0.0   0.0  |  30   23   0.0    0.0     -
knight shieldBash-> skeleton    |  61   45   1.1   0.0  | 100   73  55.2   50.8    49
duelist thrust   -> skeleton    |  13   10   0.0   0.0  |  10    8   0.0    0.0     -
skeleton slash   -> gambeson    |  28   17   0.0   0.0  |  26   16   0.0    0.0     -
```

The three fantasies the model exists to protect all survive:

- **Plate works.** A rapier thrust into full plate: 6.2% lethal. Full plate passes 17–24%
  of `S_full` through as `S_guard`, unchanged by this.
- **The skeleton still can't be stabbed.** Rapier thrust → skeleton stays at 10 severity,
  0% lethal, and is *slightly lower* than before. Blunt still works: `shieldBash` → 55%.
- **Technique still matters.** `quickCut` → naked target is 2.2% lethal against
  `fullSwing`'s 73.5%. The inversion in §2a is gone, because the overshoot now
  distinguishes them instead of being clamped away.

---

## 7. Open questions — things I could not settle without more context

**7.1 `L = 1.5` is calibrated against one sentence.** It reproduces the broadsword case
and keeps the skeleton and plate cases intact, but it has not been run through
`src/sim/fight.js` to see what it does to fight length, and the sensitivity is sharp:
at `L = 2` the knight's `fullSwing` tops out at 77 and has no lethal plateau at all.
There is not much room between "as intended" and "no longer lethal."

**7.2 At `L = 1.5` the roll stops carrying information in the unarmored case.**
`fullSwing` → naked duelist becomes: 9.5% miss, 22% graze, **68.5% dead**, with nothing
in between. That is arguably exactly the stated intent, but it means the severity axis
has three outcomes rather than a spectrum whenever armor is absent. Worth an explicit
yes/no from the designer.

The structural reason is worth knowing: against an unarmored target `coverageEff = 0`, so
the Guard band has zero width and `S_guard = S_full`. The Graze anchor is pinned to
`S_guard`, so the curve climbs to full value by roll ~32 and stays there. The unarmored
curve is close to a step function *already* — this change only raises the step above 100.

**7.3 The Vital band ignores Coverage entirely.** Separate from everything above, and
found while measuring. Vital width is

```js
// curve.js:37
const vital = connected * K.VITAL_MAX * p ** K.VITAL_EXP * (1 - (braced ? K.GUARD_VITALS : 0));
```

`coverageEff` does not appear, and the Vital *height* is built from `S_full`, which is
pre-armor. Measured, same knight `fullSwing`:

```
duelist naked       vital width 1.87   ceiling 100.0
duelist gambeson    vital width 1.89   ceiling 100.0
duelist FULL PLATE  vital width 1.99   ceiling 100.0
```

Full plate makes you *fractionally more* likely to be vitaled, at an identical ceiling.
Only `braced` defends the Vital band. This may be deliberate — "a vital hit is by
definition one that found a gap" is a defensible reading, and `gaps` exists on every
armor piece (plate 0.12, gambeson 0.50) as the obvious hook. But `gaps` is currently
wired only into `effectiveCoverage()`, which splits Guard from Wound and never touches
Vital. The change proposed here makes this matter more, not less, since the Vital anchor
stops being clamped.

**7.4 `meanSeverity()` will read high afterward.** It integrates the curve analytically
*without* the output cap, so once anchors exceed 100 it reports above the true clamped
mean. (The `AFTER` means in §6 are numeric, sampled through `severityAt`, so they are
correct.) Flagged as known-and-accepted rather than fixed, on the grounds that the stat
is not currently load-bearing — but the comments in `constants.js` describe it as "the
single dial governing fight length," so that judgement should be confirmed.

**7.5 Untouched, and possibly the real subject.** There is a larger conversation this
came out of — whether `Redundancy` is the right stat, whether the Vital band should mean
"the best hit available against *this* target given what you can reach" rather than a
multiplier on an ordinary wound, and how a giant's unreachable vitals should be
expressed. None of that is addressed here. This document is deliberately the narrow
structural fix: **the axis cannot reach its ceiling**, which is true regardless of how
that larger question is settled, and which blocks it either way.

---

## 8. Reproducing the numbers

Everything above was measured against the live model (`workbench.html` served locally,
modules imported directly). Nothing was estimated. The two edits are:

1. `src/model/curve.js:72` — remove `Math.min(100, …)` from the Vital anchor.
2. `src/model/resolve.js` — `sFull` from `100*(B*eng)/(B*eng + K.TOUGH_K*toughness)`
   to `100*(B*eng)/(K.LETHAL_RATIO * K.TOUGH_K * toughness)`, plus
   `LETHAL_RATIO: 1.5` in `constants.js`.

Neither has been applied. The project is not under version control.
