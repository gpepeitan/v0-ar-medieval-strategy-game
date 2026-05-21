# MedievalAR Unit Roster, Morale, and Upgrade Pass

This pass locks the next layer of balance:

- exact unit families
- unit subtypes
- upgrade paths
- morale behavior by unit type
- combined-arms incentives
- anti-spam penalties
- faction doctrine bias

The goal is simple:

**There should be many good ways to build an army, but no obvious best composition that works everywhere.**

---

## 1. Design Rules

1. Every unit must have a role.
2. Every role must have a counter.
3. Every upgrade must sharpen a unit’s identity.
4. Morale must matter more as fights become prolonged, isolated, or supply-starved.
5. Mixed armies should be more stable than spammed armies.
6. Spammed armies should remain viable, but easier to predict and punish.
7. Faction identity should bias composition, not determine it.

---

## 2. Army Construction Model

### 2.1 Families

All military banners belong to one of these families:

- Infantry
- Cavalry
- Ranged
- Siege
- Support

### 2.2 Recommended Army Shape

A healthy army usually wants:

- `35%–50%` frontline infantry
- `15%–30%` mobility units
- `15%–30%` ranged units
- `5%–15%` support units
- `0%–20%` siege units depending on task

### 2.3 Command Load Budget

To prevent one-type spam from being too efficient, each banner consumes command load.

Recommended army-level budget:
- Base command capacity: `100`
- Good commander bonus: `+15` to `+35`
- Exceptional commander bonus: `+40` to `+60`

If an army exceeds its command budget, it should suffer:
- slower orders
- worse morale recovery
- weaker formation control
- higher supply waste

This is a soft limiter, not a hard stop.

---

## 3. Unit Roster

### 3.1 Infantry

#### Militia
- **Role:** cheap local defense, emergency garrison, early holding force
- **Best at:** buying time, holding a town edge, absorbing first contact
- **Weak against:** heavy pressure, cavalry shock, prolonged morale strain
- **Cost multiplier:** `0.70`
- **Upkeep multiplier:** `0.75`
- **Command load:** `0.70`
- **Morale sensitivity:** `1.20`
- **Morale floor:** low
- **Notes:** strongest when defending home territory, weakest in long campaigns

#### Spear Infantry
- **Role:** anti-cavalry anchor and general line infantry
- **Best at:** holding chokepoints, defending routes, stopping charges
- **Weak against:** missile pressure, flanking, prolonged attrition
- **Cost multiplier:** `1.00`
- **Upkeep multiplier:** `1.00`
- **Command load:** `1.00`
- **Morale sensitivity:** `0.90`
- **Notes:** the most reliable baseline infantry

#### Shield Infantry
- **Role:** defensive infantry, missile screen, siege holder
- **Best at:** surviving arrows, holding walls, absorbing attacks
- **Weak against:** being bypassed, mobility warfare, being isolated
- **Cost multiplier:** `1.10`
- **Upkeep multiplier:** `1.05`
- **Command load:** `1.05`
- **Morale sensitivity:** `0.80`
- **Notes:** best infantry morale anchor, but not a killing machine

#### Heavy Infantry
- **Role:** breakthrough infantry and sustained melee line
- **Best at:** breaking weaker infantry, assaulting fortifications, grinding fights
- **Weak against:** mobility, attrition, being kited, poor supply
- **Cost multiplier:** `1.25`
- **Upkeep multiplier:** `1.20`
- **Command load:** `1.15`
- **Morale sensitivity:** `1.00`
- **Notes:** strong if supported, dangerous if overcommitted

### 3.2 Cavalry

#### Scout Cavalry
- **Role:** eyes, screen, forward pressure
- **Best at:** scouting, detection, screening, route awareness
- **Weak against:** hard engagements, traps, anti-cavalry lines
- **Cost multiplier:** `1.00`
- **Upkeep multiplier:** `0.95`
- **Command load:** `0.95`
- **Morale sensitivity:** `1.10`
- **Notes:** low direct damage, high strategic value

