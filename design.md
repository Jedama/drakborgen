# Design notes: attempt 2

A record of the brainstorm that restarted the combat design. It captures decisions and
open questions, not a spec. The first attempt (splines, curves, bands, rolled hit
location, millisecond timeline) is archived in `attempt1/` for reference.

**Read [`vision.md`](vision.md) first** — it explains the game, the feel we're chasing, the
philosophies behind these decisions, and the mistakes that produced them. This document is
the *what*; that one is the *why*.

Scope right now: **a proof of concept for the combat engine.** Traps, dungeon
navigation and the rest come later. Without combat there is no game.

---

## What we kept from attempt 1

- Declaring stance
- Cards and decks
- Fear and pain altering stats and cards
- No damage numbers, no HP
- Commit / feint
- Main hand / off hand, dominant hand, directional attacks
- Lots and lots of stats

## What we dropped

- Resolution curves, bands, splines
- Hit location rolled from a curve
- Continuous millisecond timeline with approach speeds
- Per-turn energy/stamina budget — it said the same thing as the time budget. Replaced by
  drifting Exhaustion and Fatigue (see that section)

---

## The run

Enter a dungeon. Make good decisions for as long as you can. Missteps give you
reaction opportunities. Enough poor decisions and you start getting hurt, and then the
run is about salvaging and getting out alive.

**No loot or XP for kills.** The goal is survival. Running away is a smart move, not a
failure. If your weapon can't hurt it, leave.

## Randomness

**Whether is never random; where can be, a little.** Weapon, card, stats, commitment,
anatomy and the opponent's card decide whether a blow connects, whether a block holds and
whether a dodge works. No hit rolls; you never "miss" because of dice.

The one exception (decided 18 Oct): **where a blow lands within a cell** has some
randomness, and precision limits it (see Anatomy §Where a blow lands). That's what lets a
wild swing find an eye, and what makes precision the size of the gamble. Earlier versions
of this doc ruled out even that ("no vital-hit chance").

