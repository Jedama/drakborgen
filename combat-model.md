# Combat model — stats, flags, and the resolution curve

Companion to `commit-and-bail.md` (the surrounding game) and `curve-design-brief.md`
(the problem statement this answers — now superseded, kept as a record of intent).
This document is the answer: a set of named stats and flags, and the mathematics that
turns them into a resolution curve.

No code. Every constant in here is a calibration knob, gathered in one place (§7)
rather than scattered — the whole point is that the *structure* is now derived and
only the knobs are tuned.

---

## 1. What was wrong, and what changes

The old system authored ~16 raw numbers per character (`x`, `y`, `endY`, `slope` per
band) and then bent them with a dozen independent magic scales (`MOMENTUM_Y_SCALE`,
`STRENGTH_Y_SCALE`, `PARRY_MOMENTUM_SCALE`, `DOMINANT_HAND_BONUS_RATE`, ...). Every
tuning pass fixed one complaint and broke another, because the knobs didn't map onto
anything meaningful.

Three structural changes:

1. **Nothing about the curve is authored.** Band widths and band heights are both
   computed from stats. A character sheet has stats; it does not have a curve.

2. **Band widths are shares of one budget.** The five bands partition the roll axis,
   so narrowing one necessarily widens another — the relational-width property the
   brief asked for, for free.

3. **The y-axis is five anchor values, not sixteen numbers.** Each band starts where
   the previous one ended. The band-interior *shapes* the brief kept trying to
   hand-author now emerge on their own (§5.6). No `endY`, no `slope`, no
   `TRANSITION_WIDTH` fiddling.

---

## 2. The resolution model

One hit is resolved by one uniform roll `r ∈ [0,100]`, evaluated against one curve.
The curve's y-value **is** the Severity. Nothing is computed afterward.

**There is no health pool and no accumulating damage.** Severity is not a slice taken
out of a bar — at the top of the curve it ends the fight outright, and everywhere below
that it inflicts a **condition** (design notes §10). Toughness lives in the curve, not
in a hit-point total: a thing that is hard to hurt has a low curve, not a big number.
This is what makes "your sword is not meaningfully piercing its hide — run away"
expressible at all.

Damage still accumulates, but *through the curve rather than beside it*: a condition
degrades stats, degraded stats make a worse curve, and the next blow therefore reads
higher. Two 30% blows are not a 60% blow — the second lands on someone slower and less
able to get out of the way, so it reads 55%. That non-linearity is the point, and it is
why no pool is needed to represent it.

Read the roll as **placement quality**: how well this particular blow, at this moment,
landed. Three forces move probability mass along that axis:

- the defender's **evasion** pushes mass down, toward Miss and Graze;
- the attacker's **Precision** pushes mass up, toward Vital;
- the defender's **Coverage** claims a block in the middle, as Guard.

Whatever is left is Wound — an ordinary solid connection, which is why it naturally
occupies most of the range.

```
  Severity
    ^
    |                                              ,-- Vital
    |                                          _,-'
    |                              ___,,--''''
    |                         _,,-'                <-- Wound climbs
    |    ______,,,,----''''''
    |___/                                          <-- Guard nearly flat
    |  /                                           <-- Graze rises off zero
  0 +--------------------------------------------------->  roll
    |Miss| Graze |   Guard   |     Wound      |Vital|
```

---

## 3. Bands

| Band | Meaning |
|---|---|
| **Miss** | Never connected. Severity exactly 0. |
| **Graze** | Barely connected — a glancing contact, an edge of a limb. Protection largely irrelevant; there wasn't enough there for it to matter. |
| **Guard** | Protection caught it. Armor, a shield, chitin, thick hide. What gets through is whatever penetrated plus whatever transmitted as shock. |
| **Wound** | A real connection with the body itself. The ordinary case. |
| **Vital** | Landed somewhere that materially degrades the target's ability to keep fighting. Usually an organ — throat, heart, eye — but equally a sword wrist, a knee, a leg joint, the vertebrae holding a skeleton's skull on. |

Order is fixed. Any band may be zero-width; that's how "this defender has no armor" or
"this creature has nothing worth aiming at" is expressed, with no flags and no special
cases.

---

## 4. Stats

### 4.0 What the numbers mean

Three scales, and which one a stat uses follows from what the stat *is* — it isn't
assigned. (The earlier 0–100 scale meant nothing: there was no defined average, no
ceiling, and no way to answer "is a giant Strength 150 or 300?")

| Scale | Used for | Anchor |
|---|---|---|
| **Real units** | Mass (kg), Size (m), Pace (m/s), Reach (m), phase durations (ticks) | The world. A person jogs at Pace 3, sprints at 7, a horse runs at 15. |
| **Fractions, 0–1** | Solidity, Redundancy, Coverage, Gaps, Spread, Bulk, Drive, Concentration, Aim | A true proportion of something. 1.0 means *all of it*. |
| **Human ratios, unbounded** | Strength, Agility, Precision, Reflexes, Improvisation, Stamina, Composure, PainTolerance, Toughness, Hardness | **1.0 = an ordinary competent adult.** 0.5 notably poor, ~2.0 the best human alive, monsters wherever they need to be. Hardness anchors on materials instead: 1.0 = hardened plate. |

The ratio scale is the important one. It makes statting answerable — "a giant can
throw a person, so call it Strength 6" is a question with an answer, where "is a giant
Strength 85 or 95" is not — and it removes the artificial ceiling, so something that
genuinely aims better than the best human alive has somewhere to go. Toughness was
already on this scale before the rule existed, which is a good sign it's the natural
one.

Two constants encode the anchor directly: `K_A` and `K_P` are both **1.0**, so an
ordinary adult's Agility and Precision each map to exactly 0.5 of their saturating
term. Both saturate, so capability has diminishing returns and nothing runs away.

**Categorical immunity is never a large number.** On a ×human scale there is no value
that means "cannot be frightened" or "feels no pain" — that is what `flags` are for, and
`mindless` already does both. Keep the ratio for degrees (a stoic barbarian 2.5, a soft
merchant 0.6) and the flag for kinds.

Presentation is a separate concern: the inspection UI (§14 of the design notes) can
show a 0–100 bar or "×1.4" without the model caring.

### 4.0b Authored, derived, and state

Three tiers. The distinction matters more than any individual stat, because the entire
rebuild was about moving things out of the first tier and into the second.

**Authored** — what is actually written on a sheet:

```
mass  size  pace                                 real units
agility  strength  precision  reflexes           x human
improvisation  stamina  composure  painTolerance
toughness{class}  vitalSuit{class}               per damage class
solidity  redundancy                             fractions
dominantHand  mainHand  offHand  armor  cards  flags
footprint  comHeight                             overrides, non-bipeds only
```

**Derived** — computed, never authored, and the list only grows:

| Derived | From | § |
|---|---|---|
| Encumbrance | worn mass against Strength and body mass | 5.1 |
| Bulk | the armour pieces | 5.1 |
| Body Reach | Size × `REACH_K` | 5.12 |
| Stability | Mass + worn, footprint, CoM height | 4.6 |
| `tau` (tempo) | Strength_eff and held mass — the *same* `v_weapon` momentum uses | 5.9 |
| Exertion budget | Stamina | 5.9 |
| Phase durations | profile × tau × Effort × carry × commitment | 5.9, 5.12 |
| Landing side, hit location, gravity | the card's arc | 5.12 |
| `p`, `E`, `m`, `B`, `G`, `P`, and the curve | all of the above | 5.2–5.7 |

**State** — 0–1, not on the sheet, accumulated during play: **Exhaustion**, **Pain**,
**Structure**, **Dread**, **Adrenaline** (§4.2b–4.2e).

### 4.0c The funnel

`effectiveStats()` is the **single place** where authored becomes effective. Nothing
downstream ever reads a raw sheet value — it reads the output of this one function, which
is what makes a new degradation source a change in one place rather than everywhere.

Two tiers come out, and the split matters:

- **`.capable`** — gear-adjusted but **condition-free**. What this body can do at all.
  Encumbrance and Bulk are in it, because armour is a fact about you for the whole
  fight. Exhaustion, Pain and Dread are not.
- **top level** — `.capable` after condition. What you can do *right now*.

```
felt      = Pain · (1 − ADREN_MASK · Adrenaline)     -- adrenaline masks pain, §4.2c
harm      = max(felt, Structure)                     -- never their sum, §4.2e
capacity  = (1 − Exhaustion) · (1 − harm)
rattled   = 1 − Dread
shake     = 1 − ADREN_SHAKE · Adrenaline

Strength_eff  = Strength  · capacity · handFactor(HAND_STR)
Pace_eff      = Pace      · capacity · (1 − Encumbrance·ENC_PACE)
Agility_eff   = Agility   · capacity · (1 − Encumbrance·ENC_AGI) · (1 − Bulk)
Precision_eff = Precision · capacity · (1 − Bulk·BULK_PREC) · handFactor(HAND_PREC) · shake
Reflexes_eff  = Reflexes  · capacity
Improv_eff    = Improvisation · capacity · rattled
Stamina_eff   = Stamina   · capacity
```

**Exertion cost reads `.capable` and the turn budget reads the top level**, so a
condition enters the exertion economy exactly **once**. Before that split, Pain both
shrank the budget and raised every card's cost, and the two multiplied — one fact counted
twice, which is what made being hurt feel unsurvivable rather than bad. *Capability sets
the cost; condition sets the budget.*

The states arrive **already resisted**: Composure damps how much Dread accumulates and
PainTolerance damps how much Pain does, at accumulation time. This function applies them;
it does not re-resist them.

Dread touches **Improvisation only** — §11 keeps one stat to one job, so Improvisation
still owns the reaction threshold and Dread merely scales it. It costs you the presence
of mind to spot an opening, not your legs.

`mindless` zeroes Pain, Dread and Adrenaline inside the funnel rather than at every call
site, so the immunity is impossible to forget. A skeleton at Pain 0.9 and Dread 0.9 comes
out completely unchanged. It is **not** immune to Structure.

**Composure and PainTolerance are static.** They describe *the character*, not their
current situation, so nothing degrades them — they pass through untouched. That is also
what keeps the feedback damped: a resistance eroded by the thing it resists is a loop
with no floor.

### 4.0d Conditions are located, not named

A condition is `(location, degree)`. "Maimed" and "crippled" are not two mechanics — they
are severe damage to two different places, and the flavour name follows from the pair.
Four locations, each owning a distinct cluster of stats with almost no overlap, which is
the test of the decomposition being real rather than invented:

| Location | Owns |
|---|---|
| **Main hand / off hand** | that hand's cards, its Strength and Precision contribution, its shield |
| **Legs** | Pace, Agility |
| **Head** | Precision, Reflexes, Improvisation |
| **Torso** | Stamina — breathing, and where bleeding lives |

**Localized** conditions disable a location's cluster. **Systemic** ones — Pain, bleeding,
shock — degrade everything through the funnel above. Both route through
`effectiveStats()`; neither ever touches the curve.

Hit location need not be authored either: **`endPos`, where the blade actually stopped
(§5.12), is a strong correlate of where the wound is.** Its vertical component reads as
head / torso / legs and its lateral as which side. It is the attacker's guard space
rather than a coordinate on the defender's body, so it is a mapping rather than a
measurement — but it means anatomy costs one function instead of a hit-location table.

**Bold** stats are authored on a character sheet; *italic* ones are derived and never
authored.

### 4.1 Body

