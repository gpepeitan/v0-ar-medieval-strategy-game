# MedievalAR Master Balance Document

This is the master reference for MedievalAR gameplay, economy, combat, units, factions, fairness, and tuning.

Use this document first when designing, balancing, or implementing the game.

If this document conflicts with a narrower working draft, this document wins.

---

## Executive Summary

MedievalAR is a persistent medieval strategy game about geography, logistics, supply, territory, and long-term power.

Balance goal: many viable strategies, no universal best path.

Reward:
- positioning
- economy planning
- varied composition
- morale management
- route control
- commander quality
- active upkeep

Punish:
- over-specialization
- passive snowballing
- spam
- hidden dominance
- exploit loops
- ignoring supply or terrain

---

## Quick Reference

| Topic | Core Rule |
|---|---|
| World | Persistent, never reset |
| Geography | Matter a lot |
| Supply | Stronger than raw numbers |
| Morale | Important in prolonged conflict |
| Territory | Needs active support |
| Economy | Local first, trade second |
| Structures | Upgrade individually, not as a settlement tier |
| Armies | Mixed compositions should usually outperform spam |
| Factions | Bias playstyle, do not force it |
| Exploits | Design against abuse, not honor |

## How to Use This Document

Tune in this order:
1. Design Principles
2. Core Constants and Scale
3. Economy and Value Model
4. Structure Upgrade Trees
5. Military Unit Roster
6. Unit Counters and Composition
7. Morale System
8. Combat and Siege Model
9. Factions
10. Anti-Exploit and Fairness Rules

If something feels broken, adjust the first relevant lever below.

### First levers to adjust

| Problem | First things to tune |
|---|---|
| One strategy dominates | supply, upkeep, anti-spam rules, route exposure |
| Economy snowballs too fast | structure upkeep, transport cost, rarity, reserve pressure |
| Battles end too fast | morale shocks, casualty bands, retreat thresholds |
| Siege is too weak or too strong | siege pressure, repair cost, relief timing |
| One unit type dominates | counters, specialization tradeoffs, command load |
| One faction dominates | faction modifiers, preferred bias, counterplay windows |
| New players collapse too early | starter reserves, early upkeep, claim pressure |
| Turtling is optimal | structure upkeep, isolation pressure, route vulnerability |

---

## Table of Contents

1. Design Principles
2. Core Constants and Scale
3. World, Claims, and Territory
4. Economy and Value Model
5. Structure Upgrade Trees
6. Military Unit Roster
7. Unit Counters and Composition
8. Morale System
9. Combat and Siege Model
10. Factions
11. Anti-Exploit and Fairness Rules
12. Playtest and Telemetry Checklist
13. Open Questions

---

## 1. Design Principles

- Persistent world
- No final win screen
- No permanent dominance without upkeep
- Geography matters
- Supply matters more than raw numbers
- Morale matters
- Command quality matters
- Terrain matters
- Every strong strategy needs a counter
- Many viable ways to play, not one best way
- Regular players need a recovery path
- No reward for abuse, spam, or loopholes

### Important structural rule

There is **no global settlement tier**.
Growth happens by upgrading individual structures.
That keeps the economy deep instead of flattening it into one generic town level.

### No spoilage rule

Goods do **not** automatically rot or decay.
Their value changes by use, transport cost, risk, and market pressure, not by passive spoilage timers.

### Design priority order

When tuning, adjust in this order:
1. supply
2. upkeep
3. travel and route exposure
4. morale
5. structure costs and repairs
6. unit cost and composition
7. faction modifiers

This reduces the chance of breaking the whole game while fixing a narrow issue.

---

## 2. Core Constants and Scale

### World timing

- `1 world day = 180 real seconds`
- Autosave interval: `30 seconds`
- Active simulation tick: `1 second`
- Network reconciliation tick: `5 seconds`
- Economy update tick: `1 world day`

### Geography and claims

- Claim radius: `120 meters`
- Claim cooldown after placement: `10 minutes`
- Claim contest window: `5 minutes`
- Inactive claim grace period before strong decay: `7 days`
- Full abandonment threshold: `21 days`
- Territory decay half-life target: `14 days`

### Starter state

- Food: `100`
- Wood: `60`
- Stone: `25`
- Iron: `10`

### Starter population

- Villagers: `25`
- Laborers: `12`
- Soldiers: `8`
- Artisans: `3`
- Traders: `2`

### Army scale

- `1 banner = 25 soldiers` nominal
- `1 company = 4 banners = 100 soldiers` nominal
- `1 army = 4 companies = 400 soldiers` nominal

### Practical military ranges

- Banner: `20–30` typical, `1–40` allowed
- Company: `80–120` typical, `75–200` allowed
- Army: `320–480` typical, `200–800` allowed

### Movement baseline

- Base movement speed: `1.25 m/s`

