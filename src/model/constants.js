// The entire tuning surface. Everything else in model/ is derived from stats
// and these. If a number is being tuned, it belongs here and nowhere else --
// scattering magic constants through the pipeline is exactly what the previous
// version did and why every tuning pass broke something.
//
// See combat-model.md section 7 for what each one governs.

export const K = {
  // --- Anchors --------------------------------------------------------------
  // 1.0 by definition, not by tuning: capability stats are ratios where 1.0 is
  // an ordinary competent adult, so an ordinary adult lands on exactly 0.5 of
  // each saturating term. Changing these moves what "ordinary" means.
  K_A: 1.0,   // Agility   -> evasion opportunity
  K_P: 1.0,   // Precision -> placement quality

  // --- Connecting at all ----------------------------------------------------
  K_T: 40,            // telegraph ticks -> how much warning is usable
  EV_MAX: 0.55,       // ceiling on the combined Miss + Graze share
  GRAZE_BASE: 0.15,   // graze from attacker imprecision alone; survives bracing

  // --- Where it lands -------------------------------------------------------
  VITAL_MAX: 0.16,    // ceiling on the Vital band's width
  VITAL_EXP: 1.6,     // how steeply Precision must climb to open Vital
  GUARD_VITALS: 0.6,  // how much full guard readiness narrows Vital
  BRACE_GAIN: 0.70,   // how far full guard readiness closes the gap in Coverage

  // --- Load -----------------------------------------------------------------
  CARRY_K: 12.0,      // Strength and body mass -> carry capacity
  ENC_PACE: 0.6,      // what carried weight costs Pace
  ENC_AGI: 0.4,       // what carried weight costs Agility
  BULK_PREC: 0.5,     // what restricted articulation costs Precision

  // --- Momentum -------------------------------------------------------------
  SWING_K: 36,        // Strength -> weapon velocity (m/s)
  M0: 0.8,            // weapon mass at which swing speed halves
  M_REF: 88,          // momentum of a reference standing cut by an ordinary adult

  // --- Getting through ------------------------------------------------------
  KAPPA: 0.25,        // floor on Bite, so zero-concentration blows still do something
  A_K: 6.0,           // Concentration -> contact footprint
  A_MIN: 0.05,
  AIM_AT_MATTER: 0.6, // how much Precision recovers against low Solidity
  TOUGH_K: 1.0,       // Toughness -> resistance scale
  HARD_K: 42,         // Hardness  -> resistance scale
  PEN_K: 20,          // penetration aggressiveness  <-- least calibrated
  SHOCK_K: 0.35,      // momentum transmitted through unpenetrated armor

  // --- Severity anchors -----------------------------------------------------
  GRAZE_FRAC: 0.10,   // graze severity as a fraction of a clean connection
  GRAZE_JOIN: 0.9,    // how close Graze's end sits to Guard's start
  GUARD_RISE: 0.10,   // Guard's internal rise
  VITAL_GAIN: 1.8,    // Vital payoff multiplier at Redundancy 0

  // --- Hand dominance -------------------------------------------------------
  HAND_PREC: 0.12,    // an off hand is much clumsier...
  HAND_STR: 0.05,     // ...than it is weaker
  BONUS_SHARE: 0.4,   // dominant-hand bonus as a fraction of the off-hand penalty

  // --- Band shape -----------------------------------------------------------
  // Rise fractions are semantic: what portion of a band's width its change
  // happens over, and at which end. Drifts are DERIVED per defender (see
  // curve.js derivedDrifts) -- these are only their scales.
  RISE_GUARD: 0.35,   // back-loaded: flat, then lifts into Wound
  RISE_WOUND: 0.35,   // front-loaded: jumps past the guard, then plateaus
  RISE_VITAL: 0.50,   // front-loaded: climbs to the ceiling, then eases
  DRIFT_GUARD: 0.10,      // x (1 - Spread)
  DRIFT_WOUND: 0.12,      // x (1 - Redundancy)
  DRIFT_VITAL_BASE: 0.05, // + DRIFT_VITAL_GAIN x Redundancy
  DRIFT_VITAL_GAIN: 0.45,

  // Smoothness. A rise normally happens over its own span (rise x band width);
  // SOFTNESS is a floor under that in roll units, so a very narrow band still
  // gets a runway instead of a wall. It is NOT cosmetic: past ~1.5 it starts
  // moving outcomes rather than appearance. SOFT_GAIN lengthens the runway in
  // proportion to the size of the rise -- 0 leaves it off.
  SOFTNESS: 1.0,
  SOFT_GAIN: 0.0,

  // --- Tempo ----------------------------------------------------------------
  // Every phase length is a multiple of ONE quantity: how long this fighter
  // takes to move this weapon through a unit of motion. It reuses v_weapon
  // from momentum() -- deliberately, because that is what makes a slow swing
  // and a heavy swing the same fact rather than two numbers to balance against
  // each other. A card's profile cannot author its way out of the trade.
  //
  //   tau = TEMPO_K / v_weapon        ticks per unit of motion
  //
  // Calibrated so an ordinary adult (Strength 1.0) with a 1.3 kg arming sword
  // sits at tau ~= 58 ticks, which puts a plain horizontal cut near 175 ticks
  // and a committed overhead near 270. A turn runs 300-500 ticks, so that is
  // the "two big swings or four small attacks" the design asks for.
  TEMPO_K: 1000,

  // Commitment (-1 bluff, 0 uncommitted, +1 committed) pulls windup and
  // recovery in OPPOSITE directions. Throwing yourself into a blow gets it
  // started sooner and leaves more to unwind; holding back is slower to arrive
  // and cheap to abandon. This is the whole tempo cost of commitment, and it
  // is why a Committed attack also lands better (shorter telegraph, section 5.2).
  COMMIT_WINDUP: 0.25,
  COMMIT_RECOVER: 0.35,

  // Weapon Recoverability -> recovery length. 1.0 is a weapon you can simply
  // stop; 0.0 doubles the unwind.
  RECOV_K: 1.0,
  // Extra recovery from a blow that buried itself -- an axe to dislodge. Scales
  // with penetration and with how badly the weapon recovers. Resolved at
  // resolution time, never at lock-in: energy is committed when you play the
  // card, time is discovered when it plays out.
  LODGE_K: 0.6,

  // --- Exertion -------------------------------------------------------------
  // Budget is Stamina-derived; Stamina 1.5 lands on 37.5, matching the
  // illustrative per-turn budget in section 08 of the design notes.
  STAMINA_K: 25,
  // How much a card's authored exertion swings with the stat it demands. A
  // chandelier is cheap for a strong back and ruinous for a weak one; at
  // EXERT_GAIN 0.5 that spread is about 1.17x either side of ordinary.
  EXERT_GAIN: 0.5,

  // --- Reaction windows -----------------------------------------------------
  // A window opens when an event's salience clears the watcher's threshold.
  // Improvisation sets the threshold (do I even notice the opening); Reflexes
  // sets the latency (how fast I can be on it). One stat, one job.
  IMPROV_K: 0.55,     // salience an ordinary Improvisation 1.0 needs to clear
  DRAW_STEP: 0.35,    // salience above threshold per extra reaction card drawn
  DRAW_MAX: 4,
  REACT_BASE: 22,     // reaction latency in ticks at Reflexes 1.0
  // Converting an action already in motion into a different one. Only
  // Committed pays this, and a hard-to-divert weapon pays it worse.
  COMMIT_DELAY: 0.8,

  // Salience per trigger. An opponent's recovery is the juiciest thing in the
  // game and is scaled highest on purpose -- baiting a heavy swing and
  // punishing the unwind is the exchange the whole system is built around.
  SAL_RECOVERY: 1.1,
  SAL_INCOMING: 1.6,  // x expected severity, so a trivial poke barely registers
  SAL_WINDUP: 0.8,    // x how many tempo units of windup are still to come
  SAL_FLEE: 1.2,
  // Having nothing left to execute is not standing there powerlessly: an empty
  // sequence watches instead of acting, and everything reads as more salient.
  REACTIVE_GAIN: 1.5,

  // --- Effort ---------------------------------------------------------------
  // A card's Effort is how much of the motion it actually commits: a flick of
  // the wrist and a full-shouldered swing are the SAME profile at different
  // effort, which is what lets one library entry spawn a whole family of cards.
  // Linear in windup, recovery, Drive and exertion -- gather more, unwind more,
  // put more body in, tire more. Execution is untouched on purpose: the arc
  // takes as long as the steel takes.
  //
  // Blade speed is sub-linear, because a longer gather does raise the speed at
  // contact but nowhere near proportionally.
  EFFORT_SWING: 0.5,

  // --- The exchange ---------------------------------------------------------
  // Body reach from Size, so nothing has to author it. 0.40 x height puts an
  // ordinary 1.78 m adult at 0.71 m of arm, and the duelist's rapier then
  // genuinely outreaches the knight's arming sword (1.81 m against 1.62) --
  // which falls out of data that was already there.
  REACH_K: 0.40,

  // A swing's reach through its Execution window: rises over the first EXEC_RAMP
  // of it, HOLDS at full through the middle, falls over the last EXEC_RAMP.
  // The hold is the important part. The old prototype ramped to a peak at a
  // single instant, so full reach existed for zero time and a coarse tick could
  // step straight over it and report a whiff that never happened -- the tick
  // size was doing outcome-deciding work. With a plateau, nothing in the model
  // has a knife edge and tick size stops mattering.
  EXEC_RAMP: 0.25,

  // Severity a blow must do to cancel an opponent's still-unfinished windup
  // (Disrupt, design notes section 07). A hit that lands but doesn't clear this
  // does its damage and changes nothing about what they were already doing.
  DISRUPT_SEVERITY: 25,

  // Two engaged combatants are not at zero metres -- bodies have breadth, and
  // at exactly 0 a swing's ramped reach covers the gap on the very first tick
  // of its Execution window. That collapses the whole exchange onto "whose
  // windup is shorter": Execution length and Reach stop mattering entirely.
  // A metre of standing gap is what makes the swing's own arc take real time.
  MELEE_GAP: 1.0,

  // --- Occupancy ------------------------------------------------------------
  // How much your OWN action stops you defending. Two defences, two limiters,
  // because they fail for different reasons:
  //
  //   Evasion  needs feet and mass free.  Limited by Drive -- already defined as
  //            "how much of the body's own motion goes into the blow", which is
  //            exactly "how much of my mass have I thrown somewhere I cannot
  //            take back". A wrist flick costs no footwork; a body slam costs
  //            all of it.
  //   Guard    needs an ARM free. Limited by which hand the card uses. A knight
  //            mid-overhead still has his shield arm; a duelist mid-lunge has
  //            committed everything. Handled in exchange.js, not by a constant.
  //
  // Nothing is authored per card or per phase. Magnitude is Drive x Effort x
  // commitment; the shape over time is how much momentum is already committed.
  EVADE_OCCUPIED: 0.85,  // how much of evasion full occupancy takes away

  // Not quite zero at the start of a windup: the mind has committed even when
  // the body barely has. The commitment LEVEL prices the decision itself, so
  // this floor stays small -- it is reaction lag, not a second punishment.
  OCCUPY_FLOOR: 0.12,

  // Windup rises as f^OCCUPY_RISE. Quadratic, so early windup is nearly free
  // and the apex is not -- you can still abort a swing you have only begun.
  OCCUPY_RISE: 2.0,

  // Recovery decays as (1-g)^p, p = OCCUPY_DECAY x Recoverability + 0.5. A
  // rapier (0.80) sheds its commitment fast; an axe stays committed through
  // most of its unwind. Execution itself is a flat 1.0 -- at the apex there is
  // no defending, whatever you are holding.
  OCCUPY_DECAY: 2.0,

  // Magnitude has two parts, because a motion ties you up two ways.
  //   OCCUPY_MOTION  any real swing occupies you somewhat -- your torso and
  //                  base are in it even when you go nowhere. Scales with
  //                  Effort, so a flick leaves you free and a haymaker does not.
  //   OCCUPY_BODY    throwing your MASS occupies you far more. Scales with
  //                  Drive, which already means exactly that.
  // Drive alone was not enough: an overhead is Drive 0.35 because little of the
  // body TRAVELS, yet a man mid-overhead is thoroughly committed. The rotation
  // is what roots him, and that is Effort, not Drive.
  OCCUPY_MOTION: 0.45,
  OCCUPY_BODY:   0.75,

  // Bluff 0.5x, Uncommitted 1.0x, Committed 1.5x.
  OCCUPY_COMMIT: 0.5,

  // --- Carry between cards --------------------------------------------------
  // A card leaves each hand somewhere (its arc's `to`), and the next card's
  // windup is scaled by how far that is from where IT needs to start. This is
  // what makes combos emergent rather than authored: no card ever names
  // another, it only knows where your body already is.
  //
  // The grid centre is the hub -- carry cost is distance, so ending at
  // MID_CENTRE is cheap to follow and a corner is committal.
  CARRY_MIN: 0.70,   // perfectly set up: 30% off the windup
  CARRY_MAX: 1.30,   // corner to opposite corner: 30% on

  // A card that threw your MASS leaves your base out of position too, whatever
  // the blade is doing. Drive already means exactly that.
  CARRY_FOOTING: 0.35,

  // --- Positional coverage --------------------------------------------------
  // A shield is on one side of you. It was never a general-purpose coverage
  // number, and with arcs we finally know which side a blow arrives from -- so
  // section 5.5's parked shield-side asymmetry can come back.
  //
  // How much of a side-mounted piece still helps on the WRONG side. Not zero:
  // you can turn into it. This is also what makes a two-arc card work -- a
  // buckler cannot meet a horizontal cut from both directions at once, and that
  // falls out of geometry with no bookkeeping.
  SIDE_MIN: 0.25,

  // --- Stability and interrupt ----------------------------------------------
  // Interrupt (the WHOLE remaining sequence, as opposed to disrupt's single
  // card) is the topple check succeeding -- knocked down, staggered, put out of
  // the fight for a beat. Not a severity threshold: a heavy blunt blow should
  // interrupt where an equally damaging thrust does not.
  //
  // Checked against the SAME roll as severity, never a second one (section 5.8).
  // Because the roll axis is ordered by placement quality, "the top `topple`
  // fraction of the axis" self-selects for well-placed blows with no extra gate.
  //
  // Calibrated so an ordinary 70 kg, 1.75 m adult sits at Stability 1.0.
  // <-- least calibrated of the new numbers, like PEN_K.
  STAB_K: 0.026,
  // How much Stability actually resists being put down. Without this, an
  // ordinary adult toppled to a rapier thrust ~14% of the time -- and because
  // topple shares the severity roll, that meant nearly every Vital hit also
  // interrupted, which trivialises sequences. At 3.0 a full shield bash is ~17%
  // and a thrust ~5%, which is the right shape: interrupt is for heavy blows.
  TOPPLE_K: 3.0,
  STAB_FOOT: 0.30,   // footprint as a fraction of Size, for anything bipedal
  STAB_COM: 0.55,    // centre-of-mass height as a fraction of Size

  // --- Follow-through -------------------------------------------------------
  // The blade does not always finish its arc. Where the hand actually ends up
  // depends on what the blow met, and THAT is what the next card carries from:
  //
  //   air     nothing stopped it, the sweep completes
  //   flesh   it went in; a blade that stuck stops where it stuck (the same
  //           lodge term that already lengthens the recovery)
  //   armour  it was stopped, and hard steel throws your hands back
  //
  // The consequence worth having: BLOCKING BREAKS COMBOS. Slash into Backslash
  // flows only because the Slash ends where the Backslash starts -- so a Slash
  // that rings off a shield never gets there, and the follow-up pays full carry
  // instead of none. Nobody had to write that down, and it is the first real
  // mechanical reason not to swing into a raised shield.
  FOLLOW_GRAZE: 0.88,   // barely touched; near enough a full sweep
  // Flesh does NOT stop a blade -- a cut that halts in a body is a failed cut,
  // and only LODGING (a deep pierce, an axe in a ribcage) really arrests it.
  // At 0.60 this was wrong in a way that mattered: landing a blow broke your own
  // combo almost as badly as being blocked did, so the free chain existed only
  // when you missed, which inverts the incentive. Armour is what stops a blade.
  FOLLOW_BODY: 0.80,
  FOLLOW_PEN: 0.35,     // how much punching through restores the sweep
  REBOUND: 0.20,        // how far past the start a fully-stopped blade is thrown

  // --- Adrenaline -----------------------------------------------------------
  // The counterweight to Pain, and the only state that is not purely negative.
  // Nobody should later "fix" that asymmetry -- it is the point.
  //
  // It MASKS pain rather than reducing it: the wound is the wound, you just cannot
  // feel it yet. So it is a DEFERRAL. It burns Stamina while it is up, and when it
  // fades the masked Pain simply lands -- which needs no crash mechanic at all,
  // because capacity recomputes on its own.
  //
  // In this game specifically, adrenaline is what gets you to the door. Spend it
  // fighting instead of leaving and you crash outside the room.
  ADREN_MASK: 0.80,    // at full flood you feel a fifth of your pain
  ADREN_SHAKE: 0.30,   // ...and your hands are no good. Fast, strong, clumsy.

  // Dynamics, for a turn loop that does not exist yet.
  ADREN_SPIKE: 1.30,   // x severity taken, as a fraction
  ADREN_FEAR: 0.35,    // x Dread -- fight-or-flight is one response
  ADREN_FADE_FIGHT: 0.18,  // per turn, still in it
  ADREN_FADE_REST: 0.55,   // per turn, once out -- this is where the bill arrives
  ADREN_BURN: 0.10,    // Exhaustion added per turn at full flood

  // --- Pain -----------------------------------------------------------------
  // The link between "a blow landed" and "you are hurt". Severity does not
  // subtract from anything -- it raises Pain, and Pain degrades you through the
  // funnel, so the next blow reads higher (design notes 10).
  //
  // It accumulates into the REMAINING HEADROOM rather than adding:
  //
  //     Pain += (1 - Pain) x gain
  //
  // which is what keeps this from being a health bar. Three 30% wounds give 0.29,
  // 0.50, 0.64 -- approaching 1 and never arriving. You cannot be ground to death
  // by grazes. Only a decisive blow ends a fight; lesser ones make you slower until
  // you cannot win, and then you leave. That is the whole shape of the design.
  PAIN_GAIN: 1.0,

  // Severity at which a blow simply ends it. Needs no exception for tough
  // creatures: Redundancy already caps the Vital band's ceiling, so a hydra's
  // Vital cannot reach here in the first place.
  DECISIVE_SEVERITY: 85,

  // --- Between turns --------------------------------------------------------
  // Section 08 says overspending "leaves the combatant weaker and slower the
  // following turn" and never says how much. This is that number, and the turn
  // loop cannot run without it -- the last unspecified piece of the energy
  // economy.
  OVERSPEND_GAIN: 0.35,     // x how far over budget, as a fraction of budget

  // Underspending banks a little back, "not a full 1:1 bank; there's a cap or
  // diminishing return, specifically to prevent hoarding" -- section 08.
  UNDERSPEND_RELIEF: 0.20,
  UNDERSPEND_CAP: 0.35,     // most of a budget you can bank in one turn

  // Pain past which there is no fighting on. Not death -- the point at which
  // leaving is the only move left, which is the outcome the design wants.
  PAIN_OUT: 0.90,

  // --- Structure ------------------------------------------------------------
  // The second accumulation channel, and the one that answers "how do you ever
  // beat a skeleton". Pain governs the living; STRUCTURE governs things that do
  // not feel it. You do not hurt a skeleton -- you take it apart.
  //
  // Same headroom accumulation as Pain, but resisted by Toughness{class} rather
  // than PainTolerance, and NOT gated by `mindless`. That is the whole point: a
  // skeleton shrugs off pierce at Toughness 2.5 and comes apart under blunt at
  // 0.5, so the right tool works and the wrong one crawls.
  //
  // The two never double-count, because harm is max(Pain, Structure) rather than
  // their sum. A living thing is taken out of a fight by pain and shock long
  // before it is dismantled, so Structure rarely governs a human -- which is
  // correct, not a wasted channel.
  STRUCT_GAIN: 0.70,

  // --- Readiness ------------------------------------------------------------
  // Guard readiness is 1.0 when you are simply STANDING THERE and a swing comes
  // at you. Everything below is what your own action takes away from that.
  //
  // Two terms, because committing an arm and committing your balance are
  // different costs. A one-handed swing leaves the other arm entirely free, but
  // you have still put momentum and balance into it -- so guard goes down a
  // LITTLE. Only committing the arm itself takes most of it.
  //
  // An earlier version read only the freest hand, which made a one-handed swing
  // cost nothing at all: 0.45 idle and 0.45 at the apex, identically flat.
  GUARD_BODY: 0.30,   // what committed momentum and balance costs your guard
  GUARD_ARM: 0.90,    // what committing the ARM costs it

  // You can always twist to take it differently. Both hands committed and fully
  // extended is not defenceless, it is nearly so.
  GUARD_FLOOR: 0.12,
};
