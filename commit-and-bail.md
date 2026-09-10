# Commit & Bail — combat system & run structure

Design notes for the game as a whole. This is the ruleset, not the build — nothing
here touches Unity implementation.

Two markers appear where things aren't settled:

- **OPEN** — a real fork nobody has chosen between yet.
- **PROPOSED** — a suggestion on the table that hasn't been confirmed.

Everything else is treated as decided, but this doc tracks the *shape* of decisions,
not exact numbers. Anything that looks like a specific value is illustrative.

For the damage-resolution mathematics referenced throughout §09, see
`combat-model.md`, which supersedes the numbers sketched here.

---

## 01 Vision & scope

- A Unity adaptation of Drakborgen (published in English as DungeonQuest) — the board
  game's dice-and-nerve dungeon crawl, reworked as a card-resolved combat system —
  combined with Blue Prince-style room drafting as the player explores.
- Structured as a roguelike run with permanent upgrades carried between runs; closer
  to Rogue Legacy than a reset-everything roguelite.
- The run's objective is reaching the treasure chamber, against a run-level "midnight"
  clock.
- Scope for now: strictly one player-controlled character against one enemy at a time.

> **PROPOSED / aspirational.** Deep lore and puzzles layered over the exploration, in
> the spirit of Blue Prince. Intent only — undesigned.

> **OPEN.** Multiple simultaneous enemies are wanted eventually, but deliberately out
> of scope until 1-on-1 combat is solid (see §16).

> **OPEN.** Multiple player-controlled heroes in a single fight hasn't been considered
> either way yet.

## 02 Spatial model

Position between the two combatants is a single continuous value, **Distance**, not a
grid or a set of discrete ranges. It's sticky — it never drifts back toward neutral on
its own — and moves only when a card explicitly says it does, for either side. Melee
range is the low end of that scale: the zone within which an ordinary attack applies
without penalty.

- Closing or opening distance is always an explicit card, never assumed or automatic.
- A fight is confined to the room it's happening in (set upstream by the drafting
  layer). If a combatant leaves through a door and isn't being pursued, the fight is
  over, not paused.
- A card's **direction** — which side of the defender it arrives on, not a lane — is
  *derived* from the card's own arc (§06), not authored beside it, and it is the arc's
  **leading edge**: a shield meets a blow where it arrives, not where it is deepest.
  A straight thrust or an overhead cleave has no lateral identity at all and stays
  neutral against anything that cares which side it came from. Because a shield sits on
  one side of you, a blow down your shield side is better met than one down your weapon
  side.

Distance is in **real metres**, on the same scale as Pace (m/s) and Reach (m). Melee is
roughly the first 2 m between bodies — an arm plus a weapon. A castle chamber is about
10 m square, so 14 m of diagonal is the realistic worst case; a corridor or cell is 3–5 m
and starts effectively engaged, a great hall runs to 15 m or more and is the only place
ranged weapons and Flight get room to breathe.

**Melee range is not a gate.** Closing is always possible within a single action at any
distance, because Windup runs concurrently with Travel (§06) — you cross the ground
already wound up. What a long approach costs is time and visibility, never permission.
Walking into range is a free prelude; sprinting it costs a little stamina.

## 03 Turn structure

Each turn runs through five steps, in order:

1. **Base draw** — a hand of generic, stance-agnostic cards, pulled before either side
   commits to a stance. What's already in hand can and should influence which stance
   gets declared next; intent isn't chosen in a vacuum.
2. **Declare stance** — one of the five in §05. Diegetically telegraphed (posture, a
   visible tell) *and* stated plainly to the player — both channels, not one or the
   other. Both combatants know each other's stance before locking specific cards,
   never each other's drawn hand or planned sequence in advance.

   **Except at knife range.** Once both combatants are already inside melee and already
   engaged, the full stance is *not* revealed — only whether they intend to **stay in
   it or get out of it**. Reading posture is something you do across a room, watching
   someone gather themselves. Two people already hacking at each other have no
   legible posture: there is no moment at which Attack, Await and Defence look
   different from one another, and pretending otherwise was the weakest thing in this
   section.

   Note what does *not* change: a stance is still **declared**, and it still shapes the
   draw. Only the *broadcast* is withheld. So melee is genuinely blinder than the
   approach — you know they are still committed to the fight, and nothing else.

   This also gives disengaging a purpose it lacked. Backing out to a few metres
   restores the reading game, which means distance buys **information**, not just
   safety. That is a real tactical reason to open the gap, and it emerges rather than
   being granted.
3. **Stance draw** — an additional hand, drawn mostly from the declared stance's pool.
4. **Lock-in** — both sides commit a full ordered sequence of cards for the turn,
   before any of it resolves.
5. **Resolve** — both locked sequences play out together against the shared timeline
   (§06), with reactions (§07) able to interrupt that playout as it happens.

## 04 Commitment

Every card in a locked sequence carries one of three independently-chosen commitment
levels:

- **Committed** — highest payoff (speed and/or damage), but forecloses reacting to
  anything that happens before it resolves (§07); hard and costly to divert from once
  declared.
