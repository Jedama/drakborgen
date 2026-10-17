# Ideas, loose ends and half-thoughts

The scratchpad. `vision.md` is the why and `design.md` is the what; this is the *maybe*:
ideas that were tossed around and never settled, options left open side by side, things
mentioned once in passing that deserve not to be forgotten.

Nothing here is decided. If something gets settled, it moves into `design.md` and its entry
here gets a line saying so (or is deleted). Add freely, in any state of doneness, and say
where an idea came from and how warm it was received — "Dan's idea, liked", "Claude's
suggestion, never answered", "considered and leaning against".

The first batch was recovered from the brainstorm transcripts of 21 Sep – 15 Oct 2026, after
a context compression lost the live conversation.

---

## Settled in conversation, never written into design.md

These were agreed at the time but didn't make it into the docs. Candidates to promote.

**How draws are weighted.** One deck, every card always in it; weights decide what you're
likely to draw.
- Every card carries tags. The stance tag is the obvious one and gets **colour-coded**. A
  card can carry several (a *loose bolt* is both await and defend).
- Instinct is drawn at random. You look at the colours of that hand, pick a stance, then
  draw the rest **mostly from that stance's pool, a bit more from the adjacent pools, and a
  little at random**. Of six stance cards, about four from the chosen stance on average.
- Stances sit on an axis, which is what "adjacent" means: **flee — defend — await — attack
  — charge**. Sneak, blindsided and other situational stances sit off the axis.
- **Situational tags raise relevant cards.** Opponent prone → finishers. Closer than you'd
  like → disengages. Frightened → flee, run away, stand paralysed, falter. The point is
  *relevance, not correctness*: nobody should hold a hand of sidesteps while something lies
  helpless in front of them, but whether finishing it beats checking your bleeding is still
  your call. Risk noted: if weights get strong, the game plays itself. Nudges, not
  guarantees.