Uncertainty comes from:
- **the draw** (which cards you have this turn)
- **hidden information** (the opponent's sequence, feints, whether a move is committed)
- **drift**: where inside a cell a blow ends up

If your mallet can't hit the bat, that's an observation, not bad luck. The counterplay
lives in the breadth of the deck: a faster swing, your fists, the environment, a
committed blow, "take a breath" first.

---

## Turn structure

**Terminology:** *stance* and *intent* are the same thing — you pick an intent and enter a
stance that signals it to the enemy. One word is enough, and the word is **stance**.

1. Both sides arrive and see each other.
2. Draw **~4 random cards** (instinct). These influence which stance you pick.
3. Choose **stance**, blind: charge / attack / await / defend / flee.
   This is the board game's ABC choice.
4. Draw **~6 cards from that stance**.
5. Stances are revealed (always visible to both).
6. Each side **writes and locks a sequence** of cards filling the turn.
7. Resolve.

Stances have **no built-in RPS rules**. Their relationships emerge from the cards they
draw and how those cards meet.

Layering: coarse blind guess (stance), then a detailed informed plan (sequence).
ABC grows into XYZ-and-beyond.

Possible add-on: monsters lock in some cards first, and an analysis-type stat lets the
player read **hints**, never card names or times. For example "indicating attack,
leaning left." Putting everything into analysis means you see it coming but may lack
the stats to answer it.

---

## Decks

- **Weapon cards:** 20+ *unique* moves per weapon (no duplicates), so every hand is a new
  situation.
- **Body cards:** fists, kicks, footwork, the reaction cards.
- **Mind cards:** take a breath, calm, analyse, and the fear stuff.
- **Added junk:** Wince and friends, shuffled in by pain.

Your deck is whatever weapon you're holding plus your general cards. Switching weapons
swaps a big chunk of options, so weapon choice before a fight is a real decision.

**Archetype and signature cards.** Most cards are archetypes (horizontal swing, thrust,
block, footwork) written once in code. They only care what *kind* of thing is in your
hand (long, bladed, pointed, two-handed); the weapon's stats make them behave
differently. A card is **dressed per weapon** ("Staff sweep" vs "Mallet sweep", weapon on
the art) so the player sees what will happen. **Signature cards** are what only one
weapon can do: hilt strike, axe hook, quarterstaff "switch ends". A weapon's deck is its
eligible archetypes plus its signatures.

Card faces show **computed** values: this card, with your weapon, in your posture, costs
2.25. Pick up the mallet and it says 3.

**Every weapon's cards are authored, and as many as possible** (21 Oct). Templates and
archetypes make authoring easier, but every weapon should feel unique, and bringing a
weapon adds *its* cards to your deck. Because each card is authored for its weapon, things
that make no sense are simply never written: there is no wrist flick for a spear, so the
maths doesn't need a rule to stop one. You can look through a weapon's cards and they make
sense.

Parked: card rarities (e.g. a legendary "Decapitate").

---

## Timing

- A turn is **10 time units**, divided into **quarters** (40 slots). Coarse enough to
  see and count; not a millisecond timeline.
- Cards cost time. Mallet swing ~3, sword hit ~2, parry ~2.
- **Flow:** a card can get cheaper when it follows a card that sets it up
  (parry → sword hit, sidestep → rapier thrust). Same hand twice in a row is slower than
  alternating. Flow comes from **posture** (below), not from authored pairs.
- **Quick characters** should fit roughly 3 actions where a slow one fits 2 or 1.5.
- **Phases within a card**, roughly:
  - *windup*: still adjustable, can track a dodge or go around a block, can be bailed
    out of
  - *strike*: locked in, point of no return, where contact happens
  - *recovery*: open, slow to respond

  A sidestep during the opponent's windup gets tracked. A sidestep after their strike
  locks in makes them cut air. A card's phases can be as small as a quarter, so a
  1-unit card can still have all of them.
- **Lock-in ramps up through the windup.** First windup slot: barely committed. Second:
  mostly committed. One value per phase slot, so there's a gradient without curves.
- **Commitment** makes a card a bit quicker and hit harder, but you lose flexibility and
  reaction opportunities (it probably locks in earlier).
- **Getting hit shoves the timeline.** Stagger delays the rest of your sequence.
- **Base pattern, computed length.** A card holds a base phase pattern. Smooth
  computation underneath bends it, and phases snap to quarters (maybe card totals to
  halves, but two rounding steps can disagree; leaning towards phases driving it).
  With this many inputs, breakpoints get smeared and nobody chases one stat value.
- **Modifiers are asymmetric** — different causes stretch different phases:
  - heavy weapon for you: longer windup (getting it moving) *and* recovery (stopping it)
  - high celerity: shorter windup
  - good flow from the previous card: shorter windup
  - commitment: shorter windup, longer recovery on a miss
  - pain in that arm: everything a bit slower
  - the strike itself rarely stretches

### Posture

Where your body is right now. Structured fields, not loose tags:

- **feet:** planted, stepping, crouched, airborne, down
- **weight:** forward, back, left, right, centred
- **main hand:** high, low, left, right, extended, chambered
- **off hand:** same, or "shield up"

Each card **starts from** a posture and **ends in** one. Posture is less a map you
travel across than **"what is this position good for next"**. Per field:

- **hands:** real distance on the 3×3 grid. A staff on the wrong side costs time to bring
  around. A right-to-left swing into a left-to-right swing is cheap because the hand is
  already there. Same hand twice is a special case.
- **feet:** mostly "good start for". Crouched loads a jump, planted suits heavy swings.
- **weight:** minor. Forward gives run-up to charges; it slightly slows very short, close
  cards. Otherwise barely matters.

Only a few bonuses and penalties; no big computation per field. When several fields
must change, they change **in parallel** (the slowest one counts, not the sum).

Cards leave fields they don't care about **blank, and blank is free**. A shield raise
doesn't care about feet.

**Everything is always playable.** Bad posture makes a card slower and/or weaker, never
unplayable. You can raise a shield from the ground; it just covers less or takes force
worse.

Posture is also what an opponent's read shows ("leaning left, blade high").

### Overlap: windups on free body parts

Each card declares which **body parts** it occupies (maybe per phase): an approach uses
the feet; a staff swing uses both hands, plus hips in a high-drive strike; a shield raise
uses only the off arm.

**If the next card's windup only needs body parts the current card isn't using, it can
start early.** Approach into a swing: the swing is readied while walking. Prepping the
staff while shifting weight: same thing. No separate "ready state".

**Only windups overlap, never strikes.** You can't kick and slash at once; both need too
much balance and focus. Motions that genuinely happen together (lunge, parry-riposte,
grab-and-stab, dual-wield double strike) are **single cards** listing more body parts,
often signature cards.

### Passive coverage

A held shield, a staff across the body, a sword in high guard: **posture, not a card**.
When a block card ends, the off hand's posture stays *shield up*, giving **passive
coverage**: it is just an object in the way — it intercepts nothing and gives no brace. That's how you stab from
behind a shield without playing two cards at once.

Possible extra fields, not essential yet: **facing** (squared, side-on, turned away),
**grip** (one/two-handed, choked up, reversed). **Balance** would be derived from feet +
weight rather than stored.

### Engagement (parked)

Binds, clinches, a weapon stuck in a shield, riding the troll's back. This is state
belonging to *the pair*, not to one body, so it doesn't live in posture. It changes
which cards make sense at all (a longsword is useless in a clinch). Later.

### Resolution thinks in events, not ticks

In the hand simulation, decisions were never "what happens at 2.3?" but "what are both
doing when these cards meet?" Resolution looks at meeting points. At each one, the
questions asked were:

- What is each side doing? (attacking, defending, moving, winding up)
- Where in their card are they? (windup / strike / recovery)
- Does the geometry line up? (high/low, side, what the shield covers)
- How ready is the receiver? (brace, momentum, staggered)
- How committed is the attacker? (armor vs gap)

Goal: cards described in one small shared language, plus one resolver that asks these
questions. No card-vs-card rules.

### The timeline really shifts

Outcomes move things on the timeline, and the timeline then decides the next outcome.
Resolution is a short event list: find the next meeting, resolve it, apply the shifts,
look again. Not a tick-by-tick sim.

A cut that lands during a shove's windup delays the shove by a quarter. The delayed
shove now lands during the swordsman's next card, a dodge, instead of their recovery.
No rule mentions "cut then dodge"; it falls out.

Concerns considered and accepted:
- **Cascades:** fine. Players don't plan at quarter-slot precision; the late part of a
  sequence is loose anyway.
- **Deterministic but chaotic:** fine, even good, *if conveyed well*. Adaptive cards late
  in a sequence become insurance against drift. Reaction opportunities change a fight
  more than delays do.
- **Showing it:** the hard part, but should be doable.

**End of turn:** cards pushed entirely past t=10 vanish. A card straddling t=10 cancels
or completes depending on its lock-in. A new turn can't start mid-attack, since stance
and draws happen again. If one side's card runs over while the other's plan has ended,
the other side is unscripted and ready to react to it.

**Empty time is not idle.** Unscripted time is the most reaction-ready state; it's
basically an unwritten await. Leaving slack in a sequence is a real choice.

### Strike meets strike

A simultaneous hit isn't a special case to break. It's the normal "hit mid-card" rule
happening to both people at once. Both land, and each modifies the other through:

- how much a hit **disrupts** (a shove: lots of mass, a lot; a shortsword cut: a little)
- how much a strike **resists disruption** (an all-in shove: a lot; an arm swing: a
  little)

Shove vs cut: the shove barely notices, the cut is spoiled. Two troll clubs: both land
nearly in full. Two jabs: both land fine.

"Hard to disrupt" and "hard to bail from" share many inputs (commitment, mass, momentum)
but aren't forced to be the same number.

A heavy, committed attacker in its second windup slot gets no reaction opportunity, but
if bulky/armored enough it powers through an early cut, delayed slightly.

### Blocks

**The core idea: a block is active interception.** If you play a block card, you are
focusing on the attack and putting all your effort into meeting it. If they swing from the
right, the shield goes right; if they thrust, it goes there. The shield **ends up where it
needs to be**. There is no travel time, no race, no shortfall.

This replaces an earlier, much more complicated model (recorded at the end of this
section, with the reasons it failed).

- **Interception is binary.** Either the guard is on the blow or it isn't. All the grading
  lives in the **force consequences**, which already grade well: a blocked dagger is
  nothing, a blocked mallet still breaks your arm.
- **One block card intercepts one attack.** You can't play *Raise shield* and then idle
  behind it. This is also the handle for flurries and many-limbed monsters: attack twice
  in the time of one block and the second arrives unguarded. (Multiple opponents: out of
  scope for now.)
- **Windows sort the card varieties** by *how long you're willing to not know*:
  - *Hold until hit* — long, and as soon as you block something the next card fires. An
    open-ended wait, so it uses the **await** mechanism: everything you wrote afterwards
    slides, and you hand over the tempo of the turn. If nothing comes, that's the stall
    prompt.
  - *Bunker down* — holds effectively forever.
  - *Snap block* — a narrow guess at a moment.
  - *Slamming block* — short, and spends effort to shove them (returns force).
- **No recovery:** afterwards the shield is still *held*, which is posture, giving
  **passive coverage** of the cell it's in and nothing else. Passive coverage intercepts
  nothing; it's just an object in the way.
- **Blocked is not safe.** Force still arrives: shock into the shield arm (taken by
  strength, mass, brace, the shield's weight and balance point), posture shoved, timeline
  delayed, shield durability spent. A braced knight shrugs it off; a muscle-less skeleton
  with a flimsy shield gets rattled.
- **Return force.** The block card has its own force, made like an attack (drive, arc,
  weapon). `redirected share = block force ÷ (block force + incoming force)`. A passive
  held shield has zero and takes the lot; a firm slam redirects plenty. Whatever is
  redirected is applied **to the attacker** — blade off line, posture changed, recovery
  lengthened. Meeting a troll's club with a light parry is a bad idea.
- **Interrupted paths change posture.** A swing stopped mid-path leaves the hand where it
  actually stopped, not where the card planned, and the next card's flow is measured from
  there.

#### What beats a block

Not geometry. Four things:

1. **Feints.** The main mechanic. A chain like *R→L horizontal cut (feint) → R→L low cut*
   continues the **same motion with no new windup**, so you have already spent your one
   interception on the first destination. It cuts around the shield. Likewise *cut (feint)
   → kick*: the kick arrives from a channel the defender was never attending to.
2. **Attention, which is just your next card.** No eye-tracking system: what you wrote
   next *is* what you were assuming.
   - *Raise shield → counter-cut* says "the blow is coming, I'll take it and hit back".
     If it was a feint, you're committed to swinging at someone who never swung.
   - *Raise shield → slamming block* says "I don't trust this", so the feint finds you
     still there — no reaction opportunity needed.

   Granularity is **the next card only**. This also prices wariness honestly: the
   distrustful line gets nothing when they were honest, the greedy line gets a counter-hit
   into someone mid-swing. A turtling plan can be deliberate: let them wear themselves out
   (overexert/underexert wanted in some form; fatigue still parked).
3. **Overwhelming it.** Mass and momentum: the troll doesn't beat your guard, he destroys
   it. A wooden shield splinters (breaking system later); a metal one holds and *you* get
   moved.
4. **Attacks it can't answer.** Grapples, trips, shoves, fire — things that don't care
   what's in front of your chest.

**Partial blocks are *caused*, not computed.** Corner cases rather than the main path: an
improvised block from a reaction opportunity is poor; a feinted defender with a big enough
shield still has something there. So shield **size matters exactly when you were wrong** —
a buckler punishes it, a tower shield forgives it.

#### Coverage, overhang and precision

Held defences occupy cells (placed by the posture step that adjusts the layout), and size
spills into neighbouring cells. Two things fall out for free:

- **Overhang:** a big attack covers several cells at once, so a giant's palm meets your
  shield *and* your shoulder and hip. No rule needed.
- **Partially covered cells** are where **precision** comes in: low precision hits the
  shield, high precision finds the uncovered sliver.

Worn armour and held defences are the same kind of thing — stuff occupying cells with
coverage fractions — except armour is **static** and a held defence is **aimed**. Aiming
picks the cells, size decides how many, precision contests the partial ones.

Precision is gated so it isn't a general armour bypass:

- **The weapon must fit.** Gap size comes from numbers we already have: a 0.34 m cell is
  ~0.116 m², so a helm at 0.98 coverage leaves ~0.002 m² — a 4–5 cm square, about an eye
  slit. A rapier point fits, a sword's 4 cm blade is marginal, a mallet head is nowhere
  close. So precision bypass is a *dagger, rapier, spike* affair: you can see the gap
  perfectly and still hold the wrong tool.
- **Aiming small costs.** Less drive, worse angle, or a longer windup — and falling short
  means hitting the hardest part of the armour for nothing. A bet, not a free upgrade.
  Cards can author it (*precision strike*).
- **The target's state matters**, as a passive bonus against a compromised opponent.
  Braced, moving and watching is very different from prone, dazed or bound. So precision
  builds play like duelists: engineer the opening, then exploit it. Brutes break the
  shield; duelists make you stumble and then put a point where it hurts.

#### Weapon parries

Same core (active interception), but the difference from a shield should be **general,
from weapon stats**, not authored per card. The asymmetry is what each side presents and
offers:

- a swinging blade **presents** a long moving line, so nearly anything held in its way
  meets it; a thrust presents a **point**, which you must meet exactly
- a shield **offers** a broad face (no accuracy needed); a sword offers a thin edge (it has
  to be right)

So an interception has a **required accuracy**, from the attack's arc and working size
against the defending object's working length and width, compared once against precision.
Deterministic, one comparison, no race. Shields need no accuracy; a sword parrying a
thrust needs a lot; a sword parrying a big sweep is easy.

After contact, parries differ from shields:

- **A shield absorbs; a blade deflects** (the return-force rule above).
- **It costs a hand** — whichever hand holds the parrying thing. A shield leaves the weapon
  hand free, which is the real reason to carry one.
- **Torque and disarms.** Both sides are force × a distance in metres, so no new constant:
  - `twisting = force transferred × contact distance from the hand`
  - `holding = strength × grip span` — hand width (from height) one-handed, or the weapon's
    **grip span** field two-handed (long on a staff, ~0.35 on a longsword). Cards can
    modify it (choke up, grip at the tip). A numbed or broken hand cuts it.

  | defence | contact | twisting | holding | result |
  |---|---|---|---|---|
  | round shield, near centre | 0.095 m | 1.5 | 14.4 | never in danger |
  | sword parry near the hilt | 0.10 m | 2.1 | 5.8 | solid |
  | sword parry near the tip, one hand | 0.40 m | 8.4 | 5.8 | knocked aside |
  | same, two hands | 0.40 m | 8.4 | 16.8 | holds |

  Bands: below 1× you hold; 1–2× the weapon is knocked aside (posture changes, recovery
  grows); above 2× disarmed. In between, a loosened grip can persist.
- **Ending posture** tends to favour a counter, which is what makes parry-riposte natural.
- **Durability:** blades suffer from parrying edge-on much more than shields do.

#### Shields are strong, and that's realistic

For most of history, anyone fighting on foot with a free hand carried a shield. What ended
that was cost, not a counter: plate armour made shields redundant, two-handed weapons and
polearms out-traded them, and weight, fatigue and the lost hand always hurt. Shields also
shine in formation, which a lone dungeoneer doesn't have.

So a metal shield can be near-impervious to honest blows. The counterweights are:

- **the midnight clock** — a shield doesn't make you win, it makes you *not lose slowly*,
  and not losing slowly burns the only resource that matters
- **weight** slowing you through the dungeon (Iril's two-rooms-per-turn is the opposite
  build)
- **one hand gone**, so no two-handers and a different deck
- **fatigue**, once it exists

And the monster roster carries the rest, each with its own answer:

| monster | answer to a shield |
|---|---|
| skeletons (wooden shields) | trivialised — and that's the lesson: bring blunt and a shield to the crypt |
| troll | mass and momentum; the guard holds and you don't |
| many-limbed things | more attacks than you have interceptions |
| bats, snakes, low crawlers | lines a raised shield was never watching |
| grabbers | the shield is irrelevant once it has your arm |
| fire | doesn't care at all |

No battle is trivial anyway: one mistake and the injury consequences are large.

Skill curve this supports: first survival, then survival plus loot, and only when you are
good do you worry about the clock and going deep to the treasure chamber. A new player
takes Rohan and a shield and tries not to die; an experienced one takes Iril for pace or
Yubara for stealth and avoids fights entirely.

#### Rejected: the travel-race model (and why)

The first version resolved a block as: **telegraph** → warning in slots; **distance** in
cells from the guard's position; **guard speed** in cells per slot from weight-for-you and
celerity; **travel time vs warning** → a shortfall in cells; **aim error** = angular error
(from precision) × hand-to-surface distance; shortfall + aim error against an
**arc-blended half-extent** → a coverage fraction. Plus feints eating warning, and block
cards placing the guard on the likely line.

It produced sane-looking numbers and was still wrong:

- **Five mechanisms for one question.** The player only ever asks *did my shield stop it?*
- **Every wrong case added a term.** Each fix was local; the stack was never redesigned.
- **It drifted into physics.** Cells per slot kept being sanity-checked as m/s.
- **A played card could fail for reasons the player couldn't feel.** If you commit a card
  to blocking, the block should happen; being beaten should be a *decision* you lost (a
  feint, a wrong assumption), not a race you didn't know you were in.

Kept from it: return force, torque vs grip span, the presented-vs-offered idea (now a
single required-accuracy comparison), and the force consequences of a successful block.

### Dodges

Rebuilt with the same principle as blocks: **if you commit a card to dodging, the dodge
happens.** Losing should be a decision you lost, not a race you didn't know about.

**Dodges are all-or-nothing.** A block *converts* an attack (you still take force, just not
a cut); a dodge *erases* it. So there is nowhere for grading to live, and that is the
character difference: blocks are reliable conversion, dodges are a gamble. The shield build
grinds down, the nimble build bets. It's also why the shield was the historical default and
dodging is the specialist's game.

**What a dodge answers is a condition over properties the attack already has** — arc, line,
reach, footwork — not an explicit tag pairing and not a per-card matchup table. Adding a
weapon or a monster attack doesn't touch the dodges; adding a dodge doesn't touch the
attacks. A monster's attack profile therefore implies which dodges work on it for free.

As with blocks:
- **one evasion per dodge card** (a flurry beats it — the second blow lands while your
  movement is spent)
- **varieties sorted by how long you're willing to not know**: a late slip is a narrow
  guess, a hold-until-attacked void is the await version, a dive is committed early
- **attention is your next card**: *sidestep → counter-thrust* assumes they committed;
  *sidestep → slip* says you don't trust them. Feints punish the first.
- **partial is caused, not computed**: an improvised dodge off a reaction prompt is poor; a
  dodge that only partly answers the attack gets you clipped
- **posture writeback** already handles where you end up and what flows next

**The cost is different.** A block costs your hand and converts the damage. A dodge costs
your **position and your counter**: out of the way, but out of the fight for a beat, maybe
prone or airborne.

#### How viable is dodging, really

Standalone evasion is weak in real fighting, and the reasons shaped the above:

- backing straight up is a mistake: you lose structure, can't hit from there, and he steps
  with you — you get run down or hit a wall
- voids are small and specific (slip the head, pull the arm, rotate off the line) and
  almost always glued to a parry or counter
- blade reach makes leaning out of a cut unrealistic; boxing-style head movement works
  because fists are short, slow and edgeless
- being lightly armed means *more* caution, not more dodging: distance and point control

So the realistic dodges are small, cheap and keep you in the fight; the flashy ones are big,
expensive and take you out of it. **Realism vs cool resolves through scarcity**: dives,
rolls and leaps are rare cards or hero signatures (Iril's roll), so they land once a fight
and feel earned instead of being the default answer.

#### The lineup

| card | answers | fails against |
|---|---|---|
| **slip** (upper-body shift) | narrow attacks aimed high — jabs, pecks, head thrusts. Tiny, cheap, stays in range to counter | anything wide, anything low, long weapons covering the torso |
| **void the limb** | attacks aimed at a limb you've extended (the counter to someone sniping your sword arm) | body attacks |
| **backstep** | planted attacks — the arc passes through where you were | pursuing cards, charges; and it costs your own counter |
| **sidestep** | narrow attacks, straight-line closers | wide arcs, where you move *along* the sweep |
| **duck** | horizontal sweeps, head-height attacks | downward chops and stomps — you move *into* them |
| **jump** | low sweeps, trips, tail swipes | everything else; airborne means no steering, no bail, easy knockdown |
| **dive / roll** | nearly anything, including areas | prone, long recovery, no counter, needs space |
| **step in / jam** | long weapons (inside reach − working length), undeveloped big arcs | short weapons, knees, shield bashes, grapplers |
| **give ground on contact** | blunt and heavy (the blow spends itself chasing you) — mitigation, not evasion | points and edges |
| **flinch** (fear/pain card) | sometimes helps by accident | mostly wastes the beat |

#### Pursuit

The genuinely new thing with no block equivalent, and it's carried by the card's existing
**footwork** field (which already decides whether your mass joins the force):

- **planted** cards can't pursue: the 360 mallet swing, a rooted heavy cut. Huge force, and
  a backstep beats them outright.
- **stepping** cards pursue: the lunge, the charging chop. They follow you *and* carry your
  mass, which is why they hit hardest.
- **holding** cards don't want to pursue: the prod, the spear poke to keep something at bay.
  If that meets a backstep, the attacker got what they wanted — a control tool rather than a
  damage tool, which is a good thing for spears to own.

Pursuit is **free** — no extra time cost. Any correlation between a card's time and its
pursuit is authored, not derived; this is primarily card interaction.

Rejected: displacement capacity in cells plus clearance-needed sums (the dodge version of
the travel-race model), and clearance multipliers per direction.
---

## The opening of a fight

Fights start at **very far**, so turn one is structurally different — someone has to cross
the ground. (Very far returns later only via a disengage, a toss, or a successful flight.)

**Stance decides who crosses:**

- **charge** — cross fast, and the crossing feeds your mass into the first blow
- **attack** — cross normally
- **await / defend** — don't cross; let them come and spend the beat on preparation
- **flee** — the cheapest exit in the game, since nobody has closed yet

**Nothing should discourage you from crossing.** We want melee. The waiting party gets a
beat, but that beat must not be enough to make engaging feel punished; the risk of the fight
itself is discouragement enough. The distinction is **crossing** (safe, as it should be)
versus **charging** (committing your mass, which is what gets punished).

**Crossing eats slots off the front of the turn**, which puts pace on the timeline where it
can be seen: the troll's crossing takes three units, so his first swing lands late and you
watch it coming.

**Pace decides the cost**, and the consequences are all legible:

- a **fast** enemy (bat, black elf) is on you at once, so you get no preparation beat
- a **slow** one gives you a long beat — breathe, analyse, loose a bolt, set a weapon
- the **slug** may not reach you within the turn at all, which is the whole point of the
  slug: you can simply leave
- the same stat decides whether you can **outrun** something, so fleeing the slug is trivial
  and fleeing the elf is not
- a much faster fighter **chooses the measure** every turn — closing and opening at will,
  with the slower side unable to prevent it. That's Iril's character, and it's what makes a
  disengage stick or fail.

**If both wait**, nobody closes and we're in the standoff machinery: stall prompts, composure
deciding who breaks first, and the clock burning.

**Showing the cost.** Stances are revealed before you build, so the game knows whether they
are closing too (both crossing ⇒ you meet in the middle, each paying about half). What it
can't always know is **their pace** — so the first time you meet something the estimate is
hazy, and once you know how a black elf moves it's precise. Same learning curve as knowing
that elves feint.

**The waiter's cards** come from situational weighting, not new machinery: at very far,
await and defend draws lean toward steady yourself, analyse them, draw a different weapon,
set your spear, loose a bolt.

**Ranged gets its one honest window** here — a thrown rock, a bolt, Bardhor's whole reason to
exist. A crossbow is slow to reload, so it's one shot and then melee, or turns spent cranking
while something walks at you.

### Charging onto a set weapon

A planted spear, a braced pike, a boar spear with a crossbar — these exist precisely because
things run at you. The mechanism needs no new rule: force already takes mass from a card's
footwork, and here it is the **charger's** closing mass feeding the **defender's** blow. A
set spear against a stationary opponent is a modest poke; against someone sprinting onto it,
lethal.

It isn't an auto-win, because the charger may get a reaction prompt — "you're about to run
onto that point" — and pull up short. Composed, improvisational characters can abort;
committed brutes can't.

---

## Exhaustion and fatigue

Two tiers, each with a stat that resists it:

| | stat | resource |
|---|---|---|
| within a fight | **Stamina** | **Exhaustion** |
| across the run | **Endurance** | **Fatigue** |

This replaces the per-turn stamina budget we parked long ago, which was wrong because it
said the same thing as the time budget. Exhaustion is a **drifting state**, not a budget.

**Why it matters beyond flavour:** deterministic resolution has a staleness problem, since
the same two cards always produce the same result. Exhaustion drifting through a fight means
the fourth swing of that mallet is genuinely a little slower and weaker than the first, and
the exchange doesn't repeat. **Variation without randomness**, from something the player can
feel and reason about.

**Exhaustion rises** with effort — drive, arc, crossing ground, armour weight — and **falls**
when you take a breath, disengage, or spend a turn doing little. That is the
overexert/underexert idea arriving naturally: spend big now and be slower later, or pace
yourself and stay sharp.

**What it costs** (refined 21 Oct): exhaustion lowers **effective stats**, and everything
reads effective stats, so it needs no terms of its own in force or timing. Because it gets
applied nearly everywhere, its numbers must be **small**. Placeholder shape, to be tuned:

| stat | how hard exhaustion hits it | from when |
|---|---|---|
| strength | heavy | from the start |
| pace | heavy | from the start |
| footwork | moderate | from the start |
| precision | moderate (shaky arms) | from the start |
| reaction speed | light, then heavy | heavy once badly exhausted |
| analysis, imagination, improvisation | none, then moderate | only when badly exhausted |
| composure | light | when badly exhausted |

The mental stats are mostly hit by **other states** — adrenaline, a racing heart, fear,
stress, confusion — rather than by exhaustion. Only when you're very, very exhausted does
everything take a hit. Not a lot at any one step; enough that the late fight is a different
fight.

**Strength takes it three ways at once**: blows get weaker (arm speed), everything gets slower
(power-to-weight), and weapons feel heavier (the weight penalty's floor is checked against
strength, so an exhausted average fighter's mallet becomes too heavy). No extra rules needed.

**Watch for a death spiral**: tired → weaker → each action costs more relative to your
strength → more tired. The brakes are catching your breath, low-effort cards and the forced
*gasp* cards; whether they're enough is a timing question.

It pairs badly (for you) with **adrenaline**, which masks pain but decays: a long fight
erodes your body *and* stops hiding the damage. Two clocks both saying finish this.

**Cards:** *gasp* or *catch your breath* arriving uninvited at high exhaustion, the same way
*wince* does for pain — and possibly autoplaying, since at some point your body takes the
breath whether you planned it or not. Same mechanism, nothing new.

**Fatigue** accrues across the run — rooms walked, fights fought, weight carried, wounds
nursed — and barely recovers; resting costs the one thing you can't spare. **Magic costs
fatigue**, which is the right price for effects that one-shot.

**The coupling: fatigue lowers your effective stamina.** Fresh on hour one you can push hard
and recover; five rooms deep you're winded by the second exchange. That makes the long
resource felt in every fight rather than only at the end.

**Chases work because of it.** Running from something faster isn't hopeless — it has to
sprint to catch you, taxing its exhaustion. You arrive at the fight tired, but so does it.

Considered and dropped: fear burning exhaustion. One coupling too many.
---

## Measure (distance)

No metres, no tracked positions, no per-part depth layers. **Three shared bands** between
the two fighters:

- **far** — only long weapons threaten. A polearm user's or a long-armed troll's home.
- **normal** — where most fighting happens, because that's where you have room to swing.
- **near** — bodies colliding, touching distance. You can't really swing here, so it is
  **inherently unstable**: you bounce back out unless you keep acting to stay (grappling is
  parked under engagement).

Possibly a **very far** beyond that, where you start and where only ranged weapons do
anything — ranged options are meant to be few.

**Near is held by continuity, not a timer.** As long as your next card also wants to be
there, you stay; a beat of nothing, or a card that needs room, defaults you back out. The
defender can expel you too: their dodge takes them away, their block bounces you off.

This is the same device as attention being your next card — the sequence expresses
continuity, so nothing extra is tracked.

It gives the dagger a real identity: a **pressure fighter who must never let the rhythm
break**. Every card in the string keeps him in; one pause and he's back at a band where he
has nothing. Precarious and terrifying, which is right.

**Whoever wins an exchange sets the measure afterwards** — not a fixed rule about weapon
length. And the quality of the defence is already a byproduct of resolution, so this needs
no new per-card data:

- a clean dodge, a block with force behind it, a shove, a kick → he dictated terms, measure
  resets to his band
- an improvised dodge off a reaction prompt, a partial block, a stagger, a shoved timeline →
  he survived without dictating anything, so you're still inside

That hands **reaction dodges** the cost they were missing: you live, and you lose the
position. He's still in your face and you're the one scrambling. Planned defence is
therefore better than panicked defence without panic being useless.

Cards can override the general rule as needed — a toss throws you to very far, and plenty of
things will depend.

**Crossing far is the interesting part.** Against a sword, nobody cares; you're both at
normal immediately. Against a polearm, reaching normal means spending time inside his good
band, and once you're there he's in trouble. The prod's job is to shove measure back open.
So reach is **upside at one band and a liability at another**, and the fight is about which
band you're in.

### What measure has to cover

- **reach advantages** → the far band, where only he can reach
- **stepping in to the harmless part of a swing** → going near against a long weapon, where
  the shaft is what's between you (reach − working length)
- **a short-range fighter needing to close** → a dagger only threatens at near, must cross
  two bands, and can't rest there
- **attacking and pulling back extended limbs** → *not* a measure question. Your arm is
  extended because you're mid-attack, so "extended" is a **phase**, not a position: a
  snipe-the-limb card requires its target to be in strike or early recovery, which makes it
  a read. The void answers that and nothing else.

### Rejected

- **metres and tracked positions.** Too precise to maintain, and it invited hit-and-run,
  which isn't fun to play against.
- **a 5×5×3 grid.** Two of the three layers would be nearly empty; 75 cells per creature to
  author, and the player reads three pictures instead of one.
- **depth as a per-part attribute.** It answers a narrower question (contact ordering, a
  sniped limb) and is really the 5×5×3 in disguise; a hand also moves between cells during a
  swing anyway.
- **a sticky "closed" flag.** Near isn't somewhere you can camp — you need space to swing
  and manoeuvre, so continuity is what holds it.
- **distance embedded entirely in cards, with no state at all.** Side effects were too big:
  the dagger pays its approach forever instead of once, reach becomes pure upside with no
  close-quarters liability, you can't exploit an opening you just created, and giving ground
  never accumulates.

Later, separately: **position in the room** — obstacles and walls, so diving or stepping
back into one stuns you.
---

## Reaction opportunities

A reaction opportunity is **any moment where the written plan runs out of script**.
You get a small special hand drawn for that kind of moment.

- **Danger** ("you're about to get hit"): duck, backstep, parry.
  Reaction cards are in the normal deck but carry no stance tag, so you rarely hold them.
- **Stall** ("opponent isn't doing anything"): stand your ground, disengage, flee,
  approach, proceed with next card. How many you draw depends on stats
  (imagination / flexibility).
- **Offensive** ("your attack is about to go wrong"): about to hit a shield, about to
  cut air. Draws things like redirect, pull into a feint, push through, abort.
- More kinds later (they fled, you lost your footing...).

**Prompt frequency is a build identity.** High reaction speed, improvisation and
imagination might get 5–6 prompts a turn; that character plays the fight *live*. Set
those low and you get almost none; that character plays the fight *on paper*. What
denies prompts (being locked in) also makes a plan hard to disrupt, so it happens as
written, through the pain. Ending a fight in 3 time units instead of 3 turns is also
*safe*: fewer moments for things to go wrong, adrenaline never runs out.

Emergent matchups: a low-reaction character is immune to feints, so the black elf is
easy for them, while the troll (locked in vs locked in, no way out) is their nightmare.
The improviser has it the other way round. Weak spot of low reactions: the salvage
phase, with no fallback once hurt.

Whether you get one: the **card's bail-ease** × the **character's adaptability stats**.
A troll with a heavy club fails both. An elf with a knife passes both.

**Players get reaction opportunities more easily than monsters.** That's the main thing
that lets players get far. Monsters get them too, depending on the monster.

Small misstep: you get a reaction. Bigger misstep: you get hit or staggered and
your sequence is interrupted.

### Feints

A feint is quicker and can let you slip out of the way almost for free. In attempt 1 it
felt overpowered, because pre-written plans can't be fooled. Now **feints bait
reactions:**

| | defender reacts | defender holds |
|---|---|---|
| **real attack** | saved | hit hard |
| **feint** | momentum wasted | feinter punished |

Feints also trip an opponent's **await** trigger early.

Against a defender who is *already* defending (no reaction prompt), a feint spends their
**one interception**: a chain that continues the same motion with no new windup arrives
somewhere the guard has already committed to (see Blocks). Whether they are caught also
depends on what their *next* card assumed — a wary follow-up is still watching, a greedy
one is not — and on **analysis** (reading the lack of weight behind it). A skeleton bites;
a sharp knight might not.

Falling for a feint gives **wrong-way brace**: readiness went with the shield, so the real
hit lands on a body set against the wrong place.

### Waiting

A card can be "hold until the opponent does something" instead of a fixed duration.
It's opponent-triggered, not "wait until t=4". If nothing happens, you get a **stall**
reaction.

**Composure** sets how long you can hold without a prompt. It also governs fear, so
frightened characters break first. In a standoff, the less composed side's prompt fires
first and they must act. The more composed side's wait then triggers, so they get to
respond. Composure works like initiative in a standoff.

Unused time can pay off next turn: calming, analysing, cards that draw more or better
cards later.

---

## Monsters

Personality comes from **deck plus stats**, not special rules.

- **Black elves** (Gollum-like): quick, nimble, feint-heavy, react a lot, weak hits.
  Hard to hit and predict. Hold your nerve, don't take the bait.
- **Troll:** big commits, heavy club, hard to bail from, low flexibility and
  intelligence. Barely reacts, so feinting is pointless. Get out of the way, punish the
  recovery.
- **Vampire bat:** tiny, hard to hit with slow weapons. Use something fast, or leave.

Players learn tendencies mostly **over runs**.

---

## Anatomy

A body is two things:

- an **anatomy graph**, one per creature: every element of the body, and what lies behind
  what
- a **grid** over the creature's front, which says which *surface* elements a blow landing
  in each cell can meet

Both are used for the *consequences* of a hit that has already connected; dodging, parrying
and blocking are resolved before it.

A blow arrives as a **footprint in real units** — the weapon's working length, positioned by
height and by the card's path — and we ask which cells it overlaps. From there, the graph
takes over.

### The grid: the humanoid layout

Three columns (side, midline, side) and seven uneven rows. Columns are three slices of the
*body*, roughly cheek to cheek — not arms held out wide. Rows are named and proportional:

| row | ~share of height |
|---|---|
| head | 13% |
| neck | 4% |
| chest | 18% |
| belly | 12% |
| hips | 10% |
| thighs | 23% |
| shins | 20% |

```
           side              midline            side
  head   temple, cheek     face, skull       temple, cheek
  neck   side of neck      throat, spine     side of neck
  chest  ribs, lung,       sternum,          ribs, lung,
         shoulder          heart (left-of-   shoulder
                           centre, so it
                           sits in the left
                           side column)
  belly  flank, kidney,    gut, spine        flank, kidney
         liver (right)
  hips   hip, joint        groin             hip, joint
  shins  shin, calf        (stance gap)      shin, calf
  …thighs likewise
```

A cell lists its surface elements and their **shares**, which add up to 1, and which of
them are next to each other (see Spreading a blow). That is all a cell knows. **Surface
elements never cross cells**: the centre of the jaw and the side of the jaw are two
elements, and both can lead to the same jawbone. Everything beneath the surface lives in
the graph, shared across cells.

- **The midline is the duelist's line**: throat, sternum, gut, groin. Exactly what thrusts
  and straight chops are for.
- **The heart is left-of-centre**, so it lives in a side column. Aiming for it is a
  *specific* choice rather than the obvious one.
- **The bottom middle is air** — a wide stance leaves a gap, so thrusting between someone's
  legs hits nothing. The model says so for free.
- **Cells are tall and narrow**, not square: on a 1.7 m human, roughly 15 cm × 34 cm.
- **No outer columns.** A reaching arm or a shield held wide isn't geography; being extended
  is a **phase** (you're mid-attack), as decided under Measure. Arms default to the side
  columns, in front of ribs and flank, which is where they actually hang; posture moves them
  (up a row for a high guard, and so on).
- **Small rows are the valuable ones.** The neck is a twentieth of the body, so hitting it
  deliberately is a precision feat and hitting it by accident nearly never happens. That is
  the gate *decapitate* needs — no special rule, just a small row.
- **Targeting:** ordinary attacks land high or low relative to the attacker's own height;
  specific cards may name a row.
- **Reach by height falls out.** Cells have absolute heights derived from the creature's
  height, so a 1.6 m human cannot overlap a 4 m giant's head, and a goblin cannot reach yours
  unless you are down.
- Cards are written in the **attacker's frame** and mirrored onto the defender: the
  attacker's left is the defender's right.

### The anatomy graph

One graph per creature, not one per cell. Its nodes are **elements** (skin, cranium, brain,
the left eye, a helm) and its arrows mean **"behind me is"**. Each arrow carries a **share**:
how much of this element leads to that one.

- **Shares live on the arrows**, not on the elements, so an element can split to several
  things behind it (cheek skin → cheekbone and teeth) and merge from several in front of it
  (the brain sits behind the cranium, both temples and both eyes) without anyone having to
  decide which side owns the fraction.
- **Deep elements are shared across cells.** There is one brain, reached from three head
  cells and five ways in. Only the surface is per cell.
- **Tiers** — outer, surface, inner, deep — are for reading and drawing it. The arrows are
  what count. Outer is hair, beard, armour, and whatever posture puts in front (a raised
  forearm, a shield).
- **A blow lands on the cell's surface elements by their shares and follows the arrows
  inward.** Penetration and shock travel the same arrows; each element takes what it takes
  and passes on the rest (see Penetration and shock).
- **The graph forgets the way in.** Once a blow reaches an element, it carries on by that
  element's shares, whichever arrow it arrived by. That only goes wrong when different
  parts of one element lead to different things — then **split the element**. A tool, not a
  rule; it should rarely be needed.
- **Nothing is placed.** No coordinates inside a cell, no ordering beyond the arrows.

The natural picture of a graph like this is a **Sankey diagram**, one column per tier, band
widths as shares. A viewer (later an editor) is wanted for authoring.

### Elements

Each element says what it is made of:

- **two reference forces** — the force that half-ruins it through each channel, one for
  **penetration** and one for **shock**. In the *same units as force*, so the comparison is
  like with like and there is no hardness constant. Authoring asks a question a human can
  answer: "how hard must you hit a shin to break it?"
- **steepness:** how fast severity climbs once it's in trouble. Bone is brittle (steep);
  skin just gets a longer cut (shallow).
- **sensitivity:** pain produced per point of severity. A shin or a kneecap hurts out of all
  proportion to the damage; muscle hurts less per point but costs far more function.
- **what it passes on**, one rule per channel. Both subtract as the blow goes inward:
  - **penetration** uses up the element's **penetration reference** and the rest carries
    on. Being cut through *is* being ruined, so how hard something is to cut and how much it
    stops a cut are the same number. Plate stops nearly everything; skin barely slows a
    blade.
  - **shock** uses up the element's **soak**, a separate amount, and the rest carries on.
    Fragility and absorption really differ here: bone is hard to break but soaks almost
    nothing (so a staff to the head dazes), while soft tissue and padding soak a lot. An
    amount rather than a fraction, so padding helps a great deal against a fist and barely
    against a troll's club.
- **its own penalty mapping:** bone → weight-bearing and balance, muscle → push-off and
  strength. No hierarchy between elements — a severed calf cripples a leg about as badly as
  a broken tibia.
- **holes**, if it has any (below).
- **its own effects**, added freely where the anatomy calls for them: a hit to the jaw
  dazes, the inner ear upsets balance, a broken nose makes the eyes water, a cracked temple
  starts a slow internal bleed. These are properties of the element, not rules about
  routes.

Skin, muscle and bone are **templates**, authored once and reused almost everywhere, with
values that vary by place. Fat counts as part of the skin, and it's almost nothing over the
shin, knuckles and scalp but thick over the belly, buttocks and thigh, so the skin there
soaks more. Muscle varies the same way: a thin layer on the forearm, a lot of it in the
thigh. Some elements keep a **hard line** where the fiction demands it (an eye is lost or it
isn't).

Small flavour elements are welcome even when they do nothing in a fight yet — eyebrows,
hair, a beard. They cost almost nothing, and they give later systems something to hold on
to: a beard to grab in a clinch, hair to catch fire, a face for a character creator.

### Holes

Some elements are solid with openings: ribs, the eye sockets, a visor slit, mail. An
element with holes has a **hole width** and a **hole count**. How solid it is falls out of
the two (open area = count × hole size); it isn't authored.

**A contact passes through a hole only if its widest side fits.** Contact area is already
x × y (from working length and width); compare the larger of the two against the hole
width. Holes are treated as symmetric and orientation is ignored. A contact that doesn't fit
meets the solid part. One that fits can pass without touching it — and either way, what's
next is whatever lies behind the element.

| element | holes | what it does |
|---|---|---|
| **ribs** | many, narrow | A point can slip between; swings and blunt blows meet bone. The lung is behind either way. A skeleton's ribs have nothing behind them, so a perfect thrust arrives nowhere. |
| **orbit** (eye sockets, with the eyebrows) | two, eye-sized | A fist or mallet face is too wide: it cracks the orbit (swelling shut, double vision) and the eye is spared. A staff end, a thumb or a point fits and reaches the eye. |
| **visor** | one slit | A point gets through; a mace doesn't. |
| **mail** | many, tiny | Stops cuts, leaks to points — if mail ends up modelled with holes at all. |

Hole width is a fraction of the cell's width, so it scales with the creature; the contact
converts through the cell size like everything else. This is deliberately coarse — refine
it only if it turns out not fine enough to model something we care about.

### Where a blow lands

Which surface element a blow is centred on, once the card has brought it to a cell.

1. **The card decides the cells.** Its path (row, side, entry and exit) says which cells the
   blow passes through, in order.
2. **Analysis decides what you aim for.** Each surface element has a **vital value** (how
   much hitting it matters: eye and temple high, scalp low) and an **obviousness** (how easy
   it is to know it's worth hitting: eyes and throat are obvious to anyone, the temple, the
   liver or the gap under the arm are things you have to *know*). Elements whose
   obviousness your analysis beats are candidates, and you aim at the most valuable one. If
   you recognise none, the blow goes to the card's natural landing spot.
3. **Precision decides how far you drift.** Precision is compared against how hard the aim
   is to hit: the element's size (small is hard) and the target's state (a dummy or a dazed
   man is easy, a moving one hard). The result is never a hit or a miss but **drift**: how
   many rings of neighbours away from the aim the blow is centred. Exhaustion and fatigue
   make both aiming and hitting worse.
4. **Chance decides which way it drifts.** This is the one random step in resolution (see
   Randomness). Aim at the temple, drift one ring, and the roll picks ear, scalp or cheek.
   The wild haymaker that finds an eye is a long drift in a lucky direction, which is why
   it's rare, and why precision matters: it is the size of the gamble.
5. **Then spreading, the graph, and luck.** The contact spreads from its centre (below),
   force goes inward, and luck nudges whatever ends up borderline.

**Aim once.** Steps 2–4 happen in the first cell the blow enters. A swing that still has
force to carry into the next cell lands on that cell's natural spot for the card, with no
new aim and no new drift. Hard elements stop most edges and turn the rest into a push (see
Force along a path), so carrying on is the uncommon case and doesn't need machinery of its
own.

### Spreading a blow

How a blow that has reached a cell is shared between that cell's surface elements.

- **A contact is centred** on one surface element, chosen as above.
- **If the contact fits inside that element**, everything lands there. An element's area is
  its share × the cell's area, and the contact's is x × y, both in m².
- **If it's bigger, it spreads to the element's neighbours**, then to their neighbours, ring
  by ring, until the contact is roughly used up. A contact extends both ways from its centre,
  so a cut centred on the nose reaches up and down (or left and right) at once.
- **Adjacency is plain and undirected**: each cell lists which surface elements touch. No
  above or below, no horizontal or vertical, no exact accounting of how much length each
  element uses up.
- **A contact that runs out of cell** carries on into the next cell over, which is the
  grid's job, exactly as swings already travel cell to cell.

**Why rough is fine.** Bodies twist and turn constantly in a fight, and the player never sees
how force was divided — only "jaw cracked, brow cut, reeling". If a horizontal slash catches
both jaw and forehead, the fiction absorbs it: the head was tilted, or turning away. The
test isn't whether the spread is anatomically exact, but whether the result **reads as
something that could have happened**. A fist to the jaw blinding both eyes would fail it;
plain adjacency makes that kind of result very unlikely, because the eyes aren't next to the
jaw.

### Armour

**Armour is outer elements**, in front of the elements it covers. It doesn't change the grid.
An open-faced helm simply doesn't cover the face; it needs no hole. A **visor** is its own
element in front of the orbit, so a point through its slit reaches the eyes and not the
forehead.

| piece | in front of |
|---|---|
| sabaton | the foot |
| greave | the shin |
| mail chausses | the lower leg, with tiny holes |
| padded hose | the lower leg: poor against penetration, good at soaking shock |
| helm | scalp, forehead, temples |
| visor | the orbit, with a slit |

Plate is hard: it stops penetration and passes shock. Padding soaks shock. (An earlier
version of this table had the greave as front-only, leaving the Achilles open. That needs
attacks to have a direction, which is shelved — see `ideas.md`.)

Words: **share** for how much of the body an element is, **coverage** for things worn or
held.

### Containers

A **container** is a named group of elements — "left lower leg", "head" — and nothing more.
It owns no rules. It is how the game talks to the player ("your left leg is broken"), and how
anatomy gets authored once and reused (left and right are mirrored, and any creature with
legs can borrow a leg).

### Worked example: the head

Shares are placeholders. Left and right are mirrored.

**Grid.** Every surface element belongs to one cell, so the scalp, cheek and jaw skin come
in a centre piece and side pieces.

| cell | surface elements and shares | next to each other |
|---|---|---|
| centre | forehead skin 0.25, jaw skin 0.21, cheek skin 0.10 each side, lips 0.10, nose 0.08, orbit 0.08, scalp skin 0.08 | scalp – forehead – orbit; orbit – nose, both cheeks; nose – cheeks, lips; lips – cheeks, jaw; cheeks – jaw |
| each side | scalp skin 0.25, cheek skin 0.20, jaw skin 0.20, temple skin 0.20, ear 0.15 | scalp – temple; temple – ear, cheek; ear – cheek, jaw; cheek – jaw |

**Graph**, outside in. The pieces of one skin lead to the same thing behind:

```
hair       → scalp skin (all three)
beard      → jaw skin (most), lips (a little)

scalp skin (centre, sides) → cranium → brain
forehead skin              → cranium
temple skin                → temple (thin bone) → brain
orbit                      → left eye, right eye → brain   two eye-sized holes; eyebrows
nose                       (dead end)                      bleeds, waters the eyes
ear                        → inner ear                     balance
cheek skin (centre, side)  → cheekbone, teeth
lips                       → teeth → tongue → throat (neck)
jaw skin (centre, sides)   → jawbone                       dazes

brain                      → brainstem                     deep; a backstab target
```

What it shows:

- **The brain has five ways in**: the cranium, both temples, both eyes. The danger of the
  temple is a property of the temple (thin bone), not a rule.
- **Dead ends are fine.** Nose, cheekbones, jawbone and inner ears have nothing behind them;
  what they *do* is their own effect.
- **Blunt doesn't reach the brain as a cut.** Every way in passes bone or the orbit, so a
  staff to the head arrives as shock and dazes.
- **It's small to author**: about thirty elements and forty arrows for the whole head,
  mirrored.
- **The face has no muscle layer.** The expression muscles are thin sheets that protect
  nothing. Candidates if anything earns a place: the temporalis (a chewing muscle padding
  the temple) and the masseter (over the side of the jaw).

### Other bodies

The humanoid layout and graph are written once and shared by every humanoid — skeletons,
goblins, bandits, the other heroes. A creature only needs its own when its body genuinely
differs:

- **bat:** 3 × 1 — wing, body, wing, at roughly 42 / 16 / 42 — with a tiny absolute height
  and width, which is what makes it hard to hit. Your weapon's footprint may cover the whole
  creature, so the problem is connecting at all rather than choosing where.
- **spider:** wide and low, with eight legs around a body.
- **giant slug:** two rows, a handful of columns, nothing but flank. Its job is to make you
  turn around unless you brought something specific — so its interest lives in its elements
  and hide rather than its layout.
- **dragon:** a body plus a neck and tail whose cells *move*, which is where monster posture
  comes in.

### Rejected along the way

- **A uniform 5×5 with the legs stacked in the middle column.** Legs don't live on your
  midline; the midline is the high-value target line, and between the legs is air.
- **4×5**, which gives clean left/right but loses the midline — head, sternum, spine and
  groin would all straddle two cells, which is worse.
- **Sub-cell positions or an ordering of elements within a cell**, i.e. mapping anatomy
  inside a region. The graph does what that was for.
- **Outer columns as cells**, for reaching arms and held shields: nearly always empty, and
  better expressed as the extended *phase*.
- **Depth as a third axis or a per-part attribute** (see Measure).
- **A chain per cell, or per container** (skin → muscle → bone, with features dotted in).
  Fine for a thigh, but a face is several chains side by side, and one brain sits behind
  many of them. Replaced by one graph per creature.
- **Layers that always fill their container.** A ribcage is mostly gaps. Replaced by shares
  on arrows, and holes.
- **"Between the ribs" as its own arrow.** Splits one thing in two; a hole in the ribs says
  it, and the lung is behind either way.
- **A single coverage fraction for holes**, and **solidity plus a maximum gap**. A fraction
  can't tell one big hole from many small ones, and a collective gap size lets anything
  through. Hole width and count replaced them.
- **Vertical and horizontal spans** to describe holes: more numbers than the cases needed.
- **Comparing contact *area* against a hole.** A sword edge is ~8 cm × 1.5 mm, tiny in area,
  and would "fit" an eye socket. The widest side is what has to fit.
- **The orbit rim as a placed piece of cranium.** It earned its place only as its own element
  with holes.
- **A thin bone behind the eye.** Anything that bursts an eye goes through it anyway; eye →
  brain does the same job.
- **Nose and nasal bone as two elements.** Same consequences; one element.
- **Spreading by share across the whole cell.** Puts part of a jaw blow on the scalp.
  Replaced by spreading to neighbours.
- **Directional neighbours** (above, below, left, right), and later **neighbours tagged
  horizontal or vertical**, so a cut could travel along its own axis. More precision than
  anyone would ever see; the fiction absorbs a slightly wrong spread.
- **A finer grid in the head**, or **a small picture of the surface per cell**, so the grid
  itself supplies neighbours and direction. Considered as a way to avoid having two systems
  for "where"; not needed once rough spreading was accepted.
- **Exact accounting of how much contact each element uses up** (for instance an element's
  length along the cut as the square root of its area). Hand-waving dressed as precision.

### Posture adjusts the layout

A small adjustment step runs first, then the grid and graph handle everything (both what
the blade meets and what the hit does). Considered and rejected: a fully static layout, and a
separate "contact decides interception" layer. One adjusted layout is simpler.

- **crouch:** the leg rows compress and the head comes down; a smaller target, so high
  attacks find nothing
- **arms:** move within their own 3×3 around the shoulder
- **weight / jumping:** shift the whole layout relative to the attacker (an offset when
  mapping the attacker's swing onto it)
- **shield:** placed in front of cells by the off-hand posture
- **non-humanoids** (snake, spider, bat): no posture system at all, so a static layout

**Overlap is the point.** A raised forearm ends up in front of the head; a shield in front of
the chest. Posture just adds **outer elements** to the graph, e.g. the belly reading:
shield → forearm → skin → muscle → ribs → lung. Force filters inward: the shield stops most,
some slips past its rim, the forearm takes some, a sliver reaches the ribs. Blocking with
your forearm falls out for free.

### Force along a path

- **Swings are sequential.** The blade meets the first cell, that cell takes what it takes,
  and the remainder carries on. A sweep through an unarmoured arm still has force for the
  chest; into a plated arm it's mostly spent. Order matters, so which side the swing comes
  from matters.
- **Thrusts are sequential too**, but *inwards*, along the arrows of the graph.
- **Areas are even.** A body slam isn't a path: chest, stomach and both upper arms take
  modest shock at once. Both modes exist.
- **Passing through.** The graph is front-facing, so a chain has no far side: an arm is skin
  → muscle → bone, and that's the end of it. **If penetration is still left over at the end
  of a chain, the blow went through** — severed for a swing, skewered for a thrust — and the
  leftover carries on: sideways into the next cell for a swing, deeper for a thrust. A sweep
  through a bare arm still has force for the chest; a plated arm eats it. No extra rule:
  it's the penetration subtraction running out of things to subtract from.
- **Limbs yield.** Blunt force doesn't cut through, it shoves through. An arm can be knocked
  aside, so it passes more force on than the torso, which has nowhere to go. Severing needs
  huge force relative to the bone, and should be rare.
- **What the torso doesn't stop moves the body.** A blunt blow into the left chest that
  still has force left after the chest's elements doesn't carry on to the next cell like a
  blade. It turns or shoves the whole body, through disruption and the knockdown check
  below. So a troll's club with a lot left over sends you flying, and nothing extra decides
  that. The same goes for a blade stopped by something hard: a sword that bites into a
  skull and stops rocks the head and staggers him.
- **Every blow's force ends somewhere**: used up as damage in the elements it went through,
  carried on (through, deeper, or into the next cell), or moving the body. Nothing is left
  over unaccounted for.
- **One blow reaching an element by several paths is one hit.** A sweep through all three
  head cells meets three pieces of jaw skin, and all three lead to the jawbone. Each path
  loses its own soak on the way in; what arrives is added up, and the jawbone is judged
  **once**. So the wide blow lands a little weaker than the same blow on a narrow area,
  because more tissue was compressed getting there. Separate blows are different: those
  add up as severity (bruised + bruised can become cracked). The order matters because
  damage rises faster than force does, so working out three small hits separately would
  badly understate one big one.
- **Knockdown is checked afterwards**, once every cell has been resolved: total body shock
  vs mass, balance, current feet posture and brace. Direction decides which posture field
  moves (a side cut shoves you sideways, a slam backwards).

There is **no separate "loss" step**. Disruption spoils force at the source (step 1), a
partial dodge changes which cells are reached, a block is just one more thing in the path
(the shield is armour you're holding), and brace only affects how the receiver takes it.

Immunities come free: a skeleton has no skin, so it can't bleed; no nerves, so no pain.
Nobody writes "skeletons are immune to bleed". **Blunt is good against bone**: it cracks,
blades skid off, thrusts pass between ribs and hit nothing. Bring the staff to the crypt.

**Deterministic overlap:** no roll for "did it hit the eyes". A blow distributes its force
by **fraction**: weapon coverage, card path and precision decide what share each element
receives, and the shares decide how much there is to cover. A broad club across the face
gives the orbit a good share; a precise thrust aimed at an eye puts nearly all its force
there.

### Penetration and shock

Two channels, and **neither is an authored damage type** — they're derived from the contact:

- **penetration:** breaks the protector to reach what's inside (cuts, thrusts)
- **shock:** passes through the protector without breaking it (mostly blunt)

`concentration = reference contact area ÷ actual contact area`, with the reference being
about a staff's end (~0.0009 m²). The **penetrating share** of the force rises with
concentration × **keenness** (a weapon stat); the rest is shock. Contact area comes from
working length and width, so:

- **point** (small × small): enormous pressure → deep and narrow
- **edge** (long × thin): high pressure along a line → wide and shallow
- **face** (wide × wide): low pressure → nothing penetrates, everything transmits

A spiked morningstar lands in the middle honestly: small contacts on a heavy head. Cut,
pierce and crush all emerge, and so do the awkward cases — a thrust with a shield is blunt
force, and the same sword chops or slices depending on the card's travel along its edge.

**The contact geometry does two separate jobs**, and both are needed:

- **concentration** (force ÷ area) decides **how deep** it goes
- **contact width** decides **how much got cut** — the extent of the wound, which scales
  severity

Without the second, a rapier puncture would disable a calf as badly as an eight-centimetre
slash. With it, the puncture is shallow in consequence, real in pain and bleeding.

A staff to the jaw doesn't crack the skull, but shock reaches the soft brain: dazed.
A sword there cuts skin, maybe chips bone, sends little shock inwards. A skeleton has no
brain, so it can be broken but never dazed. A blunt hit to an armoured chest still
knocks the wind out (lungs).

Shock also goes to **the whole body** as disruption (resisted by mass, balance, brace),
and **location decides which posture field it hits**:

- legs → feet: footing lost, maybe a trip
- torso → weight: knocked back, balance shifted
- arms → hands: weapon knocked wide, grip loosened
- head → some stagger, plus the daze inside

Same force, different place, different outcome. Consequences write back into posture,
and posture decides what the next card costs.

Pain and disruption are separate: skeletons ignore the *hurt* but still get *shoved*.

---

## Consequences

- **Stats have base and current values.** Display: a small footwork icon with
  `41 −8`. Hover: `Pain: left shin −8`.
- **Pain:** modest. Lowers stats, and adds cards like **Wince**. Pain should do more than
  narrow your options: these cards may **autoplay**, putting themselves onto your timeline so
  you have to build around them (you don't choose to wince). Exact shape undecided. Fades *gradually* between
  fights depending on severity, so rushing into the next room means going in hurt.
- **Bleeding, broken things, (fatigue?)** carry over. Bleeding is a clock toward the exit.
- **Adrenaline** rises when hurt and temporarily counteracts bad effects, but falls off
  over turns. Short fights you ride through; long fights the bill arrives.
- **Brace:** a temporary boost on top of pain tolerance, raised by cards: how ready you
  are to take a shock, *and where*. Raising a shield braces high; a feint can move it,
  leaving you braced for the wrong place (effectively negative). A braced knight hit on
  armor might take only −1 footwork and a small stagger.
- Leaning: *kind* of injury from weapon + location, *severity* from commitment + how the
  defence went. Not settled.

### Severity: graded underneath, labelled on top

**Status: an idea, not settled.** The formula below was Claude's proposal during a quick
worked example (13 Oct). Dan liked the reference forces and the labels, but the formula
itself was never properly discussed and is expected to be revisited. The labels, and
severity adding up and weakening an element, are on firmer ground than the maths.

Per element, compare what arrived through each channel against that element's reference
force for that channel:

```
severity = 50 × (arriving ÷ reference) ^ steepness        (capped at 100)
```

scaled by the wound's **extent** (contact width) for the penetration channel. Then the
remainder passes inward along the arrows of the graph.

That's the whole calculation. The only shared constants are the reference contact area and
the 50; everything else is a property of the element or the contact.

**Ladders are fine-grained, with intensity words doing the smoothing**, because labels
jumping from "bruised" to "broken" feels discrete even when the number underneath isn't:

- **bone:** 0–10 bruised · 10–25 badly bruised · 25–45 hairline crack → cracked ·
  45–70 broken · 70+ shattered
- **skin:** scratched · cut · gashed (bleeding follows)
- **brain:** rattled · dazed · concussed

**Penalties interpolate inside a rung**, so a 46 and a 68 both read "broken" and cost
different amounts of pace and balance. The label says what happened; the number says how
much it matters. A second hit on a cracked shin can keep saying "cracked" while the penalty
creeps, until it tips into broken — a limb deteriorating rather than flipping states.

A few elements keep a **hard line**, where the fiction demands it: a severed tendon isn't a
worse strain, and an eye isn't partly lost.

Presentation (later): a hit rocks the screen and throws up a stack of short brutal phrases —
"Tibia cracked", "Severe pain", "Off balance", "Reeling" — rather than one tidy line.

**Severity adds up.** Bruised + bruised can become cracked. And damage **weakens** the
element — its reference forces drop — so a cracked bone breaks more easily. Two moderate
hits on one shin are worse than one on each. Targeting a wound is a real tactic.

### Worked example: three weapons into an unarmoured shin

**Every number in this example is made up**, to show the shape of the calculation. None of
them is calibrated, and the passing-on figures were improvised rather than taken from a
rule. Lower-leg elements:

| element | pen ref | shock ref | steepness | sensitivity |
|---|---|---|---|---|
| skin | 6 | 60 | 1.0 | 0.8 |
| muscle | 25 | 50 | 1.0 | 0.6 |
| bone (tibia) | 90 | 45 | 2.0 (brittle) | 1.4 |

**Committed quarterstaff strike** — force 50, contact 3×3 cm (concentration 1.0), keenness 0
→ **pen 2.5, shock 47.5**
- skin 40 *bruised* · muscle 47 *deep bruise, cramping* · bone 44 ÷ 45, squared → **48,
  broken**
- a casual tap at force 25 gives bone 14, *bruised*. **Calibration anchor:** a committed
  two-handed staff strike breaks a shin; a tap does not.

**Sword cut** — force 53, edge contact ~8 cm × 1.5 mm (concentration 7.5), keenness 0.9
→ **pen 39, shock 14**
- skin *gashed*, bleeding, passes 33 on · muscle 65 *cut deep*, push-off gone ·
  bone severity 4, *notched but intact*

**Rapier thrust** — force 30, point 4×4 mm (concentration 56), keenness 0.95
→ **pen 28.5, shock 1.5**
- skin *pierced* · muscle: 22.5 vs 25 would be severity 45, but the extent is ~0.15 of the
  sword's, so **7** — a puncture that hurts (sensitivity), bleeds a little, and leaves the
  leg mostly working · bone untouched

Three completely different outcomes on the same target, from one set of numbers and no
authored damage types. A staff breaks shins, a sword opens them, a rapier punctures them.

**Addendum (17 Oct).** Two things this example gets wrong, to fix when it's redone:

- **The layering.** The front of the shin has almost no muscle: it is skin (with its thin
  fat) straight onto the tibia, which is exactly why shin hits hurt so much and break so
  easily. The muscle is behind, in the calf. In the graph that's two surface elements:
  front of shin → tibia, and calf skin → muscle → tibia. A staff to the front breaks bone;
  the same blow to the calf mostly bruises muscle.
- **Shock losses were improvised.** The penetration figures already follow the
  subtract-the-reference rule (the sword's 39 loses the skin's 6 and 33 reaches the
  muscle). The shock figures just shrank "a little" at each layer. They should come from
  each element's soak.

### What a hit leaves behind

An injury has separate parts:

- **structural** (the shin can't bear weight well): stays for the rest of the dungeon
- **pain** (it hurts): fades over time; adrenaline masks it mid-fight
- **bleeding**, if skin was cut: gets *worse over time* until stopped; a clock (turns in a
  fight, rooms in the dungeon)

So "−34 pace" might be −20 from the break and −14 from the pain, with adrenaline
counteracting some of the pain part.

**Blood loss** by stage: a little (anxiety, fast heartbeat → fear); moderate (weakness,
cold, tiring fast → endurance, strength); a lot (dizziness, confusion, clumsiness → balance,
reaction speed, analysis), then passing out.

Other results a hit can produce:
- **winded** (chest or stomach, even through armor): short-lived, hits endurance and
  celerity hard for a turn or two
- **dazed** (head): reaction speed, analysis, balance; fades fairly fast; breaks mind
  states like berserk
- **numbed or lamed limb**: loosened grip, maybe a dropped weapon at high severity
- **blinded** (one eye or both): precision, instinct, maybe analysis; possibly lasting

Stopping bleeding is **rare mid-fight**. No bandaging while something charges at you.
*Apply pressure* is a body state: the off hand holds the wound, bleeding slows, and you
fight one-handed.

### Fuzzy injuries and "Assess damage"

Mid-fight you know **what** is wrong but not exactly **how much**: "Broken shin −? pace,
−? balance", with colour or size hinting the level.

**Card faces always tell the truth.** With a broken shin, *Run away* says 4 and takes 4.

*Assess damage* (costs ~1–1.5):
- reveals the exact numbers
- lets you **adapt**: you learn to lean on the other leg, so *Run away* drops to maybe 3.
  Assess + run is roughly as fast as just running.
- **lowers fear**, and fear lowers reaction speed and improvisation, so it pays off if the
  thing chases you

Everything is deterministic: the injury follows from the stats of the exchange, and the
adapted values follow from the injury.

---

## Fear and mind states

**Fear** is a live value, like brace is to pain tolerance: derived from **composure**
(base), the opponent's **intimidation**, and how the fight is going.

Fear works like pain, through the same machinery (small stat drops plus cards entering
your draws):
- slightly slower footing and speed
- dead-ish cards: **Falter**, **Swallow**. Playing one costs a slot but restores a little
  composure/nerve. Steady yourself now, or push through with a thinner hand?
- stance draws get contaminated: pick *charge*, and *back off* and *run away* still show up.
  You intend to charge, but that's what your mind comes up with.

All on a scale. **Panic emerges**: at high fear your charge hand is mostly run-away and
falter cards. No hard rule needed; the player sees it coming hand by hand.

Intimidation vs composure: intimidation is how much fear you push into others; composure
is how much you take and how fast you shake it off.

### Mind states

Persistent states that sit alongside other cards. They use no body parts. (Body states
are posture: shield held, pressure on a wound.)

- **Berserk** (like Charak Hai in the board game): a **temporary skew**. Pain tolerance
  and strength way up; reaction speed, analysis, improvisation down to nothing. Lasts
  until the fight is over, **no voluntary exit**, and locks stance to charge/attack (no
  flee, no await). Can be broken by a **daze**.
- Others: focused, calm, and so on.

Each state defines its own endings: end of turn, a card to stop it, or something breaking
it. States breakable by the opponent become something to play against.

---

## Worked example (rough)

Rapier duelist vs armored knight with longsword and shield. Nobody takes their reaction
opportunities (to avoid branching).

| t | what happened |
|---|---|
| 0–1 | Duelist advances. Knight raises shield (braced). |
| 1–2 | Duelist feints high. No reaction for the knight, since his card already defends. Shield goes high. |
| 2–3 | Low thrust slips under the shield, but it isn't committed, so it hits armor. Knight advancing also robs the thrust of momentum. |
| 3 | Knight barely hurt (high brace): maybe −1 quick-footedness, no card. Small stagger slows his overhead. |
| 3.5 | Duelist sidesteps, but the overhead is still in windup and tracks it. |
| 5.x | Duelist gets a danger reaction (unused). Overhead lands: badly hurt. |
| 6 | Duelist staggers back; shield bash misses. Reaction opportunity to retreat (unused). |
| 7–9 | Debuffed lunge hits the raised guard. |
| 10 | Turn over. |

Lessons: think in events; windup is trackable; stagger shoves timelines; rapier vs full
plate is rough (fine, run away or pick a better weapon).

## Worked meetings: quarterstaff vs skeleton

Human (1.80 m, average mass, strength 55) with a quarterstaff vs a light skeleton
(1.70 m) with a light wooden shield (left arm) and sword.

**1. Staff sweep vs Raise shield.** The skeleton is focused on intercepting, so the shield
is where the sweep arrives: the staff hits wood. A staff is light, so little rattling on either side. The real consequence:
the staff stopped mid-path, so it's on the "wrong" side for the next card.

**2. Feinted overhead → Low sweep vs Raise shield.** The feint spends the skeleton's one
interception (low analysis, it bites), and the low sweep continues the same motion with no
new windup. The staff is two-ended: the top end went up, the bottom end is already low, so
the flow into the low sweep is cheap. The sweep connects low on a
skeleton braced the wrong way: a trip. No pain, but feet go to *down*, and getting up
eats its next turn.

---

## Making the force

Reworked 20–21 Oct, ingredient by ingredient, then through two rounds of outside review.
The full maths, the example tables and the review exchange are in **`force-model-review.md`**
(§1–11 the first version, §12 the round-two changes); this section is the current shape.
All numbers are invented and uncalibrated.

```
arm            = arm_speed(card) × (1 + strength / 10) × weight_penalty
speed_at_hands = arm + run_up_speed
speed_at_part  = arm × lever + run_up_speed

force = part_weight × speed_at_part  +  body_share × mass × speed_at_hands
```

**Your body's weight arrives at your hands' speed; only the weapon's own weight gets the
lever.** This is the key decision of round two. Before it, the body share rode the lever,
which said your body hits at the speed of the sword tip; that's what made the tip out-hit
the edge.

### Speed

- **Arm speed** comes from the card. Strength multiplies it: `1 + strength / 10`, so ×1 at
  0 (the default), ×1.5 at 5, ×3 at 20. Linear for now; a per-stat transform for
  diminishing returns is an idea (`ideas.md`).
- **The lever** is how much faster the striking part moves than the hands, so **1 means hand
  speed**:
  - swings: `(joint_radius + distance) ÷ joint_radius`
  - thrusts: 1, because the weapon moves rigidly with the hands

  `distance` is how far out the striking part is (m). `joint_radius` comes from **the card:
  which joint drives the move** — wrist ~0.05, elbow ~0.35, shoulder ~0.7, spine ~0.9, with
  in-between values allowed. Probably scaled by the fighter's height. A strike at the hands
  is ×1 whether it's a swing or a thrust, so a hook and a straight punch differ only by what
  their cards say. A wrist flick's ratio gets large, but in a flick the hands barely move, so
  the card's arm speed is small.
- **Run-up** adds to speed, and isn't levered: `run_up_speed = k × (1 + pace / 10) ×
  ground_crossed`, usually 0. It scales with how much of you the card brings: a charging
  shoulder slam carries most of its weight at run-up speed, a charging dagger lunge only a
  little.
- **The weapon weight penalty** is a **floor**, not a mid-tier gate: it keeps a strength 0
  fighter from comfortably using a mallet, and an average fighter should barely ever see it.
  Felt weight = weight × (1 + how far the balance point sits from the hands);
  comfortable weight roughly 2.5 + 0.3 × strength, doubled with two hands. Shape only; tune
  with the weapons.

### Weight

- **Swings count the striking part's effective weight**, authored per part. It peaks around
  two-thirds of the way out (about three-quarters of an evenly weighted blade) and is small
  at the tip (about a third). A sword's middle edge is ~1 kg, its tip ~0.45; a mallet head
  nearly all of the mallet.
- **Thrusts count the whole weapon**, since it moves as one piece and its momentum doesn't
  pass through your grip.
- **Body share × mass**: how much of you the card brings, from a wrist flick (none) to a body
  slam (~0.6). **Mass is total mass**: your body plus armour, pack, loot and whatever else
  you carry. So an armoured knight's charge or slam carries more.
- **Total weight mostly shows up in timing, not force.** Carried weight only adds to a blow
  when you throw your body into it; everywhere else it makes you slower (power-to-weight)
  and tires you faster. A heavy *weapon* is different: it hits harder and is slow to get
  moving.
- **Grip caps a thrust's body share**: what passes through your hands is your body, and a
  grip can only hold so much before it slips. One-handed thrusts are light vital-seekers;
  two hands, a brace or a couched spear turn thrusts into drives.

### What falls out

- **The sweet spot appears in force**: the middle of a sword's edge out-hits the tip.
- **Heavy heads matter**: a mallet hits about twice as hard as a staff end.
- **Light weapons live on the body**: daggers and swords depend on how much of you goes in.
- **Long light weapons gain little from length**; long heavy ones gain a lot, and timing has
  to slow them.
- **Pushes are just strikes at the hands**: a cross check is a punch with the whole staff and
  a wide contact.
- **Blades don't break bone; blunt weapons do.**
- **Stepping inside a long weapon helps**: the nearer parts move slower and are often blunt.
- **All forces dropped** with round two, so the calibration anchor (an average committed
  staff strike just breaks a shin) needs re-tuning.

### The sweet spot and grip

Besides force, striking hard things (bone, a shield, armour) with the **extreme tip** twists
the weapon in your hand: deflection, hand strain or lost posture if your grip can't hold.
That uses the parry model's `holding = strength × grip span`. So the tip offers reach and
vital-sniping, and the middle of the edge is the reliable striking zone.

### Strength, mass and size

**Force and time are separate.** One "speed" was doing two jobs: how much momentum a blow
carries, and how quickly the swing happens.

- **Force** uses strength and mass, as above. A troll hits like an avalanche.
- **Time** (windup, recovery) uses **power-to-weight**: strength relative to what's being
  moved, your own body plus the weapon's felt weight. A troll's attacks have long, readable
  windups.
- **Size tiers** (medium, large, huge, colossal) give a creature its **baseline muscle**. Muscle
  grows with cross-section and weight with volume (square-cube), so bigger creatures are much
  stronger in absolute terms but weaker relative to their own weight, which is why they're
  slow. Captured as an authored table, not a runtime exponent.
- **Strength is strong or weak for its kind**, on the same 0–20 scale: an average troll is
  about 5. No creature should need an absurd number to make the maths work.
- **A build factor** on the frame says when a physique is built for hitting (troll arms), so
  that's a fact about trolls rather than a fudged strength number.

### Counterweights, in timing

Long and heavy weapons gain a lot from the lever and their weight, and timing is what pays
for it. Heavy and long are different costs:

- **heavy** is slow to *get moving*: long windups, from felt weight against strength
- **long** is hard to *change once moving*: early commitment, a long recovery on a miss or
  parry (no defensive cards in it), and a dead zone inside, where only the shaft can reach

A dagger's real strength is the opposite: being able to change plans mid-strike. Timing is
the next topic; the lever shouldn't be finalised without it.

Ignored for now, noted: posture, disruption mid-strike, the target's own movement into the
blow, exhaustion, fatigue, injuries.

Not part of force: **precision** decides where it lands; **keenness and contact shape**
decide the penetration/shock split; **how long the swing takes** is timing.

Then the force is **split** (penetration vs shock, by contact and keenness) and **spread**
(see Anatomy §Spreading a blow).

*Superseded, in order:* (body + swing + moving mass) × handling; then weight × speed with
the lever measured from the hands as `1 + distance`; then with the body share riding the
lever, part weights derived with a one-third floor, and run-up added to force rather than
speed (a running dagger hit like a battering ram). Strict power-to-weight in force was
considered and rejected: it cancels body mass out of every swing.

### House rules for the maths

Learned from a first worked example that got too clever:

- **Two currencies only: cells and time slots.** Metres exist for *shape* (weapon sizes,
  cell sizes) and convert to cells at the point of use. Never m/s, never a speed in
  metres.
- **Compare like with like.** Prefer "time needed vs time available" and "cells short vs
  cells of reach" over ratios of invented quantities.
- **One shape for modifiers:** `base × (1 ± small terms)`, terms from the raw stat (e.g.
  `1 + stat/20`). *"No powers, no roots" was Claude's wording (24 Sep), written up after
  a shield calculation with `√drag` in it felt too complex. Dan never set it as a rule; the
  real intent is "keep the maths simple enough to picture", and a power is fine where it
  says something real (e.g. square-cube for creature size).*
- **No flat bonuses tacked on the end.** If something helps, it should help *because of
  what it is* (a wide shield covers its width).
- Deliberate balance knobs are fine; accidental ones are what sank attempt 1. Keep them
  few, named, and in one place.

### Scales

- **Physical values in real units:** height and reach in metres, mass and weapon weight in
  kilos, working length and width in metres.
- **Skills: no abstract scale.** Stat values are the sums produced by the stat wheel
  (`character-creation.md`), and the maths here is written against those numbers rather
  than the reverse. They are meaningful only relative to each other and to monsters built
  the same way. **0 is bad but not useless, average is around 5, 20 is ridiculous mastery,
  and values can go negative** from injuries, traits and the like
  (`character-creation.md` §4).

### How stats get read (20 Oct)

**One mechanic at a time.** There's no universal formula for what a stat does. A swing reads
strength one way, lifting a boulder might read it more heavily; imagination is a count,
precision fades drift to nothing, instinct is a contest. Each mechanic is authored for what
it is. That's more authoring, but each one tells us what it actually needs.

**0 is the default.** Mechanics are authored for a 0 character (×1); stats above zero are
bonuses, below zero penalties. Average is around 5, so an ordinary adventurer is already a
little better than the default.

**Authoring rule: three anchors, handwaved.** For each mechanic, make 0, 5 and 20 produce
reasonable results and draw straight-ish lines between them. Fine-tune later. Exhaustion,
fatigue, injuries and the like will affect most mechanics; note that they do, and **ignore
them at first**.

**The common shape: build, compare, band.** Most mechanics turn out to be the same three
steps:

- **build** a quantity from several stats plus the situation
- **compare** it against a number the world owns
- **band** the result into a few outcomes, rather than pass or fail

Force is the model case: strength, drive, the weapon and so on build a force; it's compared
against an element's reference force; the result lands in bands (bruised, cracked, broken).
Analysis against obviousness, precision against how hard the aim is, and composure against
intimidation all have the same shape. The world's numbers live on the same 0–20 scale as the
stats they're compared against.

  *Superseded:* skills were on a 0–100 scale anchored at 0 = the wimpiest adult alive,
  100 = the strongest human alive, 50 = an average adventurer. Dropped for the reason
  attempt 1 already recorded about its own version (`attempt1/combat-model.md` §4.0): no
  defined average, no ceiling, and no way to answer "is a giant 150 or 300".

### Not covered by force (parked)

- **Heat** — a third channel beside penetration and shock. Touches what is exposed or
  outermost, ignores hardness; skin burns, cloth catches, plate shields or cooks. Fits the
  anatomy graph. Dragonfire and the hero's fireball: powerful and niche, magic costs
  fatigue, not worth careful balancing.
- **Sustained force** (a troll's grip, a constrictor, jaws that hold) — engagement.
- **Things that stay in** (arrows, barbs, a lodged spear) — an injury that keeps going.
- **Force that goes around coverage** (a flail wrapping over a shield) — too niche.
- **Poison** — needs resistances; later.
- Pushes and trips should already work: very wide force moves the body without hurting
  elements.

---

## Luck — IDEA PHASE

**Status: barely set in sand.** The shape below is agreed in principle; the accrual rates,
the price function, and the thresholds that define a "grey band" are all unsettled. Treat
every number here as a placeholder and the whole section as provisional.

The board game has five stats and one of them is luck. We have nothing like it, and it could
give us some uncertainty back without reintroducing dice. **Aelfric's signature.**

**Luck is not a wheel stat.** It lives in the soul hub at the centre of the stat wheel and
comes from traits, tied to religion and divine favour — which also ties it to chapels, a
location the board game already has. See `character-creation.md` §8.

### What it does

- **It never randomises an outcome.** Luck acts only in **grey bands** — results that land
  within a hair of a threshold. A thrust two points short of the heart clips the rib
  instead: *"Lucky! Vital narrowly missed."*
- **Decisive outcomes are immune.** Being trampled by a troll has no grey band to work with;
  everything is already disastrous. Only a *lot* of luck should touch something decisive, if
  ever.
- **This is self-policing.** Bad decisions mostly produce decisive outcomes, so luck can't
  erase them. When a bad decision happens to leave a near-miss, having it tip your way is
  fine — it was near anyway. So luck can touch anything (even a feint you fell for, if your
  shield is big and the real blow only just gets past it), but only ever as a nudge.
- **The player has no agency over spending.** The moment you can plan around it, it stops
  being luck and becomes a worse-named precision. It fires on its own.
- **Price is keyed to the consequence delta**, with some interplay with the size of the
  nudge: the same two centimetres is cheap when it turns a gash into a graze and ruinous
  when it turns a severed throat into a scratch. If the ledger can pay, it spends.
- **Hidden.** No visible number. You notice it in the messages, and you learn its rhythm by
  feel — *"no procs for a while, I'm probably due."*
- **No cap**, and **no carry-over between runs**. If you're sitting on a lot, take more risks.

### Accrual

A **pity timer** as the engine: fortune accrues from the gap since your last proc, scaled by
the luck stat. It can't be farmed, needs no risk detection, and it makes luck a *rhythm*
rather than a resource — fortune arrives spaced out, the way it reads in fiction.

Additional sources, which are where deliberate choice lives:

- **prayer** — out of combat, and a quick-prayer card mid-fight, both paying in time
- **shrines and the chapel** in the castle; respecting liturgical imagery
- **relics and charms** as loot: an amulet that raises your accrual rate, a saint's bone,
  holy water. And a cursed one that quietly drains you — very much in genre, and good in a
  game where loot is the only reward.
- **suffering** — being badly hurt earns you one, the universe owing you a favour. A comeback
  lever that suits the salvage phase, and not farmable because injuries are too expensive.
- possibly **compensation for a bad draft**, since drafting will have randomness in it

### Bad luck

**Ruled against as a general mechanic** — it would just feel bad. It exists only where it is
**self-inflicted**:

- **desecration** — disrespecting liturgical imagery earns misfortune. Fair, because you
  wrought it. (And there may be a reason to do it: a relic worth taking, at a price.)
- the **Faithless** trait (below).

Misfortune runs the same ledger with the opposite sign, spending itself to turn your grazes
into gashes and your near-misses into hits.

### Monsters

Monsters don't have luck. Fallback if combat proves too predictable: spawn them with a
hidden random amount, never shown to the player.

### Rejected

- **Luck as "precision 2".** The difference isn't magnitude, it's **agency**: precision is a
  tool you aim, luck is something that happens to you. Anything you choose to spend is not
  luck.
- **A player-spent pool.** Same reason.
- **Risk-based accrual.** Appealing — fortune favours the bold, and it kills the degenerate
  tiptoe-to-the-treasure line — but it rewards a *style* rather than a *choice*, and the game
  can't tell a brainless charge from a calculated gamble. Commitment-based accrual has the
  same flaw: it pays the barbarian and not the strategist.
- **Accruing from doing nothing.** Avoiding all risk shouldn't be the best way to get lucky.

---

## Traits — IDEA PHASE

Discrete flags set at character creation, as opposed to continuous stats. "Traits" as the
category; more will exist.

**Faithless** (Yūshugom, who refuses anything magical — rings, amulets, the lot):

- **no blessings and no curses.** His weakness and his immunity are the same trait: a cursed
  amulet does nothing to him, so he can loot relics purely for their material worth.
- **cannot pray at all.** That door is simply shut.
- **luck runs negative.** The pity timer accrues *misfortune* for him, spending itself in the
  same grey bands with the opposite sign. A long run can genuinely bury him under
  accumulated bad fortune — which is a hell of a way to lose, and arguably the point of
  playing him.
- compensated by raw ability: three swords, the most health.

Other names considered for the trait: Godless, Unblessed, Unfavoured, Self-reliant. Other
names considered for the category: creeds, vows, convictions.

---

## Strategy — IDEA PHASE

A possible stat, not settled, with two readings that are really separate things:

- **deck-shaping at creation** — purge cards you never want, draft a few you do. The
  strategist's deck is small and sharp, so their draws are more reliable. Mechanically the
  *opposite* of imagination, which is a nice tension: fewer options, better options.
- **run-level preparation** — your plan going in: more of the map known, a chosen approach,
  supplies, a pre-planned escape route. Dungeon-layer rather than combat.

One combat-layer idea: strategy lets you **carry a card over** between turns, so your plan
survives the turn boundary while everyone else's hand is swept away.
---

## Stats

No classes. "Berserker", "ninja" etc. are shorthand for stat combinations. **Every stat
must be visible at both ends**: high gives a strength, low gives a weakness you feel in
play. Otherwise it is a dump slot. Builds should be skewed, not hedged in the middle
(probably via payoffs that grow faster than linearly; parked).

### Character

Stats are set on the **stat wheel** — sixteen stats in four categories, shaped by four
notches. `character-creation.md` has the wheel, the ordering and the numbers; this section
is what each stat *does* once combat reads it.

The wheel produces **set** values. Combat reads **effective** values: exhaustion and pain
scale them down, frame and gear feed some of them up.

**Body facts** (not trained; the Frame screen): **height**, **mass**. They cut both ways
and feed other stats (mass → movement force, shove resistance, a little intimidation;
height → reach, region heights, a little intimidation). Small and light gets something
back.

**Muscle:**
- **strength:** how hard you push (force, disruption); bail-ease comes from your strength
  vs your weapon's weight
- **pain tolerance:** base for taking hurt; brace is a temporary boost on top
- **stamina:** resists **Exhaustion**, the within-a-fight resource
- **endurance:** resists **Fatigue**, the across-the-run resource

**Sinew:**
- **pace:** speed in a charge, and moving through the dungeon
- **footwork:** moving well, dodging, adjusting mid-commitment
- **reaction speed:** does a reaction window open at all
- **precision:** finding gaps and weak points

**Brain:**
- **analysis:** reading one opponent deeply (posture hints, committed or feint)
- **improvisation:** how many cards you draw at a reaction window (changing plans)
- **imagination:** how many cards you draw at the start of combat (options)
- **strategy:** deck shaping at creation, and planning before embarking

**Nerve:**
- **decisiveness:** how tightly the hand concentrates on the chosen stance
- **instinct:** noticing wide (flanks, a second enemy, traps; mostly out of combat,
  sometimes grants reaction opportunities)
- **composure:** handles fear, and how long you can hold a wait
- **intimidation:** high means monsters with self-preservation flee or disengage
  (charge + battlecry scares them off); low means they see an easy target and you must
  fight. Mindless things (skeletons) ignore it. Monsters need a self-preservation value.
  Effective intimidation is this stat plus frame and gear, so a small character can still
  build presence but pays more for it.

**Cut:** balance (overlapped mass and footwork) and celerity (folded away). **Moved:**
awareness renamed **instinct** and moved to Nerve; **luck** left the stat list for the
soul hub. **Promoted:** strategy and decisiveness are now stats rather than candidates.
Traits remain discrete flags, not stats, and live in the hub beside luck.

### Weapon

Reworked 20 Oct: **a weapon is a body plus striking parts.** Not ultra-general, but any
weapon can be divided into its parts.

**The body:**

- **weight** (kg)
- **length** (m), fully extended for flexible weapons (a swung ball and chain is pulled
  straight by its own spin)
- **balance:** how far the balance point sits from the hands, in metres. Its job is **felt
  weight** = weight × (1 + balance distance), which the weapon weight penalty reads. A staff
  held in the middle has balance 0; a sword's hilt and pommel pull its balance to ~10–15 cm
  in front of the guard, which is why swords feel light for their length; a mallet's sits
  far out.
- **hands:** one, two or either. Decides loadouts (a two-hander means no shield), and two
  hands double the comfortable felt weight.
- **grip span** (m): how far apart the hands are two-handed (short on a longsword, long on a
  staff). Its job is **disarms**: holding on against a twist goes with strength × grip span.
  Niche; might end up derived rather than authored.

**Striking parts**, one or more per weapon. A card picks which part it uses, and stepping
inside a long weapon changes which part reaches you. Each part has:

- **distance from the hands** (m), which gives its lever. Negative behind the hands (a
  pommel).
- **contact shape**, x × y, which drives the penetration/shock split and, for a defending
  part, how much it covers
- **keenness** (0–1)
- **part weight**: how much weight is behind it in a swing, authored
- **rigid or flexible** attachment (a flail's head is flexible, its handle rigid)

| weapon | parts, outward from the hands |
|---|---|
| quarterstaff | an end each way, the shaft between and near the hands |
| longsword | hands and pommel, the edge near the guard, the middle of the edge, the tip |
| spear | shaft, head |
| ball and chain | handle, chain, head |
| shield | face, rim, boss |
| a rock | itself |

**Reusable part profiles**, like skin and muscle templates: chain, shaft, pommel, and **the
wielder's own hands and forearms**. Stepping into a ball and chain quietly gets you hit by
the chain; stepping into a sword swing by the hands and pommel. Unarmed fighting is the same
structure — fists, elbows and knees are parts at different distances, which is why elbows
and knees are the clinch weapons.

**Rigid or flexible** is mostly not about force. Where it matters: which cards a weapon can
use (no thrusts or fine redirects with a flail), timing (a moving flexible head can't be
stopped or steered: no tracking a dodge, no bail except letting go, long recovery on a
miss), and blocks (the chain catches the rim and the head swings over). A flexible weapon
also needs room to swing, so it's nearly useless at touching distance.

**Stepping in** needs no working length any more: which parts reach you at a given distance
decides it. Nearer parts move slower and are often blunt, so stepping in past a spearhead
helps; stepping from a sword's tip into its edge might not; stepping into a ball and chain
trades the head for the chain. This depends on the distance system being able to say
roughly how far apart two fighters are.

Kept from before:

- **keenness** degrades with use, which gives maintenance something to do later
- **durability:** later, but wanted (skeletons' wooden shields should splinter)
- **penetration through armour** (war pick yes, rapier no) is separate from finding gaps,
  which is precision. Not yet placed in the new structure.

*Superseded:* working length and width (now each part's contact shape), reach (now the
parts' distances), hand-to-surface distance (now a part's distance), damage type with card
overrides (now the card picking a part: a sword's hilt strike uses the pommel), "two-ended,
maybe" (now two parts), and balance as a fraction along the weapon (it could make felt weight
less than the real weight).

### Card

- **path:** entry and exit on a 3×3 grid in the attacker's frame, or a single cell for a
  thrust. The start cell is where the hand must be (posture), the end cell is where it
  ends up. A swing crosses several cells unless blocked or lodged, spending momentum on
  each cell it connects with (lodged → engagement). The grid carries *positions only*;
  swing build-up is **arc**.
- **phases:** base pattern of windup / strike / recovery with lock-in per slot
- **drive:** how much of your strength goes in (wrist flick vs full body). Commitment
  raises it.
- **arc:** how much swing builds up. A thrust ~0, a hip-level cut a little, a big overhead
  a lot, a ball and chain starting from facing backwards nearly all arc. Multiplies with
  reach and weight distribution (leverage), and feeds **recovery on a miss** (the big slash
  that twists you round). Authored, never inferred from computed windup length — otherwise
  a weak character with a heavy mallet, or a character in pain, would "hit harder" because
  they're slow.
- **footwork:** whether the feet move; moving adds your mass (and pace) to the force
  (running axe chop, body slam)
- **hands:** roles, never named hands: weapon hand, other hand, both on one weapon,
  the arm (a strapped buckler with a free hand). Loadout fills the roles; dual-wielding
  mirrors cards; dominant hand decides which side is better.
- **damage type:** override when different from the weapon
- **requirements:** what kind of weapon it needs (long, bladed, pointed...)
- **start/end posture:** mostly implied by the path, plus feet and weight

---

## Open questions

- How required accuracy is computed from the attack (arc, working size) against the
  defending object (working length, width), and what precision it demands.
- Numbers for where a blow lands: vital value and obviousness per element, how precision
  turns into drift, and each card's natural landing spot. The shape is settled (§Where a
  blow lands).
- **How much each element passes on**, per channel, as numbers. It's written in words
  ("skin passes nearly everything, bone stops penetration and passes shock") and the shin
  example improvised figures. With force flowing along the graph, this is the core of the
  flow. Next up.
- Whether a fourth "very far" band exists, and what a fight opens at.
- How a defence's quality maps to who sets the measure afterwards.
- Which dodge cards are rare or hero signatures, to keep the flashy ones scarce.
- Exact numbers for posture bonuses/penalties, and how bad posture splits into slower vs
  weaker.
- How a swing path's momentum is spent per cell, and when it lodges.
- Whether a card can also drop the weapon to bail (ball and chain); dropping swaps your
  weapon cards out of the deck.
- The anchor list: the handful of sentences that calibrate reference forces (first one: a
  committed two-handed staff strike breaks a shin, a tap does not).
- How armour behaves in the two channels as an element (plate stops penetration and passes
  shock; padding soaks shock).
- Each element's penalty mapping, and how severity splits into structural vs pain.
- How the attacker's 3×3 swing grid maps onto the target's cells (proportional overlap of
  a real-unit footprint, positioned by height).
- Authoring the rest of the humanoid graph, starting with the neck (windpipe, carotids,
  spine), where the mouth → throat link lands.
- How the knight-style "defending already" case skips a reaction cleanly.
- How stat values feed the combat maths at all — the wheel's numbers exist, nothing reads
  them yet. (Skewed builds are answered: the wheel's notch curves produce them
  structurally. See `character-creation.md`.)
- **Celerity has no home.** It is not on the stat wheel, but this document still leans on
  it in five places: windup length (§Timing), aim error (§Dodges), what exhaustion costs
  (§Exhaustion), what a numbed limb costs (§What a hit leaves behind), and the split
  "precision decides where it lands, celerity decides time" (§Making the force). Either
  reaction speed absorbs hand speed, or weapon weight against strength carries it, or
  celerity returns to the wheel. Nothing should be rewritten until this is decided.
- Card totals snapping to halves vs quarters.
- How the player sees the 40-slot timeline, shifts, and the opponent's hints.
- Fear: how much contamination per fear level; whether it lands in instinct or stance draws.
- How pain cards autoplay onto the timeline: when they appear, how much time they take,
  whether they can be worked around or displaced.
- Engagement / binds / grappling.
- Luck: accrual rates, the price function, and what counts as a grey band. All unsettled.
- What else belongs in traits and the soul hub beside luck — willpower, drive, will to
  live — and whether the soul becomes a fifth sector of the wheel.
- Exhaustion and fatigue rates, and how much of a penalty each step is worth.