#### Light Cavalry
- **Role:** raiding, pursuit, harassment, interception
- **Best at:** exploiting exposed supply, chasing retreats, hit-and-run warfare
- **Weak against:** prepared spears, prolonged melee, dense terrain
- **Cost multiplier:** `1.15`
- **Upkeep multiplier:** `1.10`
- **Command load:** `1.10`
- **Morale sensitivity:** `1.25`
- **Notes:** excellent for mobile play, but fragile if trapped

#### Heavy Cavalry
- **Role:** shock attack and battlefield momentum
- **Best at:** breaking open lines, decisive charges, morale shocks
- **Weak against:** choke points, rough terrain, arrows, extended fights
- **Cost multiplier:** `1.45`
- **Upkeep multiplier:** `1.35`
- **Command load:** `1.25`
- **Morale sensitivity:** `1.35`
- **Notes:** high reward, high upkeep, high morale swing unit

### 3.3 Ranged

#### Archers
- **Role:** flexible ranged pressure and attrition
- **Best at:** softening formations, supporting infantry, forcing movement
- **Weak against:** rushes, heavy shields, armored targets
- **Cost multiplier:** `1.00`
- **Upkeep multiplier:** `0.95`
- **Command load:** `0.95`
- **Morale sensitivity:** `1.00`
- **Notes:** the simplest ranged backbone

#### Crossbows
- **Role:** armor-piercing ranged pressure
- **Best at:** heavy infantry, defensive walls, siege defense
- **Weak against:** mobility, reload disruption, poor terrain
- **Cost multiplier:** `1.15`
- **Upkeep multiplier:** `1.05`
- **Command load:** `1.00`
- **Morale sensitivity:** `0.95`
- **Notes:** more punishing, less flexible than archers

#### Skirmishers
- **Role:** mobile ranged harassment and formation disruption
- **Best at:** flank pressure, disruption, screens, forcing bad positioning
- **Weak against:** direct line fights, cavalry traps, siege exposure
- **Cost multiplier:** `1.05`
- **Upkeep multiplier:** `0.95`
- **Command load:** `0.95`
- **Morale sensitivity:** `1.15`
- **Notes:** very strong in skilled hands, not strong in static fights

### 3.4 Siege

#### Sappers
- **Role:** undermine walls, gates, and fortifications
- **Best at:** long siege pressure, breach creation, gate disruption
- **Weak against:** open-field combat, quick relief, cavalry interception
- **Cost multiplier:** `1.20`
- **Upkeep multiplier:** `1.10`
- **Command load:** `1.10`
- **Morale sensitivity:** `0.85`
- **Notes:** essential for serious sieges

#### Siege Crew
- **Role:** operate engines and sustain bombardment
- **Best at:** wall damage, tower suppression, sustained pressure
- **Weak against:** sortie, mobility disruption, direct assault
- **Cost multiplier:** `1.30`
- **Upkeep multiplier:** `1.15`
- **Command load:** `1.20`
- **Morale sensitivity:** `0.80`
- **Notes:** expensive but central to any serious siege

#### Assault Support
- **Role:** breach exploitation and final assault support
- **Best at:** ladders, breach pushes, wall-top fights
- **Weak against:** premature engagement, open-field fights, low morale
- **Cost multiplier:** `1.15`
- **Upkeep multiplier:** `1.10`
- **Command load:** `1.10`
- **Morale sensitivity:** `1.00`
- **Notes:** should be used after siege preparation, not before

### 3.5 Support

#### Engineers
- **Role:** repair, fortify, stabilize siege operations
- **Best at:** wall repair, fortification, defensive efficiency
- **Weak against:** direct combat, route interception
- **Cost multiplier:** `1.15`
- **Upkeep multiplier:** `1.05`
- **Command load:** `0.80`
- **Morale sensitivity:** `0.70`
- **Notes:** one of the strongest long-term strategic units

#### Quartermasters
- **Role:** supply efficiency, convoy stability, operational endurance
- **Best at:** extending campaign length, reducing attrition, keeping armies alive
- **Weak against:** direct combat, fast raids, isolated sieges
- **Cost multiplier:** `1.10`
- **Upkeep multiplier:** `1.00`
- **Command load:** `0.80`
- **Morale sensitivity:** `0.60`
- **Notes:** very valuable in long wars