### Reserve pressure bands

- Comfortable: `14+ days`
- Stable: `7–14 days`
- Risky: `3–7 days`
- Critical: `<3 days`

---

## 3. World, Claims, and Territory

### Territory purpose

Territory is control over access, visibility, production, route control, defense depth, and local support.

### Territory quality dimensions

- access quality
- defensibility
- route centrality
- production potential
- visibility
- maintenance burden
- public access reliability

### Territory control formula

```text
controlStrength = claimStrength × decayMultiplier × logisticsFactor × supportFactor × terrainFactor
```

Component ranges:
- claimStrength: `0.0–10.0`
- decayMultiplier: `0.0–1.0`
- logisticsFactor: `0.5–1.5`
- supportFactor: `0.5–1.5`
- terrainFactor: `0.75–1.5`

### Support factor idea

```text
supportFactor = 0.5 + 0.5 × clamp01(activePopulation + nearbyGarrison + nearbyStructures + supplyCoverage)
```

### Decay model

```text
decayMultiplier(day) = exp(-day / 14)
```

Reference values:
- Day 0: `1.00`
- Day 7: `0.61`
- Day 14: `0.50`
- Day 21: `0.37`
- Day 28: `0.25`

### Retake logic

Easier to retake if isolated, under-supplied, weakly garrisoned, poorly supported, poorly scouted, or hard to repair.

Harder to retake if near active population, on a chokepoint, connected by roads/bridges/towers/gates, backed by strong command presence, or deeply supplied.

---

## 4. Information Visibility and Fog of War

### Visibility goal

Players should be able to understand the world without turning the game into total information warfare.

Default state:
- the world map is visible
- claimed land is visible
- cities and economic production are visible
- military force details are hidden unless revealed

### What is visible by default

- map geography
- public-access land
- claim ownership
- settlements and their economic footprint
- roads, bridges, and major infrastructure
- trade routes and obvious chokepoints

### What is hidden or partially hidden

- exact army composition
- exact troop counts
- commander identities and strength
- hidden reserves
- military movement outside local observation
- forts unless scouted or locally observed
- castles unless scouted or locally observed
- military-only structures unless revealed by scouting, proximity, or ownership intel

### Scouting rule

Scouting should reveal military information gradually.

- local observation reveals presence
- good scouting reveals type and rough size
- excellent scouting reveals composition, readiness, and likely intent

### Visibility tiers

#### Tier 0: public visibility
- map geography
- public-access land
- claims
- cities
- production footprint
- roads, bridges, and obvious infrastructure

#### Tier 1: local observation
- a military force is present
- a fort-like structure exists nearby
- a castle-like structure exists nearby
- activity level is detectable
- movement is visible in the local area

#### Tier 2: scout intelligence
- rough army size
- rough composition family
- likely direction or purpose
- whether a holding is military, economic, or mixed
- whether a route is under active patrol

#### Tier 3: verified intel
- specific unit classes
- approximate readiness
- commander identity if known
- rough supply status
- whether a force is likely to attack, defend, raid, or withdraw

### Intel expiry

Intel should decay unless refreshed.

Suggested expiry windows:
- local observation: `minutes to a few hours`
- scout intelligence: `1–3 world days`
- verified intel: `3–7 world days`

Fresh movement should immediately invalidate stale intel if the target is active and mobile.

### Hidden movement rule

Military movement should only stay hidden if it is:
- outside local observation
- outside current scouting coverage
- not crossing a watched route or chokepoint

If a hidden force crosses visible ground, players should at least know something moved.

### Castle role

Castles are not major production centers.
They are smaller than cities and designed to be self-sufficient enough to survive a siege.

A castle should:
- protect a surrounding area
- anchor defense
- store reserves
- house command and garrison functions
- resist siege pressure

A castle should not:
- become a huge industrial center
- outproduce a city
- replace normal economic development

### Balance rule

Players should see enough to plan economically.
They should not see so much military detail that ambushes, deception, and scouting no longer matter.

---

## 5. New-Player Protection and Expansion Pressure

### Design goal

A seasoned player should be able to win land, but not erase the future of new players.

New players should be able to start even in dense cities, but they should not expect prime land to be free.

### Core rules

- Starter holdings should be easier to defend for a limited early window.
- First losses should weaken a player, not delete their run.
- Expansion should create maintenance pressure.
- Overextension should be self-limiting.
- Dense cities should have multiple claimable public-access nodes, not one all-or-nothing land pool.

### Protection rules

- Starter claims get stronger local support for an early grace period.
- Early claims should decay more slowly if the player is active.
- A new player should always have at least one viable foothold path.
- A player who loses an early fight should be able to recover through a smaller base, trade, or mobility.

### Expansion pressure rules

