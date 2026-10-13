# The game we're making

This is the document to read first. It's the *why* — the feel we're chasing, the
philosophies behind the mechanics, and the reasoning that produced them. `design.md` is the
*what*: the decisions, the numbers, the fields on a card. If the two ever disagree, this one
is the intention and that one is the implementation.

It's written for whoever arrives next and needs to think with us: a fresh AI session, a
collaborator, or us in three weeks having forgotten the half of it.

---

## Where it comes from

It's a reimagining of **Drakborgen** — the Swedish board game known elsewhere as
DungeonQuest. You enter a dragon's castle, work through its rooms, try to reach the treasure
chamber, and try to be out again before midnight. The board game is famous for killing you.
Most players die. That's the appeal.

We want to keep the cards, the art style, the monsters and the heroes. An ideal we'd be
delighted to hit: **every card in the board game can be expressed in some form in ours.**
That said, there's no limit on inventing our own things, and the monster designs are
inspiration rather than scripture.

What we're *not* keeping is the resolution. The board game settles a fight with three cards
that are functionally rock-paper-scissors — the art differs and the cards mean nothing. The
whole project is about growing that ABC choice into something with real depth, without
losing the readability that made ABC work.

## The feel we're chasing

Fighting losing odds. Victories worth celebrating. If you're looking for a reference point,
it's **Darkest Dungeon**: you are not a hero mowing through monsters, you're someone in a
bad place trying to come out of it with your limbs attached.

The moment we want players recounting afterwards is **winning a fight they shouldn't have**,
or surviving something that by rights should have killed them. Not a big damage number. The
thing you tell someone is "I was down to one working arm and I baited him into a feint and
got out at one minute to midnight."

And no battle should be trivial. A single mistake can cost you an arm for the rest of the
run, which is what makes the easy-looking fight worth respecting.

---

## What a run is

You go into the dungeon. You make good decisions for as long as you can. When you make poor
ones, you get hurt, and from that point the run turns into salvage: getting yourself and
whatever you've found back out alive.

**There is no XP or loot for killing things.** This matters more than it sounds. It means
running away is a *skilled play*, not a failure state. If your sword can't pierce a troll's
hide, the correct answer is to leave, and the game should never make you feel you left value
on the table. Fights are obstacles, not content to be farmed.

**The clock stops you lingering.** The monsters and the traps are what kill you; midnight is
what stops you taking forever about it. But that's enough to make time the resource every
safe choice spends, and it's how defence gets balanced — not by making shields weaker, but
by making safety slow. A turtle in heavy armour behind a steel shield survives every fight
he takes and gets caught in the dungeon at midnight.

The skill curve we want runs in three stages:

1. **Don't die.** New players take a sturdy hero and a shield and try to get out.
2. **Don't die, and come out richer.** Now you're choosing which fights and rooms to take.
3. **Race the clock into the deep.** Only when you're good do you push for the treasure
   chamber, where the dragon is.

So the same systems serve a beginner and an expert, because they're worrying about different
resources.

### Heroes, and the roguelite question

Undecided, deliberately. The ideas on the table:

**Four default heroes**, each a different answer to the dungeon, and each defined as much by
their kit as their stats:

- **Riddar Rohan** — armour, shield, sword. The sturdy one.
- **Sigeir Skarpyxe** — axe and buckler.
- **Aelfric Brunkåpa** — quarterstaff and morningstar.
- **Bardhor Bågman** — crossbow, shortsword and shield. The one who gets real value out of
  the opening, while everyone is still crossing the ground.

A **character creator** unlocked after you've run each of them, so you learn what the stats
mean through pre-built characters before building your own.

The rest of the board game's roster, not available at the start:

| hero | what they are |
|---|---|
| **Iril Fëaneline** | moves two rooms in a turn, and therefore laughs at the clock |
| **Yūbara Tori-Jima** | avoids fights through stealth |
| **Chārāk-Hai Vargdödaren** | goes berserk and ends fights before they develop |
| **Yūshugom Bogd-Uul** | three swords, the most health, refuses magic |
| **Mrishnahk magikern** | fireballs, invisibility, walking through walls, stopping time |
| **Dzála Náryn** | a ball of light, and a draconic dog, Oracaz |
| **Durim Dolkspänne** | throws knives, picks locks, useless in a fight |
| **Thargrim den mörke** | the dark one |

The re-release added variants of the base four — **Béla Snabbskäkt**, **Riddar Rut**,
**Sigrunn Skiöldkross**, **Astrid Gråsyster**. We don't care about those much; support them
later or not at all.

Mrishnahk is a warning sign as much as a hero: stopping time and walking through walls are
not things this combat model has any notion of. Magic costs fatigue in our version, and the
big effects (dragonfire, the one fireball) are deliberately powerful, niche and not balanced
carefully. Whether a full wizard is expressible at all is a question for much later.