- Reaction windows draw almost entirely from a reaction / very-quick pool.
- **Decisiveness** sets how tightly the hand concentrates on the chosen stance.
- The deck is always inspectable. In development, the weights should be too ("why was
  *falter* three times as likely as *lunge*?").

**Auto-drawn cards.** Cards that arrive because of circumstance rather than the shuffle. The
first case: rare gear gets lost in a big deck, so **await with a loaded crossbow always
offers *fire bolt***. The same pattern covers a thrown rock when you're holding one, *get
up* when you're prone, and pain cards autoplaying. Worth naming as a general mechanism.

**Stances can be imposed, not only chosen.** *Blindsided*: ambushed, so you draw at random
or weighted toward quick and run-away cards, with brace at the floor, already close. Open:
whether that's the only imposed stance, or whether *floored* (prone) and *reeling* (dazed)
are stances too rather than status effects. "Just one general *unready* stance" was also on
the table. Berserk already does the same thing from the other side, locking you to
charge/attack. The unifying line, from Claude: a stance is "what your mind offers this
turn", whether you chose it or the situation chose it for you.

**Scaring things off needs no mechanic.** Charge adds intimidation → their fear rises →
their hand fills with run-away cards → they play one. A fleeing monster is a decision it made
with the hand it had. Mindless things never get fear cards, so they never flee.

**Disengages come in variants** like everything else: shield-up back off, roll and skip
away, turn your back and run, a couple of steps back. Some get pursued, and some are free
because the other side was blocking or dodging. Very far is reachable again this way: to
check wounds, fight at range, run, or just breathe.

---

## Stealth and sneaking

Long way off, deliberately not designed. What was said:

- **Sneaking comes before stances.** Stances are for when the fight starts. Trying to jam
  sneaking into the stance system felt wrong at first. Landing your first attack, or being
  spotted, is the handoff into combat.
- **But it drifted back.** By the end of the discussion: "see an enemy, choose a card —
  sneak up and stab, aim and shoot, sneak up and poison gas" looks more and more like the
  normal system with a **sneak stance**. That's probably where it lands.
- **The ambush is just a normal attack at zero brace.** No assassination rule. The fight
  then runs as if this were turn 2 and turn 1 was you getting stabbed in the back. The
  wound persists like any wound.
- **One-shots are allowed** and fall out of the anatomy: a crossbow bolt to the head,
  Yūbara's poison gas, a fireball, Aelfric's morningstar at full force into an unprotected
  skull. Claude: stealth becomes "delete the weak, enrage the strong" without anyone
  balancing it. A knife in a goblin's back is a kill; in a troll's back it's a wound and an
  angry troll at near.
- **The ambush hand.** You draw a generous hand filtered to cards that make sense against an
  unready target. The draw is there to bound the UI, not to create drama. Claude's
  addition: those cards are mostly the ones that are *bad* in a real exchange (precise
  throat cut, full wind-up, grapple from behind, carefully aimed bolt), so some cards might
  exist only for ambushes, which gives stealth builds something to collect.
- **Unanswered idea (Claude): time buys a better hand.** Watching the target for its
  routine, waiting for it to turn, spending clock to draw more or better cards. Patience
  traded for certainty, against midnight. It would give instinct/analysis a job here too.
  Dan wanted to park the whole thing before answering; "watching the enemy for their
  routine or weak points" was his own phrasing, so the shape is in his head too.
- **Sneaking past** should be possible but hard, gated by stats, armour and shield. It's
  essential for Yūbara and nearly impossible for Rohan.
- **Stealth as a stat** — mentioned as a possibility, never discussed. There's no stealth
  on the wheel; currently nothing owns "being quiet". Candidates: its own stat, or derived
  from footwork + mass + gear.

---

## Direction: front, side, behind

Raised during the anatomy-graph discussion (16–17 Oct). Shelved for now; the graph is
front-facing only. What came up:

- **Why it would matter:** sneak attacks and backstabs, flanking, the Achilles, armour that
  covers only some sides (a greave with an open back, a breastplate without a backplate),
  and shields, which are inherently a front thing.
- **Side probably isn't needed for bodies.** A side hit is a different *column*, and
  columns already exist. It might matter for armour (front-and-sides vs back).
- **The catch:** the depth order itself depends on direction. From the front the heart is
  behind sternum and ribs; from behind it's behind spine and shoulder blade. Authoring a
  second chain per body would roughly double the anatomy work.
- **Cheapest version on the table (Claude):** the body graph is the same from every
  direction, and only armour and a few features know front from back. Not discussed
  further.
- **Backstabs may not need direction at all.** Dan: if you've snuck up on someone you
  probably go for the neck, and the neck is its own row. The neck's order differs too
  (spine first from behind, throat first from the front), but for a full-force blow
  that probably doesn't matter.
- What exists already: features can be tagged **needs-an-opening** (reachable from
  behind, or only while prone).
- **Backstab targets, once there's a system:** the **brainstem**. It's inside the skull,
  at its base, where it becomes the spinal cord, so it belongs to the head graph, not the
  neck. From the front it's only reachable through the brain (already a near-fatal hard
  line), so it adds little. From behind, at the base of the skull, it's the instant kill:
  breathing and heartbeat stop. A reviewer also suggested a thrust through the open mouth
  past the back of the throat. Kidneys and the back of the neck are other likely
  candidates.

---

## The encounter, before any fight

- **Four exits, none free:** fight (costs limbs), scare (intimidation vs its
  self-preservation; never works on skeletons), sneak (contradicted by armour), run (it
  chases you, or stands guard and you need another route deeper).
- Claude's observation: the cost of running is *geographic*. A monster that chases or blocks
  a corridor means the dungeon remembers where things are, so your route matters.
- **Blue Prince-style drafting of the castle.** Dan's idea, flagged as needing "a lot of
  different considerations". Pulls the same way as the spatial consequences above: a
  castle you navigate, not a sequence of encounters. Drafting randomness also came up as
  a luck source (below).