- Taking more land should raise upkeep, patrol, and repair burden.
- Bigger holdings should need more supply and more local support.
- Winning land should not automatically produce enough surplus to hold everything safely.
- A veteran who pushes too far should become weaker in defense, response time, and maintenance efficiency.

### Dense-city claim rules

- Public-access urban areas should contain multiple valid claim nodes.
- Some should be low-value starter opportunities.
- Some should be premium, contested points.
- Claims should rotate out of neglect via decay and inactivity.
- The map should feel crowded, but not closed.

### Balance checks

A healthy city should allow:
- a new player to begin somewhere
- a veteran to contest important spots
- land to change hands over time
- no permanent blanket ownership by the first strong player

If every claim is gone, the system is too closed.
If every claim is easy, the system is too loose.

### Density and claim spacing

Dense cities should not behave like open countryside.
They should behave like layered competition zones.

Rules:
- high-density areas may contain many small claims close together
- premium public nodes should be rare and contested
- starter claims should exist in every dense metro, but not in every exact spot
- claims should be spaced by legal access, not by a simple empty-radius rule alone

### Veteran projection limit

A veteran can project power into a city, but only if they pay for it in:
- upkeep
- local presence
- patrol coverage
- supply lines
- risk of retaliation

A veteran should be able to take land.
They should not be able to lock down an entire metro just because they are rich.

### NYC-style density guidance

A place like NYC should support:
- many small claimable public-access nodes
- frequent contest windows
- mixed ownership in the same broad district
- ongoing economic and military pressure in valuable areas

The right answer is not to make land free.
The right answer is to make land **numerous, contestable, and partially local**, so new players can enter while veterans still have to fight for control.

---

## 6. Economy and Value Model

### Economic doctrine

- Local production first
- Trade second
- Transport creates value and cost
- Every resource needs a sink
- Every specialization needs a weakness
- Stockpiles buy time, not forever safety
- The economy should support multiple archetypes

### Reference value unit

- `Food = 1.0` reference value
- Everything else is measured relative to food

### Market value formula

```text
marketValue = baseValue × rarityMultiplier × strategicMultiplier × transportMultiplier × riskMultiplier × demandMultiplier
```

Recommended ranges:
- rarityMultiplier: `0.7–3.5`
- strategicMultiplier: `0.8–2.5`
- transportMultiplier: `0.9–1.8`
- riskMultiplier: `0.9–1.6`
- demandMultiplier: `0.8–2.0`

### Value interpretation

- `1–3`: common consumables
- `4–8`: strategic raw goods
- `9–20`: advanced goods or rare logistics assets
- `21+`: elite assets, mounts, diplomacy goods, or major war inputs

### Resource value registry

#### Common resources

| Resource | Base Value | Rarity | Primary Role |
|---|---:|---|---|
| Food | `1.0` | Common | Consumption, armies, livestock |
| Wood | `2.0` | Common | Buildings, carts, fuel, siege gear |
| Stone | `2.5` | Regional | Forts, roads, walls, bridges |
| Water | `0.5` | Common | Survival, livestock, stability |

#### Regional resources

| Resource | Base Value | Rarity | Primary Role |
|---|---:|---|---|
| Iron | `5.0` | Regional | Weapons, armor, tools |
| Salt | `4.0` | Regional / Rare | Preservation, trade, logistics |
| Cloth / Wool | `4.0` | Regional | Clothing, trade, population health |
| Leather | `3.5` | Regional | Equipment, armor, goods |
| Hides | `3.0` | Regional | Leather chain, trade |
| Charcoal | `2.5` | Regional | Metalworking fuel |
| Milk | `1.5` | Local | Food, herd value, trade |
| Cheese | `3.0` | Local / Regional | Preserved food, trade |
| Eggs | `1.2` | Local | Food, villages |
| Meat | `2.0` | Local | Food, armies |
| Draft Power | `4.0` | Abstract | Transport, farming, hauling |

#### Rare resources

| Resource | Base Value | Rarity | Primary Role |
|---|---:|---|---|
| Horses | `25.0` | Rare | Cavalry, courier speed, transport |
| Silver | `15.0` | Very rare | Contracts, prestige, diplomacy |
| Gold | `50.0` | Very rare | Prestige, diplomacy, major trade |
| Special Stone | `8.0` | Rare | Elite fortification and signature buildings |
| Luxury Goods | `20.0` | Rare / Very rare | Prestige trade |

#### Crafted goods

| Resource | Base Value | Rarity | Primary Role |
|---|---:|---|---|
| Tools | `6.0` | Crafted | Labor efficiency |
| Weapons | `8.0` | Crafted | Military readiness |
| Armor | `12.0` | Crafted | Elite survivability |
| Siege Gear | `10.0` | Crafted | Assault and siege pressure |
| Carts / Wagons | `7.0` | Crafted | Transport efficiency |

### Rarity bands