A lovely idea we want to find room for: **the other heroes are also in the dungeon, racing
you.** You round a corner and there's Thargrim, and your hand fills with fear cards. Beat
him one-on-one and you take his medal; carry it out and you unlock him. Maybe only for a
run. Possibly overpowered, possibly the best thing in the game.

Some roguelite progression, probably — more stat points between runs. But with a caveat:
we don't love the structure where *you* get better at the game and simultaneously the game
gets easier. If the difficulty curve sags as the player's skill rises, the tension we're
building collapses. No solution yet. Parked.

---

## What a fight is

Both sides arrive, see each other, and the exchange goes like this.

1. **Draw your instinct cards** — a few at random. What your body offers, before you've
   decided anything.
2. **Pick your stance**, blind: charge, attack, await, defend or flee. You choose it knowing
   what you're facing and what your instinct handed you, but not what they'll do. That's the
   board game's ABC choice, preserved.
3. **Draw your stance cards** — the rest of your hand, drawn from that stance.
4. **See their stance.**
5. **Build your sequence**, now knowing roughly what they mean to do.

Coarse blind guess first, fine informed plan second.

**Your hand is the point.** The deck is everything you can do — all the ways you know how to
swing that weapon, every bit of footwork, every trick. But your hand is what you *came up
with*, here, under pressure, with this body in this state. That framing does an enormous
amount of work:

- A character with high imagination draws more cards — more options occur to them.
- Fear puts *falter* and *back off* into your hand, so being frightened isn't a debuff
  number, it's your mind offering you worse ideas. Pick charge while terrified and the game
  hands you run-away cards anyway. You intended to charge; that's just not what came to
  mind.
- Pain shuffles *wince* into your deck. And pain should do more than narrow your options:
  these cards may **play themselves**, dropping onto your timeline so you have to build
  around them. You don't choose to wince. Exact shape undecided.
- Panic doesn't need a rule. As fear rises, your hand quietly becomes nothing but flinching,
  and you can see it coming, hand by hand.

Fights start at **very far**, so the opening is genuinely different from the middle. Someone
has to cross the ground. If you hang back you get a moment for a thrown rock, a crossbow
bolt, a breath to steady yourself, or drawing that heavy weapon you'd sheathed. Reach rules
that gap: a troll or a polearm user has no reason to come to you, so entering *his* band is
the price of fighting him at all.

Then most fighting happens at **normal**, where there's room to swing. **Near** is bodies
colliding — you can't really fight there, so it's unstable, and it's the dagger fighter's
home. He has to close, and he can only stay while his string of actions keeps him there. One
pause and he's back out where he has nothing. Terrifying and precarious, which is correct.

Fights have an arc: clean, then slipping, then salvage. The salvage phase is where most
games get boring, and where we want ours to get tense, because being hurt changes *what you
can think of* rather than just lowering a number.

## What a turn is

Ten time units, divided into quarters. You write a sequence of cards into that budget, lock
it in, and watch it play out against theirs, each of their cards revealing as the clock
reaches it.

A card isn't an action, it's a **movement with phases**: a windup, a strike, a recovery. The
windup is where you can still adjust, track a dodge, or bail out. The strike is the point of
no return. Commitment ramps up through the windup rather than flipping at a moment, so
"how committed am I right now" is always a real number.

Things that matter at the turn level:

**The plan gets shoved around.** Land a hit on someone mid-windup and their whole sequence
slides later. A delayed swing now meets a different card of yours than you planned. Nobody
authored "cut then dodge"; it falls out. That makes the back end of a sequence genuinely
uncertain, which is why adaptable late cards are worth having — they're insurance against
drift.

**Empty time isn't idle.** Unscripted slots are the most reaction-ready state there is.
Leaving slack is a real choice, and overstuffing your turn with a heavy swing that runs past
the end leaves you committed while they're free to respond.

**Reaction opportunities are the only live decisions.** When your plan runs out of script —
you're about to be hit, your attack's about to hit a shield, nothing is happening at all —
you get a small hand drawn for that specific moment and you choose. How often that happens
is a build identity, not a universal rule. A nimble improviser might get five or six prompts
a turn and plays the fight live. A committed brute gets none and plays it on paper, but his
plan survives contact and he's immune to feints, because feints bait reactions and he hasn't
got any.

**Your next card declares what you believed.** This is one of the neatest things we found,
and it replaces a whole attention system. If you wrote "raise shield → counter-cut," you've
said "the blow is coming, I'll take it and hit back" — and if it was a feint, you're
committed to swinging at someone who never swung. If you wrote "raise shield → slamming
block," you've said "I don't trust this," and the feint finds you still there. Wariness is
priced honestly: it gets you nothing when they were honest, and it saves you when they
weren't.