- **Uncommitted** — standard payoff, genuinely still open to reacting if something
  worth reacting to comes up.
- **Bluff** — the extreme low-commitment end of the same spectrum: near-zero cost to
  abandon outright, but can still be followed through opportunistically if the
  situation turns out clearly favourable mid-resolution. Bluff is a position on the
  commitment spectrum available generally, not a special "deception" flag every card
  needs.

There is no separate "bail" action the player chooses and pays for. What looks like
bailing — a queued action not going through as planned — is a reaction (§07) landing
on your own resolving sequence instead of an opponent's. Getting that opportunity
already costs you your planned continuation; there's no additional toggle or price tag
on top of it.

A weapon or move also carries its own fixed, inherent **recoverability**, independent
of the declared commitment level — a heavy weapon is harder to divert from mid-swing
than a light one even at the same declared commitment, because it's a worse candidate
for a reaction to land on. Commitment level and inherent move-recoverability both feed
the same odds; they don't replace each other.

All three commitment levels are expressed as **timing**, not as a modifier layered on
top of one: Committed shortens the windup and lengthens the recovery, Bluff does the
reverse. That's the whole cost, and it's why a Committed attack also lands better — a
shorter windup is a shorter telegraph. See §06 and `combat-model.md` §5.9.

## 05 Stances

Five stances: **Charge, Attack, Await, Defence, Flight.** A declared stance shapes the
bulk of a character's stance draw (§03) — not just a couple of bonus cards laid over a
neutral pool — and is visible to the opponent before either side locks in, *unless both
are already engaged in melee*, in which case only stay-or-leave is readable (§03).

That exception is why the five collapse cleanly at knife range rather than needing a
separate melee ruleset. Charge is meaningless when there is no ground left to cross;
Attack, Await and Defence are the three that genuinely cannot be told apart once blades
are crossed; and Flight is the one thing that still shows, because someone breaking off
is visibly breaking off. Five stances, one readable bit.

- **Charge** — committed, fast ground-closing. The most exposed stance to a well-timed
  reaction, and the clearest case for why stance gets stated outright rather than left
  to a diegetic read: a foe that's about to charge is exactly the moment a reaction
  matters most.
- **Attack** — standard aggressive engagement, not built around closing distance the
  way Charge is.
- **Await** — patient and reactive; holding this stance keeps more of a hand's worth of
  options open for whatever the opponent actually does.
- **Defence** — built to punish an incoming committed attack rather than to initiate.
- **Flight** — oriented toward creating distance and disengaging, the mirror of Charge.

Off-stance cards are still accessible, not hard-gated, and drawing one isn't especially
rare — it just costs more energy and carries a minor performance debuff, rather than
being locked away by a scarcity rule.

> **OPEN.** Whether a specialised character (a caster, a pure archer) eventually
> carries a stance outside this five, or a variant of one of them, hasn't come up again
> since it was first raised.

## 06 Resolution & timing

Every card moves through the same four phases — **Windup, Travel, Execution, Recovery**
— in that order. Not every card spends real time in all four: a melee attack thrown
from already inside melee range has essentially no Travel; a card with no aftermath has
essentially no Recovery. The shape stays the same either way — every card has all four
phases, some of them just zero-length for a given card in a given moment, rather than
different card types having structurally different phases.

Both sides' locked sequences execute together on one shared timeline, not simple
index-matched pairing — a card lands wherever its own phase durations actually place
it, and a fast combatant's action can legitimately outrace and land before a slower
opponent's earlier-queued one.

Time is measured in **ticks**: 100 ticks is one second. For the numbers themselves, see
`combat-model.md` §5.9, which supersedes anything specific said here.

### Phase durations are derived, not authored

A card does not carry tick counts. It names a **motion profile** — a generic shape from
a fixed library, like "horizontal weapon strike" or "jumping overhead weapon strike" —
and the actual durations fall out of that shape applied to *this* wielder's Strength and
*this* weapon's mass. One profile therefore serves an axe, a sword and a chair leg,
because the mass is what differentiates them. A card may nudge an individual phase, but
never redefine the shape; that's what lets one pass over the library retune every card
in the game at once.

The quantity all four phases are multiples of is **swing speed** — the same swing speed
that already sets a blow's momentum. This is the point of the whole design: a heavy
weapon in a weak hand is slow *and* hard-hitting because those are one fact, not two
numbers to balance against each other. No card can author itself a long windup without
also earning the momentum that justifies it.

A few phases are deliberately **fixed** instead — airtime on a jump is gravity's
business and hangs just as long for a knight as a duelist, and catching your breath
takes as long as it takes regardless of how fast you swing.

Only Strength, weapon mass, Pace and Exhaustion touch timing. Agility, Precision and
Reflexes are kept out on purpose — each of those already has exactly one job elsewhere,
and a stat that shortens a windup *and* widens a miss makes the whole thing untunable.

### Commitment is a timing decision

