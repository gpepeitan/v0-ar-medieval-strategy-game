# MedievalAR Gameplay, Balance, and Economy Spec

## Purpose

This document is the gameplay contract for MedievalAR.

It exists so any future AI, designer, or engineer can build the game as a **balanced, persistent, medieval strategy simulation** instead of improvising mechanics one at a time.

If implementation and this document conflict, this document is the source of truth.

---

## Design Goals

1. **The world is persistent**
   - No reset.
   - No final win screen.
   - No permanent dominance without upkeep.

2. **Geography matters**
   - Terrain, roads, rivers, bridges, chokepoints, and public space shape power.

3. **Supply matters more than raw numbers**
   - Large forces should be strong, but not self-sustaining.
   - Logistics, food, and transport must constrain aggression.

4. **Every system should have counterplay**
   - No unit, faction, or structure should be universally best.

5. **Solo players remain viable**
   - Smaller players should win through focus, speed, and smart positioning.

6. **Group play remains powerful**
   - Large alliances should have real scale advantages, but also coordination costs and vulnerability to disruption.

7. **The game must be legible**
   - Players should understand why they won or lost.
   - Numbers should be explainable and tunable.

---

## Current Baseline From Code

These are the current implementation anchors already in the project:

- World day length: `180` seconds
- Auto-save interval: `30` seconds
- Claim radius: `120` meters
- Territory decay half-life target: `14` days
- Starting resources:
  - Food: `100`
  - Wood: `60`
  - Stone: `25`
  - Iron: `10`
- Starter population:
  - Villagers: `25`
  - Laborers: `12`
  - Soldiers: `8`
  - Artisans: `3`
  - Traders: `2`
- Army abstraction:
  - One banner ≈ 25 soldiers
  - Several banners = company
  - Several companies = army
- Base movement speed: `1.25 m/s`

These are not sacred, but all future balancing should respect the scale they imply.

---

## Core Gameplay Loop

### Primary Loop

1. Scout public land and route opportunities.
2. Claim useful territory.
3. Build infrastructure and production.
4. Assign labor.
5. Produce and move resources.
6. Protect routes and chokepoints.
7. Raid, negotiate, tax, defend, or siege.
8. Reinforce holdings and grow the dynasty.

### Secondary Loop

- Improve settlement quality.
- Train commanders.
- Raise livestock.
- Create trade contracts.
- Set tolls and safe passage.
- Intercept rival transports.
- Repair damage and recover from neglect.

### Tertiary Loop

- Long-term territorial shaping.
- Faction specialization.
- Reputation and diplomacy.
- Dynasty continuity.
- Regional trade dominance.

---

## Unit Scale and Abstraction

### Player Scale

A player is not a single character in combat terms. A player is a political and logistical actor controlling holdings, commanders, labor, caravans, and armies.

### Military Scale

- `Banner`: tactical unit, 1–40 soldiers, standard target 25
- `Company`: 2–8 banners, standard target 4 banners
- `Army`: 3–8 companies, standard target 4 companies

### Economic Scale

- `PopulationState` tracks labor pool, military levy, artisans, and traders.
- `ResourcePoolState` tracks stockpiles.
- `StructureState` tracks buildings and infrastructure.
- `LivestockHerdState` tracks production assets.

### Strategic Scale Targets

- A solo player should remain effective with 1–3 settlements and 1–2 military groups.
- A mid-tier group should control several routes and at least one chokepoint.
- A major power should be able to field 200+ soldiers, but only with strong supply and administration.

---

## Territory System

### Territory Purpose

Territory is not just ownership. It is control over space, access, visibility, production, and movement.

### Territory Quality Attributes

Each territory should be scored across these dimensions:

- `accessQuality`
- `defensibility`
- `routeCentrality`
- `productionPotential`
- `visibility`
- `maintenanceBurden`
- `publicAccessReliability`

### Territory Control Formula

Use a control score that combines claim strength, decay, logistics, and local support.

```text
controlStrength = claimStrength × decayMultiplier × logisticsFactor × supportFactor × terrainFactor
```

