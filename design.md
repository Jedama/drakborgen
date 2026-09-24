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
coverage**: less than an active block, no tracking, no brace. That's how you stab from
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

- Shape: windup (raise), then a **held window**. No recovery: the next card starts from
  "shield up", or lowers it as part of its own windup.
- An attack striking inside the window is blocked. During the raise, it catches the shield
  half up. After, it gets through.
- **Duration is fixed per card.** More room for unique cards, a narrower decision for the
  player, easier balance. Examples:
  - *Raise shield*: no windup, but imprecise. A precise or adaptable attacker can go
    around it during their windup.
  - *Awaiting block*: waits for the attack.
  - *Slamming block*: short window, but if it lands, the attacker's recovery becomes very
    long (a timeline shift).
- Going around a block is **automatic** (computed from stats of attack and block), but a
  very flexible character may also get an offensive reaction opportunity for it.
- **Blocks track.** A shield covers some cells but can shift toward the incoming attack;
  "does it block" is a race (resolved below). Light and big is easy to move; a heavy tower
  shield covers a lot but moves slowly; a buckler on the wrong arm is hard.
- **Tracking makes blocks baitable.** A feint drags the shield; the real strike comes
  low or from the far side and the shield loses the race back. What gets through a
  "raise shield": going under it (legs), feinting it, hitting hard enough not to care,
  outlasting its window, or making it move a lot.
- **Blocks transfer force** into the shield arm, taken by strength, mass, brace and the
  shield's weight/balance point. A braced knight shrugs it off; a muscle-less skeleton
  with a flimsy shield gets rattled (timeline shoved, arm knocked wide, shield cracks).
- **Interrupted paths change posture.** A swing stopped mid-path leaves the hand where it
  actually stopped, not where the card planned. The next card's flow is measured from
  there. A block quietly rewrites the attacker's next move.

#### Resolving a block or parry

Everything is in **cells** (derived from the creature's height) or **time slots** (1 slot
= 1 time unit = 1 second; a turn is 10). Weapon sizes are metres and convert to cells
against whoever you're facing, so the same shield is nearly two cells on a goblin and half
a cell on a giant.

1. **Telegraph** → how much warning the defender gets. From the attack's windup length,
   **arc**, and weapon size. A big arcing poleaxe overhead is hugely telegraphed; a dagger
   jab is nearly invisible. This is also what an analysis-heavy defender reads.
   A **feint eats the warning**: the early part was spent tracking the wrong thing, so the
   real strike's clock starts late. That is where feints bite.
2. **Distance** → cells from where the guard is (posture) to where the blow arrives. A
   block card places the guard on the *likely* line, so an honest attack is ~0.5 cells
   away. Distance represents a **wrong read** (a feint, an unexpected line), not the normal
   case.
3. **Guard speed** → cells per slot: `6 × celerityF / drag`, where
   `drag = (weapon kg / 1.4) / strengthF`. Round shield ~4.2, sword ~6, buckler ~8.4.
4. **Travel time** (distance ÷ guard speed) vs **warning**:
   - travel ≤ warning: it got where you sent it.
   - otherwise it falls **short** by `distance − warning × guard speed` cells.
5. **Aim error** — arriving is not the same as being exactly right:
   `angular error (from precision) × distance from hand to the blocking surface`.
   A strapped shield's surface is at the hand (~0.1 m), so sloppiness barely moves it; a
   sword parries 0.4 m out, so the same angular error is multiplied. This is why close
   parries near the hilt are good: less aim error *and* less torque.
6. **Total offset (shortfall + aim error) vs the effective half-extent.** Inside it, the
   edge still covers the blow: `coverage = 1 − offset ÷ half-extent`. Beyond it, nothing.
7. Coverage decides how much force goes into the guard and how much carries on. The offset
   also says **where on the object** contact happened — centre, edge, or out near the tip —
   which feeds torque and deflection.

**Effective half-extent** blends the weapon's two sizes by the *attacker's* arc:
`half-width + (half-length − half-width) × arc`. A high-arc swing sweeps a long line, so
anything standing in it catches the blow; a thrust arrives at a point and needs real width.
Shields are therefore good against thrusts, swords parry swings well, and a thrust is the
answer to someone waving a big weapon around — with **no blade orientation tracked**.

| defence | vs cut (arc 0.6) | vs thrust (arc 0.05) | aim error |
|---|---|---|---|
| round shield 0.55 m, 2 kg | 0.81 cells | 0.81 | 0.03 |
| buckler 0.35 m, 1 kg | 0.51 | 0.51 | 0.03 |
| sword 0.8 × 0.05 m, 1.4 kg | 0.74 | **0.13** | 0.13 |

Worked, defender with strength 48, celerity 52, precision 45, cells 0.34 m:

| | honest cut (0.5 cells, warning 0.54) | feinted (2.24 cells, warning 0.2) | rapier thrust (1.0 cell, warning 0.31) |
|---|---|---|---|
| round shield | **0.96** | **0** | **0.96** |
| buckler | **0.95** | **0** | **0.95** |
| sword | **0.82** | **0** | **0** (precision 70 → 0.35) |