## What a card is

Mostly **archetypes**: a horizontal swing, a thrust, a block, a step. Written once, and they
only care what kind of thing is in your hand. The weapon's own numbers make them feel
completely different — the same "horizontal swing" is a slow crushing inevitability with a
mallet and a quick redirectable cut with a sword. On top of that sit **signature cards**:
the things only one weapon can do, like switching ends on a quarterstaff or hooking with an
axe beard.

A card carries roughly: where the hand enters and exits (on a small 3×3 in front of you),
its phases, **drive** (how much of your strength goes in — a wrist flick or your whole
body), **arc** (how much swing builds up behind it), **footwork** (whether your feet move,
which brings your mass along and also decides whether the attack *pursues* you when you give
ground), what hands it uses, and what it needs from your weapon.

Card faces show **computed** values. This card, with your weapon, in your current posture,
with your current injuries, costs 2.25. Pick up the mallet and it says 3. The player should
never have to wonder why something was slow.

A deck is **your weapon plus your general cards**, so switching weapons swaps a big chunk of
your options and choosing what to hold before a fight is a real decision. Twenty-plus unique
cards per weapon, no duplicates, so every hand is a new situation rather than a reshuffle of
the same three tricks.

---

## The philosophies

**No hit points, no damage numbers.** A hit produces a *condition*: a broken shin, a gashed
forearm, a daze. Conditions lower stats and add cards, degraded stats make the next hit
worse, and that's the non-linearity a health bar was faking. Two moderate blows to the same
shin are worse than one on each, because the first made the second easier.

**No output randomness.** You are never told "you missed." Resolution is deterministic:
weapon, card, stats, commitment, anatomy, and what they did. The dice are all in the *draw* —
what options you have — and in hidden information: their sequence, whether that lunge is
real. So uncertainty is the kind you can outthink, closer to poker than to dice, and when a
fight goes wrong it was your call. "My mallet can't touch this bat" is an observation, not
bad luck.

**Emergence over authored matchups.** We'd rather describe things and let interactions fall
out. A skeleton is immune to bleeding because it has no skin, not because someone wrote
"immune to bleed." Blunt weapons are good against it because bone is brittle and blades skid
off. A dodge works against a particular attack because of that attack's own arc and footwork,
not a lookup table. Add a monster and the existing cards already know what to do with it.

**Every stat visible at both ends.** High gives you something, low *costs* you something you
feel. Otherwise it's a dump slot. Low composure means you break first in a standoff; low
intimidation means monsters see an easy target and you have to fight the ones that would
otherwise have fled; low improvisation means no help when the plan collapses. And we want
**skewed builds**, not hedged ones — nobody should be rewarded for putting fifty in
everything.

**Everything is always playable.** Bad posture makes a card slower or weaker, never
unplayable. You can raise a shield while lying on your back; it just doesn't do much.

**Information is a resource.** Mid-fight you know you've broken your shin but not exactly
what it's costing you — "−? pace," with the colour hinting how bad. *Assess damage* spends a
slot to learn the numbers, and knowing lets you adapt (you learn to lean on the other leg)
and calms you down, which buys back reactions. Cards always tell the truth about their cost;
what's fuzzy is the diagnosis.

**The player must be able to feel why.** This is the one that keeps biting us. If a card
takes longer, there should be a visible reason. If a block failed, it should be because of a
decision you lost, not a computation you couldn't see. Realism loses to legibility whenever
they conflict.

**Cost, not gates.** Shields are strong, and that's historically accurate: if you fought on
foot with a free hand, you carried one. What ended them was cost — plate made them
redundant, polearms out-traded them, and weight and fatigue always hurt. So we let them be
strong and make them expensive: a hand, weight, tempo, and the clock. The counters are
feints, overwhelming force, breaking the shield, and attacks it simply can't answer.

**Two currencies: cells and time slots.** Metres and kilos exist for *shape* — how big a
shield is, how heavy a mallet — and convert at the point of use. The same shield covers
nearly two cells on a goblin and half a cell on a giant, with no special case. But nothing
moves at metres per second. Compare like with like: time needed against time available,
cells short against cells of reach.

---

## How it reads in play

Some fights we keep using as touchstones:

**The troll.** Huge, planted, commits totally, barely reacts. Feinting him is pointless
because he has no reactions to bait. His swings are rooted, so giving ground actually beats
them, and the fight is about getting out of the way and punishing the recovery. Blocking him
is a mistake: the guard holds and *you* get moved.

**The black elf.** Quick, nimble, feint-heavy, reacts constantly, hits for almost nothing.
He can't hurt you much but he's maddening to predict, and the answer is to hold your nerve
and not take the bait. He's the exact opposite lesson to the troll — which is why a build
that loves one tends to hate the other, and nobody designed that.