Recommended component ranges:

- `claimStrength`: 0.0 to 10.0
- `decayMultiplier`: 0.0 to 1.0
- `logisticsFactor`: 0.5 to 1.5
- `supportFactor`: 0.5 to 1.5
- `terrainFactor`: 0.75 to 1.5

### Suggested Support Factor

Support should come from nearby activity, not just paper ownership.

```text
supportFactor = 0.5 + 0.5 × clamp01(
  activePopulation + nearbyGarrison + nearbyStructures + supplyCoverage
)
```

### Territory Decay

Territory decay should represent neglect, not arbitrary punishment.

- Active holdings decay slowly.
- Unsupported holdings decay faster.
- Remote holdings require stronger logistics.
- Forts and chokepoints decay more slowly than outposts.

### Decay Model

Use exponential-style decay rather than linear-only decay.

```text
decayMultiplier(day) = exp(-day / decayHalfLifeDays)
```

For a 14-day half-life:

- Day 0: 1.00
- Day 7: 0.61
- Day 14: 0.50
- Day 28: 0.25

### Retake Rules

A territory should be easier to retake if:

- it is isolated,
- it has low supply,
- it has weak garrison,
- it has poor nearby support,
- it has low visibility coverage,
- it has low repair capacity.

A territory should be harder to retake if:

- it is near an active population center,
- it sits on a chokepoint,
- it has roads/bridges/towers/gates,
- it has strong command presence,
- it has deep supply.

---

## Resource Economy

### Resource Philosophy

The economy is local first and trade-driven second.

Resources should be unevenly distributed, geographically grounded, and multi-use.

No resource should exist only for one system.

### Core Resources

#### Common
- Food
- Wood
- Stone
- Water

#### Regional
- Iron
- Salt
- Cloth / wool
- Livestock / horses
- Charcoal
- Leather
- Milk
- Cheese
- Eggs
- Meat
- Hides
- Draft power

#### Rare
- Gold
- Silver
- Spices
- High-quality iron
- Special stone
- Luxury goods

### Resource Roles

#### Food
Used for:
- population upkeep
- army upkeep
- siege endurance
- livestock maintenance
- trade fallback

#### Wood
Used for:
- buildings
- carts
- siege gear
- repairs
- boats
- fuel

#### Stone
Used for:
- walls
- forts
- bridges
- roads
- towers
- siege resistance

#### Iron
Used for:
- tools
- weapons
- armor
- advanced production
- military upgrades

#### Salt
Used for:
- preservation
- trade leverage
- long-distance logistics

#### Cloth / Wool
Used for:
- clothing
- population health
- trade
- elite consumption

#### Livestock / Horses
Used for:
- cavalry
- transport
- food
- draft labor
- courier speed

### Production Rule

Every resource should be producible by at least one settlement type and consumable by multiple systems.

### Stockpile Rule

Stockpiles should matter. A faction with production but no reserves should feel fragile.

### Suggested Stockpile Pressure

A player should start feeling pressure when reserves fall below 7 world days of consumption.

---

## Production and Consumption

### General Production Formula

```text
dailyOutput = baseOutput × terrainMultiplier × structureMultiplier × laborMultiplier × stabilityMultiplier
```

Where:

- `baseOutput` is the raw settlement yield
- `terrainMultiplier` reflects location type
- `structureMultiplier` reflects building quality
- `laborMultiplier` reflects worker allocation
- `stabilityMultiplier` reflects morale, loyalty, and safety

### General Consumption Formula

```text
dailyConsumption = populationNeed + armyNeed + livestockNeed + structureUpkeep + transportNeed
```

### Suggested Population Consumption

Per world day:

- Villager: `1 food`
- Laborer: `1.1 food`
- Artisan: `1.1 food`
- Trader: `1 food`
- Soldier: `1.5 food`
- Horse: `1.2 food`

### Suggested Livestock Yield Logic

Livestock should generate multiple outputs over time, not just one.

