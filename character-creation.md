# Character creation: the stat wheel

**Status: settled in shape, unsettled in numbers.** The wheel, the four notches and the
curve families are agreed. Every constant below is a placeholder until a fight has been
run end to end — the combat maths is written against these numbers, not the reverse, so
nothing here is anchored to an external scale.

Supersedes the stat list in `design.md` §Stats → Character, and the 0–100 skill scale in
§Making the force → Scales.

---

## 1. Overview

A character is made on two screens.

1. **Frame.** Height and mass, plus appearance. These are givens, not wheel stats: height
   sets region heights and reach, mass sets movement force and shove resistance. They also
   feed *effective* values later (§7).
2. **Notches.** Place four notches on a wheel of sixteen stats. Each notch raises the stat
   it sits on and spreads across its neighbours by its own curve. Category totals are a
   readout of where the notches sit, not an input.

A third **nudge** screen was designed and then scrapped — the notches turned out to be
expressive enough on their own, and per-stat fine-tuning undid the coherence the wheel
exists to create.

Traits live in the hub at the centre and are chosen separately (§8).

---

## 2. The wheel

Sixteen stats, four per category, in a fixed clockwise order. The categories follow the
body: **Muscle**, then **Sinew** (which turns force into controlled movement), then
**Brain**, then **Nerve** (which links brain back to muscle). Nerve also carries its
everyday meaning of courage.

| # | Stat | Category | What it does | Link to next |
|---|---|---|---|---|
| 1 | Strength | Muscle | Force, disruption, handling heavy weapons | Strong enough to push through pain |
| 2 | Pain tolerance | Muscle | Keep going through pain | Both keep you going through a fight |
| 3 | Stamina | Muscle | Resist exhaustion in a fight | One fight, then the whole day |
| 4 | Endurance | Muscle | Resist fatigue across a whole day | Going deeper into the dungeon |
| 5 | Pace | Sinew | Crossing ground | Moving well, at speed and up close |
| 6 | Footwork | Sinew | Moving, dodging, adjusting mid-commitment | Dodging needs fast reactions |
| 7 | Reaction speed | Sinew | How fast you react to incoming things | Timing the strike |
| 8 | Precision | Sinew | Finding gaps, slits, tendons | Finding the gap means reading the opponent |
| 9 | Analysis | Brain | Reading the opponent | Read, then react |
| 10 | Improvisation | Brain | Options when reacting (cards drawn) | Reactive and proactive option-making |
| 11 | Imagination | Brain | Options generated (cards drawn) | Options feed the plan |
| 12 | Strategy | Brain | Deck shaping at creation, planning before embarking | Make the plan, then commit |
| 13 | Decisiveness | Nerve | How tightly the hand concentrates on the chosen stance | Trusting your gut to commit |
| 14 | Instinct | Nerve | Noticing wide: traps, flanks, second enemies | Sensing danger, then keeping your head |
| 15 | Composure | Nerve | Handling fear and dire situations | The unflinching are frightening |
| 16 | Intimidation | Nerve | Whether things flee from you | Frightening because you could hurt them (wraps to Strength) |

**Changes from the first stat list:** balance is cut (it overlapped mass and footwork),
awareness is renamed **instinct** and moved from Brain to Nerve, luck moves off the wheel
into the hub, and celerity is folded away.

### The order has two surfaces

**Adjacency** is the local one, and the "link to next" column validates all sixteen links.

**Opposition** is the global one, and it is the more consequential: a notch fades to
nothing across the wheel, so what sits opposite your primary is what you give up. The
eight pairs are:

| | |
|---|---|
| Strength ↔ Analysis | the trained body against the clever scholar |
| Pain tolerance ↔ Improvisation | |
| Stamina ↔ Imagination | |
| Endurance ↔ Strategy | |
| Pace ↔ Decisiveness | |
| Footwork ↔ Instinct | the nimble duelist who gets flanked |
| Reaction speed ↔ Composure | fast hands against a steady head |
| Precision ↔ Intimidation | surgical and unfrightening |

This puts **Muscle opposite Brain** and **Sinew opposite Nerve**. Muscle↔Brain is the
archetype worth protecting and it decides the arrangement; Sinew↔Nerve falls out of it.
Reordering the ring to oppose Sinew and Brain instead was considered and rejected — it
would have cost the anatomical loop for a weaker set of oppositions.

Note that opposition is not a prohibition. Wanting two opposed regions is a legitimate
build: put the primary on one and the secondary on the other, and the stats *between* them
become the weak ones instead (§6).

---

## 3. The notches