| Tier | Relative Abundance |
|---|---:|
| Common | `1.00` |
| Regional | `0.35` |
| Rare | `0.12` |
| Very Rare | `0.04` |
| Unique | `0.01` |

### Production rates by source

#### Food

| Source | Output / World Day |
|---|---:|
| Small farm | `10–20` |
| Standard farm | `20–50` |
| Strong farmland | `50–80` |
| Village mixed production | `10–20` |

#### Wood

| Source | Output / World Day |
|---|---:|
| Forest camp | `15–35` |
| Managed woodland | `25–50` |
| Charcoal operation | `5–15 charcoal` |

#### Stone

| Source | Output / World Day |
|---|---:|
| Quarry | `8–20` |
| Rich quarry | `20–35` |
| Road-cut / masonry site | `2–8` |

#### Iron

| Source | Output / World Day |
|---|---:|
| Small mine | `2–4` |
| Standard mine | `4–8` |
| Rich mine | `8–12` |

#### Salt

| Source | Output / World Day |
|---|---:|
| Salt works | `1–3` |
| Coastal salt site | `2–5` |
| Trade-import salt | variable |

#### Cloth / wool / leather

| Source | Output / World Day |
|---|---:|
| Sheep fold | `2–6 wool` |
| Leather chain | `1–4 leather` |
| Workshop textile output | `1–4 cloth` |

#### Livestock growth

| Animal | Growth / World Day |
|---|---:|
| Cattle | `0.03–0.08` |
| Sheep | `0.04–0.10` |
| Goats | `0.04–0.10` |
| Pigs | `0.05–0.12` |
| Horses | `0.01–0.03` |
| Chickens | `0.08–0.20` |

#### Crafted goods

| Source | Output / World Day |
|---|---:|
| Workshop tools | `1–3` |
| Workshop weapons | `0.5–2` |
| Workshop armor | `0.25–1` |
| Siege workshop gear | `0.25–1` |

### Bulk and transport

| Resource | Bulk Pressure |
|---|---:|
| Food | `1.0` |
| Wood | `2.0` |
| Stone | `4.0` |
| Iron | `1.5` |
| Salt | `0.5` |
| Cloth / wool | `1.0` |
| Leather | `1.2` |
| Horses | `10.0` |

### No spoilage rule

Goods do not auto-decay.
Value changes through:
- consumption
- theft
- transport loss
- raid loss
- market saturation
- strategic demand

### Transport cost rule

- local: `1.0x`
- regional: `1.1x`
- distant: `1.25x`
- very distant: `1.5x+`

### Reserve pressure and stockpile targets

| Structure Type | Target Reserve |
|---|---:|
| Outpost | `3–5 days` |
| Village | `5–10 days` |
| Town / market | `10–14 days` |
| Fort / castle | `14–30 days` |

### Economic archetypes

- Agrarian State: food-rich, raid-vulnerable, trade-dependent
- Mining State: stone/iron-rich, food-poor, route-dependent
- Trade State: flexible, wealth-heavy, route-vulnerable
- Fortress State: durable, expensive, can stagnate if isolated
- Pastoral / Cavalry State: mobile, scouting-heavy, infrastructure-light
- Balanced Kingdom: stable, less extreme, harder to counter hard

### Anti-spam economic rules

- If one resource exceeds `50%` of value, apply diminishing returns.
- Focused specialization should cap around `+40%` benefit.
- Over-specialization should create fragility through morale, supply, repair, or route vulnerability.
- A healthy empire should usually have:
  - one food source
  - one construction source
  - one strategic source
  - one trade source
  - one reserve asset

---

## 7. Structure Upgrade Trees

### Structure principle

Individual structures grow.
The settlement as a whole does not have a tier.

### General upgrade formula

```text
upgradeCost(level) = baseBuildCost × 0.55 × level^1.45 × structureClassMultiplier
```

Class multipliers:
- production structures: `1.0`
- logistics structures: `1.1`
- military structures: `1.25`
- elite anchors: `1.4`

### Farm

Branches:
- field expansion
- irrigation
- rotation planning
- granary access
- tool improvement
- labor distribution

Effects:
- food output up
- stability up
- efficiency up

### Village

Branches:
- storage yard
- labor hall
- animal pens
- craft annex
- market stalls
- recovery center

Effects:
- labor multiplier up
- local trade throughput up
- reserve capacity up
- recovery time down

### Mine

Branches:
- shaft expansion
- hauling system
- drainage
- ventilation
- security post

Effects:
- output up
- labor efficiency up
- collapse risk down
- transport friction down

### Workshop

Branches:
- tools
- weapon bench
- armor bench
- siege bench
- quality control
- apprentices

Effects:
- conversion efficiency up
- crafted goods quality up
- elite access up
- input waste down

### Market