Examples:
- Cattle: milk + meat + hides + draft power
- Sheep: wool + meat + hides
- Goats: milk + meat + hides
- Pigs: cheap meat
- Horses: cavalry + transport + courier speed
- Chickens: eggs + cheap food

### Livestock Growth Rule

Herd growth should be slow and terrain-dependent.

```text
newCount = floor(currentCount × fertility × health × habitatMultiplier)
```

---

## Population and Labor

### Population Roles

- `Villagers`: baseline settlement population
- `Laborers`: physical production and construction
- `Soldiers`: military availability
- `Artisans`: tool, equipment, and upgrade production
- `Traders`: commerce, market efficiency, route value

### Labor Output Formula

The current code uses a useful baseline:

```text
laborOutput = laborers + (2 × artisans) + traders
laborOutput *= health × loyalty
```

This is a good foundation because it makes artisans valuable without making them overpowered.

### Suggested Production Weighting

- Laborers: 1.0 output each
- Artisans: 2.0 output each
- Traders: 1.0 output each for trade/admin tasks

### Population State Targets

- Healthy settlement: loyalty and health above `0.7`
- Risky settlement: either below `0.5`
- Collapse risk: either below `0.25`

### Population Failure States

Population should degrade through:
- raids
- sieges
- starvation
- relocation
- fear
- low wages / low rewards
- neglect

### Population Recovery

Recovery should require:
- food surplus
- safety
- time
- infrastructure
- low disruption

---

## Settlement and Infrastructure

### Settlement Types

- Farm
- Village
- Town
- City
- Mine
- Workshop
- Market
- Outpost
- Fort
- Castle

### Infrastructure Types

- Road
- Bridge
- Gate
- Tower
- Palisade
- Watchpoint
- Toll Post
- Siege Work

### Build Philosophy

Infrastructure should be:
- expensive enough to matter,
- durable enough to feel strategic,
- vulnerable enough to be contestable.

### Structure Cost Curve

Use a geometric cost curve for upgrades.

```text
upgradeCost(level) = baseCost × level^1.45
```

Suggested exponent range:
- `1.35` for cheap utility buildings
- `1.45` for standard structures
- `1.60` for forts and castles

### Repair Cost Curve

```text
repairCost = maxDamage × repairRate × materialMultiplier
```

Repairs should usually be cheaper than rebuilding, but not free.

### Suggested Building Roles

#### Farm
- food production
- population stability

#### Village
- labor base
- local storage
- low-level trade

#### Town
- trade concentration
- artisan output
- market resilience

#### City
- economic hub
- advanced production
- strong labor pool

#### Mine
- stone, iron, or rare material extraction

#### Workshop
- tool and equipment production

#### Market
- price discovery
- exchange and fallback trade

#### Outpost
- visibility
- route presence
- early warning

#### Fort
- defense anchor
- garrison support

#### Castle
- regional defensive capital
- siege resistance

#### Road / Bridge / Gate / Tower / Palisade
- movement control
- visibility
- tolls
- defense depth

---

## Movement and Route Control

### Movement Principles

Movement must be route-based and server-authoritative.

### Movement Types

- roads
- bridges
- river routes
- coastal routes
- courier routes
- relay outposts
- mounted movement
- staging points
- escort chains

### Travel Time Formula

A route segment should use a formula like:

```text
travelSeconds = distanceMeters / (baseSpeed × factionMobility × terrainModifier × roadModifier × supplyModifier)
```

### Recommended Multipliers

- `baseSpeed`: 1.25 m/s for the abstract map layer
- `factionMobility`: 0.8 to 1.35
- `terrainModifier`: 0.6 to 1.4
- `roadModifier`: 0.8 to 1.2
- `supplyModifier`: 0.75 to 1.1

### Compression Rule

Long-distance travel should be compressed so it remains strategic instead of tedious.

Suggested bands:

- `0–2 km`: near-real-time or short tactical travel
- `2–20 km`: partially compressed
- `20 km+`: strongly compressed with route risk still preserved

### Visibility Rule