- **What turn one is for**, Claude's framing, which Dan agreed with: less about combat
  than about *whether this fight happens*. Very far is the "do I want this?" band.

---

## Luck: the options not taken

`design.md` §Luck has the agreed shape. These were raised along the way and are still
available:

- **Luck biases the draw.** Philosophically the cleanest, since randomness already lives in
  the deck: lucky means the cards you came up with happen to suit the moment. Downside: it's
  invisible and never produces a "Lucky!" moment.
- **Luck outside combat.** Claude asked whether combat is even luck's natural home. In the
  board game it's mostly about what you find and what happens to you. "The room you opened
  had treasure instead of a troll" is a different, maybe better, fantasy than a sword
  wandering into throats. Not answered.
- **Deeds** as discrete luck lumps: sparing something that fled, carrying a dead hero's
  medal out, closing a corpse's eyes. Easy to author, and the dungeon feels like it's
  watching you. Not answered.
- **Vows.** A monk whose luck accrues faster while he keeps a vow and dries up when he
  breaks it. That makes Aelfric's signature a behaviour, not a multiplier. Flagged as easy
  to make annoying. Not answered.
- **A ledger, not a pool**, drifting either side of zero. Adopted in spirit for Faithless
  and desecration; as a general mechanic, ruled against for now (bad luck feels bad).
