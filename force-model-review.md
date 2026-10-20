# Force model: maths and assumptions, for review

> **Round two (21 Oct 2026):** the designers' response to the first review, with proposed
> changes and new questions, is in **§12** at the end. §1–11 are the model as first
> submitted, kept so the review can be read against it.

A self-contained write-up of how a blow's force is built and what it does to a body, as of
20 Oct 2026. Written so a reviewer who hasn't seen the project can check it. Every number
here is **invented and uncalibrated**; what's under review is the *shape* of the model, the
assumptions behind it, and whether the example results are reasonable.

---

## 1. Context

A turn-based, card-driven fighting game (a reimagining of the board game Drakborgen /
DungeonQuest). Fighters write a short sequence of cards (strikes, blocks, dodges) and the
sequences play out against each other. There are **no hit points**: a blow that connects
damages specific parts of a body (a cracked tibia, a cut calf), and those injuries lower
stats.

Design principles that constrain the maths:

- **Legibility over realism.** The player must be able to feel why something happened.
  Numbers should be things a person can picture and argue about ("how hard do you have to
  hit a shin to break it?"), not tuning knobs.
- **Whether is never random; where can be, a little.** Whether a blow connects, whether a
  block holds, whether a dodge works are decided by cards and stats. Only where inside a
  body region a connected blow lands has a small random element, narrowed by precision.
- **Emergence over authored matchups.** No damage types, no "skeletons are immune to
  bleeding" rules. Behaviour should fall out of describing weapons and bodies.
- **Simple modifier shapes.** `base × (1 ± small terms)`; no flat bonuses tacked on.
- **Two currencies for gameplay** (cells and time slots). Real units (metres, kilograms)
  are allowed for *shape* and mass, never for speeds.

---

## 2. Stat scale

- Stats come from a character-creation wheel and range roughly **0 to 20**; injuries and
  traits can push them **negative**.
- **0 is the default** the maths is written against (×1). Above zero is a bonus, below a
  penalty.
- **About 5 is an average adventurer.** 0 is poor ("struggles at everything, useless at
  nothing"); **20 is ridiculous mastery**, reachable only by putting the whole build into one
  stat.
- Mechanics read stats **one at a time, each in its own way**; there's no universal stat
  curve. Authoring rule: make 0, 5 and 20 give reasonable results, draw roughly straight
  lines between, fine-tune later.
- A **transform step** (e.g. an S-curve per stat, for diminishing returns) is planned for
  later. For now strength is linear.

---

## 3. What happens to a blow, end to end

1. **The card decides the path**: which body cells the blow passes through.
2. **Where it lands** in the first cell: analysis picks a target (by each element's vital
   value and obviousness), precision sets how far the blow drifts from it (in rings of
   neighbouring elements), and a roll picks the direction of drift.
3. **Force is built** (§4).
4. **The force is split** into penetration and shock (§5).
5. **The contact spreads** from where it landed to neighbouring surface elements until the
   contact area is roughly used up.
6. **Force flows inward** through the body's anatomy graph (§6), each element taking damage
   and passing the rest on.
7. **Damage becomes a label** (bruised, cracked, broken) (§7).

This document covers steps 3–7. Steps 1, 2 and 5 are described in words only and not
under review here.

---

## 4. Building the force

```
force  = weight_behind × speed  +  run_up

speed  = arm_speed(card) × (1 + strength / 10) × lever × weight_penalty

lever  = 1 + part_distance                     (swings)
       = 1                                     (straight motions: thrusts, punches,
                                                shield slams, cross checks)

weight_behind = part_weight + body_share(card) × fighter_mass    (swings)
              = weapon_weight + body_share(card) × fighter_mass  (straight motions)

run_up = fighter_mass × (1 + pace / 10) × ground_crossed          (usually 0)
```

### 4.1 Terms

| term | meaning | where it comes from |
|---|---|---|
| `arm_speed` | how fast the move is, from the arms | the card |
| `strength` | 0–20 stat | the character |
| `part_distance` | how far out from the hands the striking part sits, in metres (negative behind the hands, e.g. a pommel) | the weapon |
| `lever` | the far end of a swung weapon moves faster than the hands | derived |
| `weight_penalty` | slows you if the weapon is too heavy for you (below) | derived |
| `part_weight` | how much of the weapon's weight is effectively behind that part in a swing, in kg | authored per part |
| `weapon_weight` | the whole weapon, in kg; in a straight motion it all moves together | the weapon |
| `body_share` | how much of the fighter's body goes into the move (0 = wrist flick, ~0.6 = body slam) | the card |
| `fighter_mass` | kg; 70 in all examples | the character |
| `pace` | 0–20 stat | the character |
| `ground_crossed` | 0–1, how much distance was covered at speed to get there | the fight (distance system) |

### 4.2 The weight penalty

```
felt_weight         = weapon_weight × (1 + balance_distance)
comfortable_weight  = 2 + 0.2 × strength            (one hand)
                    = 2 × (2 + 0.2 × strength)      (two hands)
excess              = max(0, felt_weight − comfortable_weight)
weight_penalty      = max(0.4, 1 − 0.08 × excess)
```

`balance_distance` is how far the weapon's balance point is from the hands, in metres.
Felt weight is never less than the real weight. A staff held in the middle has its balance
between the hands (distance 0). A mallet's balance sits far out, so it feels much heavier
than it weighs. Below the comfortable weight, the penalty is ×1 and invisible. The penalty
is also meant to make heavy weapons **slow** (longer windups); the time side isn't covered
here.

### 4.3 Constants

| constant | value | chosen because |
|---|---|---|
| strength divisor | 10 | 0 → ×1, 5 → ×1.5, 20 → ×3, so the strongest hits twice as hard as an average fighter. (`/20` was tried: it made strength 0 hit 80% as hard as average, and still crack shins.) |
| comfortable weight | 2 + 0.2 × strength, ×2 with two hands | a 2 kg staff is fine for anyone; a mallet is too heavy until high strength |
| penalty slope | 0.08 per kg of excess, floor 0.4 | so a weak fighter gains nothing from a heavy weapon, but isn't useless with one |
| fighter mass | 70 kg | |
| run-up | mass × (1 + pace/10) × ground | a full charge at pace 5 adds ~105 |

### 4.4 Cards

| card type | arm speed | body share |
|---|---|---|
| ordinary | 2.0 | 0.03 |
| committed | 2.2 | 0.1 |
| lunge, cross check, shield slam | 2.2 | 0.15 |
| body slam (driven by the legs) | 1.3 | 0.6 |

### 4.5 Weapons

A weapon is a **body** (weight, length, balance, hands) plus **striking parts**, each with
its own distance from the hands, contact shape and keenness. A card picks which part it
uses; stepping inside a long weapon changes which part reaches you.

| weapon | weight (kg) | balance distance (m) | felt (kg) | hands | parts: distance out (m), part weight for swings (kg) |
|---|---|---|---|---|---|
| quarterstaff | 2.0 | 0 | 2.0 | two | end 0.9, 0.7 · shaft near the hands 0.3, 0.5 |
| longsword | 1.4 | 0.12 | 1.6 | one | tip 0.9, 0.4 · middle of the edge 0.6, 0.5 · hands/pommel 0, 0.3 |
| mallet | 5.0 | 0.65 | 8.3 | two | head 0.9, 4.0 |
| ball and chain | 3.0 | 1.3 | 6.9 | one | head 1.4, 2.8 · chain 0.7, 0.4 |
| spear | 2.5 | 0.5 | 3.8 | two | head 1.8 (thrusts: all 2.5 kg) |
| dagger | 0.3 | 0.05 | 0.3 | one | point (thrusts: all of it) |
| buckler | 0.8 | 0 | 0.8 | one | boss, at the hand |
| fist | — | — | — | — | the body share only |

Part weights are authored judgements. An earlier attempt derived them as `weapon_weight ×
balance_distance / part_distance`, clamped to [1/3, 1]; it was dropped because it gave a
staff end no weight at all without the clamp.

---

## 5. Splitting force into penetration and shock

Two channels, derived from the contact rather than from a damage type:

- **penetration** breaks through a layer to reach what's inside (cuts, thrusts)
- **shock** passes through a layer without breaking it (mostly blunt)

The intended rule: `concentration = reference_area / contact_area`, with the reference area
about a staff's end (~0.0009 m²); the penetrating share rises with concentration × the
part's keenness (0–1); the rest is shock. **The exact function is not defined yet.** The
examples below use fixed shares:

| contact | penetrating share |
|---|---|
| points (spear, dagger) | 95% |
| sword edge | 74% |
| blunt (staff, mallet, fist, buckler, ball, body) | 5% |

---

## 6. Flowing through the body

The body is an **anatomy graph**: elements (skin, muscle, bone, organs) connected by
"behind me is" arrows, each with a share. A blow lands on surface elements and flows
inward. Each element takes damage from what arrives, then passes the rest on:

```
penetration_out = max(0, penetration_in − element.penetration_reference)
shock_out       = max(0, shock_in − element.soak)
```

- **Penetration** is used up by each element's penetration reference: how hard something is
  to cut is the same number as how much it stops a cut.
- **Shock** is used up by a separate **soak** amount, because fragility and absorption differ:
  bone is hard to break but soaks almost nothing; muscle and fat soak a lot. Soak is an
  amount, not a fraction, so padding helps a lot against small blows and little against
  huge ones.
- **Passing through:** penetration still left at the end of a chain means the blow went
  through (severed or skewered) and carries on.
- **Leftover force that doesn't carry on moves the body**: off balance, knocked back, maybe
  down. Every blow's force ends as damage, as carrying on, or as moving the body.
- **One blow arriving by several paths** (e.g. three pieces of jaw skin all leading to one
  jawbone) is added up after each path's own soak and judged **once**.
- Skin and muscle are **templates** whose values vary by place (fat counts as skin: thin over
  the shin, thick over the thigh).

### 6.1 The leg used in the examples

The front of the shin is skin straight onto the tibia; the calf has muscle in between.

| element | penetration reference | shock reference | soak |
|---|---|---|---|
| shin skin (thin fat) | 6 | 60 | 2 |
| calf skin | 6 | 60 | 5 |
| calf muscle | 25 | 50 | 15 |
| tibia | 90 | 45 | 1 |

Front of the shin: skin → tibia. Calf: skin → muscle → tibia.

---

## 7. Damage labels

Each element compares what arrived against its reference force for that channel. The
examples use the **ratio** directly, with bands for bone:

| arriving ÷ reference | bone label |
|---|---|
| < 0.45 | bruised |
| 0.45–0.7 | badly bruised |
| 0.7–0.95 | cracked |
| 0.95–1.2 | broken |
| > 1.2 | shattered |

A severity formula (`50 × ratio ^ steepness`, steepness 2 for bone) was proposed earlier
but **is not settled**; the bands above are what it implied. How the two channels combine
into one label for an element is also not defined.

---

## 8. Results

### 8.1 Forces, 70 kg fighter

| blow | strength 0 | 5 | 20 |
|---|---|---|---|
| staff end, committed swing | 32 | **48** | 97 |
| staff, stepped inside (shaft near the hands) | 21 | 32 | 64 |
| cross check with the staff (wide contact) | 28 | 41 | 83 |
| sword tip, committed swing | 31 | 46 | 93 |
| sword edge, committed swing | 26 | 40 | 79 |
| sword edge, ordinary cut | 8 | 12 | 25 |
| sword, stepped inside (hands and pommel) | 16 | 24 | 48 |
| mallet head, committed (penalty ×0.66 / ×0.82 / ×1) | 30 | 57 | 138 |
| ball and chain head, committed (×0.61 / ×0.69 / ×0.93) | 32 | 54 | 144 |
| ball and chain, stepped inside (the chain) | 17 | 29 | 77 |
| spear, committed thrust | 21 | 31 | 63 |
| spear lunge | 29 | 43 | 86 |
| dagger, committed thrust | 16 | 24 | 48 |
| dagger lunge | 24 | 36 | 71 |
| committed punch | 15 | 23 | 46 |
| buckler slam | 25 | 37 | 75 |
| body slam, point blank (wide) | 55 | 82 | 164 |
| body slam at a full charge, pace 5 | — | 187 | — |

Worked example, staff end at strength 5: weight behind = 0.7 + 0.1 × 70 = 7.7 kg; speed =
2.2 × 1.5 × 1.9 = 6.27; force = 7.7 × 6.27 ≈ 48.

### 8.2 Against the leg, at strength 5

| blow | where | result |
|---|---|---|
| staff end (48: 45.6 shock) | front of shin | 43.6 reaches the tibia → 0.97, **just broken** (the calibration anchor) |
| staff end | calf | muscle gets 40.6 shock (0.81, deep bruise); tibia gets 25.6 (0.57, **badly bruised**) |
| mallet (57) | front of shin | tibia gets 52.2 → 1.16, **broken** |
| ball and chain (54) | front of shin | tibia gets 49.3 → 1.10, **broken** |
| sword edge, committed (40: 29.6 penetration) | calf | 23.6 reaches the muscle (0.94): **deep cut**, nothing left for the bone |
| sword edge, committed | front of shin | 23.6 penetration reaches the tibia (0.26): **notched**, not broken |
| sword edge, ordinary (12) | calf | 2.9 reaches the muscle: **shallow cut** |
| spear thrust (31) | calf | 23.5 into the muscle (0.94): **deep puncture** |
| spear lunge (43) | calf | through the muscle; 9.9 reaches the tibia (0.11) |
| committed punch (23) | front of shin | tibia 0.44: **bruised** |

At strength 0 the staff badly bruises the front of the shin (0.65); at strength 20 it
shatters it (2.0).

### 8.3 What the designers read into these

1. **Commitment matters enormously for light weapons**: an ordinary sword cut is 12,
   committed 40. Swords and daggers live on body mechanics.
2. **Thrusts carry less force than swings but penetrate**, because they have no lever but a
   tiny contact.
3. **Blades don't break bone; blunt weapons do.** Bring a staff to the crypt.
4. **Heavy weapons are for strong fighters**: at strength 0 a mallet is no better than a
   staff, and slower; at 20 it's about 1.4× the staff.
5. **The biggest numbers are the least damaging**: body slams and cross checks land wide,
   so they're nearly all shock spread over several cells, and mostly knock people over.
6. **Stepping inside a long weapon helps**: about a third off a staff, about half off a
   sword or a ball and chain.

---

## 9. Assumptions, stated plainly

- Strength scales speed linearly (`1 + s/10`); the same multiplier applies to every card.
- A straight motion moves the whole weapon at hand speed, so its full weight counts. A swing
  only counts an authored part weight at the striking part.
- Lever grows linearly with distance from the hands (`1 + distance`).
- Body share is a fixed property of the card, independent of the fighter.
- Two hands exactly double the comfortable weight.
- Penetrating shares are fixed per contact type (§5) until the concentration rule is
  written.
- Elements subtract fixed amounts; there's no proportional loss in either channel.
- Shock and penetration are independent channels that don't interact inside an element.
- The leg is simplified to three layers; shares, splitting along arrows and spreading are
  ignored in the leg examples (the whole blow is assumed to land on one surface element).
- Ignored for now: posture, being disrupted mid-strike, the target's own movement into the
  blow, exhaustion, fatigue, injuries, damaged elements passing more, armour, the weapon's
  effect on timing.

## 10. Known weak spots

- **The sword's sweet spot doesn't appear.** The tip hits harder than the middle of the edge
  (46 vs 40), because it's faster and nothing else differs. The proposed fix is through
  contact: the tip touches a short stretch of edge, so the wound is smaller.
- **Part weights are hand-authored**, and are the least principled numbers here.
- **The penetration/shock split function is missing.**
- **The severity formula and how channels combine** are unsettled.
- **Run-up depends on a distance system** the designers have doubts about.
- **Shapes the contact model can't express yet**: how deep a spike can go (a morningstar's
  3 cm spikes can't reach a heart), several points at once (a morningstar, a trident, claws),
  and a thick wedge versus a thin blade (an axe versus a sword).

## 11. What we'd like a reviewer to look at

- Does the shape `weight_behind × speed + run_up` hold up across these weapons, or does it
  break somewhere we haven't tried?
- Are the results in §8 believable, relative to each other?
- Which assumptions in §9 are most likely to cause trouble later?
- Is there a simpler way to get the same behaviour?
- Anything that looks like it's quietly doing more work than it should (the way the
  one-third clamp on part weight was).

---

## 12. Round two: response to the review (21 Oct 2026)

Thank you; the review found real problems. Below is how we read each suggestion, what we
propose instead where we differ, and the questions it opened. **Nothing here is
calibrated yet**; numbers are illustrative only.

### 12.1 Summary

| suggestion | our response |
|---|---|
| A. run-up into speed, not force | **adopted** |
| B. lever = 0.7 + distance | **adopted and extended**: the base comes from the joint that drives the move, and it needs a counterweight in timing |
| C. the card decides swing vs thrust | **adopted in principle**, but we read the physics differently: see 12.4 |
| D. the sweet spot via grip torque | **adopted**, and we think the sweet spot also appears in force once C is fixed |
| E. strength as power-to-weight | **adopted in a different place**: in timing, not force, plus a size baseline. See 12.6 |
| weight penalty as a floor | **adopted in shape**; constants later with the weapons |
| continuous severity under the labels | **agreed**; that was always the intent |
| soak cliffs | **agreed** that consequences soften them; a capped soak noted as an option if a case needs it |
| the split function, depth limits | **agreed**, still open |

### 12.2 A. Run-up

```
speed_at_hands = arm_speed(card) × (1 + strength / 10) + run_up_speed
run_up_speed   = k × (1 + pace / 10) × ground_crossed
```

Running speed is not multiplied by the lever. A consequence we like: **run-up now scales
with how much of the body the card brings.** A charging shoulder slam (body share ~0.6)
carries most of its weight at run-up speed; a charging dagger lunge (~0.15) gets a real
bump, about 11 kg × the run-up, but nothing like a battering ram.

### 12.3 B. The lever, and where it pivots

A swing turns around a joint, so the striking part's speed is turning speed × its distance
from that joint. Rather than a fixed 0.7 m, **the card says which joint drives the move**:

| driving joint | base radius (m) |
|---|---|
| wrist (a flick) | ~0.05 |
| elbow (a forearm chop) | ~0.35 |
| shoulder (a full swing) | ~0.7 |
| spine (a whole-body swing) | ~0.9 |

with in-between values allowed. A flick with a long weapon gains a lot of tip speed from
very little. The radius should probably also scale with the fighter's height, since arm
length varies.

Compared with `1 + distance`, at equal hand speed the shoulder version makes length matter
about 1.4× more per metre (staff end ×2.3 instead of ×1.9, spear head swung ×3.6 instead
of ×2.8). That's closer to reality (a sword tip moves roughly 2.5–3× as fast as the hand),
but:

- **It needs a counterweight.** Real long weapons are much harder to *turn* (rotational
  inertia grows with length squared). With the weight penalty reduced to a floor, nothing in
  force brakes long weapons. We think the brake belongs in **timing**: longer and heavier
  means slower windups, earlier commitment, and less ability to change plans mid-strike.
  That last one is the dagger's real advantage. Timing is the next topic, and B shouldn't
  be finalised without it.
- **Thrusts need their own number.** With thrusts fixed at 1.0 and a swing at the hands at
  0.7, a straight punch out-hits a hook by 40% from a constant alone. A thrust's speed
  should be chosen deliberately on the same footing.

### 12.4 C. Swings, thrusts, and where the weight comes from

We agree a part is just a physical part and the card decides the motion. But we read the
mass question differently, and it led to what we think is the more important fix.

**Swings.** The review is right that we under-counted the weapon. The weight effectively
behind a point on a swung weapon is its **effective mass** there: for an evenly weighted
blade, about three-quarters of the weapon near two-thirds of the way out (the sweet spot),
and about a third at the tip. So a sword's middle-of-the-edge part weight should be nearer
1 kg than the 0.5 we used.

**The deeper flaw: the body was riding the lever.** §4 multiplies *everything* behind the
blow by the speed at the striking part, including the body share. That says your body's
mass arrives at sword-tip speed, which is wrong, and it's why the tip out-hit the edge.
Proposed:

```
force = part_weight × speed_at_part  +  body_share × mass × speed_at_hands
```

**Your body's weight arrives at your hands' speed; only the weapon's own weight gets the
lever.**

**Thrusts.** We think the grip argument is right, but about the body, not the weapon. In a
straight thrust the weapon moves as one rigid piece at hand speed, so all of its own weight
arrives, regardless of grip: its momentum doesn't pass through your hand. What a grip
limits is how much of **your body** you can push through it before your hand slips. So:

- thrusts keep the **whole weapon's weight**
- **grip caps a thrust's body share**: one hand low, two hands higher, a brace or couched
  spear highest

That's also good gameplay: a one-handed thrust can't put much of you into it.

Illustrative numbers at strength 5 (hand speed 3.3, committed body share 7 kg, shoulder
lever):

| | weapon part | body | force |
|---|---|---|---|
| sword, middle of the edge | 1.0 × 6.3 | 7 × 3.3 | ~29 |
| sword tip | 0.45 × 7.6 | 7 × 3.3 | ~27 |
| staff end | 0.7 × 7.6 | 7 × 3.3 | ~28 |
| mallet head | 4.0 × 7.6 | 7 × 3.3 | ~54 |

- **The sweet spot appears in force**: the middle of the edge out-hits the tip, with no
  extra rule.
- **Heavy heads matter far more**: the mallet is now about twice the staff.
- **Light weapons live even more on the body.**
- **It defuses part of B**: the lever only multiplies the weapon's own weight, so long
  *light* weapons gain little from length; long *heavy* ones still gain a lot, and those
  are exactly what timing should slow.
- **All forces drop**, so the calibration anchor (an average committed staff strike just
  breaks a shin) needs re-tuning.

### 12.5 D. The sweet spot through grip

Adopted as the review describes: striking hard things with the extreme tip twists the
weapon in your hand, risking deflection, hand strain and lost posture. It gives grip span
(`holding = strength × grip span`, from the parry/disarm model) a second job. With 12.4,
the sweet spot now shows up in both force and grip.

### 12.6 E. Strength, mass and size

We agree trolls should be strong, heavy and slow, and that no creature should need an
absurd strength number (−25 or 300) to make the maths work. But a strict power-to-weight
reading has a consequence we don't want: if limb speed goes with strength ÷ mass and force
is mass × speed, **body mass cancels out of every swing**, and a 100 kg fighter hits no
harder than a 60 kg one of the same strength.

What we think is going on: **one "speed" was doing two jobs**, how much momentum a blow
carries (force) and how quickly the swing happens (time). Proposed:

- **Force** uses strength and mass as now.
- **Time** (windup, recovery) uses **strength relative to what's being moved**: your own
  body plus the weapon's felt weight. Power-to-weight belongs here, where it's right.

**And a size baseline, from square-cube.** Muscle force grows with cross-section (size²)
and weight with volume (size³), so bigger creatures are much stronger in absolute terms but
weaker relative to their own weight. So:

- **the body sets the baseline**: a creature's raw muscle output comes from its mass,
  growing more slowly than mass itself (∝ mass^⅔)
- **strength says strong or weak for its kind**, on the same 0–20 scale; an average troll
  is about 5, a strong one 12
- **slowness falls out**, because output grows more slowly than mass

| average member, strength 5 | mass | muscle vs a human | weight vs a human | moves its body |
|---|---|---|---|---|
| human | 70 kg | ×1 | ×1 | ×1 |
| troll | 300 kg | ×2.6 | ×4.3 | ×0.6 |
| dragon | 5 t | ×17 | ×71 | ×0.24 |

- A physique built for hitting (troll arms) would be a **build factor** on the frame, next
  to mass, so "trolls hit unusually hard for their size" is a fact about trolls rather than
  a fudged strength number.
- Could be a formula (mass^⅔) or a small table of size classes. Either is fine by us.

### 12.7 Weight penalty

Agreed as a floor. With comfortable weight 2.5 + 0.3 × strength (×2 for two hands), an
average fighter swings a mallet freely. The ball and chain one-handed stays penalised at
strength 5, which seems right for an exotic weapon. We'll tune the constants with the
weapons.

### 12.8 Questions back to the reviewer

1. Does **body at hand speed, weapon at part speed** (12.4) hold up, or does it break
   somewhere, e.g. whole-body swings where the hips and shoulders really do move fast?
2. Is a **grip cap on a thrust's body share** a fair reading of the grip argument?
3. Does **power-to-weight in timing, not force**, plus the **square-cube baseline**, solve
   the troll and dragon cases without creating new ones?
4. With length now mattering more in swings, what's the strongest **counterweight in
   timing** you'd expect long weapons to need?
5. Anything in 12.2–12.6 that looks like it's quietly doing more work than it should?