Branches:
- stall expansion
- contract office
- warehouse annex
- courier desk
- toll desk
- exchange hall

Effects:
- trade throughput up
- price efficiency up
- route visibility up
- contract capacity up

### Outpost

Branches:
- watchpoint
- relay signal
- supply cache
- scout shelter
- mounted relay

Effects:
- detection radius up
- response speed up
- route intelligence up
- holding power modestly up

### Fort

Branches:
- palisade ring
- rampart reinforcement
- gatehouse
- barracks
- storehouse
- lookout tower

Effects:
- garrison capacity up
- siege resistance up
- repair capacity up
- local supply resilience up

### Castle

Branches:
- keep
- curtain wall
- outer works
- command hall
- armory
- quartermaster stores

Effects:
- command support up
- defense up
- reserve capacity up
- regional control up

### Roads, bridges, gates, towers, palisades, toll posts

Branches:
- road surfacing
- bridge reinforcement
- gate control
- tower visibility
- palisade extension
- toll mechanism improvement

Effects:
- movement efficiency up
- toll value up
- visibility up
- choke control up

### Structure upgrade guardrail

Upgrading one path should not erase the other paths.
A great farm should still need protection.
A great fort should still need supply.
A great market should still need route safety.

---

## 8. Military Unit Roster

### Army construction model

Families:
- Infantry
- Cavalry
- Ranged
- Siege
- Support

Recommended composition:
- `35%–50%` frontline infantry
- `15%–30%` mobility units
- `15%–30%` ranged units
- `5%–15%` support units
- `0%–20%` siege units depending on task

Command load budget:
- Base: `100`
- Good commander bonus: `+15` to `+35`
- Exceptional commander bonus: `+40` to `+60`

### Infantry

| Unit | Role | Best At | Weak Against | Cost | Upkeep | Morale Sensitivity |
|---|---|---|---|---:|---:|---:|
| Militia | Cheap local defense | Buying time, garrison, first contact | Heavy pressure, cavalry shock, long strain | `0.70x` | `0.75x` | `1.20` |
| Spear Infantry | Anti-cavalry anchor | Chokepoints, route defense, stopping charges | Missile pressure, flanking, attrition | `1.00x` | `1.00x` | `0.90` |
| Shield Infantry | Defensive infantry | Arrow resistance, wall holding, absorbing attacks | Bypass, mobility warfare, isolation | `1.10x` | `1.05x` | `0.80` |
| Heavy Infantry | Breakthrough line | Assaults, grinding fights, breach pressure | Mobility, attrition, kiting, poor supply | `1.25x` | `1.20x` | `1.00` |

### Cavalry

| Unit | Role | Best At | Weak Against | Cost | Upkeep | Morale Sensitivity |
|---|---|---|---|---:|---:|---:|
| Scout Cavalry | Eyes and screening | Scouting, detection, route awareness | Hard fights, traps, anti-cav lines | `1.00x` | `0.95x` | `1.10` |
| Light Cavalry | Raiding and pursuit | Supply harassment, chasing retreats | Prepared spears, melee traps, dense terrain | `1.15x` | `1.10x` | `1.25` |
| Heavy Cavalry | Shock attack | Charge impact, morale shocks, line breaking | Chokepoints, rough terrain, arrows, long fights | `1.45x` | `1.35x` | `1.35` |

### Ranged

| Unit | Role | Best At | Weak Against | Cost | Upkeep | Morale Sensitivity |
|---|---|---|---|---:|---:|---:|
| Archers | Flexible ranged pressure | Softening, support, forcing movement | Rushes, heavy shields, armored targets | `1.00x` | `0.95x` | `1.00` |
| Crossbows | Armor piercing | Heavy infantry, walls, siege defense | Mobility, reload disruption, poor terrain | `1.15x` | `1.05x` | `0.95` |
| Skirmishers | Mobile disruption | Flanks, screens, positioning punishment | Direct line fights, cavalry traps, siege exposure | `1.05x` | `0.95x` | `1.15` |

### Siege

| Unit | Role | Best At | Weak Against | Cost | Upkeep | Morale Sensitivity |
|---|---|---|---|---:|---:|---:|
| Sappers | Undermine fortifications | Breaches, gate disruption, long siege pressure | Open field combat, relief, cavalry interception | `1.20x` | `1.10x` | `0.85` |
| Siege Crew | Operate engines | Wall damage, tower suppression, sustained pressure | Sorties, mobility disruption, direct assault | `1.30x` | `1.15x` | `0.80` |
| Assault Support | Breach exploitation | Ladders, breach pushes, wall-top fights | Premature engagement, open field fights, low morale | `1.15x` | `1.10x` | `1.00` |

### Support