Four notches. Each sits on one stat and spreads to its neighbours. They differ in width
**and in curve family**, because a wide notch and a narrow notch do different jobs.

| Notch | Width | Reach `h` | Curve | Role |
|---|---|---|---|---|
| Primary | 13 | 6 | bell | Core focus — raises a region |
| Secondary | 9 | 4 | bell | Regional strength |
| Tertiary | 5 | 2 | spike | A sharp signature |
| Quaternary | 3 | 1 | spike | A second signature, or extra focus |

### Curves

**Bells** are Gaussian, `exp(−d² / 2σ²)`, truncated at `h`. The real width is σ, derived
as `σ = (h + 1) / BELL_K`; `h` only truncates the far tail. This is the important knob:
reach stays the same while the outer stats lose their share.

**Spikes** are convex, `(1 − |d| / (h + 1))^p`. They concentrate the budget on the centre.

With `BELL_K = 3.5`, `p = 2.5` (tertiary) and `p = 3` (quaternary), all peaking at 5:

| Notch | Profile from the centre outwards | Total | Centre holds |
|---|---|---|---|
| Primary | 5.00 4.41 3.03 1.62 0.68 0.22 0.06 | 25.0 | 20% |
| Secondary | 5.00 3.91 1.88 0.55 0.10 | 17.9 | 28% |
| Tertiary | 5.00 1.81 0.32 | 9.3 | 54% |
| Quaternary | 5.00 0.63 | 6.3 | 80% |

Grand total **58.4**.

### Equal peak

Every notch peaks at the same height, so **width alone decides total influence** and the
primary always carries the most (43% of the budget). `peak` is a per-notch field so the
heights can be graduated later, but see §6 — it measured as a weak lever.

Two consequences of capping the peak, both deliberate:

- **A spike costs points to buy concentration.** At a fixed peak, a convex spike is
  strictly worse than a triangle of the same width: same height, fewer points. The
  quaternary holds 80% of itself on its centre stat where a triangle would hold 50%, and
  pays 6.3 points against the triangle's 10. That is the trade, and it is the right way
  round for a signature.
- **The ceiling is 20** — all four notches stacked on one stat.

### Rejected scalings

- **Equal total** (every notch worth the same, so narrow ones spike higher): makes the
  quaternary out-peak the primary, which inverts the hierarchy the primary exists to set.
- **Equal budget per width** (`UNIT × (h+1)`, shapes free to redistribute): same problem
  in milder form — the tertiary peaked at 8.09 against the primary's 5.00. Kept behind the
  `SCALING` constant for comparison.

---

## 4. Scale

**There is no 0–100 mapping and no "best human" anchor.** The notch sums *are* the stat
values, and the combat maths will be written against them. This replaces the 0–100 skill
scale in `design.md`, which had the same defect attempt 1 recorded about its own: no
defined average, no ceiling, and no way to answer "is a giant 150 or 300".

A consequence worth remembering: **the numbers are only meaningful relative to each
other.** A character's 8.91 means something next to their own 0.77 and next to a troll
built the same way. It means nothing on its own, and `UNIT` can be rescaled freely.

### What 0 and 20 mean (20 Oct)

- **0 is bad, but not useless.** You struggle with everything at 0, but nothing is closed
  to you. Imagination 0 draws something like three random cards and three stance cards, so
  building a good sequence is hard, especially when some of them don't apply. Strength 0
  means you need a very good, precise hit to accomplish much of anything. Instinct 0 means
  every trap ambushes you and you never spot anything hidden.
- **0 is also the default the maths is written against.** Every mechanic is authored for a
  0 character, so 0 means ×1, and anything above is a bonus on top (strength might give
  ×1.2 at 5 and ×2 at 20). Below zero is a penalty. This is for ease of thinking: the
  numbers on a card describe the default person, and stats only ever adjust them.
- **Average is somewhere around 5.** Roughly where the shoulders of a bell notch land. So
  an ordinary adventurer already gets a small bonus over the default.
- **20 is ridiculous.** The ceiling, reachable only by stacking every notch, means
  near-absolute mastery of that one thing: imagination drawing something like twenty cards
  instead of ten, precision that always lands where it's aimed, endurance that never tires.
- **Stats can go negative.** Injuries, traits, exhaustion and the like push values below
  zero.

This is the framing the combat maths gets written against. With the wheel's total of 58.4
over sixteen stats (3.65 each on average), a typical character is below average at most
things and good at a few, which suits the game.

---

## 5. How a build reads

The mechanic has two independent controls, and no point budget for the player to manage.

- **The arc between notch 1 and notch 2 is a specialist-to-generalist dial.** Adjacent,
  and the two bells stack into one deep region. Opposite, and they cover the whole wheel —
  a deliberate generalist, with the stats at right angles to both becoming the weak ones.