Travel should be visible if:
- the route is scouted,
- the path is locally observed,
- the convoy is large,
- the transport is near a controlled chokepoint.

### Interception Rule

Interception should be based on:
- route prediction,
- local scouting,
- control of adjacent nodes,
- speed differential,
- concealment.

### Route Control Rule

If movement enters a controlled bridge, gate, corridor, or toll segment, the controller should be able to:
- tax it,
- deny it,
- slow it,
- ambush it,
- or negotiate passage.

---

## Trade and Toll Economy

### Trade Philosophy

Trade is not the same as alliance.

Players can be economically connected without being politically aligned.

### Trade Flow Rule

Trade volume should depend on:
- route safety,
- route speed,
- scarcity,
- local production,
- toll pressure,
- distance,
- trust.

### Toll Formula

```text
tollValue = routeValue × tollRate × controllerPower × routeCentrality
```

Suggested toll rate band:
- low traffic: 2%–5%
- normal traffic: 5%–12%
- choke point: 12%–25%

### NPC Market Purpose

The NPC market is a stabilizer, not the ideal trade partner.

It should:
- buy excess cheaply,
- sell scarce goods expensively,
- prevent total collapse,
- never outcompete player trade at scale.

### Pricing Formula

```text
marketPrice = basePrice × scarcityMultiplier × distanceMultiplier × stabilityMultiplier
```

Suggested ranges:
- `scarcityMultiplier`: 0.7 to 2.5
- `distanceMultiplier`: 0.9 to 1.6
- `stabilityMultiplier`: 0.8 to 1.3

### Player Trade Tools

- barter
- contracts
- scheduled delivery
- safe passage
- toll agreements
- tribute

---

## Army System

### Army Purpose

Armies are political, logistical, and territorial tools.

They are not just damage numbers.

### Army State Targets

Each army should track:
- commander
- location or node
- route progress
- morale
- cohesion
- supply days
- garrison status

### Force Readiness Formula

The current readiness pattern is solid:

```text
readiness = average(
  commandQuality,
  morale,
  cohesion,
  supplyFactor
)
```

Suggested component ranges:
- `commandQuality`: 0.0 to 1.0
- `morale`: 0.0 to 1.0
- `cohesion`: 0.0 to 1.0
- `supplyFactor`: 0.0 to 1.0

### Supply Factor

```text
supplyFactor = clamp01(supplyDays / 7)
```

This makes 7 days of supply feel like “fully supplied” for a field force.

### Army Supply Pressure

A force should start degrading noticeably below 3 days of supply.

### Army Decay Per Day

Current decay should be gentle but real:

- supply declines every day
- morale declines slightly
- cohesion declines slightly
- exposure and damage should accelerate if supply is zero

### Recommended Daily Losses

- Supply: `0.5–1.5` days/day depending on activity
- Morale: `0.01–0.05` per day
- Cohesion: `0.005–0.02` per day

### Army Role Types

- field battle
- escort
- raid
- garrison
- siege support
- scouting support
- interception

---

## Combat Model

### Combat Philosophy

Combat should reward:
- better command,
- better supply,
- better positioning,
- better morale,
- better terrain,
- better scouting.

Combat should not be decided by a single hidden roll.

### Effective Power Formula

```text
effectivePower = troopCount × bannerQuality × moraleFactor × cohesionFactor × supplyFactor × commanderFactor × terrainFactor × factionFactor
```

### Suggested Multipliers

- `bannerQuality`: 0.8 to 1.2
- `moraleFactor`: 0.5 to 1.2
- `cohesionFactor`: 0.5 to 1.1
- `supplyFactor`: 0.0 to 1.0
- `commanderFactor`: 0.7 to 1.3
- `terrainFactor`: 0.7 to 1.4
- `factionFactor`: 0.85 to 1.35

### Damage Distribution Rule

Damage should be proportional, not binary.

A good pattern is:

```text
damageShare = attackerPower / (attackerPower + defenderPower)
```

Then convert that share into casualties, morale loss, and cohesion loss.

### Casualty Rule