| Unit | Role | Best At | Weak Against | Cost | Upkeep | Morale Sensitivity |
|---|---|---|---|---:|---:|---:|
| Engineers | Repair and fortify | Repair, wall support, siege stabilization | Direct combat, route interception | `1.15x` | `1.05x` | `0.70` |
| Quartermasters | Supply and endurance | Campaign length, attrition reduction, convoy survival | Direct combat, fast raids, isolated sieges | `1.10x` | `1.00x` | `0.60` |
| Field Logistics | Movement discipline | Long-range movement, staging, recovery | Direct combat, surprise ambushes | `1.05x` | `1.00x` | `0.65` |

---

## 9. Unit Counters and Composition

### Counter table

| Unit | Primary Counters | Secondary Counters | Notes |
|---|---|---|---|
| Militia | Heavy infantry, heavy cavalry | Ranged pressure, morale shock | Strong only when defending home territory |
| Spear Infantry | Crossbows, skirmishers, flanking cavalry, attrition | Siege pressure | Best baseline line unit; not a universal answer |
| Shield Infantry | Mobility units, bypass play, isolation | Heavy pressure over time | Great defense, poor pursuit |
| Heavy Infantry | Mobility warfare, supply denial, kiting | Crossbows when unsupported | Strong when supported, vulnerable when stretched |
| Scout Cavalry | Anti-cavalry traps, rough terrain | Surprise contact | Valuable for information, not direct damage |
| Light Cavalry | Spear walls, rough terrain, prolonged melee | Heavy missile focus | Great for raids and pursuit, not for standing fights |
| Heavy Cavalry | Spears, pikes, rough terrain, archers, supply denial | Chokepoints | Terrifying in the right place, not everywhere |
| Archers | Cavalry rushes, shielded advance, heavy pressure | Fast flanks | Require protection |
| Crossbows | Mobility, disruption, bad terrain | Cavalry dives | High payoff against armor |
| Skirmishers | Anti-cav screens, direct line fights | Siege exposure | Strong in skilled hands and bad for the enemy’s tempo |
| Sappers | Relief forces, field cavalry, open-field fighting | Rapid disruption | Essential to real sieges |
| Siege Crew | Sorties, mobility disruption, sudden assaults | Engine sniping | Not a general combat unit |
| Assault Support | Early engagement, low morale pushes | Heavy screens | Valuable only at the right moment |
| Engineers | Direct combat, route interception | Raids | Make the whole army better without adding damage |
| Quartermasters | Direct combat, fast raids | Isolation | Become crucial in long wars |
| Field Logistics | Surprise ambushes, direct combat | Route raids | Keep armies efficient rather than lethal |

### Combined-arms rules

- Infantry makes ranged units safer.
- Ranged units soften fights before melee.
- Cavalry punishes bad positioning.
- Support units extend endurance.
- Siege units matter only if the army can hold the field.

### Anti-spam rules

- If one family is more than `60%` of an army: no bonus.
- If one family is more than `70%`: `-5%` readiness, `+5%` command strain.
- If one family is more than `80%`: `-10%` readiness, `+10%` counter exposure.

### Family balance bonus

- At least one frontline family + one mobility family + one ranged family + one support family: `+3%` readiness, `+3%` morale recovery.
- All five families in meaningful amounts: `+5%` readiness, `+5%` rally resistance.

### Example army templates

#### Balanced field army
- `40%` frontline infantry
- `20%` ranged
- `20%` cavalry
- `10%` support
- `10%` flexible

#### Raiding army
- `25%` infantry
- `10%` ranged
- `45%` light cavalry / scout cavalry
- `10%` support
- `10%` flexible

#### Siege army
- `40%` infantry
- `15%` ranged
- `10%` cavalry
- `20%` siege
- `15%` support

#### Defensive garrison army
- `45%` shield / spear infantry
- `25%` ranged
- `10%` cavalry
- `10%` support
- `10%` siege or reserve

#### Pursuit army
- `30%` infantry
- `10%` ranged
- `40%` cavalry
- `10%` skirmishers
- `10%` support

---

## 10. Morale System

### Morale scale

- `0.90–1.00`: inspired
- `0.75–0.89`: steady
- `0.60–0.74`: cautious
- `0.45–0.59`: shaken
- `0.30–0.44`: brittle
- `0.00–0.29`: breaking

### Morale effects

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
- frequent rout checks
- large penalties to attack and control

### Morale sensitivity by unit

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

### Morale formula

```text
unitMoraleMultiplier = clamp(0.75, 1.25, 1 + (morale - 0.5) × moraleSensitivity)
```

### Morale sources

Morale rises from:
- strong commander quality
- victories
- reinforcements
- good terrain
- good supply
- holding home ground
- successful charges or defenses

Morale falls from:
- casualties
- commander loss
- low supply
- isolation
- flanking
- siege starvation
- nearby routs
- failed assaults

### Morale shocks

