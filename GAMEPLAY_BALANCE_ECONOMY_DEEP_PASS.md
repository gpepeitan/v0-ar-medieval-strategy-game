# MedievalAR Economy Deep Pass

This document focuses on the value of everything.

Its job is to make the economy deep enough that there are many viable ways to play, but no obvious permanent best route.

If a future system touches scarcity, production, transport, upkeep, or trade, this document should be treated as the economy authority.

---

## 1. Economic Doctrine

### Core Rules

1. **Local production matters first**
   - The best source of most goods should be nearby, not global.

2. **Trade matters second**
   - Trade should fix shortages and create wealth, but not replace production.

3. **Transport creates value and cost**
   - Distance, risk, and route control should change prices.

4. **Every resource needs a sink**
   - Nothing should be abundant without demand.

5. **Every specialization needs a weakness**
   - A food empire should be vulnerable to raids.
   - A mining empire should be vulnerable to logistics.
   - A trade empire should be vulnerable to route disruption.

6. **Stockpiles are strategic**
   - Reserves should buy time, not create safety forever.

7. **The economy should push players into different archetypes**
   - Farming, mining, trading, fortifying, raiding, or mobile control should all be real paths.

8. **Settlements grow through structures, not tiers**
   - A settlement is not a level.
   - A settlement is a living collection of structures that each grow, branch, and specialize independently.

9. **No spoilage system**
   - Goods do not decay automatically over time.
   - Scarcity comes from production, transport, loss, storage limits, and demand.
   - Time-sensitive goods are modeled by access and price, not by freshness timers.

---

## 2. Value Model

Use a simple reference-value system.

### Reference Value Unit

- `Food = 1.0` reference value
- All other values are measured relative to food unless otherwise stated.

### Market Value Formula

```text
marketValue = baseValue × rarityMultiplier × strategicMultiplier × transportMultiplier × riskMultiplier × demandMultiplier
```

Recommended ranges:
- `rarityMultiplier`: `0.7–3.5`
- `strategicMultiplier`: `0.8–2.5`
- `transportMultiplier`: `0.9–1.8`
- `riskMultiplier`: `0.9–1.6`
- `demandMultiplier`: `0.8–1.5`

### Value Interpretation

- `1–3`: common consumables
- `4–8`: strategic raw goods
- `9–20`: advanced goods or rare logistics assets
- `21+`: elite assets, mounts, diplomacy goods, or major war inputs

---

## 3. Resource Value Registry

### Common Resources

| Resource | Base Value | Rarity | Primary Role | Notes |
|---|---:|---|---|---|
| Food | 1.0 | Common | Consumption, armies, livestock | Most universal sink |
| Wood | 2.0 | Common | Buildings, carts, fuel, siege gear | Bulky, always needed |
| Stone | 2.5 | Regional | Forts, roads, walls, bridges | Heavy, infrastructure-heavy |
| Water | 0.5 | Common | Survival, livestock, stability | Usually implicit, not traded much |

### Regional Resources

| Resource | Base Value | Rarity | Primary Role | Notes |
|---|---:|---|---|---|
| Iron | 5.0 | Regional | Weapons, armor, tools | High strategic density |
| Salt | 4.0 | Regional / Rare | Cooking, livestock, trade, contracts | Strong route-value good |
| Cloth / Wool | 4.0 | Regional | Clothing, trade, population health | Strong civilian utility |
| Leather | 3.5 | Regional | Equipment, armor, goods | Good supporting material |
| Hides | 3.0 | Regional | Leather chain, trade | Raw support resource |
| Charcoal | 2.5 | Regional | Metalworking fuel | Turns wood into a strategic input |
| Milk | 1.5 | Local | Food, herd value, trade | Strong local support good |
| Cheese | 3.0 | Local / Regional | Food, trade, army provisioning | Durable value in trade |
| Eggs | 1.2 | Local | Food, villages | Cheap and flexible |
| Meat | 2.0 | Local | Food, armies | High demand in campaigns |
| Draft Power | 4.0 | Abstract | Transport, farming, hauling | Not a trade good so much as an efficiency multiplier |