The three commitment levels of §04 are expressed almost entirely as tempo, pulling
windup and recovery in opposite directions. **Committed** starts sooner and leaves more
to unwind. **Bluff** is slower to actually arrive and nearly free to abandon. That is
also *why* a Committed attack lands better — a shorter windup is a shorter telegraph, so
the defender has less warning to use, with no accuracy stat involved anywhere.

Recovery does two jobs, both real: you cannot begin your next card while unwinding, and
you are measurably easier to hit while you do.

### Acting costs you your defence

You do not sidestep at the apex of your own swing, and this is not a rule so much as a
consequence. Two defences fail for two different reasons, and separating them is what
makes it answerable without authoring a defence number per phase.

**Evasion needs your feet and your mass free.** How much of both a card takes is already
written on it — how large the motion is, and how much of your body you throw into it —
and it builds as the swing loads: nearly free at the start of a windup, total at the
apex, bleeding off through the unwind at a rate the weapon sets. A rapier you can simply
stop; an axe carries you most of the way through its own aftermath. A card you have only
begun can still be abandoned, though never quite for free — the mind commits before the
body does.

**Guarding needs an arm free**, which is a different question entirely. A knight
mid-overhead has his feet planted and can slip nothing, but his shield arm is untouched
and covers exactly as well as ever. A duelist mid-lunge has committed both. And a shield
*bash* spends the shield to throw it, leaving that side open while it happens.

This is also why catching someone mid-commitment lands better — because of what *they*
are doing, not a bonus handed to whoever moved first. It is what gives the aftermath of
a heavy swing its teeth, and it is the reason a card that costs no exertion, like taking
a breath, is not free: you are 45% committed to it and not defending. It is also the loudest event on the
timeline for the purposes of §07 — baiting a heavy commitment and punishing the unwind
is the exchange this entire system exists to produce.


### What one card leaves the next

A card doesn't know what came before it. It knows *where your body is now*, and that is
what makes combos emergent rather than authored — §09's rule that no card ever names
another is what forces this shape, and it turns out to be the better one anyway.

Every card carries an **arc**: where the weapon starts and where it finishes, on a
three-by-three grid of guard positions. The next card's windup is scaled by how far your
hand is from where *it* needs to begin. So `Slash` into `Backslash` flows, because one
ends exactly where the other starts; `Overhead` into `Overhead` does not, because you
have to lift the sword back up first. Nobody wrote either of those down.

The centre of that grid is the hub, since the cost is distance. A thrust starts and ends
there, which makes it the most chainable action in the game — and is why a fencer thrusts.
A corner strike is committal in a way that is now mechanical rather than flavour.

Two more things carry:

- **Footing.** A card that threw your mass leaves your base out of line as well, whatever
  the blade is doing. A charge into an attack is naturally awkward.
- **The free hand.** A card using the *other* hand may begin while the previous one is
  still unwinding; the same hand must wait. Not a bonus — limbs overlapping, the same
  principle as windup completing during travel. Alternating hands genuinely interleaves,
  and two-weapon fighting becomes distinct with no rule of its own.

An arc also says which side of the defender the blow arrives on, so §02's direction is
one number derived from the motion rather than a second field that could disagree with
it. And since a shield sits on one side of you, a blow down your shield side is better
met than one down your weapon side — which is what makes a card with **two** arcs work at
all. A buckler cannot meet a cut from both directions at once; nothing needed to be
written for that, it is just where the shield is.

A card with two arcs resolves as two separate contacts. Two blades arriving are two
things that could kill you, not one averaged one.

**And the blade does not always finish its arc.** If it passes through air it completes
the sweep. If it goes into flesh it mostly completes — a cut that halts in a body is a
failed cut. But if it is *blocked*, it stops dead, and hard steel throws your hands back
past where they began.

So blocking breaks combos. `Slash` flows into `Backslash` only because the first ends
where the second starts — and a Slash that rings off a shield never gets there, so the
follow-up costs more than an uncarried card would have. Nothing was written down for
that; it is just the blade not having arrived. It is also the first real reason not to
swing into a raised shield.

### Windup completes during Travel

Two combatants both closing toward each other aren't racing their Windups while standing
still first — both are closing ground while each readies their own attack, and only once
Travel actually ends (both now in range) do their Executions meet. Windup pace mostly
matters once both sides are already close; while there's real ground between them, who
arrives and is ready to strike first is what matters.

Because these run concurrently, **closing a gap is always possible within one action, at
any distance** — you cross the ground already wound up and strike on arrival. There is no
range gate and no special case. What crossing a long gap costs is time and visibility:
the travel *is* the telegraph, so charging the length of a hall means everyone saw you
coming for the whole trip. In practice this rarely comes up — the great majority of
fights are melee, both sides walk into range as an uninteresting prelude that costs
nothing but a little stamina if sprinted, and the timing game proper starts once they're
close.

Travel's actual completion is resolved against what both sides are really doing that
exchange, not assumed from a number fixed the moment the card was chosen — a pursuer
closing on a target that's simultaneously creating distance may not finish closing the
gap. A genuinely faster combatant can outrun a slower one indefinitely, which is what
makes Flight a real stance rather than a flavour of retreat, and it needs no rule of its
own: it is just two paces subtracting.