- **Notches 3 and 4 are signatures** laid on top, and they are normally the character's
  single highest stats.

> Placing the primary and secondary opposite each other and then complaining the character
> came out general is the main way to misread the wheel. That *is* the generalist control.

### Worked example: Aelfric

**Frame:** 1.74 m, 68 kg, lean and narrow.
**Notches:** primary **Footwork**, secondary **Instinct**, tertiary **Precision**,
quaternary **Composure**.
**Soul:** faithful — which is where his luck comes from.

Chosen by searching all 65 536 placements against a target profile, then judging the
shortlist by eye. The best correlation (primary Precision, secondary Pace) was rejected:
it matched the broad middle but put Footwork on top and Precision sixth, and a character
reads by its peaks and its floor rather than its middle.

The binding constraint is that **composure and endurance both need a narrow notch and
there is only one spare**, because precision claims the other. Composure wins; he is a
meditating monk before he is a walker.

| | | | | |
|---|---|---|---|---|
| Composure | 8.9 | | Intimidation | 2.6 |
| Precision | 8.0 | | Strategy | 1.9 |
| Reaction speed | 6.2 | | Stamina | 1.6 |
| Instinct | 5.6 | | Improvisation | 1.1 |
| Footwork | 5.3 | | Strength | 0.8 |
| Pace | 4.4 | | Pain tolerance | 0.8 |
| Decisiveness | 3.9 | | Imagination | 0.8 |
| Analysis | 3.4 | | | |
| Endurance | 3.0 | | | |

Categories: Muscle 6.2, **Sinew 24.0**, Brain 7.2, **Nerve 21.0**. Spread 11.6×, with 77%
of him in his top two categories.

All four of the board game's numbers survive the translation:

| Board game | Wheel |
|---|---|
| Styrka 4 — weak | Strength 0.8, at the floor |
| Vighet 7 — agile | Sinew 24.0, his largest category |
| Kroppspoäng 15 — fragile | Pain tolerance 0.8, at the floor |
| Tur 8 — lucky | the soul hub, via *faithful* |

One consequence to be aware of rather than fix: **imagination 0.8 and improvisation 1.1
put him among the lowest card-draws in the game**, at the start of combat and at reaction
windows alike. That is a coherent reading — a narrow drilled repertoire executed
perfectly, answering with training rather than invention — but it means he is played as a
man with few options and the precision to make them land, which is a real choice about
how he feels at the table.

---

## 6. Measured properties

Everything here was computed against the prototype, not estimated.

- **The total is placement-invariant.** 58.4 wherever the four notches go, because each
  notch's contributions sum to its own budget and the widest covers 13 of 16, so nothing
  wraps onto itself. Placement redistributes; it never adds or removes.
- **Only the shape constants change the total.** Spike `p` trades points away: p=1 gives
  84.4 (a spike with exponent 1 *is* a triangle), p=2.5 gives 75.5 at the old bell width,
  p=4 gives 72.5. These are tuning constants, not player choices.
- **`BELL_K` is the strong lever.** On a Sinew-primary, Nerve-secondary build, the share
  of points landing in the top two categories goes 63% → 72% → 77% → 83% as K goes
  2.3 → 3.0 → 3.5 → 4.2. (K = 2.3 reproduces the raised-cosine bell this replaced, which
  leaked badly at the shoulders and made every build a generalist.)
- **Graduated peaks are a weak lever.** 6.5 / 6 / 5.5 / 5 moves the primary-plus-secondary
  share only from 73.4% to 76.7%, and does not make the primary's centre the top stat.
- **Signature notches double-dip near the primary.** A tertiary is worth 10.0 at the
  primary's centre, 6.6 at distance 3, and 5.0 on the far side — a 2× swing from position
  alone. This quietly pulls signatures toward the primary and works against split builds.
  Unresolved; see §9.
- **The quaternary is only 11% of the budget** (6.3 of 58.4). That makes it cheap in power
  and expensive in identity, which is the right shape for something unlocked during a run
  or bartered against a trait (§8).

---

## 7. Set values against effective values

The wheel produces a character's **set** values. What combat reads is the **effective**
value, which other systems feed:

- **Exhaustion** and **pain** scale stats down (`design.md` §Exhaustion and fatigue).
- **Frame** feeds some upward: mass and height into intimidation, mass into movement force
  and shove resistance, height into reach and region heights.
- **Gear** likewise — full plate is intimidating whoever is inside it.

### Other creatures: size tiers (21 Oct)