### Rare Resources

| Resource | Base Value | Rarity | Primary Role | Notes |
|---|---:|---|---|---|
| Horses | 25.0 | Rare | Cavalry, courier speed, transport | One of the strongest mobility assets |
| Silver | 15.0 | Very rare | Contracts, prestige, diplomacy | Good high-value trade currency |
| Gold | 50.0 | Very rare | Prestige, diplomacy, major trade | High-value reserve asset |
| Special Stone | 8.0 | Rare | Signature buildings, elite fortifications | Should be geographically limited |
| Luxury Goods | 20.0 | Rare / Very rare | Prestige trade | Useful for diplomacy and elite demand |

### Crafted Goods

| Resource | Base Value | Rarity | Primary Role | Notes |
|---|---:|---|---|---|
| Tools | 6.0 | Crafted | Labor efficiency | Improves production everywhere |
| Weapons | 8.0 | Crafted | Military readiness | Converts raw materials into combat power |
| Armor | 12.0 | Crafted | Survival, elite units | Expensive but decisive |
| Siege Gear | 10.0 | Crafted | Assault, siege pressure | High wood + iron demand |
| Carts / Wagons | 7.0 | Crafted | Transport efficiency | Huge logistics value |

---

## 4. Rarity Bands

### Availability Tiers

Use rarity to control map distribution, trade friction, and strategic importance.

| Tier | Relative Abundance | Typical Availability |
|---|---:|---|
| Common | 1.00 | Present in many regions |
| Regional | 0.35 | Present in some regions |
| Rare | 0.12 | Present in few regions |
| Very Rare | 0.04 | Present in rare nodes or special routes |
| Unique | 0.01 | One-off, quest-like, or extreme geography |

### Design Rule

A resource is not just rare because it is hard to get.
It is rare because it is hard to get **and** worth transporting.

That means:
- food should be common but strategically important,
- stone should be common but bulky,
- iron should be regional and strategic,
- horses should be rare and politically important,
- gold should be very rare and never required for basic survival.

---

## 5. Production Rates by Source

### Food Sources

| Source | Output per World Day | Notes |
|---|---:|---|
| Small farm | `10–20` | Early settlement support |
| Standard farm | `20–50` | Core early/midgame source |
| Strong farmland | `50–80` | High-value agricultural region |
| Village mixed production | `10–20` | Small but flexible |

### Wood Sources

| Source | Output per World Day | Notes |
|---|---:|---|
| Forest camp | `15–35` | Reliable early-game wood |
| Managed woodland | `25–50` | Requires control and labor |
| Charcoal operation | `5–15 charcoal` | Converts wood into higher value fuel |

### Stone Sources

| Source | Output per World Day | Notes |
|---|---:|---|
| Quarry | `8–20` | Core infrastructure resource |
| Rich quarry | `20–35` | Strong construction zone |
| Road-cut / masonry site | `2–8` | Small but strategic |

### Iron Sources

| Source | Output per World Day | Notes |
|---|---:|---|
| Small mine | `2–4` | Enough to matter |
| Standard mine | `4–8` | Serious regional advantage |
| Rich mine | `8–12` | Strong military economy |

### Salt Sources

| Source | Output per World Day | Notes |
|---|---:|---|
| Salt works | `1–3` | Valuable cooking and trade source |
| Coastal salt site | `2–5` | Strategic trade input |
| Trade-import salt | variable | Good for inland empires |

### Cloth / Wool / Leather Sources

| Source | Output per World Day | Notes |
|---|---:|---|
| Sheep fold | `2–6 wool` | Civilian + trade utility |
| Leather chain | `1–4 leather` | Usually tied to livestock and butchery |
| Workshop textile output | `1–4 cloth` | Strong urban value |

### Livestock Growth Sources

| Animal | Growth per World Day | Notes |
|---|---:|---|
| Cattle | `0.03–0.08` | Slow but durable |
| Sheep | `0.04–0.10` | Better wool economy |
| Goats | `0.04–0.10` | Good in rough terrain |
| Pigs | `0.05–0.12` | Fast food conversion |
| Horses | `0.01–0.03` | Rare, high value |
| Chickens | `0.08–0.20` | Fast, cheap food source |