Casualties should increase when:
- supply is low,
- morale is low,
- terrain is bad,
- commander quality is poor,
- the unit is isolated.

### Morale Shock Rule

Morale should drop sharply when:
- casualties exceed a threshold,
- relief does not arrive,
- the army is outmatched,
- the commander is absent,
- supply is exhausted.

### Retreat Rule

Retreat should be rational and survivable.

A force should retreat before total collapse if:
- power ratio falls below a threshold,
- morale is low,
- supply is low,
- losses exceed acceptable bounds.

### Presence Bonus

Physical player presence should matter.

Recommended effect:
- +5% to +15% morale
- +5% to +10% command responsiveness
- stronger visibility and coordination near the player

### Battle Duration Targets

- Small skirmish: 30 seconds to 3 minutes
- Medium engagement: 3 to 10 minutes
- Major battle: 10 to 30 minutes
- Siege assault: only one phase of a longer siege

---

## 12.1 Unit Families, Upgrades, and Combined Arms

### Unit Design Principle

The game should have depth through **multiple unit types per family**, not just bigger numbers.

A strong army should come from composition, timing, terrain, supply, and command, not from spamming one obvious best unit.

### Core Families

Each banner should belong to one family and one subtype:

- Infantry
- Cavalry
- Ranged
- Siege
- Support

Each family should have several distinct subtypes with different jobs.

Examples:
- Infantry: spear, shield, heavy
- Cavalry: light, heavy, scout/raider
- Ranged: archers, crossbows, skirmishers
- Siege: sappers, siege crew, assault support
- Support: engineers, quartermasters, field logistics

### Upgrade Philosophy

Upgrades should increase specialization, not erase tradeoffs.

A unit upgrade should usually do one or more of these:
- improve a unit’s intended role
- increase resource cost and upkeep
- increase training time
- add a tactical weakness elsewhere

Upgrades should not make one unit type strictly better in every situation.

### Combined Arms Rule

The best armies should mix roles:
- infantry holds ground
- cavalry creates pressure and interception
- ranged units shape engagement space
- siege units break structures
- support units keep the army operational

### Anti-Spam Rule

Single-type armies should be possible, but they should be easier to counter and less efficient at the top end.

Use soft penalties, not hard bans:
- repeated same-type concentration should reduce flexibility
- too much of one subtype should increase supply strain and command strain
- mixed armies should gain a modest readiness bonus
- armies with clear counters should perform better than armies that simply out-number everything

### Counterplay Rule

Every unit type should have at least one clear counter and one clear strength.

No unit family should be universally best in open battle, siege, defense, and raiding at the same time.

### Faction Interaction

Faction identity should bias unit choices without locking them in.

A faction can be better at cavalry, defense, logistics, or scouting, but the faction should still need mixed arms to win long wars.

## 12.2 Unit Subtypes, Counters, and Morale

### Infantry Subtypes

#### Spear Infantry
- Best at holding ground
- Strong against cavalry charges
- Reliable in choke points and defensive lines
- Weak to missile pressure and flanking if unsupported

#### Shield Infantry
- Best at absorbing ranged fire and surviving prolonged fights
- Strong in sieges and street fighting
- Good morale anchor for nearby troops
- Weak at chasing or exploiting gaps

#### Heavy Infantry
- Best at sustained melee and breaking other infantry lines
- Strong morale presence in the center of an army
- Useful in sieges and fortified assaults
- Weak to mobility, attrition, and being kited

### Cavalry Subtypes

#### Light Cavalry
- Best at scouting, raiding, chasing, and harassment
- Strong at pursuit and interception
- Weak in prolonged melee and against prepared spears

#### Heavy Cavalry
- Best at shock attacks and decisive charges
- Strong morale impact on enemy lines
- Strong in open terrain
- Weak in rough terrain, choke points, and prolonged sieges

#### Scout Cavalry
- Best at detection, screen lines, and route awareness
- Low direct combat power
- High strategic value through vision and disruption
- Weak if forced into a direct fight

### Ranged Subtypes

