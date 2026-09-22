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

Parked: card rarities (e.g. a legendary "Decapitate").

---

## Timing

- A turn is **10 time units**, divided into **quarters** (40 slots). Coarse enough to
  see and count; not a millisecond timeline.
- Cards cost time. Mallet swing ~3, sword hit ~2, parry ~2.
- **Flow:** a card can get cheaper when it follows a card that sets it up
  (parry → sword hit, sidestep → rapier thrust). Same hand twice in a row is slower than
  alternating. Idea: cards carry "ends in" / "starts from" state tags so combos come
  from tags, not authored pairs.
- **Quick characters** should fit roughly 3 actions where a slow one fits 2 or 1.5.
- **Phases within a card**, roughly:
  - *windup*: still adjustable, can track a dodge, can be bailed out of
  - *strike*: locked in, point of no return, where contact happens
  - *recovery*: open, slow to respond

  A sidestep during the opponent's windup gets tracked. A sidestep after their strike
  locks in makes them cut air.
- **Commitment** makes a card a bit quicker and hit harder, but you lose flexibility and
  reaction opportunities (it probably locks in earlier).
- **Getting hit shoves the timeline.** Stagger delays the rest of your sequence.

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

---

## Reaction opportunities

A reaction opportunity is **any moment where the written plan runs out of script**.
You get a small special hand drawn for that kind of moment.

- **Danger** ("you're about to get hit"): duck, backstep, parry.
  Reaction cards are in the normal deck but carry no intent tag, so you rarely hold them.
- **Stall** ("opponent isn't doing anything"): stand your ground, disengage, flee,
  approach, proceed with next card. How many you draw depends on stats
  (imagination / flexibility).
- More kinds later (they fled, you lost your footing...).

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

- Each creature has a **fixed 5×5 anatomy grid**, used only for the *consequences* of a
  hit that has already connected. Dodging, parrying and blocking are resolved before it,
  separately.

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

---

## Consequences

- **Stats have base and current values.** Display: a small footwork icon with
  `41 −8`. Hover: `Pain: left shin −8`.
- **Pain:** modest. Lowers stats, may add a **Wince** card. Fades *gradually* between
  fights depending on severity, so rushing into the next room means going in hurt.
- **Bleeding, broken things, (fatigue?)** carry over. Bleeding is a clock toward the exit.
- **Adrenaline** rises when hurt and temporarily counteracts bad effects, but falls off
  over turns. Short fights you ride through; long fights the bill arrives.
- **Brace:** a temporary stat for how ready you are to take a shock (raising a shield
  braces the shield arm). A braced knight hit on armor might take only −1 footwork and a
  small stagger.
- Leaning: *kind* of injury from weapon + location, *severity* from commitment + how the
  defence went. Not settled.

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

---

## Open questions

- Exact representation of phases inside a card, and how commitment / flow / stagger
  shift them.
- Two strikes landing on the same slot: who wins?
- What exactly determines armor vs gap, and injury severity.
- How the knight-style "defending already" case skips a reaction cleanly.
- Final stat list (improvisation, flexibility, quick-footedness, composure, analysis,
  precision, height, brace, ...).
- How the player sees the 40-slot timeline and the opponent's hints.
- How fear alters cards (not by shifting the random/intent draw ratio).