### Crafted Goods Sources

| Source | Output per World Day | Notes |
|---|---:|---|
| Workshop tools | `1–3` | Labor efficiency |
| Workshop weapons | `0.5–2` | Military throughput |
| Workshop armor | `0.25–1` | Elite cost gate |
| Siege workshop gear | `0.25–1` | Slow, expensive, strategic |

---

## 6. Structure Economy and Upgrade Paths

### Structure Principle

A settlement does not have a global tier.

Instead, each structure has its own growth path.
That gives the economy depth because players can specialize individual structures in different directions instead of simply upgrading “the settlement.”

### Structure Growth Model

Each structure can improve along one or more tracks:

- output
- capacity
- resilience
- access
- labor efficiency
- defense
- route control
- quality

### General Upgrade Rule

```text
upgradeCost(level) = baseCost × level^1.45 × structureClassMultiplier
```

Recommended class multipliers:
- production structures: `1.0`
- logistics structures: `1.1`
- military structures: `1.25`
- elite anchors: `1.4`

### Farm Upgrade Path

A farm should not just become “a better farm” linearly.
It should branch.

Possible farm upgrades:
- field expansion
- irrigation
- rotation planning
- granary access
- tool improvement
- labor distribution

Suggested farm output scaling:
- level 1: base output
- level 2: `+20%`
- level 3: `+45%`
- level 4: `+75%`

### Village Upgrade Path

A village is a labor and support node.

Possible upgrades:
- storage yard
- labor hall
- local market stall network
- animal pens
- craft annex
- recovery center

Suggested village effects:
- labor multiplier up
- local trade throughput up
- reserve capacity up
- recovery time down

### Mine Upgrade Path

A mine should deepen rather than just scale flatly.

Possible upgrades:
- shaft expansion
- hauling system
- drainage
- ventilation
- tool room
- security post

Suggested mine effects:
- output up
- labor efficiency up
- collapse risk down
- transport friction down

### Workshop Upgrade Path

A workshop is where raw material becomes strategic value.

Possible upgrades:
- tools
- armor bench
- weapon bench
- siege bench
- specialist apprentices
- quality control

Suggested workshop effects:
- conversion efficiency up
- crafted-goods quality up
- elite item access up
- input waste down

### Market Upgrade Path

A market should become a pricing and logistics hub.

Possible upgrades:
- stall expansion
- contract office
- warehouse annex
- courier desk
- toll desk
- exchange hall

Suggested market effects:
- trade throughput up
- price efficiency up
- route visibility up
- contract capacity up

### Outpost Upgrade Path

An outpost is a visibility and control node.

Possible upgrades:
- watchpoint
- relay signal
- supply cache
- scout shelter
- mounted relay

Suggested outpost effects:
- detection radius up
- response speed up
- route intelligence up
- holding power modestly up

### Fort Upgrade Path

A fort is a defense and logistics anchor.

Possible upgrades:
- palisade ring
- rampart reinforcement
- gatehouse
- barracks
- storehouse
- lookout tower

Suggested fort effects:
- garrison capacity up
- siege resistance up
- repair capacity up
- local supply resilience up

### Castle Upgrade Path

A castle is a regional authority structure.

Possible upgrades:
- keep
- curtain wall
- outer works
- command hall
- armory
- quartermaster stores

Suggested castle effects:
- command quality support up
- defense up
- reserve capacity up
- regional control up

### Roads, Bridges, Gates, Towers, Palisades, Toll Posts

These are not background flavor.
They are economy multipliers.

Possible upgrades:
- road surfacing
- bridge reinforcement
- gate control
- tower visibility
- palisade extension
- toll mechanism improvement

Suggested effects:
- movement efficiency up
- toll value up
- visibility up
- choke control up

---

## 7. Cost Anchors

### Settlement Build Costs

