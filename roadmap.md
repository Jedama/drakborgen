# Roadmap

What's left to design or build, roughly ranked. The overview, not the detail: each item
points to where the detail lives. `design.md` holds what's decided, `ideas.md` what's loose,
this file what's *next*.

Ranking is by what unblocks the current goal — **a combat proof of concept, run end to end
on paper** — not by how interesting it is. Move things freely; cross them off by deleting
them (git remembers).

Last reshuffled: 17 Oct 2026.

---

## Now: blocking an end-to-end fight

1. **Numbers for what each element passes on.** The rules are settled (penetration
   subtracts the penetration reference, shock subtracts soak, leftover penetration at the
   end of a chain went through). Still needed: soak values for the templates, and the shin
   example redone with the real layering. Can wait until the fight needs them.
   (`design.md` §Elements, §Force along a path, §Worked example: shin)
2. **How stats feed the combat maths.** The approach is settled (one mechanic at a time,
   three handwaved anchors at 0 / 5 / 20, build–compare–band, exhaustion and fatigue
   ignored at first). **Force is settled in shape after two review rounds** (weapon part at
   part speed + body at hand speed; levers from the card's joint; size tiers;
   power-to-weight in timing; total mass and exhaustion through effective stats).
   **Next: timing** — windups and recovery from power-to-weight against total mass, the
   heavy-versus-long counterweights, what raises exhaustion per card, and where celerity's
   missing home gets decided.
   Then re-tune the shin anchor, since every force dropped. (`design.md` §Making the force,
   §How stats get read; `character-creation.md` §4, §7)
3. **Where a blow lands, the rest.** The shape is settled (the arc and heights decide where
   it can go; ordinary cards steer a little by analysis, targeting cards name a target in
   reach; precision sets drift, a roll its direction; cards trade force for control; the
   fighter chooses by sampling candidates and scoring how much worse off each leaves the
   defender). Open: the defender's part (moving into a blow), the scoring weights (long
   term), and numbers. Still needed: vital value and
   obviousness for the head's elements, how precision turns into drift, and natural
   landing spots for the cards the fight uses. (`design.md` §Where a blow lands)
4. **Author the skeleton** as a graph, and the quarterstaff in the same terms.
5. **Run the fight**: the opening → one full turn → one meeting resolved completely → carry
   state into turn two → end it and write down what broke. (`ideas.md` §Open threads)

## Next: to make the proof of concept complete

- The rest of the humanoid graph, starting with the neck (windpipe, carotids, spine; where
  mouth → throat lands)
- **The penetration/shock split function** (contact area and keenness into the ratio), and
  **depth limits** for short spikes. Both flagged by the review for round three.
- How much of a swing's force a cell uses up before the rest carries on (passthrough
  itself is settled; lodging is an idea)
- **Severity, properly.** The formula (`50 × ratio ^ steepness`) is a quick proposal that
  was never really discussed; the labels and ladders want refining too. (`design.md`
  §Severity)
- Damaged elements: what a cracked bone passes on
- Required accuracy for parries (attack's arc and working size against the defending
  object)
- Pain cards autoplaying onto the timeline
- Fear: how much contamination per level, and where it lands
- Exhaustion and fatigue rates
- Posture bonus and penalty numbers
- How the player sees the timeline, the shifts and the opponent's hints
- Monster AI (random is fine for the proof of concept)
- An anatomy graph viewer, later an editor (Sankey, a column per tier) (`ideas.md`)

- Revisit the distance system: Dan has doubts, and run-up depends on it (`ideas.md`)

## Later: beyond the combat proof of concept

- Engagement: binds, clinches, grappling, a weapon lodged in a monster, riding its back
- Breaking weapons and shields (durability)
- The environment: picking things up, shoving a table; position in the room and walls
- Heat (dragonfire, the fireball) and poison
- Direction: attacks from behind, backstabs, the brainstem (`ideas.md` §Direction)
- Stealth and sneaking (`ideas.md` §Stealth)
- Luck, traits and the soul hub (`design.md` §Luck, §Traits; `ideas.md` §The soul)
- Strategy as a stat (`design.md` §Strategy)
- Heroes, unlocks and roguelite progression (`vision.md` §Heroes)
- The dungeon layer: navigation, the midnight clock, traps, castle drafting