#### Archers
- Best at early pressure, harassment, and softening formations
- Strong cost-efficiency
- Weak armor penetration and weaker against shielded fronts

#### Crossbows
- Best at armor penetration and anti-heavy pressure
- Strong in siege defense and choke fights
- Weak rate of fire and slower repositioning

#### Skirmishers
- Best at mobility, ambushes, and flexible skirmishing
- Strong against exposed support units and routing enemies
- Weak in a direct stand-up fight

### Siege Subtypes

#### Sappers
- Best at undermining walls and gates
- Strong in prolonged siege pressure
- Weak in open battle

#### Siege Crew
- Best at operating engines and sustaining bombardment
- Strong against structures
- Weak if exposed without protection

#### Assault Support
- Best at helping infantry breach and exploit openings
- Strong during the final phase of a siege
- Weak if used too early

### Support Subtypes

#### Engineers
- Improve repairs, fortification, and siege defense
- Strong in long campaigns
- Weak direct combat power

#### Quartermasters
- Improve supply efficiency and reduce attrition
- Strong for long-distance operations
- Weak if the army is already overextended

#### Field Logistics
- Improve movement coordination and recovery
- Strong for sustained maneuver warfare
- Weak in straight combat output

### Counter Matrix Principle

Every subtype should have at least one clear answer and one clear threat.

Examples:
- Spear infantry answers cavalry
- Shield infantry answers arrows and frontal pressure
- Heavy infantry answers weak melee lines
- Light cavalry answers exposed logistics and slow ranged units
- Heavy cavalry answers open-field soft targets
- Archers answer unshielded infantry and light units
- Crossbows answer heavy infantry and armored targets
- Skirmishers answer slow formations and isolated support
- Sappers answer walls and gates
- Engineers answer damage and siege pressure

### Morale as a Core Combat Resource

Morale should be a major combat variable, not a minor modifier.

Morale should affect:
- attack quality
- defense stability
- movement confidence
- willingness to hold ground
- resistance to routing
- retreat timing
- siege endurance
- pursuit after victory

### Morale Sources

Morale should rise from:
- commander quality
- recent victories
- strong supply
- good terrain position
- nearby friendly banners
- factional or dynastic prestige
- successful charges or defense holds
- being near a defended home holding

Morale should fall from:
- casualties
- supply loss
- isolation
- flanking pressure
- being outnumbered badly
- commander loss
- failed assaults
- siege starvation
- watching nearby allies rout

### Morale and Unit Type

Different unit types should react to morale differently.

- Heavy infantry should hold longer under pressure
- Light cavalry should route sooner if trapped
- Archers should lose effectiveness quickly if rushed
- Crossbows should be steady but slower to recover
- Shock cavalry should gain a lot from high morale and lose a lot from low morale
- Support units should rarely be the frontline morale anchor

### Morale and Army Composition

A balanced army should be easier to keep steady than a spammed one.

Reason:
- mixed armies create mutual support
- multiple roles reduce the chance of a single counter collapsing the whole force
- support units can keep supply and recovery stable

### Morale and Composition Penalty

Armies that lean too hard into one role should become fragile when countered.

Not because the game hard-bans them, but because:
- they are easier to predict
- they suffer worse morale shocks when countered
- they lose flexibility after the first bad exchange

### Morale and Retreat

Retreat should be a valid skill expression.

A good army should leave before full collapse if:
- morale drops too low
- supply is failing
- the fight is going badly
- the terrain is bad
- the commander is giving a withdrawal order

This keeps morale meaningful without turning battles into total wipes every time.

### Upgrade Path Rule

Upgrades should deepen a unit’s identity, not flatten it.

Examples:
- spear infantry can become better anti-cavalry anchors
- shield infantry can become better at siege holding and missile resistance
- heavy infantry can become better at breakthrough and morale pressure
- light cavalry can become better at scouting and pursuit
- heavy cavalry can become better at charge impact but worse in sustained fights
- archers can become better at volume fire or fire discipline
- crossbows can become better at armor piercing or fortress defense
- skirmishers can become better at evasion or harassment
- sappers can become better at wall damage or gate disruption
- engineers can become better at repair speed or fortification efficiency