| Stat | Range | Meaning |
|---|---|---|
| **Mass** | kg | Real mass. Drives momentum, carry capacity, and stability. A skeleton is ~35 (bones only); a knight's body is ~85 before armor. |
| **Size** | m | Standing height / body length. With Mass, gives density and footprint. |
| **Pace** | m/s | Ground speed, unencumbered. Feeds momentum, closing, and flee odds (§12 of the design notes). Jog 3, sprint 7. |
| **Agility** | ×human | Changing direction, keeping footing, getting the body out of the way. *Not* the same as Pace — a heavy knight can jog but cannot slip a blow. |
| **Strength** | ×human | How fast this body can accelerate a given weapon, and how much it can carry. |
| **Toughness**{class} | multiplier | **Per damage class, not a scalar.** How much punishment the flesh or frame absorbs before it counts as a wound. A human is roughly even across classes; a skeleton is `{blunt 0.5, pierce 2.5, slash 1.3}` — bone shatters under impact and barely notices a puncture. |
| **Solidity** | 0–1 | Fraction of the silhouette that is actually damageable matter. Flesh 1.0. Skeleton ~0.25 (mostly air between struts). A swarm, lower still. |
| **Redundancy** | 0–1 | **If this creature loses its single most important part, is it finished?** 0 = every critical is a sole point of failure (a human has one heart). A three-headed dragon is high — lose a head, keep fighting. A hydra higher. A slime 1.0: nothing is localised at all. A skeleton ~0.45. Sets the Vital band's *payoff* and the *shape of its front*, never its width. |
| *Reach* | m | Limb length, added to weapon reach. **Derived** from Size × `REACH_K` (§5.12) — an ordinary 1.78 m adult gets 0.71 m of arm. |
| **DominantHand** | −1..+1 | −1 fully left, +1 fully right, 0 ambidextrous. Feeds Precision, Strength, and phase durations — an off hand is both clumsier *and* weaker, though noticeably more clumsy than weak. |

### 4.2 Mind

| Stat | Range | Meaning |
|---|---|---|
| **Precision** | ×human | Consistency at placing a blow where it disables. Does four things: widens Vital, narrows the defender's Guard (finds the gaps), narrows the attacker's own Graze, and recovers Engagement against a low-Solidity target (§5.4). |
| **Reflexes** | ×human | Reaction latency — how quickly a qualifying trigger (§07) can be answered. |
| **Improvisation** | ×human | Thinking on the fly. Quality and breadth of reaction draws. A skeleton is ~0.2. |
| **Composure** | ×human | Resists Intimidation (design notes §11). |
| **PainTolerance** | ×human | Resists pain-mediated conditions (§10). A stoic barbarian 2.5, a soft merchant 0.6. Categorical immunity is not a large number — it is the `mindless` flag. |
| **Stamina** | ×human | Sets the per-turn energy budget (§08). |

### 4.2b The four condition states

Four 0–1 states, built identically and for the same reason: something has gone wrong
with you, and it makes everything you do worse. **None of them ever touches the curve
directly** — they scale stats, and stats make the curve. That rule is what stops a
growing list of conditions turning into a growing list of bespoke curve modifiers, which
is exactly the failure this whole model was rebuilt to escape.

| State | Resisted by | Comes from | Does |
|---|---|---|---|
| *Exhaustion* | Stamina | overspending the turn budget (§08) | scales down Pace, Agility, Strength, Reflexes, Precision; lengthens every phase |
| *Dread* | Composure | Intimidation (§11) | multiplies attack card costs up and flight costs down; raises the reaction threshold; poisons the draw |
| *Pain* | PainTolerance | being hurt (§10) | scales down the same stats as Exhaustion; poisons the draw |

Dread and Pain poison the draw in the same way — crowding the hand with cards that are
not fighting — so that is **one mechanism with two sources**, not two mechanisms.

`mindless` grants immunity to Dread, Pain and Adrenaline alike: nothing to frighten,
nothing to hurt, no endocrine system to flood.
A skeleton is degraded only *structurally*, which is why it can be dismantled and cannot
be broken in nerve.


### 4.2c Adrenaline — the counterweight

The other three states are purely negative. **This one is not, and that asymmetry is the
point** — it exists to stop being hurt feeling unsurvivable. Nobody should later "fix" it.

**It masks Pain rather than reducing it.** The wound is the wound; you just cannot feel
it yet.

```
felt     = Pain · (1 − ADREN_MASK · Adrenaline)
capacity = (1 − Exhaustion) · (1 − felt)
```

**So it is a deferral, not a negation.** It burns Stamina while it is up, and when it
fades the masked Pain simply lands — which needs **no crash mechanic at all**, because
`capacity` recomputes on its own. The fade is much faster once the fighting stops, which
is where the bill arrives: in the corridor, not the room.

**And it does not help everything.** Adrenaline gives back the body and takes the hands:

| Duelist | Pace | Agility | Strength | Precision |
|---|---|---|---|---|
| whole | 4.03 | 1.57 | 0.91 | 1.82 |
| Pain 0.7 | 1.21 | 0.47 | 0.27 | 0.55 |
| Pain 0.7 + full Adrenaline | **3.46** | **1.35** | **0.79** | 1.10 |
| Adrenaline alone | 4.03 | 1.57 | 0.91 | **1.28** |

A fighter running on adrenaline is a genuinely different character — faster, stronger,
and placing worse. Not a buff. It also does nothing for Improvisation: it makes you fast,
not clever.

Dread feeds it, because fight-or-flight is one response, so terror briefly makes you
quicker and no smarter — a partial counterweight to Dread as well.

Fade after taking a 60% blow: **0.78 → 0.64 → 0.52 → 0.43** while still fighting, then
**0.19 → 0.09 → 0.04** once out. Roughly three turns of grace, and it is proportionate
because the thing that hurt you is the thing that floods you.

In this game specifically, **adrenaline is what gets you to the door**. Spend it fighting
instead of leaving and you crash outside the room. That is §12's "limping home is a win"
given a mechanism.

> The dynamics (`adrenalineAfter`, `adrenalineBurn`) are written and unused — there is no
> turn loop to call them from yet.

### 4.2d Pain accumulation

The one link between "a blow landed" and "you are hurt":

```
gain  = PAIN_GAIN · (Severity/100) · (1 − Redundancy) / PainTolerance
Pain += (1 − Pain) · gain
```

It accumulates into the **remaining headroom** rather than adding, and that is what
keeps this from being a health bar under another name:

| Four 30% wounds | | | | |
|---|---|---|---|---|
| Duelist, PainTolerance 1.1 | 0.27 | 0.47 | 0.62 | 0.72 |
| Knight, PainTolerance 1.6 | 0.19 | 0.34 | 0.46 | 0.56 |
| Hydra-like, Redundancy 0.85 | 0.05 | 0.09 | 0.13 | 0.17 |
| Skeleton, `mindless` | 0.00 | 0.00 | 0.00 | 0.00 |

It approaches 1 and never arrives, so **you cannot be ground to death by grazes**. A
fight ends because a decisive blow landed, or because you got slow enough that leaving
was the only move — which is the whole shape of the design rather than a consequence of
one formula.

Order matters, as it should: one 70% then two 20% gives **0.64 → 0.70 → 0.76**, where
four 20% blows would reach far less. Being badly hurt once is worse than being lightly
hurt repeatedly.

`decisive(severity)` is a blow ending the fight outright at `DECISIVE_SEVERITY`. It needs
no exception for tough creatures, because Redundancy already caps the Vital band's
ceiling — a hydra's Vital cannot reach the threshold in the first place.

Both channels accrue **per contact**, not on a turn's summed severity: each blow meets
the headroom left by the ones before it. Summing first landed two 40% hits as 0.73 rather
than 0.59, which was enough to end most fights in a single turn.

> **OPEN.** Pain does not recover. Within a run that is probably right — wounds do not
> close in a dungeon — which makes it a run-layer question (§15) rather than a combat
> one. But nothing currently says so.

### 4.2e Structure — the other accumulation channel

**Pain governs the living; Structure governs things that do not feel it.** Same headroom
accumulation, but **not gated by `mindless`**. You do not hurt a skeleton — you take it
apart.

```
gain       = STRUCT_GAIN · (Severity/100)
Structure += (1 − Structure) · gain
harm       = max(Pain, Structure)          -- never their sum
```

`harm` is what the funnel (§4.0c) actually consumes, and taking the **worse** of the two
rather than adding them is what stops a blow that both hurts and breaks you being counted
twice. For a living thing Pain almost always dominates, so Structure rarely governs a
human — which is correct, not a wasted channel.

**Neither Toughness nor Redundancy appears in `gain`, and both omissions were measured
rather than assumed.**

- Toughness is *already in the severity* — it shapes `S_full`, which is why a knight's
  blunt bash averages 46% against bone and a duelist's point averages 10%. Reading it
  again, across the 5× spread between `{blunt 0.5}` and `{pierce 2.5}`, made one tool
  instantaneous and the other useless.
- Redundancy answers "will losing the single most important part finish it" — the Vital
  band's question. Being taken apart piece by piece is a different one.

The tool difference survives both omissions intact, because it was always in the curve.

Adrenaline masks Pain and **not** Structure — you cannot feel your way past a joint that
no longer works.

### 4.3 Protection (per piece — armor, shield, or natural)

| Stat | Range | Meaning |
|---|---|---|
| **Coverage** | 0–1 | Fraction of the body this piece protects. Directly the Guard band's width. |
| **Hardness** | ×plate | How much it resists being penetrated, anchored on materials: hardened plate 1.0, steel-faced shield 0.7, chitin 0.5, wood 0.35, quilted cloth 0.18. Unbounded above for dragon scale. |
| **Gaps** | 0–1 | How exploitable this protection's coverage is — how much a precise attacker can go *around* it rather than through it. Full plate 0.12 (an armpit, a visor slit). A shield 0.40: you can simply come round the edge. Chitin near 0. This is what stops Precision eroding all armor equally. |
| **Spread** | 0–1 | How well it distributes an impact rather than transmitting it locally. Plate ~0.8; mail ~0.3; gambeson ~0.5; chitin ~0.6. |
| **Resist**{class} | multiplier | Per damage class. Plate vs pierce is excellent; wood vs blunt is poor. |
| **Mass** | kg | Real mass. Plate ~25, large shield ~5, gambeson ~3. Feeds Encumbrance — and adds to the wearer's own body momentum, which is physically correct: an armored charge hits harder. |
| **Bulk** | 0–1 | **Articulation cost, separate from mass** — how much free movement the shape itself denies. Real plate is well articulated and scores lower than its weight suggests; a large shield scores high on one side. 1.0 means completely immobilised (pinned behind a pavise, tangled in a net). **Natural armor has Bulk 0**: chitin and a skeleton's own bone restrict nothing. |

Multiple pieces combine as a probabilistic union, not a sum:
`Coverage_total = 1 − Π(1 − Coverage_i)`.

### 4.4 Weapon

| Stat | Range | Meaning |
|---|---|---|
| **Mass** | kg | Real mass. With Strength, sets swing speed and weapon momentum. |
| **Reach** | m | Added to the wielder's Reach. |
| **Recoverability** | 0–1 | §04's inherent divertibility — how good a candidate this is for a reaction to land on. Heavy weapons low. Also lengthens Recovery (§5.9). |
| **Sharpness** | × | Scales the card's Concentration. 1.0 is a well-kept edge; a rusted sword 0.75. |

There is **no Lethality and no weaponPower**. Those three jobs are now: how hard it
hits → Mass × swing speed → Momentum; how well it defeats protection → Concentration
vs Hardness; what it does once it's in → damage class. *Sharpness is Concentration* —
a dull axe and a sharp axe have identical mass and swing speed and differ only in how
much area they concentrate that momentum into. Whetstones, rust, and weapon quality
are all one number moving.