Stats on the wheel are **strong or weak for that creature's kind**, on the same 0–20
scale: an average troll has strength about 5, a strong one 12. What makes a troll stronger
than a human in absolute terms is its **size tier** (medium, large, huge, colossal), an
authored table that gives each tier a baseline muscle and a base action cost. Muscle grows
with cross-section and weight with volume, so bigger creatures are far stronger but slower
relative to their own weight. A **build factor** on the frame covers physiques built for
hitting (troll arms). No creature should need an absurd stat to make the maths work. See
`design.md` §Making the force, §Strength, mass and size.

Intimidation is the clearest case and settles an open question: it stays a pure wheel stat,
but *effective* intimidation is that stat plus frame plus gear. A small character can
still build presence; they simply pay more for it than a large one does. This also resolves
the one profile the wheel cannot express on its own — high composure beside low
intimidation, which are adjacent by design ("the unflinching are frightening"). Aelfric's
68 kg is what breaks the tie.

---

## 8. The soul hub

The centre of the wheel is the soul: what the character believes in, as against what they
are made of. It holds traits rather than notch-driven stats.

- Traits such as **faithful** / **faithless**, chosen separately from the notches.
- **Luck** lives here, tied to religion and divine favour rather than being a wheel stat —
  which also ties it to chapels, already a location in the board game. This supersedes
  luck's description as a candidate stat in `design.md` §Luck.
- Candidates, undecided: **willpower** (refusing to give up over time), **drive**, **will
  to live**, and anything else that is about belief rather than body or skill.
- Possible future shape: the soul becomes a **fifth sector of the wheel** rather than a
  hub, with its own notch behaviour. Open.

---

## 9. Open questions

- [ ] **Celerity (hand speed) was dropped and nothing replaced it.** `design.md` still
      depends on it in five places — windup length, aim error, what exhaustion costs, what
      a numbed limb costs, and the "precision decides where it lands, celerity decides
      time" split. Either reaction speed absorbs it, weapon weight against strength
      carries it, or it comes back onto the wheel. This is the one gap that blocks wiring
      stats into combat.
- [ ] Peak values and the constants generally — all placeholders until a fight runs.
- [ ] Should a wheel stat be allowed to fall to effectively zero? At `BELL_K` 3.5 the
      weakest stat is 0.32 and at 4.2 it is 0.07, which is *no* imagination rather than
      little. K = 3.0 leaves 0.78, a floor rather than a void.
- [ ] The clustering incentive from the signature double-dip (§6) — leave it as a real
      positional trade-off, or even it out?
- [ ] Is the quaternary unlocked during a run, or traded away for traits, luck or another
      auxiliary system?
- [ ] Does a deliberate generalist feel like a real option, or just a worse specialist?
- [ ] Stacking limits: is stacking every notch on one stat allowed, capped or blocked?
      Currently allowed, ceiling 20.
- [ ] Willpower: does it earn a place, and does it live in Nerve or the hub?
- [ ] Brain versus Cortex as the category name. Cortex is the better tissue-consistency
      argument; Brain keeps the plain-English register with muscle, sinew and nerve.
      Currently Brain.
- [ ] Category sizes may drift from four each as stats are added or cut, and more stats
      are likely.
- [ ] Alternative naming families, kept as fallbacks: classical elements (Earth / Water /
      Air / Fire, which maps cleanly onto the ring order and could serve as flavour),
      metals (Iron / Quicksilver), abstract nouns (Body / Finesse / Mind / Spirit),
      adjectives (Strong / Swift / Clever / Bold), structural (Might / Poise / Insight /
      Resolve). Rejected: classic RPG terms (clash with stat names, and charisma misses
      the fourth category) and the four humours (temperament only, missing most physical
      stats — though their 2×2 of qualities inspired the wheel).

---

## 10. Prototype

`stat-wheel.html` at the repo root — one self-contained page, no server needed (there is
no node or python on this machine; `attempt1/serve.ps1` exists for the multi-file ones).

Sliders place the four notches; `BELL_K` and spike `p` are exposed as sliders; a linear-fade
checkbox restores the original triangle for comparison; the quaternary can be switched off.
Readouts cover each notch's profile and centre share, category totals, the best/worst
spread and ratio, and **top 2 cats** — the share of the character landing in its two
strongest categories, which is the direct measure of specialist against generalist.

Presets: Aelfric, focused, spread, split.

All tunable constants sit at the top of the script — the stat list, the notch table with
per-notch `h`, `kind`, `p` and `peak`, `UNIT`, `SPIKE_REF`, `BELL_K` and `SCALING` — so the
design can be retuned without touching the drawing code.