### Upgrade Cost Rule

The more specialized and powerful a unit becomes, the more it should cost in:
- training time
- equipment
- upkeep
- command attention
- supply dependency

### Soft Cap Rule

A force should feel best when it has a balanced mix of roles.

Soft caps can come from:
- command bandwidth
- supply burden
- morale fragility
- terrain mismatch
- counter exposure

The goal is not to punish creativity. The goal is to make every composition have tradeoffs.

---

## Commander System

### Commander Purpose

Commanders are long-term assets.

Losing a good commander should hurt.

### Commander Stats

- Tactics
- Leadership
- Logistics
- Cavalry
- Infantry
- Siege
- Naval

### Commander Quality Formula

The current average-of-stats model is a good baseline:

```text
commandQuality = average(tactics, leadership, logistics, cavalry, infantry, siege, naval)
```

Convert to 0–1 or 0–100 depending on UI layer.

### Role Bias Targets

- Field commander: tactics + leadership
- Logistics expert: logistics + leadership
- Defensive marshal: leadership + infantry
- Siege master: siege + tactics
- Cavalry leader: cavalry + tactics

### Commander Growth Formula

```text
xpGain = actionValue × hiddenTalent × roleRelevance
```

Suggested level-up behavior:
- Every 100 XP = 1 visible improvement step
- Each improvement step should raise 1–3 stats, not all stats equally

### Commander Risk

Commanders should be able to be:
- wounded
- captured
- killed
- reassigned
- retired

### Commander Scarcity Rule

Good commanders should be uncommon enough to matter, but not so rare that the game becomes dead if one dies.

---

## Siege System

### Siege Philosophy

Sieges are slow, expensive, and strategic.

They should not be instant capture mechanics.

### Siege Win Conditions

A siege should succeed by combining:
- starvation,
- wall damage,
- supply denial,
- morale collapse,
- final assault.

### Siege State Elements

- attacker strength
- defender strength
- wall integrity
- supply status
- morale
- repair rate
- reinforcement risk
- breach progress

### Siege Pressure Formula

```text
siegePressure = bombardment + starvation + sapping + isolation
```

### Suggested Siege Timelines

- Outpost: 1–2 days
- Fort: 3–7 days
- Castle: 7–21 days
- Major fortified city: longer if supply and relief are strong

### Siege Repair Rule

Defenders should be able to slow a siege by spending:
- labor,
- wood,
- stone,
- morale,
- and time.

### Relief Rule

Relief forces should matter a lot.

If a relief force arrives with enough strength and supply, it should be able to:
- break the siege,
- force withdrawal,
- or stabilize the defense.

### Assault Rule

Assault should be the most dangerous option.

It should be used when:
- a breach exists,
- morale is low,
- defenders are isolated,
- or a decisive finish is worth the risk.

---

## Faction Balance

### Faction Balance Rule

No faction can be universally best.

Every faction must have:
- at least one major strength,
- at least one major weakness,
- at least one counterplay path.

### Frankish Kingdom

**Identity**: heavy cavalry, castles, direct battle

**Strengths**
- strong shock combat
- strong fortress play
- strong siege engineering

**Weaknesses**
- slow mobility
- higher upkeep
- vulnerable to raiding and supply disruption

### Mongol Khanate

**Identity**: mobility, interception, raiding

**Strengths**
- best movement
- best hit-and-run pressure
- strong scouting and interception

**Weaknesses**
- weak static defense
- weaker long sieges
- more exposed when forced to hold ground

### Abbasid Caliphate

**Identity**: administration, trade, logistics

**Strengths**
- best logistics
- strong economy
- strong sustained war capability

**Weaknesses**
- expensive expansion
- vulnerable when trade routes are cut

### Byzantine Empire

**Identity**: intelligence, defense, durable territory

**Strengths**
- strong scouting
- strong defense
- strong local control