**Sharpness lives on the weapon, not the card**, and that placement is what makes cards
shareable. The card authors what the *technique* concentrates — a thrust concentrates
more than a cut in anyone's hands with anything — and the weapon scales it:

```
Concentration_eff = clamp01(Concentration_card · Sharpness_weapon)
```

Which reproduces the values that used to be hand-authored per weapon exactly: Slash
0.60 × 1.00 = 0.60 with an arming sword, × 0.75 = 0.45 with a rusted one. The two cards
that difference used to require are now one card.

### 4.5 Card (technique)

| Stat | Range | Meaning |
|---|---|---|
| **Drive** | 0–1 | How much of the body's own motion goes into the blow. Shoulder charge 1.0; committed swing ~0.3; wrist flick ~0.02. |
| **Concentration** | 0–1 | How focused the *technique* is, before the weapon's Sharpness scales it (§4.4). Thrust 0.92; cut 0.60; mace 0.2; body slam 0.05. |
| **Effort** | × | How much of the motion is actually committed. 1.0 is the profile as written; 0.55 is a flick of the same shape, 1.45 is everything you have. §5.9. |
| **Hand** | main / off | Which hand throws it — and therefore which held item, which Sharpness, which mass, and whether the off-hand penalty applies. |
| **Direction** | −100..100 | Which side it arrives from, from the *defender's* point of view. −100 fully lateral (a flat sweep across), −50 angled in toward the core, 0 no lateral identity at all (a thrust, an overhead). Authored, not yet read — it plugs into `Coverage_total` when shield-side asymmetry lands. |
| **UsesWeapon** | bool | False for a card that ignores whatever is in the hand — a breath. Gets no Sharpness and no mass. |
| **Aim** | 0–1 | How much of the wielder's Precision actually applies *at the moment of contact*. A steered thrust is ~1.0; a wild swing ~0.5; a fired crossbow bolt ~0.15 — accurate when loosed, but committed the instant it leaves and unable to adjust. |
| **Class**{mix} | sums to 1 | `{slash 1.0}`, `{pierce 1.0}`, `{blunt 0.75, pierce 0.25}`. On the card, not the weapon — a sword cuts *or* thrusts. |
| **MoveFactor** | × | Multiplier on Pace for this card's own motion. A charge is >1. |
| **Profile** | name | Which *motion* this is, from the fixed library in `data/profiles.js`. All four phase durations are derived from it — §5.9. Never authored per card. |
| **PhaseNudge** | × | Optional per-phase multiplier for the rare card that must deviate from its profile. Used sparingly. |
| **Exertion** | number | What the motion demands. What it *costs* depends on the body — §5.9. |
| **Demands** | stat | Which stat the exertion leans on: Strength, Agility, or nothing. |
| **Direction** | −100..100 | Parked with lanes. |

There is **no Windup and no Weapon** on a card any longer. Both were hand-authored
numbers sitting on top of derived ones that already contained the answer — the same
mistake `weaponPower` was. Phase durations come from Profile × the wielder's Strength ×
the weapon's mass (§5.9); the weapon itself comes from whoever is holding the card.

That is what makes cards shareable across characters. One `Slash`, thrown by the knight
and by the skeleton:

| | τ | Windup | Total | `C_eff` | Exertion | Mean severity vs Duelist |
|---|---|---|---|---|---|---|
| Knight, arming sword | 40.9 | 53 | 143 | 0.60 | 9.4 | 37.5% |
| Skeleton, rusted sword | 73.3 | 95 | 249 | 0.45 | 12.8 | 16.9% |

Same card. The skeleton's version is 74% slower, a quarter blunter, more tiring, and
does under half the damage — entirely from Strength, mass and Sharpness.

**Effort** is the second half of that economy: it lets one profile spawn a family of
cards from a single authored number, which is what makes a large library affordable.
The knight's horizontal strike at three efforts, against the duelist:

| | Effort | Windup | Recovery | Total | `m` | Exertion | `E` | Mean severity |
|---|---|---|---|---|---|---|---|---|
| Quick cut | 0.55 | 29 | 34 | 92 | 0.76 | 5.1 | 0.258 | 28.9% |
| Slash | 1.00 | 53 | 61 | 143 | 1.25 | 9.4 | 0.349 | 37.5% |
| Full swing | 1.45 | 77 | 89 | 195 | 1.72 | 13.6 | 0.402 | 43.0% |

Monotone in every direction, and the trade reads cleanly: 2.6× the effort buys 2.3× the
momentum and 14 points of severity, paid for with 2.7× the windup, 2.6× the recovery,
2.7× the exertion, and 0.14 more evasion handed to the defender.

**Hand** decides which held item a card swings — and a shield is a held item, so a bash
carries its real 5 kg into tempo (`tau` 120 rather than the 15.6 an empty hand would
give) and pays the off-hand clumsiness penalty. The `Slash` / `Backslash` pair is one
profile at direction ∓100, not two library entries and not a flag.

### 4.6 Stability

Computed, with an override:

```
Stability = STAB_K · Mass · footprint / centreOfMassHeight
```

For anything bipedal, footprint and CoM height fall out of Size and Mass, so it never
needs authoring. Anything else overrides directly. This produces the counter-intuitive
results you want: a giant spider is nearly untippable (eight legs, wide base, low
body), while a giant of the same mass is far easier to put on the ground.

### 4.7 Flags

Deliberately few — most of what would be a flag is a stat set to zero.

| Flag | Effect |
|---|---|
| `braced` | **Converts evasion into coverage** — it raises effective Coverage toward 1, sets evasion opportunity to 0, and narrows Vital. Bracing is exactly the act of no longer trying to not-be-there and instead trying to have-armor-there, so Guard swallows the axis. Miss vanishes structurally; Graze survives, because the attacker can still land badly. This is what replaces the bespoke parry curve. |
| `airborne` | Cannot change direction mid-flight — evasion 0, Drive locked at its committed value. |
| `mindless` | No reaction draws regardless of Improvisation. |
| `undead` | Ignores morale/fear. Reserved. |

Not flags, because a stat covers them: "has no armor" (Coverage 0), "nothing worth
aiming at" (Redundancy 1), "incorporeal" (Solidity → 0), "can't be tripped"
(Stability high).

---

## 5. The mathematics

### 5.0 Symbols at a glance

| Symbol | Is | From |
|---|---|---|
| `E` | evasion opportunity, 0–1 | defender Agility × how much warning they got |
| `p` | effective precision, 0–1 | attacker Precision × Aim × modifiers |
| `m` | normalized momentum | body momentum + weapon momentum |
| `G` | engagement, 0–1 | is there matter where the blow landed |
| `B` | bite | momentum weighted by concentration |
| `P` | penetration, 0–1 | did it get through the armor |
| `L` | shock leak, 0–1 | what transmitted through armor it didn't penetrate |
| `S_full` | severity of a clean connection | bite vs toughness |
| `s_*` | band width shares, summing to 1 | §5.5 |
| `tau` | ticks per unit of motion | swing speed — every phase length is a multiple of it, §5.9 |
| `c` | commitment, −1…+1 | Bluff, Uncommitted, Committed (§04) |
| `T` | telegraph, ticks | `max(Windup, Travel)` — they run concurrently, §5.9 |

### 5.1 Load

```
Encumbrance = Σ Mass_worn / (CARRY_K · Strength · Mass_body^⅓)
Bulk_total  = 1 − Π(1 − Bulk_i)
```

Two separate costs, because they are two separate things. **Encumbrance is weight** —
it slows you down (Pace) and tires you (Stamina). **Bulk is shape** — it stops you
bending (Agility, Precision). Plate is heavy but well articulated: high Encumbrance,
moderate Bulk. A large shield is light but blocks an entire side: low Encumbrance,
high Bulk. And because Encumbrance is a ratio of real kilograms against a
Strength-derived capacity, a strong knight is genuinely less burdened by the same
armor than a weak one.

### 5.2 Effective stats

The funnel itself is §4.0c — one function, and every degradation source widens it rather
than adding another beside it. What it feeds:

```
p = (Precision_eff / (Precision_eff + K_P)) · Aim        -- K_P = 1, so an ordinary adult is 0.5
```

Hand dominance, with the off hand penalised more than the dominant hand is rewarded,
and clumsiness costing more than weakness (`HAND_PREC > HAND_STR`):

```
alignment     = DominantHand · (hand == right ? +1 : −1)
handFactor(k) = alignment ≥ 0 ? 1 + alignment·k·BONUS_SHARE
                              : 1 + alignment·k
```

**Evasion opportunity.** This is where an attack's speed becomes accuracy without any
accuracy stat existing. A defender can only use their Agility if they had time to see
it coming:

```
T      = telegraph time (attacker's Windup + Travel, lengthened by Exhaustion)
window = T / (T + K_T)
E      = (Agility_eff / (Agility_eff + K_A)) · window · braced_factor · free
free   = 1 − EVADE_OCCUPIED · occupancy   -- what the defender's OWN action costs them, §5.11
```

`braced_factor` is 0 when `braced`. A Committed attack (§04) has shorter phases, so
`T` is smaller, so `window` is smaller, so Miss and Graze narrow — the attack "lands
better" purely because the defender had less time, with no attacker accuracy term
anywhere in the model.

### 5.3 Momentum

```
v_body   = Pace_eff · MoveFactor                 -- Pace is already m/s
p_body   = (Mass_body + Mass_worn) · v_body · Drive · Effort

v_weapon = SWING_K · Strength_eff / (Mass_weapon + M0) · Effort^EFFORT_SWING
p_weapon = Mass_weapon · v_weapon

M = p_body + p_weapon
m = M / M_REF
```

Two sources, one quantity — the rapier-charge case resolved. The weapon's velocity in
the target's frame is the body's velocity plus the arm's velocity relative to the
body, so they add. A body slam is all `p_body`; a standing slash is all `p_weapon`; a
running thrust is genuinely both.

`v_weapon` saturating in weapon mass is physically right and useful: a heavier weapon
carries more momentum but is swung more slowly, with diminishing returns, until a weak
enough wielder cannot swing it usefully at all.

### 5.4 Engagement — is there anything there to hit

```
a     = A_K·(1 − Concentration)² + A_MIN         -- contact footprint
G_raw = 1 − (1 − Solidity)^a                     -- blind chance of meeting matter
G     = G_raw + (1 − G_raw) · p · AIM_AT_MATTER  -- but a skilled attacker aims AT the bone
```

Against Solidity 1.0 this is exactly 1 and vanishes from every formula below. Against
a Solidity-0.25 skeleton, illustratively:

| Blow | C | footprint | `G_raw` | with p=0.85 (duelist) | with p=0.15 (crossbow) |
|---|---|---|---|---|---|
| Rapier thrust | 0.95 | 0.07 | 2% | **52%** | 11% |
| Sword cut | 0.60 | 1.01 | 25% | **63%** | 32% |
| Mace | 0.20 | 3.89 | 68% | **84%** | 71% |

The precision recovery term is the important half. Blind, a rapier point almost always
passes between the ribs — but a duelist is not swinging blind: they are looking at a
skeleton and putting the point through the eye socket or into a vertebra. So a
high-Precision fencer stays dangerous, while a **crossbow is genuinely near-useless**:
accurate when loosed, but committed the instant the bolt leaves and unable to adjust
to what it finds. That distinction lives entirely in the card's `Aim`.

### 5.5 The five width shares