### A turn has no fixed length

Turn length is **emergent**, never budgeted. Both sides pick cards until their exertion
budget is full (or deliberately overfull), and the turn lasts as long as those sequences
actually take. Two combatants who both hold still finish almost immediately; a pursuit
across a hall runs long.

The invariant that makes this work: **exertion is committed at lock-in, time is
discovered at resolution.** A card's cost is fixed the moment you play it and never
moves. Its duration is not — a blow that buries itself takes longer to free than one
that glances. Nothing needs a time currency, because time is not a resource you spend;
it is a window during which things happen to you.

In practice sequences come out to similar lengths on their own, because a high-exertion
card is generally a slow one — many quick cards and few slow ones fill the same budget
in roughly the same span. Where they genuinely don't, whoever runs out of cards enters a
**reactive stance**: not standing there powerlessly, but watching, with everything
reading as more salient and reaction draws coming more readily. And full playout is the
exception anyway — reactions cancel cards and a solid hit interrupts a whole sequence.

Being outpaced, or hit hard enough, interrupts a combatant's own sequence: later queued
cards may simply not fire because the combatant's place in the sequence has been
broken. This is a real mechanical consequence, not flavour text.

**Disrupt and interrupt are different scopes, and the words are not interchangeable.**
*Disrupt* cancels the **current card** — a hard enough blow landing before an
opponent's Windup finishes (§07). *Interrupt* cancels the **rest of the sequence** —
knocked down, staggered, put out of it for a beat. It is the topple check
(`combat-model.md` §5.8) rather than a damage threshold, so a heavy blunt blow puts
someone out where an equally damaging thrust does not, and a wide-based creature is
genuinely hard to stop. A disrupt may or may not interrupt; an interrupt always implies
the card in flight is gone too.

### Cards that cost only time

A card with no exertion cost is not free, and needs no second currency to price it.
"Take a breath" — draw some extra options next turn, sharpen your reflexes and precision
— costs nothing from the budget and everything in exposure: the opponent can charge
while you're doing it and you are not ready to answer. It is limited further by being
scarce in the deck and by occupying a hand slot. It is the purest card in the system,
all tempo and no payoff, and the fact that it needs no special rule is a good sign the
model is the right shape.

Combat duration does feed the run's midnight clock, but only slightly — midnight is
primarily an exploration pace, not a combat one. Standing and staring at a foe who
isn't approaching will eventually cost you the night; a long fight barely will.

> **OPEN.** The exchange loop itself isn't built. Phase durations and reaction odds
> exist; what doesn't is the thing that runs two sequences against one clock. The
> intended shape is a tick loop that can pause at a reaction window, hand out draws and
> resume, rather than one pass that runs to completion. What happens to a Travel that
> doesn't finish before the turn ends — carried as an in-progress action, or abandoned —
> is the piece that still needs deciding.

## 07 Reactions

A reaction becomes available whenever something happens that would make a combatant
want to change their plan — most often an attack about to land, but also an opponent
revealing a heavy commitment (a large Windup coming due), an opponent breaking off to
flee, or other moments like these. Getting one requires not already being fully
Committed to your own current action (§04) — commitment level gates whether the
opportunity exists at all, not only how likely it is to land.

Reactions aren't a single fixed check per exchange. In principle any number can occur
across one sequence's resolution — one for every moment that actually qualifies, not a
capped budget.

Playing a reaction **replaces** some or all of a combatant's own remaining plan — never
a free action layered on top. What happens to the rest of a locked sequence after one
fires depends on whether each remaining queued card still makes sense given the new
situation: a queued melee attack after a reactive retreat no longer applies and drops
out; a card unrelated to what changed keeps flowing as planned. That's one underlying
check applied at every point in the sequence, not three separately-authored rules for
"interrupt," "cancel," and "continue."

Mechanically, a window is a **salience** score against a **threshold**, not a dice roll
per exchange. Something happens; how much it should make you want to change plan is
scored; whether you notice and how much you make of it is your **Improvisation** against
that score; how fast you can be on it is your **Reflexes**. Clear the threshold and you
draw reaction cards — more of them the further above it you are — drawn at the moment the
window opens, not planned in advance.

On top of Reflexes there's a conversion delay: an action already in motion takes real
time to become a different one, and being Committed with a weapon that's hard to divert
is what makes that delay bite. A window whose delay outlasts the thing it was reacting to
is simply **missed** — you saw it and were too committed to do anything about it. That's
an outcome worth showing the player, not a failure.

An opponent's Recovery is deliberately the most salient event in the game, scaled by how
long and how hard to abort that unwind is. Baiting a heavy commitment and punishing the
aftermath is the exchange the whole system is built around, so it has to be the loudest
thing on the timeline. See `combat-model.md` §5.10 for the numbers.

> **OPEN.** The trigger list is decided in shape (an unwind starting, a blow about to
> land, a heavy windup coming due, an opponent breaking off) but not closed — more will
> want adding. The salience constants are first-pass guesses and want play before they
> mean anything.