| Structure | Suggested Build Cost |
|---|---|
| Farm | `20 wood + 10 food` |
| Village hub | `30 wood + 10 stone` |
| Market | `50 wood + 15 stone` |
| Workshop | `40 wood + 10 stone + 5 iron` |
| Mine | `30 wood + 20 stone` |
| Outpost | `20 wood + 5 stone` |
| Fort | `80 wood + 50 stone + 10 iron` |
| Castle | `150 wood + 120 stone + 25 iron` |
| Road segment | `10 wood + 5 stone` |
| Bridge | `40 wood + 20 stone + 5 iron` |
| Gate | `25 wood + 10 stone + 5 iron` |
| Tower | `35 wood + 25 stone` |
| Palisade | `50 wood` |
| Toll post | `15 wood + 5 stone` |

### Upgrade Cost Rule

Upgrades should be cheaper than building a new structure of equivalent strength, but still significant enough to matter.

Recommended upgrade rule:

```text
upgradeCost = baseBuildCost × 0.55 × level^1.45
```

### Maintenance Costs

Maintenance should be a small but persistent tax.

| Structure Type | Suggested Daily Maintenance |
|---|---|
| Small production structure | `1 resource/day` equivalent |
| Village / outpost | `1–2 resource/day` equivalent |
| Market / workshop | `2–4 resource/day` equivalent |
| Fort | `4 resource/day` equivalent plus materials |
| Castle | `8 resource/day` equivalent plus materials |

### Repair Cost Rule

Repairs should be cheaper than rebuilding until damage exceeds `75%`.

Recommended repair formula:

```text
repairCost = missingIntegrity × buildCost × 0.4
```

Recommended rebuild threshold:
- rebuild if damage > `75%`
- repair if damage is between `25%` and `75%`
- patch if damage is below `25%`

---

## 8. Military Procurement Costs

Military is an economic sink.

### Banner Cost Bands

| Banner Type | Suggested Cost Band |
|---|---|
| Light infantry | `40–60` value |
| Heavy infantry | `60–90` value |
| Archer / ranged | `50–80` value |
| Cavalry | `90–150` value |
| Siege banner | `80–140` value |
| Support banner | `30–60` value |

### Daily Upkeep Bands

| Banner Type | Food/Day | Extra Cost |
|---|---:|---|
| Light infantry | `20–25` | low equipment wear |
| Heavy infantry | `25–35` | medium equipment wear |
| Archer / ranged | `22–30` | ammo / bow wear |
| Cavalry | `25–35` | horse feed required |
| Siege | `30–40` | wood/stone support required |
| Support | `15–25` | depends on role |

### Military Cost Rule

The strongest army should not be the one with the most units.
It should be the one that can:
- feed itself,
- move itself,
- replace losses,
- and keep its quality high.

---

## 9. Trade and Pricing

### Base NPC Pricing

Use the existing reference price anchors as the central market baseline.

### Suggested Normal NPC Buy/Sell Spread

- NPC buy price: `65%–75%` of base value
- NPC sell price: `130%–170%` of base value

### Market Price Bands by Situation

| Situation | Price Band |
|---|---|
| Surplus local market | `0.7x–0.9x` base |
| Normal market | `0.9x–1.2x` base |
| Regional shortage | `1.2x–1.8x` base |
| War zone / blockade | `1.8x–3.0x` base |

### Trade Value Formula

```text
tradePrice = baseValue × rarityMultiplier × distanceMultiplier × riskMultiplier × demandMultiplier
```

### Player Trade Rule

Player trade should usually beat NPC trade by `10%–25%` when routes are safe.

If NPC trade is too good, player trade becomes pointless.
If NPC trade is too weak, the economy collapses during shortages.

---

## 10. Transport and Bulk

### Bulk Pressure

Some goods are valuable because they are bulky and expensive to move.

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

### Loss Pressure

Transport losses should come from:
- theft
- raids
- interception
- damage
- route obstruction
- bad logistics

### No Spoilage Rule

Goods do not decay automatically.

Food, milk, meat, eggs, cheese, and similar goods keep their value until they are:
- consumed,
- stolen,
- damaged by transport failure,
- or made irrelevant by market saturation.

### Transport Cost Rule

Longer transport should raise effective cost.

