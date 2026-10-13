# Design notes: attempt 2

A record of the brainstorm that restarted the combat design. It captures decisions and
open questions, not a spec. The first attempt (splines, curves, bands, rolled hit
location, millisecond timeline) is archived in `attempt1/` for reference.

Scope right now: **a proof of concept for the combat engine.** Traps, dungeon
navigation and the rest come later. Without combat there is no game.

---

## What we kept from attempt 1

- Declaring intent
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
- Per-turn energy/stamina budget (parked; may return for balance)

---

## The run

Enter a dungeon. Make good decisions for as long as you can. Missteps give you
reaction opportunities. Enough poor decisions and you start getting hurt, and then the
run is about salvaging and getting out alive.

**No loot or XP for kills.** The goal is survival. Running away is a smart move, not a
failure. If your weapon can't hurt it, leave.

## Randomness

**No output randomness.** Resolution is deterministic: weapon, card, stats, commitment,
anatomy and the opponent's card decide the outcome. No hit rolls, no vital-hit chance.

Uncertainty comes from:
- **the draw** (which cards you have this turn)
- **hidden information** (the opponent's sequence, feints, whether a move is committed)

If your mallet can't hit the bat, that's an observation, not bad luck. The counterplay
lives in the breadth of the deck: a faster swing, your fists, the environment, a
committed blow, "take a breath" first.

---

## Turn structure

1. Both sides arrive and see each other.
2. Draw **~4 random cards** (instinct). These influence which intent you pick.
3. Choose **intent**, blind: charge / attack / await / defend / flee.
   This is the board game's ABC choice.
4. Draw **~6 cards from that intent**.
5. Intents are revealed (always visible to both).
6. Each side **writes and locks a sequence** of cards filling the turn.
7. Resolve.

Intents have **no built-in RPS rules**. Their relationships emerge from the cards they
draw and how those cards meet.

Layering: coarse blind guess (intent), then a detailed informed plan (sequence).
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
or completes depending on its lock-in. A new turn can't start mid-attack, since intent
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

Held defences occupy cells (placed by the posture step that adjusts the grid), and size
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
  Reaction cards are in the normal deck but carry no intent tag, so you rarely hold them.
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

## Anatomy and height

- Each creature has a **5×5 anatomy grid**, adjusted by posture before use (below).
  Dodging, parrying and blocking are resolved before it, separately.

  ```
  .          .          Head       .          .
  .          Upper arm  Chest      Upper arm  .
  .          Lower arm  Stomach    Lower arm  .
  .          .          Upper legs .          .
  .          .          Lower legs .          .
  ```

  A low trip covers row 4. Monster grids can be weird (a serpent, a spider).
- **Height is a stat.** It decides which rows you can reach. A 1.60 m human never
  reaches a 4 m giant's head, and a goblin doesn't reach yours unless you're down.
- Attacks target **regions** (high/low, side), never named body parts. No "armpit."
- The contact system still needs a coarse notion of height and side. The grid says
  *where exactly*; contact says *roughly where, and did it get through*.
- Cards are written in the **attacker's frame** and mirrored onto the defender. The
  attacker's left is the defender's right.
- The attacker's 3×3 swing grid is translated onto the defender's 5×5 grid using height.

### What's in a cell

Each cell holds a **list of contents**, each reacting to damage in its own way:

- **skin:** bleeds, hurts
- **muscle:** hurts, weakens what it moves
- **bone:** breaks
- **organs:** eyes, brain, lungs, with special effects (blind, daze, winded)

Contents are not strictly ordered (the head is a cluster, not a stack). Each has roughly:

- **size:** share of the cell (brain ~0.4 of the head, cranium ~0.8)
- **protected by:** what shields it (brain by cranium, cranium by skin); exposed if none
- **hardness**, and how it reacts to each damage type

**Armour is just a content**: the outermost thing in the cells it covers. Plate is hard
(stops penetration, passes shock); padding soaks shock. A monk with arm guards is
protected exactly on the lower arms. A full helm has coverage ~0.98 with the eyes still
exposed. No special rules needed.

Words: **size** for anatomy (the brain's share of the head), **coverage** for things worn
or held.

### Posture adjusts the grid

A small adjustment step runs first, then the grid handles everything (both what the blade
meets and what the hit does). Considered and rejected: a fully static grid, and a
separate "contact decides interception" layer. One adjusted grid is simpler.

- **crouch:** legs collapse into fewer rows, the head comes down; a smaller target, so
  high attacks find nothing
- **arms:** move within their own 3×3 around the shoulder
- **weight / jumping:** shift the whole grid relative to the attacker (an offset when
  mapping the attacker's 3×3 onto it)
- **shield:** placed into cells by the off-hand posture
- **non-humanoids** (snake, spider, bat): no posture system at all, so a static grid

**Overlap is the point.** A raised forearm shares a cell with the head; a shield sits in
front of the chest. No separate depth order is needed — the **protected by** chain does
it. Posture just rewrites the links, e.g. a stomach cell reading: shield (hardness 0.9,
covers 0.9) → forearm → skin → ribs → lung. Force filters down the chain: the shield stops
most, a tenth slips past the rim, the forearm takes some, a sliver reaches the ribs.
Blocking with your forearm falls out for free.

### Force along a path

- **Swings are sequential.** The blade meets the first cell, that cell takes what it takes,
  and the remainder carries on. A sweep through an unarmoured arm still has force for the
  chest; into a plated arm it's mostly spent. Order matters, so which side the swing comes
  from matters.
- **Thrusts are sequential too**, but *inwards* along the protected-by chain.
- **Areas are even.** A body slam isn't a path: chest, stomach and both upper arms take
  modest shock at once. Both modes exist.
- **Limbs yield.** An arm can be knocked aside, so it passes more force on than the torso,
  which has nowhere to go. Severing needs huge force relative to the bone, and should be
  rare.
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
by **fraction**: weapon coverage, card path and precision decide what share each content
receives, and size decides how much there is to cover. A broad club across the face gives
the eyes a good share; a precise thrust aimed at an eye puts nearly all its force there.

### Penetration and shock

Damage types are mixes of two channels, plus how wide the blow is:

- **penetration:** breaks the protector to reach what's inside (cuts, thrusts)
- **shock:** passes through the protector without breaking it (mostly blunt)

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
- **Pain:** modest. Lowers stats, may add a **Wince** card. Fades *gradually* between
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

Each content has a smooth **severity** number and a ladder of labels over it:

- **bone:** bruised, cracked, broken, shattered
- **skin:** scratched, cut, gashed (bleeding follows from cuts)
- **brain:** rattled, dazed, concussed

The player sees "broken shin, −34 pace"; internally that was a 56. A 57 gives −35. Same
pattern as timing: smooth underneath, clear labels on top.

**Severity adds up.** Bruised + bruised can become cracked. And damage **weakens** the
content (effective hardness drops), so a cracked bone breaks more easily. Two moderate
hits on one shin are worse than one on each. Targeting a wound is a real tactic.

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
- **blinded** (one eye or both): precision, awareness, maybe analysis; possibly lasting

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
- intent draws get contaminated: pick *charge*, and *back off* and *run away* still show up.
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
  until the fight is over, **no voluntary exit**, and locks intent to charge/attack (no
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

- **body:** strength × drive (commitment raises drive)
- **moving mass:** mass × card footwork, plus pace for running cards
- **swing:** arc × weapon weight × leverage (reach, weight distribution)
- **handling:** strength vs weapon weight — bends force a little and time a lot

Shape: **(body + swing + moving mass) × handling.** The sources add; handling multiplies,
because a weapon you can't control spoils everything.

A weak character with a heavy weapon is penalised in both, but mostly in time: hard *and*
slow, not useless. Precision and celerity stay out of force — precision decides where it
lands, celerity decides time.

Then the force is **split** (penetration vs shock, by damage type and by narrow vs wide)
and **spread** (sequentially along a path, evenly over an area).

### House rules for the maths

Learned from a first worked example that got too clever:

- **Two currencies only: cells and time slots.** Metres exist for *shape* (weapon sizes,
  cell sizes) and convert to cells at the point of use. Never m/s, never a speed in
  metres.
- **Compare like with like.** Prefer "time needed vs time available" and "cells short vs
  cells of reach" over ratios of invented quantities.
- **One shape for modifiers:** `base × (1 ± small terms)`, terms from `stat/50 − 1`. No
  powers, no roots.
- **No flat bonuses tacked on the end.** If something helps, it should help *because of
  what it is* (a wide shield covers its width).
- Deliberate balance knobs are fine; accidental ones are what sank attempt 1. Keep them
  few, named, and in one place.

### Scales

- **Physical values in real units:** height and reach in metres, mass and weapon weight in
  kilos, working length and width in metres.
- **Skills 0–100**, with anchors: **0** is the wimpiest malnourished adult alive, **100**
  is the strongest human alive, **50** is an average adventurer (competent, not
  necessarily strong — an arbalest specialist might be 35–40 strength). Monsters may
  exceed both ends; players are capped.

### Not covered by force (parked)

- **Heat** — a third channel beside penetration and shock. Touches what is exposed or
  outermost, ignores hardness; skin burns, cloth catches, plate shields or cooks. Fits the
  contents model. Dragonfire and the hero's fireball: powerful and niche, magic costs
  fatigue, not worth careful balancing.
- **Sustained force** (a troll's grip, a constrictor, jaws that hold) — engagement.
- **Things that stay in** (arrows, barbs, a lodged spear) — an injury that keeps going.
- **Force that goes around coverage** (a flail wrapping over a shield) — too niche.
- **Poison** — needs resistances; later.
- Pushes and trips should already work: very wide force moves the body without hurting
  contents.

---

## Stats

No classes. "Berserker", "ninja" etc. are shorthand for stat combinations. **Every stat
must be visible at both ends**: high gives a strength, low gives a weakness you feel in
play. Otherwise it is a dump slot. Builds should be skewed, not hedged in the middle
(probably via payoffs that grow faster than linearly; parked).

### Character

**Body facts** (not trained): **height**, **mass**. They cut both ways and nudge other
stats slightly (mass → a little strength and intimidation; height → a little
intimidation and reach). Small and light gets something back.

**Physical:**
- **strength:** how hard you push (force, disruption); bail-ease comes from your strength
  vs your weapon's weight
- **precision:** finding gaps and weak points
- **balance:** staying upright
- **footwork:** moving well
- **pace:** speed in a charge, and moving through the dungeon
- **celerity:** hand speed
- **endurance:** staves off fatigue (fatigue wanted eventually, not in the POC)
- **pain tolerance:** base for taking hurt; brace is a temporary boost on top
- **reaction speed:** does a reaction window open at all

**Mental:**
- **composure:** handles fear, and how long you can hold a wait
- **imagination:** how many cards you draw at the start of combat (options)
- **improvisation:** how many cards you draw at a reaction window (changing plans)
- **intimidation:** high means monsters with self-preservation flee or disengage
  (charge + battlecry scares them off); low means they see an easy target and you must
  fight. Mindless things (skeletons) ignore it. Monsters need a self-preservation value.
- **analysis:** reading one opponent deeply (posture hints, committed or feint)
- **awareness:** noticing wide (flanks, a second enemy, traps; mostly out of combat,
  sometimes grants reaction opportunities)

### Weapon

- **weight:** relative to your strength drives speed, bail-ease, redirecting, and force
- **balance point:** head-heavy (mallet) builds momentum and is hard to stop; centred is
  easy to control. Feeds commitment/bail-ease, and torque when blocking (blocking a mallet
  near a sword's tip is hopeless)
- **grip span** (m): the distance between the hands in two-handed use — long on a staff,
  ~0.35 on a longsword. One-handed use takes hand width, derived from height. Cards can
  modify it (choke up, widen, grip at the tip). Feeds `holding` against torque.
- **hand-to-surface distance** (m): how far the blocking/striking surface sits from the
  hand. ~0.1 for a strapped shield, ~0.4 for a sword parrying mid-blade. Multiplies aim
  error, and sets the lever for torque.
- **reach:** the weapon alone, in metres, from a comfortable grip, plus an arm contribution
  from height. Its main job is deciding **which measure bands you threaten at** (see
  Measure): a polearm owns *far*, a sword *normal*, a dagger only *near*. So reach is
  upside at one band and a liability at another, and getting inside it is the counterplay.
  A card can say "grip at the tip": more reach, with the costs following from existing
  stats (weight distribution moves out, so slower to redirect, harder to bail, easier to
  twist from your grip, and no second hand).
- **working length** and **working width** (metres): the surface that can hurt or stop
  something. Length tells how many of the target's cells a swing crosses; width decides
  narrow-and-penetrating vs wide-and-shocking; length × width is roughly the area, which
  *is* coverage when defending, measured against the target's cell size.

  | | working length | width |
  |---|---|---|
  | longsword | 0.9 | 0.04 |
  | spear | 0.05 | 0.04 |
  | mallet | 0.15 | 0.15 |
  | shield | 0.6 | 0.6 |
  | ball and chain | 0.2 | 0.2 |

  A shield 0.6 m across, against a 1.7 m creature whose cells are ~0.34 m, spans about two
  cells and fills them. The same shield on a 4 m giant covers much less. A sword blocks
  about a tenth of what a shield does.
- **damage type:** default; cards can override (a sword's hilt strike is blunt)
- **hands:** one, two, either
- **penetration:** punching *through* armour (war pick yes, rapier no). Finding gaps is
  precision, not this.
- **durability:** later, but wanted (skeletons' wooden shields should splinter)
- possible: two-ended (quarterstaff), making high and low close in posture

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
- How precision and armour coverage combine in general (fraction bypassed? gap targeted?).
- Whether a fourth "very far" band exists, and what a fight opens at.
- How a defence's quality maps to who sets the measure afterwards.
- Which dodge cards are rare or hero signatures, to keep the flashy ones scarce.
- Exact numbers for posture bonuses/penalties, and how bad posture splits into slower vs
  weaker.
- How a swing path's momentum is spent per cell, and when it lodges.
- Whether a card can also drop the weapon to bail (ball and chain); dropping swaps your
  weapon cards out of the deck.
- How contents' size, protection and hardness turn force into a severity number.
- Label ladders per content type, and how severity maps to structural vs pain penalties.
- How the 3×3 swing grid maps onto the 5×5 target grid with height.
- How the knight-style "defending already" case skips a reaction cleanly.
- Stat list is a first pass; how to reward skewed builds.
- Card totals snapping to halves vs quarters.
- How the player sees the 40-slot timeline, shifts, and the opponent's hints.
- Fear: how much contamination per fear level; whether it lands in instinct or intent draws.
- Engagement / binds / grappling.