#### Field Logistics
- **Role:** routing, staging, movement discipline, recovery
- **Best at:** moving armies efficiently across long distances
- **Weak against:** direct combat, surprise ambushes
- **Cost multiplier:** `1.05`
- **Upkeep multiplier:** `1.00`
- **Command load:** `0.85`
- **Morale sensitivity:** `0.65`
- **Notes:** makes the whole army better, but is never the damage source

---

## 4. Upgrade Trees

### 4.1 Universal Upgrade Rules

Every unit should have:

- a **training tier**
- a **specialization choice**
- a **veterancy cap**
- a **cost escalation curve**

### 4.2 Training Tiers

Recommended tiers:

- **Tier 0:** levy / raw
- **Tier 1:** trained
- **Tier 2:** specialized
- **Tier 3:** veteran

Suggested scaling per tier:
- Cost: `+20%` per tier
- Upkeep: `+10%` per tier
- Command load: `+5%` per tier
- Performance: `+10%` to `+15%` per tier in the chosen role
- Off-role performance: should not improve much, and may worsen

### 4.3 Infantry Branches

#### Militia
- **Town Levy:** better holding power, slower to break
- **Emergency Guard:** cheaper, faster to raise, lower peak power

#### Spear Infantry
- **Braced Spears:** stronger anti-cavalry and choke defense
- **Deep Pike Line:** stronger mass defense, slower repositioning

#### Shield Infantry
- **Shield Wall:** best at missile resistance and wall defense
- **Assault Shields:** better in close assault and urban fights

#### Heavy Infantry
- **Breaker Line:** stronger breakthrough and assault pressure
- **Guard Line:** stronger defense and morale anchoring

### 4.4 Cavalry Branches

#### Scout Cavalry
- **Pathfinders:** better route intelligence and detection
- **Screen Riders:** better screening and anti-ambush coverage

#### Light Cavalry
- **Raiders:** stronger supply attack and harassment
- **Interceptors:** stronger pursuit and convoy catching

#### Heavy Cavalry
- **Lancers:** stronger charge opening and morale shock
- **Reserve Shock:** stronger late-fight countercharge and field reserve role

### 4.5 Ranged Branches

#### Archers
- **Volley Archers:** better mass fire and area pressure
- **Field Archers:** better mobility and flexible support

#### Crossbows
- **Armor Piercers:** better against heavy targets
- **Fortress Crossbows:** better defensive efficiency and wall defense

#### Skirmishers
- **Disruptors:** better at confusion, flanks, and pursuit denial
- **Screeners:** better at protecting the army and revealing threats

### 4.6 Siege Branches

#### Sappers
- **Miners:** stronger wall undermining and breach creation
- **Gatebreakers:** stronger gate damage and breach timing

#### Siege Crew
- **Bombarders:** stronger direct structural damage
- **Deploy Specialists:** faster engine deployment and repositioning

#### Assault Support
- **Breach Troops:** stronger in the first wave through a breach
- **Escalade Troops:** stronger on ladders and wall-top fighting

### 4.7 Support Branches

#### Engineers
- **Repair Specialists:** faster repair and recovery
- **Fortification Specialists:** stronger building durability and siege resistance

#### Quartermasters
- **Convoy Masters:** better escort efficiency and route survival
- **Rationing Officers:** better supply stretch and daily attrition reduction

#### Field Logistics
- **Road Masters:** better movement efficiency on established routes
- **Campaign Planners:** better long-range organization and staging

### 4.8 Upgrade Tradeoff Rule

Every specialization should improve one thing while narrowing something else.

Examples:
- stronger offense usually means weaker flexibility
- stronger defense usually means lower pursuit
- stronger mobility usually means lower staying power
- stronger siege power usually means higher supply cost
- stronger support usually means lower direct combat value

Upgrades should create meaningful decisions, not flat upgrades.