Two stages, and the ordering matters. **Stage one asks whether the blow connected at
all; stage two asks, given that it connected, where it landed.** Collapsing these
into a single residual was a real bug: with Wound as the residual of everything,
bracing a knight *widened* Wound, because the probability freed by removing Miss had
nowhere else to go.

```
STAGE 1 — did it connect?
  s_miss    = EV_MAX · E²
  s_graze   = EV_MAX · (E − E²)  +  GRAZE_BASE · (1 − p)
  connected = 1 − s_miss − s_graze

STAGE 2 — given it connected, where?
  s_vital = connected · VITAL_MAX · p^VITAL_EXP · (1 − GUARD_VITALS·braced)
  rest    = connected − s_vital

  Coverage_eff = Coverage_total · (1 − Gaps_eff · p)
  if braced:  Coverage_eff += (1 − Coverage_eff) · BRACE_GAIN

  s_guard = rest · Coverage_eff
  s_wound = rest · (1 − Coverage_eff)
```

- **Miss uses `E²`, Graze uses `E − E²`.** At low evasion almost all of it is partial
  (grazes); at high evasion it becomes clean misses. One expression, no split
  parameter.
- **Graze survives bracing.** The evasion term goes to zero but the imprecision term
  doesn't — a braced target can still be hit badly.
- **Coverage now means what it says.** What doesn't meet armor meets flesh: Guard and
  Wound split the connected mass by `Coverage_eff` and nothing else. A knight at 0.95
  coverage has a genuinely small Wound band, which is the correct answer to "what is a
  clean unarmored hit on a man in full plate?" — an armpit, a visor, the back of a
  knee.
- **Gap-finding is a property of the armor, not a global constant.** `Gaps_eff` is the
  coverage-weighted `Gaps` of the worn pieces, so Precision erodes a shield's coverage
  far more than plate's. Previously one global `GAP_FIND` let a precise attacker eat
  42% of a knight's coverage, as if plate were as exploitable as a gambeson.
- **Bracing widens Guard** rather than merely removing Miss — see §4.7.
- **Vital stays narrow by construction.** `VITAL_MAX` is small and `VITAL_EXP > 1`.
  Note `Redundancy` does not appear here; it sets the payoff and the shape, not the
  width.

### 5.5b The Vital anchor is not clamped

`heightAnchors()` used to cap the Vital anchor at 100 before the curve was built:

```js
const vital = Math.min(100, Math.max(wound, sFull · (1 + VITAL_GAIN·(1−Redundancy)·vitalSuit)));
```

That was wrong twice over, and `severityAt()` already clamps the **output**, so the cap
was pre-empting one that existed anyway.

**The surplus above 100 is not waste — it is the width of the lethal plateau.** A blow
whose raw anchor is 103 should be lethal across a sliver of the roll axis; one at 288
across a third of it. Discarding the overshoot collapsed every overwhelming blow into
"reaches 100 at `x = 100` and nowhere else", which made `P(severity = 100)` **exactly
zero for every curve in the game**. Measured, before:

```
roll 99        severity 89.813729
roll 99.999    severity 99.994110
roll 100       severity 100.000000
```

**And it inverted technique.** Once two anchors both clamp to 100 the only thing left
separating them is Vital *width*, which comes from `Aim` — so a flicked `quickCut`
(Aim 0.85) killed more often than a committed `fullSwing` (Aim 0.70):

| Knight → naked duelist | Vital anchor | Vital width | P(≥85) | P(=100) |
|---|---|---|---|---|
| `fullSwing`, **before** | 100 *clamped* | 1.87 | 1.3% | **0.0%** |
| `quickCut`, **before** | 100 *clamped* | **2.90** | **1.5%** | **0.0%** |
| `fullSwing`, after | **170** | 1.87 | **2.3%** | **1.9%** |
| `quickCut`, after | **113** | 2.90 | 1.9% | 1.3% |

The committed swing now kills more than the flick, and the overshoot does the
distinguishing instead of being thrown away. Nothing else changes: the skeleton still
cannot be stabbed (thrust → skeleton, anchor 17, 0% lethal) and plate still works
(thrust → plate, 5.2% lethal).

> **The Wound band has the same defect one layer down, and is NOT fixed here.** `S_full`
> is a saturating ratio `X/(X+T)` that asymptotes to 100 and never arrives, so an
> *ordinary solid connection* can never be lethal however hard it is thrown — a
> broadsword through an unarmoured person cannot kill without finding a vital. A
> proposed fix (`S_full = 100·X / (LETHAL_RATIO·T)`, capped at output) is written up in
> `severity-ceiling.md` §5.2 and deliberately **not applied**: it makes `S_full` the only
> non-saturating term in the model, and in simulation it turned nearly half of unarmoured
> mirror fights into first-turn mutual kills. That measurement is itself suspect, because
> the fight loop has **no reactions** — see §10 — so it wants revisiting once §07 exists.

### 5.6 The five height anchors

Each band starts where the previous ended, so the entire y-axis is five numbers.

```
B      = m · (KAPPA + Concentration)              -- bite
T_eff  = TOUGH_K · Σ_class mix_c · Toughness_c    -- the body's own resistance to THIS blow
S_full = 100 · (B·G) / (B·G + T_eff)              -- a clean connection with the body
```

Toughness being a per-class table is what lets bone shatter under a mace and shrug off
a rapier without any armor being involved.

**Guard** — what gets past protection, as penetration plus shock:

```
R = HARD_K · Hardness · Σ_class mix_c · Resist_c
P = (m · Concentration · PEN_K) / (m · Concentration · PEN_K + R)
L = SHOCK_K · m · (1 − Spread) / (1 + m)

S_guard = S_full · (P + (1 − P)·L)
```

`L` is the design's load-bearing "mass punches through regardless" idea, finally
derived rather than added as a flat bonus. It is why blocking a much heavier
attacker's weapon does not save you from the body behind it, and why plate (high
Spread) beats mail (low Spread) against a mace at similar Hardness.

`P` is deliberately a single number in `[0,1]`. **If a dedicated armor-penetration
system arrives later, it replaces this one expression and nothing else changes** —
that is the seam.

**The rest:**

```
S_graze = GRAZE_FRAC · S_full
S_wound = S_full
S_vital = min(100, S_full · (1 + VITAL_GAIN · (1 − Redundancy) · classSuit(classMix, defender)))
```

`classSuit` is why a pierce to the throat is worse than a blunt to the throat, and a
blunt to a skull worse than a pierce.

**Anchors, in order:**

```
Miss end   = 0
Graze end  = max(S_graze, S_guard · GRAZE_JOIN)    -- rises to meet Guard
Guard end  = S_guard · (1 + GUARD_RISE)            -- modest internal rise only
Wound end  = max(S_wound, Guard end · (1+ε))       -- monotonicity guard
Vital end  = S_vital                                -- at x = 100, the ceiling
```

**The band shapes now emerge instead of being authored.** This is what the brief kept
failing at:

- **Graze climbs off zero** toward Guard's opening, because its end anchor is pinned
  to Guard's start. (Brief item 9.)
- **Guard is nearly flat** — start and end differ only by `GUARD_RISE` — because
  armor's response genuinely doesn't vary much within "the armor caught it," but isn't
  dead flat either, since shock differs by spot. (Brief items 2, 3.)
- **Wound climbs hard across its span**, because it spans from "only just past the
  guard" to a full clean connection. A large gap by construction. (Brief item 4.)
- **Vital is narrow and high.** (Brief items 5, 6.)

Four of the brief's expectations fall out of one rule: *each band starts where the
last one ended.*

### 5.7 Band shape — and why there is no spline

The rule above fixes the *inter-band* relationships but leaves each band as a single
monotone segment between two anchors, which can only do one thing. That isn't enough:
Wound should **jump the moment it clears the guard and then plateau** across most of
its width, and Vital should reach its ceiling well before a roll of exactly 100.

So each band carries two more numbers — both semantic constants of what the band
*means*, never per-character values:

| Band | Rise | At | Drift from | Reads as |
|---|---|---|---|---|
| Graze | 1.00 | front | — | a steady climb off zero |
| Guard | 0.35 | **back** | Spread | flat the whole way, then lifts into Wound |
| Wound | 0.35 | front | Redundancy | jumps past the guard, then a tilted plateau |
| Vital | 0.50 | front | Redundancy | climbs to the ceiling and keeps easing up |

**The curve is defined by its derivative, not by its own points.** Read that table
again and every band says exactly two things: a *phase change* of a certain size,
happening over a certain stretch at one end of the band, and a *drift* spread across
the whole of it. Each of those is one smooth, non-negative bump in the derivative —
so instead of drawing `y` and then trying to make it look continuous, we write down
`y′` and integrate.

For a band spanning `[x_a, x_b]`, with `w = x_b − x_a` and `d = y_b − y_a`:

```
span   = rise · w                               -- how long the phase change takes
sigma  = max(SOFTNESS, span / 4)                -- a rise happens over ~±2 sigma
centre = at == "front" ? x_a + span/2 : x_b − span/2

phase change   area (1 − drift)·d   at centre            sigma
drift          area      drift ·d   at (x_a + x_b)/2     max(SOFTNESS, w/4)
```

and the curve is the sum of those bumps' integrals, mapped affinely onto the axis:

```
raw(x) = Σ area_j · Φ((x − centre_j) / sigma_j)          -- Φ = normal CDF
y(x)   = (raw(x) − raw(x₁)) · y_vital / (raw(100) − raw(x₁))     for x > x₁
       = 0                                                       otherwise
```

where `x₁` is the Miss/Graze boundary. Everything the previous polygon-and-fillet
version had to arrange falls out of this instead:

- **Smooth everywhere,** because there are no corners to round. No fillet, no radius,
  no cap on the radius — that whole mechanism is gone.
- **Monotone,** because every bump has non-negative area, so `y′ ≥ 0` by construction.
  Nothing needs limiting, checking or repairing.
- **No dead-straight plateaus.** The drift is a wide, gentle S rather than a straight
  tilt, so even a calm stretch of the curve has curvature in it.
- **The bands join themselves.** The next bump's tail reaches back across the
  boundary, so a band lifts slightly as it approaches the next one. That is §5.6's
  continuity arriving on its own rather than being imposed.
- **Both ends pinned exactly.** A total miss is 0 and a roll of 100 is the Vital
  anchor, by construction rather than by clamping afterwards.
- **No sample table.** The curve is a closed-form expression of six or seven terms.
  It has no resolution to get wrong, costs about what interpolating a table cost, and
  ports as arithmetic. Mean severity has a closed form too — `∫Φ` is elementary — so
  the dial that governs fight length is exact, not estimated.

**The anchors are targets, not points the curve passes through.** They set the areas
of the bumps, so the curve arrives at each one's height *around* it rather than *at*
it. That was already true of the fillet version; it is worth restating because the
plot draws the anchors hollow for exactly this reason.

**`SOFTNESS` is the one honest tradeoff here.** Where a band is roomy, `span/4`
governs and the shape constants are fully in charge; the floor only binds on a band
too narrow to hold its own rise — a Vital band 1.6 rolls wide, say, climbing 46
points. There the floor decides whether a vital hit is a *step* or a very steep
*climb*, and it moves outcomes, not just appearance: at 1.0 rolls the six reference
matchups shift their mean severity by −0.9%, +0.6%, −0.4%, +4.8%, +7.5% and −0.7%;
at 2.5 the largest reaches +31%. The ones that move are precisely the ones with a wall
in them. Previously the fillet cap answered this question by accident.