**Disrupt** is a separate, narrower mechanic, not a reaction: a sufficiently fast and
heavy action that connects before an opponent's Windup completes cancels that Windup
outright. No card is spent reacting — it's a property of a hit landing first, not a
choice the defender makes.

## 08 Energy economy

Each character has a maximum per-turn energy budget (illustrative: 37.8) that fully
resets every turn. It is not a pool that gradually depletes across an entire fight,
only a per-turn allowance. Individual card costs are fine-grained fractional values
against that budget (illustrative: a card costing 12.25), not small whole-number pips.

- **Overspending** beyond the turn's budget is allowed, and leaves the combatant weaker
  and slower the following turn. Nothing debilitating by itself, but it adds up: less
  reaction time, more windup, less speed, less strength. In `combat-model.md` this is
  the single **Exhaustion** scalar, which degrades Pace, Agility, Strength, Reflexes
  and Precision and lengthens every phase — it never touches the damage curve directly,
  only through those stats.
- **Underspending** is also allowed, and grants some advantage the following turn — but
  this is not a full 1:1 bank; there's a cap or diminishing return, specifically to
  prevent hoarding energy across many turns to unleash one overwhelming turn.
- This same overspend/underspend currency and consequence applies identically to
  monsters.

## 09 Cards & damage

This section stays at the system level — no per-character or per-monster card lists are
tracked here.

Every action card carries: which **motion** it is (a profile, §06), how much **effort**
goes into that motion, which **hand** throws it, its **direction** (§02), how focused
the technique is, how much of the wielder's own momentum it channels, and what it
demands in exertion. **No card ever references another specific card by name** —
emergent combos come from sequence order and live battlefield state, never from
authored card-to-card relationships.

A card **names no weapon**, only a hand. It is a motion, swung with whatever that hand
happens to be holding, exactly as it names a profile rather than four tick counts. One
`Slash` is therefore shared by the knight and the skeleton and comes out as two
entirely different attacks — the arm and the steel do all the differentiating, and a
rusted blade blunts every card the holder owns at once rather than needing a duplicate
of each.

**Effort** is what turns one profile into a family. A quick cut, a slash and a full
swing are the same horizontal motion at 0.55, 1.0 and 1.45 effort: more effort gathers
longer, unwinds longer, puts more body behind the blow, tires more, and hands the
defender a longer telegraph. Nothing else differs between those three cards. Together
with shared motions and a hand instead of a weapon, this is what makes the intended
multitude of cards affordable to author — a new card is usually a profile name, an
effort, and a direction.

Note that effort and *commitment* (§04) are different things pulling different levers.
Effort is authored on the card and lengthens the gather **and** the unwind together,
buying power with both. Commitment is chosen when the card is played and trades one
against the other — sooner to start, longer to stop.

**Direction** is authored but not yet read by resolution. A flat horizontal sweep is
±100, an angled hack toward the core is around ∓50, and a thrust or an overhead is 0 —
no lateral identity at all. It also removes the need for a mirrored-card flag: `Slash`
and `Backslash` are one motion at opposite signs.

### Resolving a hit

Each defending character has their own curve describing how their body and armour
respond to being struck at all, independent of what's attacking them — a graze that
barely counts, a real connection against whatever protection they have, a solid hit, a
precise one. Before a single roll against that curve decides the outcome, several
things reshape it: the attacking weapon's own lethality sets the ceiling it can reach;
the attacker's momentum and muscle push some bands higher, since a heavy blow partially
punches through even a raised guard; and active choices in the moment — a raised shield,
being caught still moving, a called shot — shift where the roll needs to land. The roll
then reads directly as the Severity of the blow; nothing further is computed afterward.

> **`combat-model.md` supersedes the detail above.** The bands are now
> Miss → Graze → Guard → Wound → Vital, the y-value is Severity, and both band widths
> and heights are computed from stats rather than authored. There is **no health pool at
> all** — severity ends the fight at the top and inflicts conditions below it (§10).
> "Lethality" in particular no longer exists as a stat: it decomposed into momentum,
> concentration and damage class.

Secondary consequences — an opening for a riposte, a stagger, a lost foothold — are
checked independently, either against that same roll landing in a marked-out secondary
range, or against a separate momentum-versus-stability comparison. They ride alongside
the main damage outcome; nothing needs to be rolled twice.

## 10 Wounds & conditions

**There is no health pool, and no damage is carried.** A blow does not deplete a bar —
it either ends the fight or it *does something to you*, and what it does is the whole
mechanic. Getting cut is not losing 30 of 100; it is bleeding, losing your footing,
being in pain, and finding that everything you do afterwards is worse.

Severity (§09, `combat-model.md`) is unchanged as a quantity. What changed is what
consumes it:

- **At the top of the curve it ends the fight outright.** A clean Vital is not
  three-quarters of someone's health, it is the end of them.
- **Everywhere below that it inflicts a condition**, and conditions degrade you.

### Why this is not a health bar with extra steps