A hugely telegraphed mallet overhead (warning 0.8) is caught by everyone, even the sword
at 0.88. Its answer is force going *through* the guard, not beating it.

So: block cards work when the read is honest, feints beat everything, thrusts punish thin
parries, big swings are easy to catch and hard to survive, and parrying rewards precision
while shield-blocking does not.

#### Parries differ after contact

Same geometry, different consequences:

- **A shield absorbs; a blade deflects.** `redirected share = parry force ÷ (parry force +
  incoming force)`, where a parry has its own force (drive, arc, weapon), made like an
  attack. A passive held shield has parry force 0 and takes the lot. A firm parry (40 vs
  53) redirects 0.43. A desperate flick (10 vs 53) redirects 0.16 and you eat the rest.
  Whatever is redirected is applied **to the attacker**: blade off line, posture changed,
  recovery lengthened. Meeting a troll's club with a light parry is therefore a bad idea.
- **It costs a hand** — whichever hand holds the parrying thing. A shield leaves the weapon
  hand free; that is the real reason to carry one.
- **Torque and disarms.** Both sides are force × a distance in metres, so no new constant:
  - `twisting = force transferred × contact distance from the hand`
  - `holding = strength × grip span`, where grip span is hand width (derived from height)
    one-handed, or a **weapon field** two-handed (a staff's is long, a longsword's ~0.35).
    Cards can modify it (choke up, grip at the tip). A numbed or broken hand cuts it.

  | defence | contact | twisting | holding | result |
  |---|---|---|---|---|
  | round shield, 0.28 cells off centre | 0.095 m | 1.5 | 14.4 | never in danger |
  | sword parry near the hilt | 0.10 m | 2.1 | 5.8 | solid |
  | sword parry near the tip, one hand | 0.40 m | 8.4 | 5.8 | knocked aside |
  | same, two hands | 0.40 m | 8.4 | 16.8 | holds |

  Bands: below 1× you hold; 1–2× the weapon is knocked aside (posture changes, recovery
  grows); above 2× disarmed. In between, a loosened grip can persist, making the next
  twist easier.
- **Ending posture** tends to favour a counter, which is what makes parry-riposte natural.
- **Durability:** blades suffer from parrying edge-on much more than shields do.

Rejected along the way: travel speeds in m/s, dividing two invented numbers, a flat size
bonus, an authored nonlinear distance exponent, and tracking blade orientation.

### Dodges

- Kinds: sidesteps (left, back, right), in place (duck, jump, bend), rolls (if nimble),
  reactive await-dodges (slower on their own, more adaptable).
- Same shape as a block: windup, then an **evasive window**. A block *covers* a region;
  a dodge *vacates* one. Duck escapes high, jump escapes low, a sidestep escapes one line
  but a wide sweep from the wrong side can chase it.
- Windup tracking applies: dodge too early and the attack follows.
- A dodge **changes your posture**, which sets up what flows next (sidestep, then a thrust;
  duck, then a leg sweep).

**Distance is barely modelled.** Hit-and-run isn't fun to play against, so a backstep
still leaves you in melee range. A backstep is like a sidestep but worse against charges,
and its "weight back" posture can add momentum to certain charging follow-ups.
Disengage is its own card. Ranged weapons exist, mostly for heroes.

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

Against a defender who is *already* defending (no reaction prompt), a feint baits the
**tracking** instead. Whether the tracking bites is decided by the defender's
**analysis** (reading the lack of weight behind it). A skeleton bites; a sharp knight
might not.

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

**1. Staff sweep vs Raise shield.** The sweep runs attacker-left to right, so it enters
on the skeleton's sword side. But the big light shield tracks across in time: the staff
hits wood. A staff is light, so little rattling on either side. The real consequence:
the staff stopped mid-path, so it's on the "wrong" side for the next card.

**2. Feinted overhead → Low sweep vs Raise shield.** The shield tracks the feint upward
(low analysis, it bites). The staff is two-ended: the top end went up, the bottom end
is already low, so the flow into the low sweep is cheap. The shield would have to drop
the full body height and can't cover legs and head at once. The sweep connects low on a
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
lands, celerity decides time and helps beat a tracking block.

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
- **reach:** the weapon alone, in metres, from a comfortable grip. **Effective reach** is
  computed: weapon reach + an arm contribution from height + posture (hand extended,
  weight forward, a stepping card). A card can say "grip at the tip": more reach, and the
  costs follow from existing stats (weight distribution moves out, so slower to redirect,
  harder to bail, easier to twist from your grip, and no second hand).
  Reach matters because you connect earlier in your swing, before a shorter weapon
  reaches you; getting inside it is the counterplay.
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

- Angular error per point of precision; the base guard speed of 6 cells/slot.
- Whether the deflection share is authored per parry card or computed from the angle.
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