- `5%` casualties in a short window: `-0.03`
- `10%` casualties in a short window: `-0.07`
- commander wounded: `-0.06`
- commander captured: `-0.10`
- commander killed: `-0.15`
- supply below `1 day`: `-0.12`
- reinforcements arrive: `+0.05`
- successful defensive hold: `+0.04`
- successful charge or breakthrough: `+0.06`

### Routing thresholds

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

### Morale recovery

- Safe home territory: `+0.03/day`
- Stable camp with supply: `+0.02/day`
- After victory: `+0.02` immediate morale pulse
- Under active threat: little or no recovery

Morale should recover faster than cohesion.

---

## 11. Combat and Siege Model

### Army readiness

```text
readiness = average(commandQuality, morale, cohesion, supplyFactor)
```

Readiness bands:
- `0.80–1.00`: elite
- `0.65–0.79`: combat-ready
- `0.40–0.64`: strained
- `<0.40`: broken

Supply factor:

```text
supplyFactor = clamp01(supplyDays / 7)
```

### Effective power

```text
effectivePower = troopCount × bannerQuality × moraleFactor × cohesionFactor × supplyFactor × commanderFactor × terrainFactor × factionFactor
```

Recommended ranges:
- bannerQuality: `0.85–1.15`
- moraleFactor: `0.60–1.15`
- cohesionFactor: `0.60–1.10`
- supplyFactor: `0.00–1.00`
- commanderFactor: `0.80–1.25`
- terrainFactor: `0.75–1.35`
- factionFactor: `0.90–1.25`

### Battle outcome curve

```text
a = attackerPower
d = defenderPower
attackShare = a / (a + d)
defenseShare = d / (a + d)
```

Outcome bands:
- `attackShare < 0.40`: attacker usually loses or retreats
- `0.40–0.49`: attacker disadvantaged but can trade
- `0.50–0.59`: roughly even
- `0.60–0.69`: attacker advantage
- `>= 0.70`: decisive attacker advantage

### Casualty bands

Winning side:
- clean victory: `5%–15%` losses
- hard victory: `15%–25%` losses

Losing side:
- controlled retreat: `15%–30%` losses
- defeat: `30%–55%` losses
- rout or collapse: `55%+` losses

### Retreat trigger

Retreat becomes likely when any two are true:
- power ratio below `0.75`
- morale below `0.45`
- supply below `2 days`
- losses above `25%`
- commander quality disadvantage of `0.10+`

### Terrain bands

- Open ground: `1.00`
- Favorable terrain: `1.05–1.15`
- Strong favorable terrain: `1.16–1.25`
- Bad terrain: `0.85–0.95`
- Severe bad terrain: `0.75–0.84`

Specifics:
- Roads / open plains: `1.00`
- Woods: `0.90–1.05`
- Hills: `1.05–1.15`
- River crossing without bridge: `0.80–0.90`
- Chokepoint: defender `1.10–1.25`, attacker `0.80–0.95`
- Fortified gate or wall approach: attacker `0.75–0.90`

### Battle duration targets

- Skirmish: `30 sec–3 min`
- Small battle: `3–10 min`
- Major battle: `10–30 min`
- Siege assault phase: one step in a longer operation

### Supply and attrition

- Light raiding force: `3–5 days` supply
- Standard field force: `5–7 days`
- Siege force: `7–14 days`
- Long campaign force: `14+ days`

Supply effects:
- `7+ days`: `1.00x`
- `3–6 days`: `0.80–0.95x`
- `1–2 days`: `0.50–0.75x`
- `<1 day`: `0.00–0.40x`

Attrition pressure:
- marching with poor supply: `0.5%–1.5%` daily equivalent
- fighting undersupplied: `1%–3%` extra effective loss pressure/day
- prolonged siege without supply: `2%–5%` daily degradation pressure/day

### Siege pressure

```text
siegePressure = bombardment + starvation + sapping + isolation
```

Pressure by source:
- Bombardment: `0.5–2.5/day`
- Starvation: `0.5–2.0/day`
- Sapping: `0.25–1.5/day`
- Isolation: `0.25–1.5/day`

Total pressure target:
- Weak siege: `1–3/day`
- Standard siege: `3–5/day`
- Hard siege: `5–8/day`

### Siege duration targets

- Outpost: `1–2 days`
- Fort: `3–7 days`
- Castle: `7–21 days`
- Major fortified city: `14+ days` if well supplied and relieved

### Defender repair capacity per day

- Wood: `5–20`
- Stone: `2–10`
- Labor: `5–20`
- Morale cost: `0.05–0.20`

### Relief force rule

A relief force is decisive if it can do at least one of these:
- bring `25%+` more effective power than the siege line
- restore supply above the `3 day` threshold
- force a mobility advantage at the siege perimeter

### Assault rule

Assault should be the highest-risk option and attractive mainly when:
- a breach exists
- defender morale is low
- relief is blocked
- the target is isolated