---

## 5. Morale System

### 5.1 Morale Scale

Morale is a `0.0–1.0` value.

Recommended bands:

- `0.90–1.00`: inspired
- `0.75–0.89`: steady
- `0.60–0.74`: cautious
- `0.45–0.59`: shaken
- `0.30–0.44`: brittle
- `0.00–0.29`: breaking

### 5.2 Morale Effects

#### Inspired
- `+12%` offense
- `+10%` defense
- `+15%` rally speed
- `+10%` pursuit

#### Steady
- normal combat performance

#### Cautious
- `-5%` offense
- normal defense
- slight retreat bias

#### Shaken
- `-10%` offense
- `-10%` defense
- `+15%` retreat bias

#### Brittle
- `-20%` offense
- `-15%` defense
- `+30%` retreat bias

#### Breaking
- rout checks every combat tick
- large penalties to attack and control

### 5.3 Morale Sensitivity by Unit

Use morale sensitivity as a multiplier on morale swings and morale-derived combat effects.

Recommended values:

- Militia: `1.20`
- Spear Infantry: `0.90`
- Shield Infantry: `0.80`
- Heavy Infantry: `1.00`
- Scout Cavalry: `1.10`
- Light Cavalry: `1.25`
- Heavy Cavalry: `1.35`
- Archers: `1.00`
- Crossbows: `0.95`
- Skirmishers: `1.15`
- Sappers: `0.85`
- Siege Crew: `0.80`
- Assault Support: `1.00`
- Engineers: `0.70`
- Quartermasters: `0.60`
- Field Logistics: `0.65`

### 5.4 Suggested Morale Formula

```text
unitMoraleMultiplier = clamp(0.75, 1.25, 1 + (morale - 0.5) × moraleSensitivity)
```

This keeps morale important without letting it completely erase unit identity.

### 5.5 Morale Sources

Morale rises from:
- strong commander quality
- recent victories
- visible friendly support
- good terrain
- good supply
- successful charges or holds
- being near a defended home holding
- receiving reinforcements

Morale falls from:
- casualties
- commander loss
- low supply
- isolation
- flanking
- siege starvation
- seeing nearby allies rout
- failing a charge or assault

### 5.6 Morale Shock Values

Suggested battlefield shocks:

- `5%` casualties in a short window: `-0.03`
- `10%` casualties in a short window: `-0.07`
- commander wounded: `-0.06`
- commander captured: `-0.10`
- commander killed: `-0.15`
- supply below `1 day`: `-0.12`
- reinforcements arrive: `+0.05`
- successful defensive hold: `+0.04`
- successful charge or breakthrough: `+0.06`

### 5.7 Routing Thresholds by Type

Different units should break at different points.

- Militia: `0.55`
- Archers: `0.50`
- Crossbows: `0.48`
- Light Cavalry: `0.45`
- Scout Cavalry: `0.45`
- Heavy Cavalry: `0.40`
- Spear Infantry: `0.38`
- Shield Infantry: `0.35`
- Heavy Infantry: `0.30`
- Skirmishers: `0.42`
- Siege Crew: `0.35`
- Sappers: `0.33`
- Assault Support: `0.35`
- Engineers: `0.50`
- Quartermasters: `0.55`
- Field Logistics: `0.55`

Support units should usually withdraw before they are destroyed.

### 5.8 Morale Recovery

Recommended recovery rates:
- Safe home territory: `+0.03/day`
- Stable camp with supply: `+0.02/day`
- After victory: `+0.02` immediate morale pulse
- Under active threat: little or no recovery

Morale should recover faster than cohesion.

---

## 6. Composition and Anti-Spam Rules

### 6.1 Family Balance Bonus

Armies with breadth should get a modest stability bonus.

If an army contains at least:
- one frontline family,
- one mobility family,
- one ranged family,
- one support family,

then grant:
- `+3%` readiness
- `+3%` morale recovery

If it contains all five families in meaningful amounts, grant:
- `+5%` readiness
- `+5%` rally resistance

### 6.2 Spam Penalties