`SOFT_GAIN` is the open follow-up, and ships at 0. It lengthens the runway in
proportion to the *size* of a rise, not just its width — the wider the gap between
what the armor stops and what the flesh takes, the wider the band of rolls where you
are partly through it. It is the dial for the one shape the smoothing does not fix:
a matchup like Skeleton → Knight, where Guard is genuinely flat across 71 rolls
because `GUARD_RISE × S_guard` is a quarter of a point, and then Vital is a wall.
That flatness is a *data* property, not a rendering one; either this dial or a Guard
rise measured against the gap up to Wound is the answer, and that is a design call
rather than a maths one.

*Why not just ease each segment.* An earlier version eased every band to zero slope
at its own two ends, which is C² and looks wrong: the curve flattens at every anchor,
so it reads as rise-flatten-rise-flatten. Building the derivative avoids this without
having to think about it — nothing forces `y′` to zero anywhere, because no bump is
obliged to end where a band does.

**No plateau is dead flat.** A band's change splits in two: most of it in the fast
phase, and a `drift` remainder spread across the whole band. So Wound jumps to about
93% of its end value and then climbs slowly the rest of the way, rather than every
roll across two-thirds of the band returning an identical number. Both terms increase
with `t`, so the band stays monotone.

**Drift is derived from the defender, not a global constant.** Each has an honest
driver, and they don't move together:

```
drift_guard = 0.10 · (1 − Spread)          -- armor that distributes an impact
                                              varies less from spot to spot
drift_wound = 0.12 · (1 − Redundancy)      -- a differentiated body varies more
                                              within an ordinary wound; a slime
                                              is the same everywhere
drift_vital = 0.05 + 0.45 · Redundancy     -- spare vitals spread the outcomes:
                                              most of the band is a replaceable
                                              one, only the top is the heart
```

Redundancy driving Wound and Vital in *opposite* directions is the point, and it
replaces an earlier hack that scaled Vital's rise fraction and flipped its direction.
One stat, one mechanism, and the three-headed dragon reads correctly: its Vital band
climbs gradually across its width — a head, a head, then the heart — while a human's
jumps to the ceiling immediately because none of its vitals are replaceable.

Guard's drift also delivers the brief's own item 3 — "armor start and armor end don't
need to be exactly the same, blows still carry shock, and the shock's impact differs
between spots" — with no special case: under plate (Spread 0.80) Guard drifts up ~2%
across its flat stretch, under a wooden shield (Spread 0.35) ~6.5%.

**Guard's back-loading against Wound's front-loading produces the steep step at that
boundary** — the brief's original "flat through armor, then jump" — while both band
interiors stay calm. There is no transition mechanism and no `TRANSITION_WIDTH`: the
monotone cubic spline is gone entirely, and so is the polygon that replaced it. Two
bumps per band, integrated, is both simpler and strictly more expressive than either.

**Redundancy also flattens the front of Vital.** A creature that can lose its most
important part keeps fighting, so its Vital band opens only a little above Wound —
that's the spare head — and spikes only at the very top of the roll, where the
irreplaceable thing finally gets hit. A human, with redundancy 0, jumps immediately.
This is what the three-headed dragon needs and what a scalar payoff could not express.

### 5.8 Secondary consequences

Stagger, trip and lost footing are checked alongside the Severity roll, never as a
second roll — momentum actually transferred, against Stability:

```
transferred = m · (P + (1 − P)·(1 − Spread))
topple      = transferred / (transferred + Stability_norm)
```

Additional *secondary bands* marked on the same roll axis (a riposte window, a
disarm) remain available as an alternative or a supplement; nothing here forecloses
them. If "what actually got through" needs a name across enough systems, **Impulse**
is the physically correct word — impulse *is* momentum transferred. Held in reserve.

### 5.9 Phase timing — tempo, profiles, exertion

The organising idea is that **every phase length is a multiple of one quantity**, and
that quantity is the swing speed the momentum term already uses:

```
v_weapon = SWING_K · Strength_eff / (Mass_weapon + M0)      -- §5.3, unchanged
tau      = TEMPO_K / v_weapon                                -- ticks per unit of motion
```

This is the load-bearing decision. A heavy weapon in a weak hand is slow *and* hard
hitting because those are one physical fact read twice — so a card cannot author a
long windup without also earning the momentum that justifies it, and nothing has to
be balanced against anything. It is the same move that replaced `weaponPower`: delete
the hand-authored number that sat on top of a derived one already containing the
answer.

**Profiles.** A card names a *motion* from a fixed library (`data/profiles.js`) —
"horizontal weapon strike", "jumping overhead weapon strike". One entry serves an axe,
a sword and a chair leg, because the mass term does the differentiating. Each phase
declares a weight and a driver:

| Driver | Length | For |
|---|---|---|
| `swing` | `w · tau` | Almost everything. Scales with arm and steel. |
| `fixed` | `w` ticks | Motion the body doesn't power. Airtime is gravity's business; a jump hangs as long for a knight as a duelist. Catching your breath likewise. |
| `pace` | `distance / (Pace_eff · MoveFactor)` | Travel only. |

A card may nudge individual phases (`phaseNudge`) but never redefine the shape — that
is what keeps one tuning pass over the library moving every card at once.

**The four phases, and what drives each:**

```
Windup     = w · tau · (1 − COMMIT_WINDUP · c)
Travel     = distance / (Pace_eff · MoveFactor)
Execution  = w · tau                                    -- unmodified, deliberately
Recovery   = w · tau · (1 + COMMIT_RECOVER · c)
                     · (1 + RECOV_K · (1 − Recoverability))
ready      = max(Windup, Travel)                        -- §06: they run concurrently
telegraph  = ready                                      -- what §5.2 reads as T
```

`c` is commitment: −1 Bluff, 0 Uncommitted, +1 Committed. It pulls windup and recovery
in **opposite** directions — throwing yourself into a blow gets it started sooner and
leaves more to unwind; holding back is slower to arrive and cheap to abandon. That is
the entire tempo cost of commitment, and it is *why* a Committed attack lands better:
shorter telegraph → smaller `window` → narrower Miss and Graze, with no accuracy term
anywhere. Measured on the knight's overhead against the duelist:

| Commitment | Windup | Recovery | Telegraph | `E` |
|---|---|---|---|---|
| Bluff | 113 | 64 | 113 | 0.451 |
| Uncommitted | 90 | 98 | 90 | 0.423 |
| Committed | 68 | 133 | 68 | 0.384 |

Windup running concurrently with Travel is what satisfies the design requirement that
closing is *always* possible within one action. A duelist's lunge across a 14 m hall
diagonal takes 248 ticks of travel and arrives ready — total 366 ticks — but hands the
defender a 248-tick telegraph. You always get there; everyone always saw you coming.
No range gate, no special case.

**Exhaustion needs no term of its own.** It is already inside `Strength_eff` (so `tau`
lengthens) and `Pace_eff` (so travel lengthens). Every phase stretches, as §08 of the
design notes requires, without being told to.

**What is deliberately absent.** Agility, Precision and Reflexes drive *nothing* here.
Agility owns evasion, Precision owns placement, Reflexes owns reaction latency. The
moment one stat shortens a windup *and* widens a Miss, no tuning pass can converge.

**Lodging.** Recovery gets its final length after the roll — an axe buried in a
ribcage takes longer to free:

```
Recovery_final = Recovery · (1 + LODGE_K · P · Concentration · (1 − Recoverability))
```

This is the one place a phase length is resolved late, and it expresses the invariant
the whole turn structure rests on: **exertion is committed at lock-in; time is
discovered at resolution.** That asymmetry is why turn length is emergent rather than
budgeted.

**Exertion.** A card authors what the *motion* demands; what it costs depends on the
body attempting it, so one number covers every character:

```
cost   = Exertion · (1 + EXERT_GAIN · (1/stat_eff − 1))     -- stat named by `demands`
budget = STAMINA_K · Stamina · (1 − Exhaustion)
```

A chandelier is cheap for a strong back and ruinous for a weak one, with no
per-character table. Stamina 1.5 lands on a budget of 37.5, matching the illustrative
figure in §08. Players fill the budget with cards; **time is not a second currency**,
because a card that costs no exertion is already priced by what the opponent does
during it.

Calibration as it stands, which is the shape §06 asks for:

| | tau | W | E | R | Total | Cost | Fits budget | Turn |
|---|---|---|---|---|---|---|---|---|
| Knight, Cut | 40.9 | 53 | 29 | 61 | 143 | 9.4 | 4 | 573 ticks |
| Knight, Overhead | 40.9 | 90 | 33 | 98 | 221 | 13.6 | 2 | 442 ticks |
| Duelist, Thrust | 57.7 | 40 | 23 | 42 | 105 | 6.3 | 4 | 420 ticks |
| Duelist, Lunge | 57.7 | 58 | 35 | 83 | 175 | 9.4 | 3 | 526 ticks |
| Skeleton, Cut | 73.3 | 95 | 51 | 103 | 249 | 12.8 | 2 (overspending) | 498 ticks |

Two big swings or four small ones, landing on turns of roughly 4–5 seconds. `TEMPO_K`
alone shifts every duration in the game; the exertion column alone shifts how many
cards fit.

### 5.10 Reaction windows

Event-driven and commitment-gated, per §07. A window is a **salience** score against a
**threshold**, not a per-exchange dice roll:

```
S         = per-trigger salience, below
threshold = IMPROV_K / Improvisation_eff
margin    = S − threshold                       -- ≤ 0 means it went unnoticed
draws     = min(DRAW_MAX, 1 + ⌊margin / DRAW_STEP⌋)
latency   = REACT_BASE / Reflexes_eff  +  COMMIT_DELAY · max(0,c) · (1 − Recoverability) · tau
```

**Improvisation sets the threshold** — whether the opening is noticed at all, and how
much is made of it. **Reflexes sets the latency** — how fast you can be on it. One stat,
one job, again. The second latency term is conversion: an action already in motion takes
real time to become a different one, and only Committed pays it. A window whose latency
exceeds the time until the triggering event closes is *missed* — you saw it and were too
committed to act. That is a legible outcome, not a failure of the model.

| Trigger | Salience |
|---|---|
| Opponent enters Recovery | `SAL_RECOVERY · (1 − Recoverability) · Recovery/tau` |
| Attack about to land | `SAL_INCOMING · S̄/100` (expected severity) |
| Windup coming due | `SAL_WINDUP · Windup_remaining/tau` |
| Opponent breaking off | `SAL_FLEE` |

Recovery is scaled highest on purpose: baiting a heavy commitment and punishing the
unwind is the exchange the whole system exists to produce, so the unwind has to be the
loudest event on the timeline. Scaling it in `tau` means a slow fighter's recovery is
genuinely more inviting than a fast one's.

An **empty sequence** multiplies all salience by `REACTIVE_GAIN`. Having nothing left
to execute is not standing there powerlessly — it is watching instead of acting, and
everything reads louder.

### 5.11 Occupancy — what your own action costs your defence

You do not sidestep at the apex of your own swing. The naive way to say that is a
defence number per phase, which is four authored values per profile and the
`weaponPower` mistake in a new costume. Nothing here is authored.

**It is two defences, not one, and they fail for different reasons.** Evasion needs your
**feet and mass** free; guarding needs an **arm** free. A knight mid-overhead has his feet
planted and cannot slip anything — but his shield arm is untouched, so his Coverage is
exactly as good as ever. A duelist mid-lunge has committed both. That asymmetry is the
real difference between fighting with a shield and without one.

**Evasion** is scaled by occupancy, whose magnitude comes from two existing card fields:

```
magnitude   = clamp01((OCCUPY_MOTION + OCCUPY_BODY·Drive) · Effort · (1 + OCCUPY_COMMIT·c))
occupancy(t)= magnitude · shape(t)
evasion_eff = evasion · (1 − EVADE_OCCUPIED · occupancy)
```

Drive alone was not enough. An overhead is Drive 0.35 because little of the body
*travels* — yet a man mid-overhead is thoroughly committed, because the rotation is what
roots him, and that is Effort. Both terms are needed and both already exist.

`shape(t)` is how much of that commitment has actually happened:

| Phase | Shape | Why |
|---|---|---|
| Windup | rises as `f^OCCUPY_RISE` from `OCCUPY_FLOOR` | A swing you have only begun can still be abandoned. The floor is the mind having committed before the body has — reaction lag, not a second punishment, since the commitment *level* already prices the decision. |
| Execution | flat 1.0 | At the apex there is no defending, whatever you are holding. |
| Recovery | decays toward the floor at `p = OCCUPY_DECAY·Recoverability + 0.5` | A rapier sheds commitment fast; an axe carries it through most of the unwind. |

| Card | 10% into windup | Apex | Mid-recovery |
|---|---|---|---|
| Quick cut | 0.05 | 0.35 | 0.15 |
| Slash | 0.08 | 0.64 | 0.27 |
| Full swing | 0.12 | 0.92 | 0.40 |
| Full swing, Committed | 0.13 | **1.00** | 0.43 |
| Lunge, Committed | 0.13 | **1.00** | 0.33 |
| Take a breath | 0.45 | 0.45 | — |

The lunge sheds faster than the full swing mid-recovery (0.33 against 0.40) purely
because a rapier's Recoverability is 0.80 and an arming sword's is 0.50. And *Take a
breath* comes out 45% occupied throughout, with no rule written for it — which is
exactly the exposure that prices a card costing no exertion.

Caught at the apex of their own full swing, the duelist's defence collapses:

| Duelist defending against a Knight's Slash | Free | At apex (occ 0.92) |
|---|---|---|
| `E` | 0.349 | **0.076** |
| Miss width | 6.7 | **0.3** |
| Graze width | 21.7 | 13.1 |
| Mean severity | 37.5% | **42.9%** |

**Guard** is the other limiter and needs no curve at all: if the card's `hand` is the
hand holding the shield, that shield's Coverage drops out for the card's duration. So a
shield *bash* spends the shield to throw it and is undefended on that side while it
happens — emergent, with no rule authored. A two-handed weapon would want `hand: "both"`
and lose it entirely.

This is also the honest answer to "why does catching someone mid-windup land better?" It
is a consequence of what *they* are doing, never a bonus bolted onto the attacker for
being early.

### 5.12 Carry — what one card leaves the next

A card leaves each hand somewhere, and the next card is scaled by how far that is from
where it needs to start. This is what makes combos **emergent** rather than authored,
which §09 of the design notes requires: no card ever names another, it only knows where
the body already is.