Because **two 30% blows are not one 60% blow.** The second lands on someone whose
Agility is down, whose footing is gone, and whose guard is compromised — so it does not
read 30%, it reads 55%. The accumulation is real, but it happens *through the curve*
rather than in a pool beside it, and it is nonlinear in exactly the way a real fight is.

Pain also accumulates into the *remaining headroom* rather than adding, so it approaches
total and never arrives: **you cannot be ground to death by grazes**. Four 30% wounds
leave a duelist at 0.72 and a hard-bitten knight at 0.56. A fight ends because a decisive
blow landed, or because you got slow enough that leaving was the only move.

Order matters too. One bad wound then two light ones hurts more than three light ones —
being badly hurt once is worse than being lightly hurt repeatedly.

That is a positive feedback loop, and it is deliberate. It is also the reason §12's
"fleeing is a normal choice" is a real choice rather than a sentiment: the moment your
hand starts filling with *Succumb to Pain* is the game telling you, mechanically and
diegetically, to get out. Limping home with what you managed to loot is a **win**.

### Three kinds of condition, resisted by three different things

Conditions are not one category, and the distinction is what makes different creatures
frightening in different ways.

| Kind | Examples | Resisted by |
|---|---|---|
| **Pain-mediated** | shock, panic, giving up | **Pain Tolerance**, or immunity via `mindless` |
| **Structural** | broken bones, maimed limb, crippled leg | Toughness{class}, Redundancy |
| **Physiological** | bleeding, internal bleeding, concussion, burns | needs blood and organs to matter |

A skeleton is immune to **two of the three**. It never limps, never gives up, and has
nothing to bleed — it can only be *dismantled*. Which is why a mace is the right answer
to one and a rapier is not, and why `Toughness{blunt 0.5, pierce 2.5}` and
`vitalSuit{blunt 1.4, pierce 0.3}` were already saying so on its sheet.

That is why **structural damage accumulates on its own track**, separate from Pain
(`combat-model.md` §4.2e). Without it a skeleton had nowhere to accumulate anything at
all, and simulated fights found a duelist could not beat one under any circumstances —
which is wrong. A base skeleton should be *hard*; genuinely unwinnable belongs to far
scarier things. With the second channel a knight with blunt takes one apart in three
turns and a duelist with a point needs nine and wins about a third of the time.

> **Pain Tolerance** is a ×human ratio like every other capability — a stoic barbarian
> 2.5, a soft merchant 0.6. Categorical immunity is not a big number, it is the
> `mindless` flag, exactly as it already is for Intimidation (§11).

### Conditions never touch the curve

They degrade **stats**, and stats make the curve. This is the same rule Exhaustion
already follows, and it is what stops a dozen conditions becoming a dozen bespoke curve
modifiers — which is precisely the failure the whole model was rebuilt to escape.

| Condition | Takes |
|---|---|
| Bleeding | Stamina, continuously — Exhaustion accumulates on its own |
| Broken ribs | Pace, Strength; heavy Pain |
| Concussion | Precision, Reflexes, Improvisation |
| Crippled leg | Pace, Agility |
| Maimed arm | that hand entirely |
| Burns | Agility; heavy Pain |

**Which** condition a blow inflicts derives from its damage class and where it landed —
slash bleeds, blunt breaks, pierce punctures. No card ever says "causes bleeding," any
more than a card ever names another card (§09).

Two of those are much larger than they look, because of how §06 already works:

- **A maimed arm removes a hand.** Every card played from that hand becomes unplayable,
  the shield is gone for good rather than only while bashing, and hand concurrency stops
  existing. Half your options, permanently.
- **A crippled leg means you cannot flee.** Pace collapses, so the pursuit maths in §12
  stops working in your favour. That is the horror beat the run structure needs: the
  game is telling you to leave, and the thing that hurt you took away your ability to.

### A poisoned hand is one mechanism with two sources

Pain and Dread (§11) both do the same thing to your draw: they crowd it with cards that
are not fighting. *Succumb to Pain*, *Give Up*, *Limp Away*, *Assess Damage* from one;
*Falter* from the other. Build it once.

Illustratively, badly hurt, the base draw might come up:

> Assess Damage · Succumb to Pain · Succumb to Pain · Limp Away

and declaring **Flight** might draw:

> Give Up · Give Up · Give Up · Sword Swing · Limping Flight · Sidestep Back · Give Up

*Give Up* crowding the Flight pool specifically is the sharp part — it is the stance
where quitting is most tempting, so it is where quitting should be hardest to avoid.

### Adrenaline

The counterweight, and the only one of the four states that is not purely negative.

Getting hurt floods you. Adrenaline **masks** Pain rather than reducing it — the wound is
the wound, you simply cannot feel it yet — so it is a *deferral*. It burns you while it
lasts, it fades on its own, and it fades much faster once the fighting stops. When it
goes, the Pain it was hiding lands, and that needs no crash rule: it is just the mask
lifting.

It does not give everything back. Adrenaline returns the body and takes the hands — you
are faster and stronger and place worse — and it does nothing for presence of mind. A
fighter running on it is a different character rather than a buffed one. Fear feeds it
too, since fight-or-flight is one response, so terror briefly makes you quicker and no
cleverer.