**Weaknesses**
- slower expansion
- fewer units per cost
- weaker aggressive projection

### Khazar Khaganate

**Identity**: chokepoint control, tolls, flexible mixed forces

**Strengths**
- strong toll economy
- strong route taxation
- adaptable force composition

**Weaknesses**
- dependent on trade flow
- vulnerable if bypassed
- weaker if opponents route around control

### Faction Tuning Rule

Faction bonuses should be noticeable but not overwhelming.

Recommended bonus band:
- strong modifier: `1.20–1.35`
- mild modifier: `0.95–1.10`
- weak modifier: `0.80–0.95`

---

## Balance Targets

### Early Game

The player should be able to:
- claim a first territory,
- support a first commander,
- manage a starter stockpile,
- learn one route,
- and protect one small holding.

### Mid Game

The player should begin to:
- build a settlement chain,
- control a trade route,
- field multiple companies,
- and feel pressure from logistics and rivals.

### Late Game

The player should be able to:
- maintain multiple holdings,
- project force across several route segments,
- sustain sieges,
- and win through logistics rather than raw brute force.

### Long-Term Targets

- No build should be free.
- No defense should be permanent.
- No resource should become irrelevant.
- No route should eliminate geography.
- No faction should invalidate the rest.

---

## Pacing Targets

### Resource Pacing

A player should usually be able to make one meaningful improvement every few world days early on.

### Military Pacing

A new banner should be a meaningful acquisition, not a trivial purchase.

### Siege Pacing

A siege should feel like an operation, not a button press.

### Territory Pacing

Claiming territory should be easy enough to teach, but costly enough to defend.

---

## Cost Model

### General Cost Rule

Cost should increase faster than linear progress.

This prevents snowballing and preserves strategic choice.

### Upgrade Cost Formula

```text
cost(level) = baseCost × level^1.45
```

### Maintenance Cost Formula

```text
maintenance = baseUpkeep + sizeFactor + distanceFactor + garrisonFactor + damageFactor
```

### Suggested Cost Drivers

- population size
- territory size
- route distance
- fortification depth
- commander quality
- military size
- livestock count
- market distance

### Suggested Upkeep Pressure

- small holdings: low but persistent upkeep
- medium holdings: require trade or production surplus
- large holdings: require logistics chains and route security

---

## Failure States

### Acceptable Failure

A player can lose territory, armies, trade, commanders, and wealth.

### Unacceptable Failure

The game should not create situations where a single early mistake makes recovery impossible.

### Recovery Principle

A player who loses should still have:
- a path back,
- a smaller safe base,
- or a way to rebuild through trade, mobility, or allies.

---

## AI Build Contract

Any AI implementing this game later should follow these rules:

1. Do not invent fantasy mechanics.
2. Do not bypass supply.
3. Do not make any faction universally best.
4. Do not let ownership replace logistics.
5. Do not make combat binary.
6. Do not make sieges instant.
7. Do not make the NPC market stronger than player trade.
8. Do not make territory permanent without active support.
9. Do not make movement ignore routes.
10. Do not make the client authoritative.

---

## Open Questions to Decide Before Full Combat Implementation

- Exact banner-to-soldier ratio for standard units
- Exact casualty rates for field battle
- Exact siege duration targets by structure tier
- Exact territory density rules in public space
- Exact trade price bands for each resource
- Exact labor allocation formula across settlement tiers
- Exact maximum supply capacity for armies and caravans
- Exact threshold for collapse vs retreat
- Exact visibility radius for transport detection
- Exact claim retention rules for inactive players

---

## Recommended Next Implementation Steps

1. Lock unit scales.
2. Formalize resource production and consumption.
3. Formalize settlement upgrade tiers.
4. Implement battle resolution math.
5. Implement siege pressure and repair loops.
6. Add market pricing and toll formulas.
7. Add faction modifiers to all relevant systems.
8. Add balance telemetry so tuning is data-driven.

---

## Final Rule

Every advantage must be earned, supplied, defended, and exposed to counterplay.