---

## 12. Factions

### Faction principle

All factions can recruit all unit types.
Faction identity should bias composition, not force it.

### Faction modifiers

#### Frankish Kingdom
- Cavalry: `1.20`
- Siege: `1.15`
- Defense: `1.10`
- Mobility: `0.95`

Preferred bias:
- heavy infantry
- heavy cavalry
- shield infantry
- siege crew

#### Mongol Khanate
- Cavalry: `1.20`
- Mobility: `1.20`
- Scouting: `1.10`
- Siege: `0.90`
- Defense: `0.90`

Preferred bias:
- scout cavalry
- light cavalry
- skirmishers
- field logistics

#### Abbasid Caliphate
- Logistics: `1.15`
- Trade support: `1.10`
- Siege endurance: `1.05`
- Direct shock combat: `0.95`

Preferred bias:
- archers
- crossbows
- quartermasters
- engineers

#### Byzantine Empire
- Defense: `1.20`
- Scouting: `1.10`
- Logistics: `1.05`
- Mobility: `0.95`

Preferred bias:
- shield infantry
- crossbows
- engineers
- spear infantry

#### Khazar Khaganate
- Trade: `1.10`
- Toll: `1.20`
- Mobility: `1.05`
- Scouting: `1.05`

Preferred bias:
- scout cavalry
- light cavalry
- skirmishers
- quartermasters

### Faction balance rule

Faction bonuses should change what feels efficient, not what feels mandatory.
A faction should still be able to win with off-meta composition if the player executes well.

---

## 13. Anti-Exploit and Fairness Rules

### Common exploit risks

- alt abuse
- resource pumping
- route sniping
- zerg/blob dominance
- defensive stalling
- siege turtling
- market arbitrage abuse
- AFK growth
- scout abuse
- commander sniping
- unit spam
- overclaim walls
- tower spam
- fort shell abuse

### Structural rules

- No free advantage.
- No permanent safety.
- No infinite loop.
- No best-in-all-cases strategy.
- No invisible dominance.
- No untouchable snowball.

### Economy defenses

- concentration penalties on one-resource dominance
- multiple sinks for every valuable good
- route dependency for high-value trade
- reserve risk for large stockpiles
- player trade should usually beat NPC trade by `10%–25%` on safe routes

### Combat defenses

- spam penalties for single-family armies
- stacking penalties for huge concentrated forces
- alpha-strike limits so fights have response windows
- morale chain reactions should have visible preconditions
- retreat must remain available if players respond in time

### Geography defenses

- chokepoints are strong, not unbeatable
- border cheese should not create free defense
- overclaim overlap should not form untouchable walls
- dead zones should not be perfect safe buffers

### Structure defenses

- tower spam should have diminishing returns
- forts without workers or supply should become shells
- upgrade rush should not bypass the economy
- perfect walling should not remove interaction

### Regular-player pain points

- first-loss spiral
- hidden resource bleed
- build-then-die problem
- unreadable losses
- busywork without meaning

### Fairness rule

The game is balanced when:
- strong strategies are expensive
- cheap strategies are answerable
- players can recover from mistakes
- and no exploit becomes the best strategy

---

## 14. Playtest and Telemetry Checklist

### What to watch

- one unit subtype dominates usage and win rate
- one resource is hoarded far above others
- one route is used almost exclusively
- one faction wins everywhere
- one structure type dominates all others
- new players fail at the same step repeatedly
- losses happen without visible cause
- players stop moving because turtling is better

### Playtest success criteria

A good system should usually satisfy all of these:
1. A stronger position should feel stronger.
2. A weaker position should still have a plan.
3. Big advantages should cost something.
4. Small advantages should matter if used well.
5. No single tactic should work everywhere.
6. Supply, morale, terrain, and scouting should matter together.
7. Losing should be recoverable.
8. Winning should create opportunity, not automatic certainty.

### Test order

1. Opening game stability
2. First expansion choice
3. Claim contest behavior
4. Economy specialization
5. Resource pressure
6. Unit composition balance
7. Morale behavior
8. Supply attrition
9. Siege timing
10. Trade and toll pressure
11. Faction identity
12. Solo vs group balance
13. Comeback paths

---

## 15. Open Questions

- Exact claim density and spacing rules
- Exact public-land verification method
- Exact movement compression curves
- Exact trade price bands by biome
- Exact upgrade efficiency by structure level
- Exact maximum supply capacity for armies and caravans
- Exact threshold for collapse vs retreat
- Exact visibility radius for transport detection
- Exact faction matchup tables by subtype
- Exact claim retention rules for inactive players

---

## Final Rule

Players should be able to build almost anything, but every advantage must be earned, supplied, defended, and exposed to counterplay.

The game should feel deep, readable, and unfair only to players who try to abuse it.