**Adrenaline is what gets you to the door.** Roughly three turns of grace after a solid
blow. Spend it fighting instead of leaving and you crash in the corridor.

### What keeps this from being a one-exchange game

The open worry is rate. If one solid hit puts you two-thirds into the spiral, a fight is
decided in a single exchange and everything in §06 barely happens. Four things are meant
to hold it open. The first exists; the rest do not:

- **Adrenaline** (above) buys roughly three turns after a solid blow, so the spiral has a
  grace period rather than starting instantly.
- **Reactions** (§07) — the player, and to a lesser extent the monster, gets to *not* be
  hit by the thing that would have started the spiral.
- **Asymmetry of options.** The player has more reactions and more choices than a monster
  does. That is intended, not an imbalance.
- **Meta-progression** (§15). Pain Tolerance, and resistance to specific conditions, are
  natural things to carry between runs.

> **OPEN.** The Pain curve — how much severity produces how much degradation — is the
> dial between "getting cut is catastrophic" and "combat is an interesting multi-turn
> system." It wants playing with, not deciding in the abstract.

> **OPEN.** Whether **Tripped** and **Staggered**, the two flags that already existed,
> fold into this as short-lived structural conditions or stay separate. Almost certainly
> they fold in.

## 11 Composure & intimidation

Fear is not a saving throw and not a damage type. It is a **tax on the exertion budget**
(§08), which is why it needs no new currency and no new resolution step.

**Intimidation** is how frightening a combatant is; **Composure** is how well they hold
themselves together. Both are ×human ratios like everything else, and the pressure one
puts on the other is the usual saturating ratio, so evenly matched combatants sit at
exactly 0.5 and neither is taxed:

```
pressure = Intimidation_att / (Intimidation_att + Composure_def)
```

Two stats, one live value. **Composure is the stat; Dread is the 0–1 state it resists**
— exactly the relationship Stamina has with Exhaustion, and it should be built the same
way. Dread accumulates under pressure and is spent down by recovering.

### What Dread actually does

- **Attack cards cost more exertion.** Not "you may not attack" — attacking while
  terrified is possible, it just eats a budget you needed for something else. The
  penalty is selective, which is why it multiplies *card costs* rather than shrinking
  the budget.
- **Flee cards cost less.** The mirror, and the better half of the idea: fear makes
  running genuinely cheaper than fighting, so a frightened combatant drifts toward the
  door without being ordered there. §12 already wants fleeing to be a normal choice
  rather than a shameful one, and this is what makes it one.
- **Past a wide enough gap, drawn cards are replaced.** Some of what you draw comes up
  as a card that does nothing but recover Composure — a **Falter**. It costs no
  exertion and it occupies a hand slot, which is the same way "take a breath" is priced
  (§06). This is also the release valve that keeps Dread from being a death spiral: the
  worse it gets, the more of your hand is spent climbing back out of it.

> **PROPOSED.** *Falter* as the card name, over *Paralysis* — it reads as your own
> nerve failing rather than a status somebody imposed on you, and it stays apt for a
> hero who is merely rattled rather than rooted to the spot.

### What it hooks into that already exists

- **Psychic might** on two of the default heroes stops being a bespoke ability and
  becomes a high Intimidation stat plus cards that spike it. Scaring things away *is*
  the mechanic, not an exception to it.
- **`mindless` and `undead`** are already flags on the skeleton. A thing with no mind to
  frighten simply has no Dread, with no special case — the flags do the work they were
  put there for.
- **Exhaustion's pattern.** Dread degrades things the way Exhaustion does. The obvious
  candidate beyond cost is §07's reaction threshold: a frightened combatant should find
  it harder to notice an opening. That keeps one stat to one job — Improvisation still
  owns the threshold, Dread just scales it, the same way Exhaustion scales Strength.

### Parity, as always

Monsters use this identically (§13). A monster can be frightened off by a hero with
Psychic might, and a hero can be pinned by something genuinely terrible. That symmetry
is what makes Intimidation a build rather than a scripted set piece.

> **OPEN.** Whether Intimidation is purely passive (a stat) or also active (cards that
> spike it, at an exertion cost of their own). Probably both, but the balance between
> them isn't decided.

> **OPEN.** Whether the opponent's Dread is visible to the player, and how. A diegetic
> tell fits §14's philosophy; a number does not. Note this interacts with the melee
> intent rule in §03 — if you cannot read their stance at knife range, you probably
> should not read their nerve either, only infer it from what they do.

> **OPEN.** The exact shape of the replacement rule — what gap starts replacing draws,
> how many, and how much Composure a Falter returns.

## 12 Fleeing

Fleeing is an ordinary card, not a special multi-step ritual with a fixed shape. It can
be played as the very first card in a locked sequence, or set up with other cards first
— whatever the situation calls for, the same way any other card's placement is a choice.

- A **tactical reposition** (buying distance without committing to leave) and a
  **genuine escape attempt** are two different cards, not one action with two outcomes.
  Only the real escape card can end the fight outright.