**Direction is an arc, not a side.** A card carries `from` and `to` on a 3×3 grid in the
attacker's own frame. A rising diagonal and a descending one are the same mirror on y
that `Slash` and `Backslash` are on x, so putting the vertical on the profile would have
forced a near-duplicate profile for every up/down pair. Three things then derive rather
than being authored beside it: the **carry state** (the arc's `to`), the **landing side**
(§02's direction, mirrored out of the arc, so offensive and defensive can never
disagree), and **gravity** (the sign of the vertical travel).

```
blade   = |handPos − arc.from| / corner-to-corner
footing = CARRY_FOOTING · Drive_previous
carry   = CARRY_MIN + (CARRY_MAX − CARRY_MIN) · min(1, blade + footing)
Windup ·= carry
```

Carry is a relationship *between* cards, so the opening card of a sequence is neutral at
1.00 — it has not earned a discount, and the whole calibration is anchored on an
uncarried card.

| Sequence | Carry | Windup |
|---|---|---|
| Thrust → Thrust → Thrust | 1.00 → 0.74 → 0.74 | 40 → 30 → 30 |
| Slash → Backslash → Slash | 1.00 → 0.75 → 0.75 | 53 → 40 → 40 |
| Overhead → Overhead | 1.00 → **1.20** | 90 → **108** |

The grid centre is the hub, because carry cost is distance. So a thrust
(`MID_CENTRE`→`MID_CENTRE`, zero carry either way) is the most chainable action in the
game — which is exactly why fencers thrust, and it is emergent rather than authored.


**Landing side is the leading edge, not the midpoint.** A shield does not intercept
where the blade is deepest — it intercepts where the blade *arrives*, and a sweep
arrives on the side it entered from:

```
landingSide = −(0.75·from.x + 0.25·to.x)
```

Your right hand is opposite their left shoulder, hence the flip. On the midpoint,
`Slash` and `Backslash` both came out at 0 — the mirror pair did nothing at all to a
shield, which undercut the whole reason for arcs. Now `Slash` arrives at −50 (their
left, into a right-hander's shield at factor 0.81) and `Backslash` at +50 (their right,
past it at 0.44). Thrusts and overheads stay correctly neutral. A `crossSlash` sends one
arc down each side, which is exactly why a buckler cannot meet both.

**The blade does not always finish its arc**, and where it actually stops is what the
next card carries from:

```
Miss / whiff   1.0                                        -- nothing stopped it
Graze          FOLLOW_GRAZE
Guard          −REBOUND + (FOLLOW_BODY + FOLLOW_PEN + REBOUND)·P
Wound / Vital  FOLLOW_BODY + FOLLOW_PEN·P − (P · C · (1 − Recoverability))
handPos        = lerp(from, to, followThrough)
```

Below zero is a **rebound**, not an error: hard steel throws your hands back past where
they began. And the lodge term is the same one that already lengthens recovery, doing a
second honest job — a blade that stuck stops where it stuck.

The consequence worth having: **blocking breaks combos.** `Slash → Backslash` flows only
because the Slash ends where the Backslash starts, so a Slash that rings off plate never
gets there:

| Knight's Slash → Backslash | Slash ends | Backslash carry |
|---|---|---|
| into a duelist's gambeson (Wound 52%) | `~MID_LEFT`, near-full sweep | **0.82** — chain holds |
| into a knight's plate (Guard 9%) | `~MID_RIGHT`, **rebounded** | **1.17** — chain broken, worse than uncarried |

Nobody wrote that down. It is also the first real mechanical reason not to swing into a
raised shield, which the model previously lacked.

`FOLLOW_BODY` is 0.80 rather than 0.60 deliberately: flesh does *not* stop a blade — a
cut that halts in a body is a failed cut, and only lodging really arrests one. At 0.60,
landing a blow broke your own combo almost as badly as being blocked did, so the free
chain existed only when you *missed*, which inverts the incentive. **Armour is what stops
a blade.**

**Hands overlap rather than discount.** A card using a *different* hand may begin while
the previous one is still unwinding; the same hand must wait for that unwind to finish.
One rule, and it makes two-weapon fighting mechanically distinct with nothing written for
it. Measured: the knight's Slash starts at 0 and runs 149 ticks; his Shield bash begins
at **82**, the instant the Slash enters recovery; his second Slash waits until 149,
because it needs the hand back.

**Interrupt is the topple check, not a severity threshold.**

```
transferred = m · (P + (1−P)(1−Spread))              -- §5.8, unchanged
topple      = transferred / (transferred + TOPPLE_K · Stability)
interrupted = roll ≥ 100 · (1 − topple)
```

Checked against the **same roll** as severity, never a second one. Because the axis is
ordered by placement quality, "the top `topple` fraction" already self-selects for
well-placed blows with no extra gate. `TOPPLE_K` exists because without it an ordinary
adult toppled to a rapier thrust ~14% of the time — and since topple shares the roll,
that meant nearly every Vital hit also interrupted, which trivialises sequences. At 3.0 a
full shield bash is ~17% and a thrust ~5%: interrupt is for heavy blows, which is the
whole point of using Stability rather than damage.

Stability itself is derived — `STAB_K · Mass · footprint / comHeight`, with footprint and
CoM height falling out of Size for anything bipedal and overridable for anything else.
Knight 1.63, duelist 1.01, skeleton 0.50. Worn mass counts: armour is ballast.

**Positional coverage.** A shield is on one side of you, so `protection()` scales each
piece's coverage by how well its side matches the arc's landing side before aggregating.
Body armour has no side. This unparks §5.5's shield-side asymmetry, and it is what makes
a multi-arc card resolvable: a buckler cannot meet a horizontal cut from both directions
at once, and that falls out of geometry rather than needing the shield to be *spent* on
one of them.

**Each arc is its own contact.** A dual-wield cross slash resolves as two rolls, because
two blades arriving are two things that could kill you, not one averaged one. Nothing
prices such a card by hand: both hands must travel to high corners (large carry in), no
arm is left free and Drive is high (no guard, no evasion), and it finishes with both
hands in low corners — the worst carry in the game. This is structurally the same problem
as the parked swarm case, and wants solving once for both.

**Turn length, measured at last.** Sequences built by filling the exertion budget run
2.97–4.24 s across the presets, against the 3–5 s the design asks for. And a fighter
whose sequence has ended has occupancy zero — genuinely harder to hit while idle, which
is a real counterweight to under-queueing that nobody had to author.

---

**Disrupt** (§07) stays separate and is now expressible: a hit landing before the
opponent's `ready` has elapsed catches them mid-Windup, and cancels that card if it did
real damage (`DISRUPT_SEVERITY`). It cancels the CARD, not the sequence -- cancelling
the rest of a sequence is *interrupt*, a different and wider thing. No card is spent; it is a
property of the timeline, not a choice.

---

## 6. The three fighters

Illustrative values, to show the shape of a sheet.

### Duelist — rapier, light gambeson

```
Mass 68 kg  Size 1.78 m  Pace 4.2 m/s  Agility 1.7  Strength 0.9  DominantHand +0.8
Toughness{blunt 1.0, pierce 1.0, slash 0.95}   Solidity 1.0   Redundancy 0.0
Precision 1.8  Reflexes 1.6  Improvisation 1.5  Stamina 1.2
Composure 1.4  PainTolerance 1.1
Gambeson: Coverage 0.25  Hardness 0.18  Spread 0.5  Mass 3 kg  Bulk 0.05  Gaps 0.50
Rapier:   Mass 1.1  Reach 1.1  Recoverability 0.8  Sharpness 1.02
  Thrust  Drive 0.18  C 0.92  Aim 1.00  {pierce 1.0}  MID_CENTRE→MID_CENTRE
  Lunge   Drive 0.45  C 0.92  Aim 0.85  {pierce 1.0}  MoveFactor 1.4  Effort 1.15
```

### Knight — arming sword, large shield, full plate

```
Mass 85 kg  Size 1.80 m  Pace 3.6 m/s  Agility 0.7  Strength 1.4  DominantHand +0.9
Toughness{blunt 1.1, pierce 1.0, slash 1.05}   Solidity 1.0   Redundancy 0.0
Precision 1.1  Reflexes 1.0  Improvisation 0.85  Stamina 1.5
Composure 1.3  PainTolerance 1.6
Plate:  Coverage 0.92  Hardness 1.00  Spread 0.80  Mass 25 kg  Bulk 0.20  Gaps 0.12
        Resist{pierce 2.5, slash 2.2, blunt 1.1}
Shield: Coverage 0.35  Hardness 0.70  Spread 0.55  Mass 5 kg   Bulk 0.25  Gaps 0.40
Sword:  Mass 1.3  Reach 0.9  Recoverability 0.5  Sharpness 1.00
  Slash        Drive 0.25  C 0.60  Aim 0.80  {slash 1.0}   MID_RIGHT→MID_LEFT
  Backslash    Drive 0.25  C 0.60  Aim 0.80  {slash 1.0}   MID_LEFT→MID_RIGHT
  Quick cut    Drive 0.25  C 0.60  Aim 0.85  {slash 1.0}   Effort 0.55
  Full swing   Drive 0.25  C 0.60  Aim 0.70  {slash 1.0}   Effort 1.45
  Overhead     Drive 0.35  C 0.60  Aim 0.75  {slash 1.0}   HIGH_CENTRE→LOW_CENTRE
  Thrust       Drive 0.18  C 0.92  Aim 1.00  {pierce 1.0}
  Shield bash  Drive 0.60  C 0.10  Aim 0.60  {blunt 1.0}   off hand, swings the shield
```

Coverage = 1 − (1−0.92)(1−0.35) = **0.95**. Bulk_total = 1 − (0.80)(0.75) = **0.40**.
Real full plate leaves the armpit, the visor and the palms — not a third of the body.
33 kg of worn mass against a Strength-80 body gives real Encumbrance — but noticeably
less than the same armor on the duelist would.

### Skeleton — rusted sword, wooden shield

```
Mass 35 kg  Size 1.75 m  Pace 3.3 m/s  Agility 0.9  Strength 0.75  DominantHand +0.5
Toughness{blunt 0.5, pierce 2.5, slash 1.3}    Solidity 0.25   Redundancy 0.45
Precision 0.65  Reflexes 0.7  Improvisation 0.2
flags: mindless, undead -- immune to Dread and Pain both; only structural
conditions touch it, which is why a mace is the answer and a rapier is not
Wood shield: Coverage 0.25  Hardness 0.35  Spread 0.35  Mass 4 kg  Bulk 0.15  Gaps 0.45
             Resist{blunt 0.7, slash 1.1, pierce 1.2}
Rusted sword: Mass 1.2  Reach 0.9  Recoverability 0.6  Sharpness 0.75
  Shares the SAME Slash / Backslash / Thrust / Overhead cards the knight throws.
  A card names no weapon (§4.5) — the rust is one number, and it blunts every
  card the holder owns at once: Slash's C 0.60 arrives as 0.45.
```

Low Mass gives it poor momentum; `Toughness{blunt 0.5, pierce 2.5}` is where the
skeleton fantasy lives; `Solidity 0.25` is what punishes fine points — but only
against attackers who cannot aim.

---

## 7. Calibration constants

The entire tuning surface, in one table. Everything else is derived.

| Constant | Illustrative | Governs |
|---|---|---|
| `K_A` | **1.0** | Agility → evasion. 1.0 by definition: an ordinary adult sits at 0.5 |
| `K_P` | **1.0** | Precision → placement. Same anchor, same reason |
| `K_T` | 40 | How quickly telegraph time saturates into usable warning |
| `EV_MAX` | 0.55 | Ceiling on the combined Miss+Graze share |
| `GRAZE_BASE` | 0.15 | Graze from attacker imprecision alone (survives bracing) |
| `VITAL_MAX` | 0.16 | Ceiling on the Vital band's width |
| `VITAL_EXP` | 1.6 | How steeply Precision must climb to open Vital |
| `GUARD_VITALS` | 0.6 | How much bracing narrows Vital |
| `BRACE_GAIN` | 0.70 | How far bracing closes the remaining gap in Coverage |
| `RISE_GUARD/WOUND/VITAL` | 0.35, 0.35, 0.50 | Band rise fractions (§5.7) |
| `drift_*` | derived | Per-band plateau tilt, from Spread and Redundancy (§5.7) |
| `SOFTNESS` | 1.0 rolls | Floor under a rise's runway. Only binds on bands too narrow to hold their own rise, where it decides whether a vital hit is a step or a steep climb. Moves outcomes, not only appearance — useful range roughly 0.5–1.5 (§5.7) |
| `SOFT_GAIN` | 0 | Extra runway in proportion to the size of a rise. Ships off; the dial for a flat-plateau-then-wall matchup (§5.7) |
| `CARRY_K` | 12.0 | Strength and body mass → carry capacity |
| `ENC_PACE`, `ENC_AGI` | 0.6, 0.4 | What carried weight costs |
| `BULK_PREC` | 0.5 | What restricted articulation costs Precision |
| `SWING_K`, `M0` | 36, 0.8 | Strength and weapon mass → swing speed (m/s) |
| `M_REF` | 88 | Momentum of a reference standing sword cut by an ordinary adult |
| `KAPPA` | 0.25 | Floor on Bite, so zero-concentration blows still do something |
| `A_K`, `A_MIN` | 6.0, 0.05 | Concentration → contact footprint |
| `AIM_AT_MATTER` | 0.6 | How much Precision recovers against low Solidity |
| `TOUGH_K` | 1.0 | Toughness → resistance scale |
| `HARD_K` | 42 | Hardness → resistance scale |
| `PEN_K` | 20 | Penetration aggressiveness |
| `SHOCK_K` | 0.35 | Momentum transmitted through unpenetrated armor |
| `GRAZE_FRAC` | 0.10 | Graze severity as a fraction of a clean connection |
| `GRAZE_JOIN` | 0.9 | How close Graze's end sits to Guard's start |
| `GUARD_RISE` | 0.10 | Guard's internal rise |
| `VITAL_GAIN` | 1.8 | Vital payoff multiplier at Redundancy 0 |
| `HAND_PREC`, `HAND_STR` | 0.12, 0.05 | Off-hand clumsiness and weakness |
| `BONUS_SHARE` | 0.4 | Dominant-hand bonus as a fraction of the off-hand penalty |
| `EFFORT_SWING` | 0.5 | Exponent on blade speed from a card's Effort (sub-linear) |
| `TEMPO_K` | 1000 | Swing speed → `tau`. **One knob for the pace of the entire game** |
| `COMMIT_WINDUP` | 0.25 | How much committing shortens the windup |
| `COMMIT_RECOVER` | 0.35 | How much committing lengthens the recovery |
| `RECOV_K` | 1.0 | Weapon Recoverability → recovery length. 0 doubles the unwind |
| `LODGE_K` | 0.6 | Extra recovery from a blow that buried itself |
| `STAMINA_K` | 25 | Stamina → per-turn exertion budget. 1.5 → 37.5 |
| `EXERT_GAIN` | 0.5 | How much a card's cost swings with the stat it demands |
| `IMPROV_K` | 0.55 | Salience an ordinary Improvisation must clear for a window |
| `DRAW_STEP` | 0.35 | Salience above threshold per extra reaction card |
| `DRAW_MAX` | 4 | Ceiling on reaction cards from one window |
| `REACT_BASE` | 22 | Reaction latency in ticks at Reflexes 1.0 |
| `COMMIT_DELAY` | 0.8 | Converting an in-motion action into a different one |
| `SAL_RECOVERY` | 1.1 | Salience of an opponent's unwind — highest on purpose |
| `SAL_INCOMING` | 1.6 | × expected severity of an incoming blow |
| `SAL_WINDUP` | 0.8 | × tempo units of windup still to come |
| `SAL_FLEE` | 1.2 | Salience of an opponent breaking off |
| `REACTIVE_GAIN` | 1.5 | Salience multiplier for a combatant with nothing queued |
| `REACH_K` | 0.40 | Size → body reach. 1.78 m of person is 0.71 m of arm |
| `EXEC_RAMP` | 0.25 | Fraction of an Execution window spent rising, and falling. The middle is a plateau |
| `DISRUPT_SEVERITY` | 25 | Severity needed to cancel an opponent's unfinished card |
| `MELEE_GAP` | 1.0 m | Standing gap between engaged combatants. Not zero — bodies have breadth |
| `EVADE_OCCUPIED` | 0.85 | How much of evasion full occupancy takes away |
| `OCCUPY_MOTION` | 0.45 | Occupancy from the motion itself, × Effort |
| `OCCUPY_BODY` | 0.75 | Occupancy from thrown mass, × Drive |
| `OCCUPY_FLOOR` | 0.12 | Floor at the start of a windup — the mind commits before the body |
| `OCCUPY_RISE` | 2.0 | Windup rises as f^this. Quadratic, so early windup is nearly free |
| `OCCUPY_DECAY` | 2.0 | Recovery decay rate, × Recoverability |
| `OCCUPY_COMMIT` | 0.5 | Bluff 0.5×, Uncommitted 1.0×, Committed 1.5× |
| `CARRY_MIN`, `CARRY_MAX` | 0.70, 1.30 | Windup multiplier from a perfect and a worst-case carry |
| `CARRY_FOOTING` | 0.35 | How much the previous card's Drive costs the next one's setup |
| `SIDE_MIN` | 0.25 | What a side-mounted piece is worth on the wrong side |
| `FOLLOW_GRAZE` | 0.88 | Arc completed after a graze |
| `FOLLOW_BODY` | 0.80 | Arc completed in flesh at zero penetration |
| `FOLLOW_PEN` | 0.35 | How much punching through restores the sweep |
| `REBOUND` | 0.20 | How far past its start a fully-stopped blade is thrown |
| `ADREN_MASK` | 0.80 | How much of Pain a full flood hides |
| `ADREN_SHAKE` | 0.30 | What it costs Precision — fine motor control goes first |
| `ADREN_SPIKE` | 1.30 | × severity taken, as a fraction |
| `ADREN_FEAR` | 0.35 | × Dread — fight-or-flight is one response |
| `ADREN_FADE_FIGHT` | 0.18 | Per-turn fade, still in it |
| `ADREN_FADE_REST` | 0.55 | Per-turn fade once out — where the bill arrives |
| `ADREN_BURN` | 0.10 | Exhaustion added per turn at full flood |
| `STAB_K` | 0.026 | Mass and shape → Stability. Anchored so an ordinary adult is 1.0 |
| `STAB_FOOT`, `STAB_COM` | 0.30, 0.55 | Footprint and CoM height as fractions of Size, for bipeds |
| `TOPPLE_K` | 3.0 | How much Stability resists being put down |
| `PAIN_GAIN` | 1.0 | Severity → Pain, into the remaining headroom |
| `DECISIVE_SEVERITY` | 85 | Severity at which a blow simply ends the fight |
| `STRUCT_GAIN` | 0.70 | Severity → Structure, the channel `mindless` cannot escape |
| `OVERSPEND_GAIN` | 0.35 | Exhaustion from going over budget, × how far over |
| `UNDERSPEND_RELIEF`, `UNDERSPEND_CAP` | 0.20, 0.35 | Banking an underspend, and its ceiling |
| `PAIN_OUT` | 0.90 | Harm past which there is no fighting on |

---

## 8. Where this lives in the code

The organising principle is a hard line between code that ports to Unity and code
that doesn't.

```
src/model/      pure functions over plain data. No DOM, no globals, no rendering.
                This is what becomes C#.
  constants.js    §7, in one place
  stats.js        §5.1–5.2  load, effective stats, placement, evasion
  attack.js       §5.3–5.4  momentum, bite, engagement
  defense.js      §5.6      protection aggregation, penetration, shock leak
  curve.js        §5.5–5.7  widths, anchors, shape, rise events, evaluation
  timing.js       §5.9–5.11 tempo, phases, exertion, reaction windows, occupancy
  exchange.js     the exchange loop: two sequences on a shared clock -- carry,
                  hand concurrency, reach, disrupt, interrupt
  resolve.js      composeCurve() / rollOn() / resolveHit()

src/sim/        the fight loop. Ports to C# eventually, but it is the INSTRUMENT
                rather than the game: there is no draw and no reactions, so cards
                come from a script or a crude appetite and every blow lands.
  fight.js        turns, between-turn conditions, end conditions, batches

src/data/       content, no logic. ScriptableObjects later.
  gear.js  cards.js  fighters.js
  profiles.js     the fixed motion library read by §5.9
  arcs.js         the 3x3 guard grid read by §5.12

src/ui/         scaffolding. Ports to nothing.
  workbench.js  workbench.css  exchange.js  exchange.css

workbench.html  the curve explorer
exchange.html   the head-to-head: two locked cards on one timeline
index.html      LEGACY — the old prototype, still on the superseded model
script.js       LEGACY — untouched; contains the old hand-authored curves,
                weaponPower, buildParryCurve, the monotone spline, and a
                Windup/Travel/Execution/Recovery simulation that is being
                left behind rather than ported (timing gets its own pass).
```

ES modules need to be served over HTTP — run `serve.ps1` and open
`http://localhost:8080/workbench.html`. Opening the file directly will not work.

Stances, energy, reactions and status each land as one more file in `model/` or a
new `sim/` without disturbing what's there.

## 9. Parked and open

- **Reactions and contested closing.** `exchange.js` now runs two full sequences on a
  shared clock, with carry, hand concurrency, disrupt and interrupt. Two things still
  extend it: reactions, for which the state classification is already the right hook but
  which need the loop to pause, hand out draws and resume; and per-tick movement, since
  distance is fixed for the whole exchange, so a pursuer closing on a retreating target
  cannot yet fail to arrive.
- **Multi-arc resolution and swarms are the same problem.** A dual-wield cross slash
  resolves as one contact per arc, which is right — but a swarm is the same shape at a
  different scale, and whatever generalises should serve both. `crossSlash` is authored
  and unused; nothing is statted to hold two weapons yet.
- **Momentum carry.** A blade still travelling the way the next card wants to go should
  carry some speed into it — a moulinet, a double cut. That is a damage carry rather than
  a tempo one, feeding `v_weapon` rather than the windup, and it is the last of the
  between-card ideas still unbuilt. (Contact carry landed: §5.12's follow-through.)
- **A jump adds no momentum.** `jumpingOverhead` declares 45 ticks of fixed airtime and
  gets nothing for it, because the body term is `Mass · Pace_eff · MoveFactor · Drive`
  and Pace is *horizontal ground speed* — a fall has no representation anywhere. So a
  jumping overhead is currently slower, costlier and no harder-hitting than a standing
  one: strictly worse, which is why no card uses that profile yet. Half of the fix is
  already expressible (a jump commits more of the body, so `Drive` goes up); the missing
  half is the fall itself. ~0.22 s of falling is ~2.2 m/s, comparable to the knight's
  encumbered Pace of 2.4, so it roughly doubles the body term. Wanted shape: a profile
  that declares airtime also yields a fall velocity, and `v_body` takes the greater of
  pace-driven and fall-driven. One term, and it serves `jumpingOverhead`, `charge`, and
  any leaping monster.
- **Composure and Intimidation** (design notes §11) are designed but unmodelled. Both
  are ×human ratios; Dread is their 0–1 live state, built exactly the way Exhaustion is.
  It multiplies card exertion cost rather than shrinking the budget, because the effect
  is selective (attacks dearer, flight cheaper). The `mindless` flag is the immunity
  hook and already exists.
- **Body-powered tempo borrows the blade formula.** `tau` comes from `v_weapon`, which
  is about swinging a mass through an arc — but a shove, a charge or a headbutt is
  driven by the body, not the arm. A shield bash works now only because the shield is
  a held item with real mass; an *empty*-handed body check would come out at `tau` 15.6
  and be the fastest thing in the game. Body-driven profiles probably want tempo from
  Mass and Pace instead. Not urgent, but it is a real hole.
- **Armor penetration** is a single term (`P`, §5.6) precisely so a dedicated system
  can replace it later without disturbing anything else.
- **Stances** (§05) are not modelled — everything assumes a neutral attacking posture.
  Each stance will be a (guard emphasis, evasion effort) pair; `braced` already
  demonstrates the mechanism. **Posture** is the card-level counterpart.
- **Lanes and Direction** are parked. Shield-side asymmetry plugs into
  `Coverage_total` when they return.
- **Reactions are the last inert system.** `reactionWindow` is written and correct and
  nothing calls it, because a reaction draws cards AT the window and there is no draw.
  The fight loop (`src/sim/fight.js`) now calls everything else. Their absence is also
  the single biggest distortion in every measurement in §10 — with no dodging, no
  reactive stance and no flexibility, every attack lands unopposed.
- **Named conditions** (design notes §10). Pain and Structure exist as scalars; the
  *located* conditions do not. Three kinds — pain-mediated (PainTolerance, `mindless`),
  structural (Toughness{class}) and physiological (needs blood and organs) — which is why
  a skeleton is immune to two of the three. Conditions must degrade STATS, never the
  curve. Which condition a blow inflicts derives from its damage class and where it
  landed, not from a per-card list. `Stability` and §5.7's topple check are the hooks for
  the structural ones, and Tripped/Staggered probably fold in.
- **Pain and Dread poison the draw**, which needs a draw. Nothing above lock-in in §03
  exists — no deck, no hand, no stances. That is the other half of the turn.
- **`S_full` cannot reach its own ceiling.** `severity-ceiling.md` §5.2, diagnosed and
  deliberately not applied — see §5.5b for why it is deferred rather than rejected.
- **`meanSeverity()` integrates the curve analytically without the output clamp**, so it
  reads high once an anchor exceeds 100 (up to ~5 points). `greedyChooser` in the fight
  loop ranks cards by it, so it is load-bearing in the sim. Sample it instead.
- **The Vital band ignores Coverage entirely.** Vital *width* has no `coverageEff` term
  and its height is built from pre-armour `S_full`, so full plate makes you
  *fractionally more* likely to be vitaled (width 2.07 against 1.87 naked) at an
  identical ceiling. Only `braced` defends it. "A vital hit is by definition one that
  found a gap" is a defensible reading, and `gaps` is the obvious hook — but it is wired
  only into `effectiveCoverage()` and never touches Vital.
- **Exhaustion's exact curve** — how much overspend produces how much Exhaustion — is
  an energy-economy question, not a combat-math one.
- **A swarm as a single combatant** — a rat swarm, a cloud of bats. The defensive half
  is already expressible (Solidity low, Redundancy ~0.95, Coverage 0, tiny Mass). What
  the model lacks is the offensive half: a swarm's attack isn't one blow resolved by
  one roll, it's many small ones, and that wants either a different resolution or a
  card that represents the aggregate. Wanted, not designed.
- **Projectiles break the momentum term.** A crossbow bolt is ~0.08 kg at ~55 m/s —
  trivial momentum, yielding an absurd `S_full` of about 8% against a human. The fault
  is real: penetration for a projectile is governed by energy and sectional density,
  not by `p = mv`, which badly underrates anything light and fast. Melee is unaffected
  because hand weapons cluster in a narrow mass–velocity range. Ranged weapons need
  their own treatment of §5.3 before they can be statted. The `Aim` half of the
  crossbow example (§4.5, §5.4) is unaffected and stands.

---

## 10. What the fight loop found

`src/sim/fight.js` runs turns until somebody is out of it. Its first batch said something
the model had asserted for months and never demonstrated — and then said something the
model had got wrong.

### A duelist could not beat a skeleton at all

Best possible severity with a rapier against bone was **43.9%**, `DECISIVE_SEVERITY` is
85, and the skeleton is `mindless` so it accumulated no Pain either. There was **no win
condition of any kind**. Over 120 fights: duelist 0, skeleton 120.

Half of that is exactly the fantasy §2 was written for — *"your sword is not meaningfully
piercing its hide — run away"* — arrived at from the bottom rather than asserted. But a
base skeleton being *literally* unwinnable is wrong; that should be reserved for far
scarier things.

### The missing piece was the second accumulation channel

Design notes §10 always said conditions come in three kinds and that a skeleton is immune
to two. Only the **pain-mediated** one existed, so a skeleton had nowhere to accumulate
anything. **Structure** (§4.2e) is the other: the same headroom accumulation, not gated
by `mindless`. You do not hurt a skeleton — you take it apart.

Two things it must NOT do, both of which were tried and measured:

- **Do not divide by Toughness.** Toughness is already in the severity — it shapes
  `S_full`, which is why a knight's blunt bash averages 46% against bone and a duelist's
  point averages 10%. Reading it twice, across a 5× spread between `{blunt 0.5}` and
  `{pierce 2.5}`, made one tool instant (knight winning in a *median of 1 turn*) and the
  other useless.
- **Do not damp by Redundancy.** Redundancy answers "will losing the single most
  important part finish it", which is the Vital band's question. Being taken apart piece
  by piece is a different one, and damping it here left dismantling anything redundant
  impossible rather than merely slow.

What is left is simply how much the blow actually did — and the tool difference survives
intact, because it was always in the curve.

### The measurements below have no reactions in them

Everything in this section was run through `src/sim/fight.js`, where **every attack lands
unopposed**. There is no dodging, no reactive stance, no flexibility — nothing that makes
a blow simply *not* connect. Section 07 is the system that extends fights, and none of it
exists yet.

So every number here is **shorter and more lethal than the game will be**, and any
conclusion of the form "this kills too fast" is measuring the absence of reactions rather
than the damage model. The rows below are useful for *relative* comparisons — which tool
beats which target, whether a matchup is winnable at all — and should not be read as
fight length.

The sharpest example: applying `severity-ceiling.md` §5.2 turns **97 of 200** unarmoured
mirror fights into first-turn mutual kills. That looks alarming and may simply be what an
exchange with no defence in it looks like. It is the main reason that change is deferred.

### Where it landed

200 fights per row, greedy appetite on both sides, no fleeing, **no reactions**:

| | Result | Median | Ended by |
|---|---|---|---|
| Duelist vs Skeleton | **64 – 88** (48 unresolved) | 10 turns, 99 s | 2 decisive |
| Knight vs Skeleton | **199 – 0** | 3 turns, 16 s | 10 decisive |
| Knight vs Duelist | **190 – 9** | 2 turns, 10 s | 37 decisive |
| Duelist mirror | 121 – 73, 5 mutual | 1 turn, 5 s | 49 decisive |
| Knight mirror | 74 – 80 (46 unresolved) | 7 turns, 39 s | 83 decisive |

The skeleton now reads as the board game intends: **hard, and beaten by the right tool.**
A knight with blunt takes it apart in three turns; a duelist with a point needs ten and
wins about a third of the time. Winnable, unpleasant, and a clear argument for leaving.

### What the table still says is wrong

- **Knight vs Duelist, 190–9 in two turns.** Full plate against a gambeson is a real and
  large advantage, but not that large. This is an armour and severity question rather
  than an accumulation one — the knight simply out-damages the duelist about 2.3 to 1 —
  so it is a separate pass.
- **Duelist mirror ending in a single turn.** Two unarmoured people with points kill each
  other almost immediately. Plausibly correct, and still worth looking at.
- **Knight mirror, 46 unresolved.** Two things that cannot reliably put each other down
  grind to the cap — the mirror of the skeleton problem, and another argument for
  fleeing.

### And the biggest hole is still fleeing

The correct play for that duelist is to leave. There is no flee card, nothing chooses to
disengage, and so every unwinnable or unfavourable matchup reads as a loss rather than a
decision — which is the exact opposite of what §12 wants.