- **Risk-based accrual variants**, all rejected but recorded: danger of the moment (what's
  in front of you vs your state), commitment, and choices not taken (could have fled and
  didn't; went deeper).
- **Prayer efficiency.** If praying is a good deal, everyone prays constantly and it becomes
  a chore. It probably wants to be slow, weak, or restricted to the characters it suits.
- Luck as compensation for an unlucky **draft** (of the castle, or of cards).

---

## The soul: traits, willpower, drive, luck

- **The soul hub** at the centre of the wheel: what the character believes in, as against
  what they are made of. It holds traits (faithful / faithless) and is where luck lives.
- **A fifth sector instead of a hub.** Dan: "we might introduce soul as a 5th sector of the
  circle, with will to live and luck and drive and other things." That gives luck a home on
  the wheel after all, with its own notch behaviour. Open questions: does a fifth sector
  break the four-way opposition structure (Muscle↔Brain, Sinew↔Nerve), and would the
  soul stats then be notch-driven like everything else, or chosen?
- **Candidates:** **willpower** (refusing to give up over time; does it live in Nerve or the
  soul?), **drive**, **will to live**. None of them has a mechanical job yet. Possible jobs
  to look at: what keeps you fighting late in the salvage phase, resisting panic over many
  turns (where composure is the moment-to-moment version), and whether you pass out or keep
  crawling at high blood loss.
- **Trait names considered:** for Faithless, also Godless, Unblessed, Unfavoured,
  Self-reliant ("trusts nothing but his own hands" — reads as a boast rather than a flaw).
  For the category, also creeds and vows.
- **The quaternary notch as currency:** unlocked during a run, or traded away for a trait,
  luck, or another auxiliary system.

---

## Stat structure: roads explored

The wheel won, but the alternatives explored on the way may matter again, especially for
monsters or for presentation.

- **Disco Elysium-style parent groups** (Physique / Motorics / Intellect / Psyche, children
  set relative to the parent). Liked as "an idea to keep in mind"; it evolved into the
  wheel. Psyche fell apart because composure and intimidation aren't the same faculty.
- **Group by what degrades them** (stats that fail when tired, hurt, afraid, or never). Your
  category would tell you *how you lose*. Never discussed.
- **Group by timescale** (tick / exchange / fight / expedition). Rejected for categories, but
  as a lens it says something useful about a character: "devastating in the instant, weak
  across a fight, fine over days."
- **Named rungs as input** (Feeble / Poor / Ordinary / Trained / Expert / Peerless), with
  continuous values underneath. Dan liked rungs for making creation sensible; the wheel
  replaced them.
- **Practices** (Claude): author a body plus a list of practices — staff forms, mountain
  walking, sitting meditation — and stats fall out. Rejected as a creation system. Claude
  flagged it as the best *progression* surface anyone had proposed, since a run could give
  you practices. Might be worth revisiting for the roguelite question.
- **Width as a body fact** beside height and mass (lean vs bulky: wide means more force and
  stability, narrow means a smaller target). The Frame screen currently has only height
  and mass.
- **Grip** was considered as a stat and rejected ("nobody builds a grip character"). It's
  derived from strength and the state of the hand.

---

## Cards and card ideas

- **Rarities.** A legendary *Decapitate* you're thrilled to draw. Parked since day one. The
  neck row being a twentieth of the body is already its gate.
- **Ball and chain:** your one bail option is letting go of it to dodge. Generalises to
  dropping or throwing any weapon (if you draw such a card), which swaps your weapon cards
  out of the deck.
- **The environment:** pick something up to chuck it, use it as a blunt weapon, shove a
  table. Far future.
- **Prayer** as a mid-fight card. **Assess damage** and **apply pressure** as the rare
  mid-fight self-care.
- **Mind cards** that pay off next turn: calming, analysing, cards that draw you more or
  better cards later. That's the await playstyle's reward.
- **Strategy carries a card over** between turns, so your plan survives the turn boundary.
- **Monster tactic:** a turtling plan that lets an opponent overcommit and exhaust
  themselves (raise shield, then slamming block, letting them wear out).

---

## Open threads

**The ribcage — settled 17 Oct.** It became the anatomy graph with holes (`design.md`
§Anatomy). Ribs are an element with many narrow holes: points slip between, swings and
blunt meet bone, and a skeleton's ribs have nothing behind them. Claude's side remark from
15 Oct, still worth keeping: against a skeleton, precision gets **re-aimed** rather than
becoming useless. It means hitting a narrow *solid* thing (spine, joint, skull) instead of
finding a gap.

**Anatomy graph, loose ends** (from 16–17 Oct):
- **Temple artery: a node, or a property of the temple?** A reviewer suggested it as a node
  between temple bone and brain: a cracked temple tears it, and the bleed builds slowly
  ("feels fine, collapses an hour later"). Claude liked it as a hidden clock that fits
  adrenaline masking, fuzzy injuries and *assess damage*. Open: whether a death you couldn't
  see is fair. Claude's view: yes, as long as *assess damage* can find it.
- **Face muscles:** none in the head graph for now. Optional candidates: the temporalis
  (padding over the thin temple) and the masseter (side of the jaw).
- **Cranium as one element.** Real skulls fracture locally (a cracked forehead doesn't
  weaken the crown), but Dan judged that too niche to matter. Split later only if it ever
  does.
- **Eyebrows** sit on the orbit as flavour. Possible use: a cut to the brow bleeding into
  the eyes.
- **An anatomy graph viewer**, later an editor, drawn as a Sankey diagram with a column per
  tier. Dan wants one for authoring. Claude's suggestion: two modes, the anatomy as authored
  and "show me where this hit went", since force flows along the same arrows.
- **Orientation is ignored for holes and edges.** Physically, a horizontal slice runs
  parallel to the ribs and could slip between them while a vertical chop crosses them all.
  Deliberately left out; revisit only if a case needs it.

**The end-to-end fight plan.** The original plan was lost to the compression. The rebuilt
one: author Aelfric (done) → author the skeleton the same way → gear in the same terms → the
opening → one full turn → one meeting resolved completely → carry state into turn two → end
it and write down what broke. Dan's direction: no newtons, no unit translation chains; the
reference forces are the right currency, and celerity's absence doesn't block anything.

---

## Not recovered

The stat wheel itself was designed in a separate brainstorm outside Claude Code (pasted in
on 15 Oct as "Character stat wheel — design"). That conversation isn't on this machine, so
whatever was said there beyond the pasted summary isn't in this file.