Suggested transport cost multiplier:
- local: `1.0x`
- regional: `1.1x`
- distant: `1.25x`
- very distant: `1.5x+`

---

## 11. Stockpiles and Pressure

### Reserve Bands

- Comfortable: `14+ days`
- Stable: `7–14 days`
- Risky: `3–7 days`
- Critical: `<3 days`

### Structure Reserve Targets

| Structure Type | Target Reserve |
|---|---|
| Outpost | `3–5 days` |
| Village | `5–10 days` |
| Town / market | `10–14 days` |
| Fort / castle | `14–30 days` |

### Reserve Rule

A structure should feel strong because it has time.
Not because it is impossible to raid.

### Stockpile Scarcity Rule

When a stockpile falls below critical threshold:
- trade prices rise,
- morale falls,
- labor efficiency drops,
- and military readiness suffers.

---

## 12. Economic Archetypes

The game should support multiple economic identities.

### Agrarian State

- High food output
- Good population support
- Vulnerable to raids
- Weak if trade routes are cut

### Mining State

- High stone/iron output
- Strong fortification and military production
- Food poor unless traded in
- Route dependent

### Trade State

- High market volume
- Strong silver/gold flow
- Flexible resource access
- Vulnerable to route control and tolls

### Fortress State

- High stone, defense, and durability
- Strong on chokepoints
- Very expensive to maintain
- Can become stagnant if isolated

### Pastoral / Cavalry State

- High horse and livestock value
- Excellent mobility and scouting
- Weak heavy infrastructure
- Needs large grazing access and food balance

### Balanced Kingdom

- Moderately strong across multiple resources
- Harder to counter hard
- Less explosive in any one dimension

### Design Rule

No archetype should be universally best.
Each should be strongest when the map, the season, and the opponent favor it.

---

## 13. Anti-Spam Economic Rules

### Single-Resource Dominance

If a player’s economy relies on one resource for more than `50%` of value, apply diminishing returns.

### Diminishing Return Rule

After a resource exceeds its ideal share, output efficiency should fall by `10%–30%` depending on how extreme the concentration is.

### Specialization Bonus Cap

A focused structure should gain at most `+40%` from specialization.

### Over-Specialization Penalty

If a settlement ignores too many other needs, it should become fragile through:
- morale loss,
- supply risk,
- repair deficits,
- or route vulnerability.

### Economic Diversity Rule

A healthy empire should usually have at least:
- one food source,
- one construction source,
- one strategic source,
- one trade source,
- and one reserve asset.

---

## 14. Balance Targets by Game Stage

### Early Game

The player should be able to:
- support a small settlement,
- understand shortages,
- choose what to produce first,
- and feel meaningful pressure within a few days.

### Mid Game

The player should be able to:
- specialize structures,
- create trade routes,
- maintain a reserve,
- and notice meaningful differences between goods.

### Late Game

The player should be able to:
- maintain several distinct economic engines,
- survive route disruption,
- and use reserves as strategic leverage rather than raw infinite growth.

---

## 15. Final Economy Rules

1. Food should always matter.
2. Wood should always matter.
3. Stone should always matter.
4. Iron should always matter.
5. Salt should be valuable as a trade and logistics good.
6. Cloth and leather should support both civilian and military life.
7. Horses should be rare and powerful.
8. Gold should be valuable but not required.
9. NPC trade should stabilize, not dominate.
10. A good economy should have several viable shapes, not one best shape.
11. Growth should happen through structure upgrades, not settlement tiers.
12. There should be no automatic spoilage system.

---

## 16. Open Economy Questions for Later Tuning

- Exact market spread by region
- Exact reserve capacity by structure level
- Exact livestock feed conversion ratios
- Exact military procurement recipes
- Exact trade contract penalties and premiums
- Exact map rarity by biome
- Exact structure upgrade efficiencies
- Exact storage and transport loss rules under raid pressure

---

## Final Note

If the game feels flat, add more economic meaning.

If one path is too dominant, raise its upkeep, lower its transport efficiency, or give its counters more value.

The goal is not a single perfect economy.
The goal is a living economy with multiple strong ways to play.