If one family makes up more than:
- `60%` of the army: no bonus
- `70%` of the army: `-5%` readiness, `+5%` command strain
- `80%` of the army: `-10%` readiness, `+10%` counter exposure

These are soft penalties.
The army is still allowed to exist.
It just should not be the best answer in every situation.

### 6.3 Command Strain

Repeated same-type banners should reduce command clarity.

Recommended effect:
- each banner beyond the dominant family threshold increases order delay slightly
- each additional same-type banner after the threshold increases morale shock sensitivity slightly

### 6.4 Synergy Pairs

Certain combinations should create strong, readable synergies:

- Spear Infantry + Crossbows: strong anti-heavy defense
- Shield Infantry + Archers: strong wall hold and missile screen
- Heavy Infantry + Shield Infantry: strong assault line
- Cavalry + Skirmishers: strong pursuit and flank pressure
- Engineers + Siege Crew: strong siege efficiency
- Quartermasters + any expeditionary army: strong campaign endurance
- Scout Cavalry + ranged units: strong trap avoidance and positioning

### 6.5 Combined-Arms Rule

The best armies should not be the most specialized.
The best armies should be the ones whose parts support each other.

That means:
- infantry makes ranged units safer
- ranged units soften fights before melee
- cavalry punishes bad positioning
- support units keep the force alive over time
- siege units matter only when the rest of the force can hold the field

---

## 7. Faction Doctrine Bias

All factions can recruit all unit types.
Each faction should simply get an easier time building one or two styles.

### Frankish Kingdom

Preferred bias:
- heavy infantry
- heavy cavalry
- shield infantry
- siege crew

Why:
- strong charge and fortress identity
- good in set-piece battles and sieges

### Mongol Khanate

Preferred bias:
- scout cavalry
- light cavalry
- skirmishers
- field logistics

Why:
- mobility, screen warfare, interception, and deep raids

### Abbasid Caliphate

Preferred bias:
- archers
- crossbows
- quartermasters
- engineers

Why:
- logistics, trade, sustained campaigns, and organized defense

### Byzantine Empire

Preferred bias:
- shield infantry
- crossbows
- engineers
- spear infantry

Why:
- defensive depth, disciplined control, and strong fort play

### Khazar Khaganate

Preferred bias:
- scout cavalry
- light cavalry
- skirmishers
- quartermasters

Why:
- route control, toll pressure, movement disruption, and flexible response

### Faction Balance Rule

Faction bonuses should change what feels efficient, not what feels mandatory.

A faction should be able to win with off-meta composition if the player executes well.

---

## 8. Example Army Templates

These are not fixed metas.
They are test baselines.

### Balanced Field Army
- `40%` frontline infantry
- `20%` ranged
- `20%` cavalry
- `10%` support
- `10%` flexible slot

### Raiding Army
- `25%` infantry
- `10%` ranged
- `45%` light cavalry / scout cavalry
- `10%` support
- `10%` flexible slot

### Siege Army
- `40%` infantry
- `15%` ranged
- `10%` cavalry
- `20%` siege
- `15%` support

### Defensive Garrison Army
- `45%` shield/spear infantry
- `25%` ranged
- `10%` cavalry
- `10%` support
- `10%` siege or reserve

### Pursuit Army
- `30%` infantry
- `10%` ranged
- `40%` cavalry
- `10%` skirmishers
- `10%` support

---

## 9. Balance Guardrails

Do not allow any unit to be best at all of these:
- offense
- defense
- mobility
- siege
- sustain

Do not allow any army to ignore:
- supply
- morale
- counterplay
- command capacity
- terrain

Do not allow any upgrade path to erase the base unit’s weakness.

Do allow players to win through:
- smart composition
- morale management
- terrain usage
- supply warfare
- timing
- route control
- commander quality

---

## 10. Locked Intent

This pass is meant to create depth.

That depth should come from:
- many viable unit combinations
- meaningful upgrades
- morale pressure
- counter-based composition
- faction identity
- logistics and terrain

The game should feel like there is **no single clear best way**, only better answers to the current situation.