- Speed feeds flee odds directly, on top of its other jobs (Windup, reactions) — one
  stat doing several things, not a separate escape stat.
- This applies identically to monsters. An enemy can successfully flee even against a
  fully committed attacker, if its own escape resolves well.
- Fleeing is meant to be a normal, common choice, not a shameful last resort. At the run
  level, dropping low is meant to trigger a pivot toward extracting safely with whatever
  has already been gained, not a failure state.

> **This is the biggest hole in the build.** The fight loop found a matchup a duelist
> literally cannot win — a rapier tops out at 43.9% severity against bone, and a skeleton
> feels no Pain, so no win condition of any kind exists. The correct play is to leave in
> turn one. There is no flee card, nothing chooses to disengage, and so 120 out of 120
> simulated fights read as the duelist dying over six turns doing the one thing that
> could never work. Until fleeing exists, every unwinnable matchup is a loss rather than
> a decision — which is the exact opposite of what this section wants.

## 13 Player/monster parity

Monsters are not a separate ruleset. They use the identical commitment vocabulary
(Committed / Uncommitted / Bluff), the same energy overspend/underspend consequences,
the same reaction mechanics, and the same status flags as the player. A monster's
multi-part sequence is built from the same primitives a player's sequence is; it just
happens to be aimed at the player.

## 14 Presentation & UI philosophy

Fights are meant to be visually acted out between the combatants on screen, with
animated tells (a crouch reading as an imminent leap, a heavy windup reading as slow
and punishable) as the primary information channel for most players. Full numeric
detail for any card is available on inspection for players who want it, but the default
view stays uncluttered. A declared stance (§05) is shown both diegetically and stated
plainly — the same two-channel approach.

Randomness is a deliberate, permanent design pillar, not something to design away:
correct play should skew odds heavily in a player's favour, never guarantee an outcome
outright. That said, the curve should be driven mostly — and swing wildly — by the stats
and the interaction between the two fighters. A hopeless matchup producing a nearly flat
curve is a feature: the correct read is to run away.

## 15 Meta-progression & run structure

- Roguelike run structure with permanent upgrades carried between runs; closer to Rogue
  Legacy than a reset-everything roguelite.
- The run's objective is reaching the treasure chamber.
- 0 HP is lethal. A run-level hard time limit ("midnight") is also lethal if reached
  without completing the objective.
- Room drafting (Blue Prince-style) shapes available space in whatever fights happen in
  that room (§02).
- **Loadout/item drafting is the actual mechanism for avoiding unwinnable matchups.**
  Some matchups are intentionally unwinnable, and the strategic answer is choosing
  gear/routes in advance, or fleeing/routing around in the moment — not a guarantee that
  every fight can be brute-forced.
- Found items add new cards to a character's available pool when picked up.

> **PROPOSED.** A Death's Door state at 0 HP rather than instant death — one final
> decision (attempt to flee, or gamble on winning outright), with any further hit while
> there being final. Not confirmed.

> **OPEN.** A "fatigue the longer you stay" idea has been raised but is explicitly
> underdeveloped.

> **PROPOSED.** Fatigue may be redundant with the midnight clock rather than needing to
> be its own separate system. Unconfirmed.

## 16 Explicitly out of scope (for now)

- Multiple simultaneous enemies in one fight — wanted eventually, deliberately deferred
  until 1-on-1 combat is solid.
- Multiple player-controlled heroes in one fight — not yet considered either way.
- A real draw/hand system, and stance-gated hands specifically — deliberately sequenced
  after the timing system (§06) and the multi-card-per-turn sequencing it enables.

## 17 Open questions — quick index

| Where | Question |
|---|---|
| §02 | Whether melee range becomes a hard precondition rather than a soft distance penalty |
| §05 | Whether any specialised character ever needs a stance outside the base five |
| §03 | Whether stay-or-leave is the right single readable bit in melee, or if a third signal is wanted |
| §06 | What happens when a card's Travel doesn't finish within one exchange |
| §07 | Exact reaction odds, and the precise list of qualifying triggers |
| §11 | Whether Intimidation is passive, active, or both |
| §11 | Whether an opponent's Dread is visible, and how |
| §11 | What gap starts replacing draws with Falter, and how much it returns |
| §10 | The Pain curve — the dial between "getting cut is catastrophic" and "combat is a multi-turn system" |
| §10 | Whether Tripped and Staggered fold into conditions (almost certainly yes) |
| §01 | Multiple heroes in one fight: not yet considered |
| §01 / §16 | Multiple enemies at once: deferred by design, not resolved |
| §15 | Death's Door at 0 HP: proposed, unconfirmed |
| §15 | Fatigue-over-time: raised, underdeveloped; possibly redundant with the midnight clock |
| §01 / §15 | Lore and puzzle layer: aspirational, undesigned |

Further open items specific to the damage model — projectiles breaking the momentum
term, swarms as a single combatant, stances as a (guard, evasion) pair, lanes and
direction — are tracked in `combat-model.md` §9.