**The skeleton with a wooden shield.** Blunt-and-shield is the crypt loadout, and it should
feel like discovering a cheat code. No skin to cut, no nerves to hurt, no muscles to keep it
stable — so the staff that would bruise a man cracks it apart, and a rapier slides between
its ribs achieving nothing. Its shield splinters. A fight that rewards having brought the
right thing.

**The vampire bat.** Small and fast. A slow mallet genuinely cannot touch it. Your options
are a quicker weapon, your fists, the environment, "take a breath" first to steady your
aim — or walking away.

**The rapier duelist against an armoured knight.** Rough. Most of what the duelist does
hits steel. His win condition is precision: find the gap, which means setting it up —
stumble him, bind him, catch him down — then put a point somewhere thin. Not forcing it.

**The dagger fighter.** Must close, can't rest there, lives on an unbroken string of
pressure. The most precarious way to play and the most frightening to face.

---

## What we got wrong, and what it taught us

Worth reading, because the same mistake has now happened twice in different clothes.

**Attempt one: the resolution curve.** A fight was resolved by rolling against a spline
built from authored band widths and heights, bent by a dozen independent magic scales. Every
tuning pass fixed one complaint and broke another, because the knobs didn't correspond to
anything a human could picture. Hit location came out of the curve, so it felt arbitrary. The
whole thing is archived in `attempt1/`.

Lesson: **if the player can't picture the quantity, no amount of tuning will make it feel
right.**

**The millisecond timeline.** Attacks had exact timings, approach speeds in metres per
second, continuous overlap. It had lovely properties — alternating hands being faster than
repeating one, a quick fighter fitting three actions into a slow one's two — but it was
impossible to author, impossible to balance, and impossible to show a player. It also
abandoned the rock-paper-scissors readability that was the point of the original.

Lesson: **coarse and discrete beats continuous.** Ten units in quarters is something you can
hold in your head.

**The travel-race block model.** This is the instructive one, because it happened *after*
we'd learned the lesson above. Resolving one shield block came to involve: a telegraph value
producing a warning, a distance in cells, a guard speed in cells per slot, a travel time
compared against the warning producing a shortfall, an aim error computed as an angular error
times the distance from your hand to the blocking surface, and all of that compared against
an arc-blended half-extent to produce a coverage fraction. Every one of those terms was added
to fix a case that felt wrong. The numbers it produced were *reasonable*. It was still a
disaster, and it's what burned us out.

Four reasons it failed:

- Five mechanisms for one question. The player only ever asks *did my shield stop it?*
- Every fix was local. The stack was never redesigned, only extended.
- It drifted back into physics — cells per slot kept being sanity-checked as metres per
  second.
- A card you committed to could fail for reasons you couldn't feel. **If you spend a card on
  blocking, the block should happen.** Being beaten should be a decision you lost — a feint,
  a wrong assumption — not a race you didn't know you were in.

What replaced it: a block card means you are *focused on intercepting*, so the guard ends up
where the attack is. Full stop. Interception is binary, one per card, and all the grading
lives in the force that still arrives. You beat it by lying (a feint continuing the same
motion, which spends the one interception), by what your opponent's next card assumed, by
overwhelming force, by breaking the shield, or with something a shield can't answer at all.

Dodges got the same treatment: we had started building displacement capacities and clearance
sums, and threw them out in favour of all-or-nothing evasion where each card answers a
condition over the attack's own properties.

Lesson, stated as a rule we keep breaking: **when a case feels wrong, don't add a term.
Ask whether the model is the wrong shape.**

**Other things we tried and dropped:** per-turn stamina (it said the same thing as the time
budget — two budgets that agree are one budget with bookkeeping), tracked positions in
metres (invited hit-and-run, which isn't fun to be on the receiving end of), a 5×5×3 anatomy
grid (two layers would be nearly empty, and the player would be reading three pictures), and
blade orientation as tracked state (the attack's arc tells us what we needed to know).

---

## Open frontiers

Wanted, sketched, not built: **fatigue** and an overexert/underexert system; **engagement**
state for binds, clinches, grappling, a weapon lodged in a monster, riding something's back;
**breaking** weapons and shields; the **environment** — picking up a rock, shoving a table,
being stunned by the wall you dived into; **position in the room**; **heat** as a third
damage channel for dragonfire and the one fireball; **poison**; monster AI (random is fine
for the proof of concept); and how the whole turn looks on screen.

## Where things live

- **`vision.md`** — this. Stance, philosophy, reasoning, mistakes.
- **`design.md`** — the decisions in detail: stats, fields, formulas, worked examples, open
  questions.
- **`attempt1/`** — the first attempt, kept as a record. The curves, the splines, the
  millisecond timeline and the prototype that ran them.
