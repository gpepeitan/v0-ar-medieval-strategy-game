# MedievalAR Numeric Balance Sheet

This is the tuning sheet for MedievalAR.

It converts the gameplay spec into concrete numbers so future implementation stays balanced, legible, and testable.

If a future system needs a number and this document provides one, use this first.

---

## 1. Baseline Constants

### World Timing

- `1 world day = 180 real seconds`
- Autosave interval: `30 seconds`
- Recommended active simulation tick: `1 second`
- Recommended network reconciliation tick: `5 seconds`
- Recommended economy update tick: `1 world day`

### Geography and Claims

- Claim radius: `120 meters`
- Recommended claim cooldown after successful placement: `10 minutes`
- Recommended claim contest window: `5 minutes`
- Recommended inactive claim grace period before strong decay: `7 days`
- Recommended full abandonment failure threshold: `21 days`

### Territory Decay Target

Use exponential decay.

```text
decayMultiplier(day) = exp(-day / 14)
```

Reference values:
- Day 0: `1.00`
- Day 7: `0.61`
- Day 14: `0.50`
- Day 21: `0.37`
- Day 28: `0.25`

---

## 2. Starting State

### Starter Resources

- Food: `100`
- Wood: `60`
- Stone: `25`
- Iron: `10`

### Starter Population

- Villagers: `25`
- Laborers: `12`
- Soldiers: `8`
- Artisans: `3`
- Traders: `2`

### Starter Military

- 1 starter commander
- 1 starter banner-equivalent force
- 1 starter holding
- 1 starter route segment

### Starter Pressure Target

A fresh player should feel safe for about `3–5 world days` if they ignore expansion and manage consumption reasonably.

---

## 3. Unit Scale

### Standard Military Scale

- `1 banner = 25 soldiers` nominal
- `1 company = 4 banners = 100 soldiers` nominal
- `1 army = 4 companies = 400 soldiers` nominal

### Acceptable Range

- Banner: `1–40 soldiers`
- Company: `75–200 soldiers`
- Army: `200–800 soldiers`

### Practical Balance Target

- Solo player: `1–3 banners`
- Small group: `4–12 banners`
- Mid-tier power: `13–32 banners`
- Major regional force: `33+ banners`

---

## 4. Resource Economy Numbers

### Daily Consumption

Per world day:

- Villager: `1.0 food`
- Laborer: `1.1 food`
- Artisan: `1.1 food`
- Trader: `1.0 food`
- Soldier: `1.5 food`
- Horse: `1.2 food`
- Cattle: `0.8 food`
- Sheep: `0.3 food`
- Goats: `0.3 food`
- Pigs: `0.4 food`
- Chickens: `0.1 food`

### Suggested Starter Base Consumption

Using the starter population above, base daily food burn should be roughly:

```text
25*1.0 + 12*1.1 + 3*1.1 + 2*1.0 + 8*1.5 = 55.3 food/day
```

This is intentionally high enough to force early production, trade, or deliberate restraint.

### Resource Reserve Pressure Thresholds

- Comfortable reserve: `14+ days`
- Stable reserve: `7–14 days`
- Risky reserve: `3–7 days`
- Critical reserve: `<3 days`

### Suggested Base Resource Prices

These are NPC reference prices, not fixed player prices.

| Resource | Buy Price | Sell Price |
|---|---:|---:|
| Food | 1.0 | 1.5 |
| Wood | 2.0 | 3.0 |
| Stone | 2.5 | 4.0 |
| Iron | 5.0 | 8.0 |
| Salt | 4.0 | 6.5 |
| Wool/Cloth | 4.0 | 7.0 |
| Horse | 25.0 | 40.0 |
| Gold | 50.0 | 80.0 |

### Price Bands

Market prices should generally stay within:
- Common goods: `0.7x–1.6x` base price
- Regional goods: `0.8x–2.0x` base price
- Rare goods: `1.0x–2.5x` base price

---

## 5. Production and Labor

### Labor Output Formula

Use the current code baseline:

```text
laborOutput = laborers + (2 × artisans) + traders
laborOutput *= health × loyalty
```

### Recommended Multipliers

- Laborer: `1.0`
- Artisan: `2.0`
- Trader: `1.0`

### State Health Bands

- Healthy: `0.70–1.00`
- Strained: `0.50–0.69`
- Dangerous: `0.25–0.49`
- Collapse: `<0.25`

### Settlement Production Formula

```text
dailyOutput = baseOutput × terrainMultiplier × structureMultiplier × laborMultiplier × stabilityMultiplier
```

### Suggested Multiplier Ranges

- `terrainMultiplier`: `0.8–1.6`
- `structureMultiplier`: `1.0–2.5`
- `laborMultiplier`: `0.5–2.0`
- `stabilityMultiplier`: `0.5–1.3`

### Baseline Settlement Outputs Per Day

A single modest settlement should roughly support one of these profiles:

- `30–60 food/day`
- `10–20 wood/day`
- `5–12 stone/day`
- `2–6 iron/day` if on strong terrain

### Production Targets by Settlement Type

#### Farm
- Food: `20–50/day`
- Stability bonus: `+0.05 to +0.15`

#### Village
- Food: `10–20/day`
- Wood: `5–10/day`
- Labor multiplier: `+0.10 to +0.20`

#### Town
- Food: `8–15/day`
- Trade throughput: `+15% to +30%`
- Artisan output: `+20% to +40%`

#### City
- Food: `15–30/day`
- Labor multiplier: `+30% to +60%`
- Market efficiency: `+25% to +50%`

#### Mine
- Stone: `8–20/day`
- Iron: `2–8/day`

#### Workshop
- Tool / equipment production multiplier: `+20% to +50%`

---

## 6. Livestock Numbers

### Fertility Targets

- Cattle: `0.03–0.08 growth/day`
- Sheep: `0.04–0.10 growth/day`
- Goats: `0.04–0.10 growth/day`
- Pigs: `0.05–0.12 growth/day`
- Horses: `0.01–0.03 growth/day`
- Chickens: `0.08–0.20 growth/day`

### Health Bands

- Healthy herd: `0.75+`
- Strained herd: `0.50–0.74`
- Dangerous herd: `0.25–0.49`
- Collapse: `<0.25`

### Livestock Use Targets

A modest early-game holding should be able to support one of these:
- `3–8 cattle`
- `6–20 sheep`
- `4–12 goats`
- `5–15 pigs`
- `2–6 horses`
- `10–30 chickens`

---

## 7. Territory Numbers

### Territory Control Formula

```text
controlStrength = claimStrength × decayMultiplier × logisticsFactor × supportFactor × terrainFactor
```

### Suggested Component Ranges

- `claimStrength`: `0.0–10.0`
- `decayMultiplier`: `0.0–1.0`
- `logisticsFactor`: `0.5–1.5`
- `supportFactor`: `0.5–1.5`
- `terrainFactor`: `0.75–1.5`

### Control Interpretation

- `0.0–0.5`: effectively lost
- `0.5–1.0`: unstable claim
- `1.0–2.0`: secure claim
- `2.0–4.0`: strong claim
- `4.0+`: anchor territory

### Reinforcement Values

- Small reinforcement action: `+0.10 claimStrength`
- Standard reinforcement action: `+0.25 claimStrength`
- Major reinforcement action: `+0.50 claimStrength`

### Territory Decay Rate

If using daily decay steps instead of exponential only:
- Weak outpost: `0.03/day`
- Normal claim: `0.01/day`
- Fortified claim: `0.005/day`
- Castle anchor: `0.002/day`

---

## 8. Structure Costs and Durability

### Upgrade Cost Curve

```text
upgradeCost(level) = baseCost × level^1.45
```

### Recommended Exponents

- Utility buildings: `1.35`
- Standard buildings: `1.45`
- Forts / castles: `1.60`

### Suggested Base Costs

#### Economic Structures
- Farm: `wood 20`, `food 10`
- Village: `wood 30`, `stone 10`
- Town: `wood 60`, `stone 25`, `food 20`
- City: `wood 120`, `stone 50`, `iron 10`
- Workshop: `wood 40`, `stone 10`, `iron 5`
- Market: `wood 50`, `stone 15`

#### Defensive Structures
- Outpost: `wood 20`, `stone 5`
- Fort: `wood 80`, `stone 50`, `iron 10`
- Castle: `wood 150`, `stone 120`, `iron 25`
- Tower: `wood 35`, `stone 25`
- Palisade: `wood 50`
- Gate: `wood 25`, `stone 10`, `iron 5`
- Bridge: `wood 40`, `stone 20`
- Toll Post: `wood 15`, `stone 5`

### Durability Bands

- Temporary structure: `0.25–0.50 integrity`
- Standard structure: `0.50–0.80 integrity`
- Fortified structure: `0.80–1.00 integrity`

### Repair Targets

- Simple repair should restore `10%–25%` integrity
- Major repair should restore `25%–50%` integrity
- Full rebuild should be cheaper than building from scratch only if damage exceeds `75%`

---

## 9. Movement and Route Numbers

### Travel Formula

```text
travelSeconds = distanceMeters / (baseSpeed × factionMobility × terrainModifier × roadModifier × supplyModifier)
```

### Recommended Multipliers

- `baseSpeed`: `1.25 m/s`
- `factionMobility`: `0.80–1.35`
- `terrainModifier`: `0.60–1.40`
- `roadModifier`: `0.80–1.20`
- `supplyModifier`: `0.75–1.10`

### Route Distance Bands

- `0–2 km`: near-real-time tactical
- `2–20 km`: partially compressed
- `20 km+`: strongly compressed strategic

### Supply Impact on Movement

- Full supply: `1.00x`
- Light supply: `0.90x`
- Low supply: `0.80x`
- Critical supply: `0.65x`

### Interception Thresholds

A convoy should become vulnerable if any of these are true:
- route is known: `+20%` intercept chance
- adjacent node controlled by enemy: `+20%`
- convoy is large: `+10% to +30%`
- escort is weak: `+10% to +25%`
- supply is low: `+10% to +20%`

---

## 10. Trade and Toll Numbers

### Toll Formula

```text
tollValue = routeValue × tollRate × controllerPower × routeCentrality
```

### Toll Rate Bands

- Light traffic: `2%–5%`
- Normal traffic: `5%–12%`
- Chokepoint: `12%–25%`

### Market Price Formula

```text
marketPrice = basePrice × scarcityMultiplier × distanceMultiplier × stabilityMultiplier
```

### Market Multiplier Bands

- `scarcityMultiplier`: `0.7–2.5`
- `distanceMultiplier`: `0.9–1.6`
- `stabilityMultiplier`: `0.8–1.3`

### Trade Health Targets

- Healthy route: at least `60%` of trade volume through player trade
- Stable route: `30%–60%` player trade
- Weak route: `<30%` player trade

NPC market should always remain a fallback, not the dominant option.

---

## 11. Army and Supply Numbers

### Force Readiness Formula

```text
readiness = average(commandQuality, morale, cohesion, supplyFactor)
```

### Readiness Bands

- Elite readiness: `0.80–1.00`
- Combat-ready: `0.65–0.79`
- Strained: `0.40–0.64`
- Broken: `<0.40`

### Supply Factor

```text
supplyFactor = clamp01(supplyDays / 7)
```

### Supply Bands

- Well supplied: `7+ days`
- Normal field force: `3–7 days`
- Pressured: `1–3 days`
- Critical: `<1 day`

### Daily Army Decay Targets

- Supply burn: `0.5–1.5 days/day`
- Morale decay: `0.01–0.05/day`
- Cohesion decay: `0.005–0.02/day`

### Army Maintenance Cost Targets

Per banner per day:
- Food: `25–40`
- Equipment wear value: `0.5–1.5`
- Horse / transport support if mounted: `extra 0.3–1.0`

### Army Size Pressure

- 1 banner: easy to support locally
- 4 banners: requires organized logistics
- 12 banners: requires serious supply chains
- 20+ banners: needs route security or a major base

---

## 12. Combat Numbers

### Effective Power Formula

```text
effectivePower = troopCount × bannerQuality × moraleFactor × cohesionFactor × supplyFactor × commanderFactor × terrainFactor × factionFactor
```

### Suggested Multipliers

- `bannerQuality`: `0.8–1.2`
- `moraleFactor`: `0.5–1.2`
- `cohesionFactor`: `0.5–1.1`
- `supplyFactor`: `0.0–1.0`
- `commanderFactor`: `0.7–1.3`
- `terrainFactor`: `0.7–1.4`
- `factionFactor`: `0.85–1.35`

### Casualty Band Targets

- Winning side: `5%–20%` losses in a clean fight
- Losing side: `15%–60%` losses
- Rout / collapse: `60%+` losses or forced retreat

### Damage Share Formula

```text
damageShare = attackerPower / (attackerPower + defenderPower)
```

### Retreat Thresholds

Retreat should trigger when any two of these are true:
- power ratio is below `0.75`
- morale below `0.45`
- supply below `2 days`
- losses above `25%`
- commander quality disadvantage is large

### Presence Bonus

Physical player presence bonus:
- Morale: `+5% to +15%`
- Command responsiveness: `+5% to +10%`
- Visibility / coordination: context-dependent

### Battle Duration Targets

- Skirmish: `30 sec–3 min`
- Small battle: `3–10 min`
- Major battle: `10–30 min`
- Siege assault phase: `1 step` in a longer operation

---

## 13. Commander Numbers

### Commander Stat Range

Base stat roll:
- Minimum: `30`
- Maximum: `85`

Role bias additions:
- Field commander: `+10 tactics`, `+10 leadership`
- Logistics expert: `+18 logistics`, `+8 leadership`
- Defensive marshal: `+12 leadership`, `+12 infantry`
- Siege master: `+18 siege`, `+8 tactics`
- Cavalry leader: `+18 cavalry`, `+8 tactics`

### Commander Quality Formula

```text
commandQuality = average(tactics, leadership, logistics, cavalry, infantry, siege, naval)
```

### Commander Progression

- `100 XP = +1 progression step`
- Typical gain from a small meaningful action: `1–5 XP`
- Typical gain from a major action: `10–30 XP`

### Hidden Talent Range

- Low talent: `0.65`
- Typical talent: `0.75–0.85`
- Exceptional talent: `0.90–1.00`

### Commander Scarcity Target

A player should feel that a good commander is worth protecting, but not so rare that loss is unrecoverable.

---

## 14. Siege Numbers

### Siege Pressure Formula

```text
siegePressure = bombardment + starvation + sapping + isolation
```

### Suggested Siege Duration Targets

- Outpost: `1–2 days`
- Fort: `3–7 days`
- Castle: `7–21 days`
- Major fortified city: `14+ days` if well supplied and relieved

### Siege Phase Values

- Starvation pressure: `0.5–2.0 pressure/day`
- Sapping pressure: `0.25–1.5 pressure/day`
- Bombardment pressure: `0.5–2.5 pressure/day`
- Isolation pressure: `0.25–1.5 pressure/day`

### Defender Repair Capacity

A defender should typically be able to spend per day:
- Wood: `5–20`
- Stone: `2–10`
- Labor: `5–20`
- Morale: `0.05–0.20`

### Relief Force Threshold

A relief force should meaningfully matter if it can bring:
- `25%+` more effective power than the siege line,
- or enough supply to negate starvation pressure,
- or enough mobility to force a withdrawal.

### Assault Risk Rule

Assault should only be attractive when at least one is true:
- breach exists
- defender morale is low
- relief is blocked
- siege target is isolated

---

## 15. Faction Modifiers

These are recommended modifier bands, matching the current code direction.

### Frankish Kingdom

- Cavalry: `1.35`
- Logistics: `0.95`
- Defense: `1.20`
- Mobility: `0.90`
- Trade: `1.00`
- Siege: `1.25`
- Scouting: `0.95`
- Toll: `0.95`

### Mongol Khanate

- Cavalry: `1.35`
- Logistics: `1.05`
- Defense: `0.85`
- Mobility: `1.35`
- Trade: `0.95`
- Siege: `0.80`
- Scouting: `1.20`
- Toll: `0.90`

### Abbasid Caliphate

- Cavalry: `0.95`
- Logistics: `1.40`
- Defense: `1.00`
- Mobility: `1.00`
- Trade: `1.25`
- Siege: `1.00`
- Scouting: `1.00`
- Toll: `1.05`

### Byzantine Empire

- Cavalry: `1.00`
- Logistics: `1.05`
- Defense: `1.35`
- Mobility: `0.95`
- Trade: `1.00`
- Siege: `1.05`
- Scouting: `1.35`
- Toll: `1.00`

### Khazar Khaganate

- Cavalry: `1.00`
- Logistics: `1.05`
- Defense: `1.00`
- Mobility: `1.05`
- Trade: `1.20`
- Siege: `0.95`
- Scouting: `1.05`
- Toll: `1.35`

### Modifier Rule

No faction modifier should exceed `1.40` or fall below `0.80` unless a system is intentionally extremely asymmetric.

---

## 16. Balance Targets by Game Stage

### Early Game

Target state:
- 1 territory
- 1 commander
- 1 compact supply line
- 1 small productive loop
- 3–5 days of survivability if played carefully

### Mid Game

Target state:
- 2–5 holdings
- 1–3 active routes
- 2–6 banners
- meaningful toll and trade pressure
- logistic strain visible

### Late Game

Target state:
- multiple holdings
- route defense required
- siege threat real
- supply lines meaningful
- victories won by coordination, not just blob size

---

## 17. Tuning Guardrails

Do not allow any of these:

- free buildings
- permanent territory without support
- instant sieges
- binary combat with no retreat
- infinite food production from one source
- a faction that is best in all categories
- NPC market stronger than player trade
- movement that ignores route control
- armies that do not consume supply
- commanders that do not matter

---

## 18. Fast Tuning Checklist

When balancing a new feature, ask:

1. What is the resource cost?
2. What is the upkeep cost?
3. What is the time cost?
4. What is the logistics cost?
5. What is the counterplay?
6. What is the solo-player version of this?
7. What is the group-player version of this?
8. What happens if supply is cut?
9. What happens if the player is absent?
10. What makes this different from just having more units?

---

## 19. Recommended Next Numbers to Lock

1. Exact banner casualty curve.
2. Exact siege pressure thresholds.
3. Exact production by settlement type.
4. Exact route toll curves.
5. Exact claim contest and decay rules.
6. Exact NPC market pricing.
7. Exact upkeep by force size.
8. Exact reinforcement and repair costs.

---

## 20. Locked Numbers v1

These are the first concrete values for the remaining open tuning areas.

### 20.1 Banner Casualty Curve

Use a soft nonlinear casualty curve so battles are decisive without instantly deleting forces.

```text
casualtyRate = baseRate × pressureMultiplier × moraleMultiplier × supplyMultiplier × terrainMultiplier
```

Recommended values:
- `baseRate`: `0.08` per combat round for equal forces
- `pressureMultiplier`: `0.75–1.50`
- `moraleMultiplier`: `0.60–1.20`
- `supplyMultiplier`: `0.50–1.00`
- `terrainMultiplier`: `0.75–1.35`

Target outcomes per battle:
- Winning side in a clean engagement: `5%–15%` casualties
- Losing side in a clean engagement: `15%–35%` casualties
- Crushed side: `35%–60%` casualties
- Rout collapse: `60%+` casualties or forced withdrawal

### 20.2 Siege Pressure Thresholds

A siege should progress through clear stages.

```text
siegeState = buildup -> pressure -> breach -> collapse -> capture
```

Pressure thresholds:
- `0.0–0.99`: no meaningful siege effect
- `1.0–2.49`: light pressure
- `2.5–4.99`: active siege
- `5.0–7.49`: critical siege
- `7.5+`: collapse danger

Suggested daily pressure accumulation:
- Starvation: `0.5–2.0/day`
- Bombardment: `0.5–2.5/day`
- Sapping: `0.25–1.5/day`
- Isolation: `0.25–1.5/day`

### 20.3 Settlement Production by Type

These are baseline daily outputs before terrain and labor modifiers.

#### Farm
- Food: `30/day`
- Wood: `2/day`
- Stone: `0/day`
- Stability bonus: `+0.08`

#### Village
- Food: `15/day`
- Wood: `8/day`
- Stone: `2/day`
- Labor multiplier: `+0.15`

#### Town
- Food: `12/day`
- Wood: `6/day`
- Stone: `4/day`
- Trade throughput: `+0.20`
- Artisan output: `+0.30`

#### City
- Food: `20/day`
- Wood: `10/day`
- Stone: `8/day`
- Trade throughput: `+0.35`
- Labor multiplier: `+0.45`

#### Mine
- Stone: `12/day`
- Iron: `4/day`
- Food upkeep: `+4/day`

#### Workshop
- Tool output multiplier: `+0.30`
- Equipment output multiplier: `+0.20`

#### Market
- Trade throughput: `+0.35`
- NPC price efficiency: `+0.10`

#### Fort
- Garrison bonus: `+1.0`
- Supply storage bonus: `+7 days`

#### Castle
- Garrison bonus: `+2.0`
- Supply storage bonus: `+14 days`

### 20.4 Route Toll Curves

Tolls should be meaningful without deleting trade.

```text
tollRate = baseRate + centralityBonus + hostilityBonus
```

Suggested values:
- Minor road: `2%–4%`
- Normal trade route: `5%–8%`
- Major route: `8%–12%`
- Chokepoint bridge/gate: `12%–20%`
- Absolute choke under tension: `20%–25%`

Cap rule:
- Total toll burden on a single trip should not exceed `30%` unless the route is under active siege or blockade.

### 20.5 Claim Contest and Decay Rules

#### Claim Contest
- New claim contest window: `5 minutes`
- Nearby hostile pressure to contest successfully: `1.25x` minimum local claim strength
- Nearby friendly support to stabilize: `+0.10 claimStrength per active support action`

#### Decay
- Active claim decay: `0.002/day`
- Lightly supported claim decay: `0.005/day`
- Neglected claim decay: `0.010/day`
- Isolated outpost decay: `0.030/day`

#### Retention
- Safe claim retention period with no active support: `7 days`
- Strong risk period: `7–21 days`
- Likely loss period: `21+ days`

### 20.6 NPC Market Pricing

NPC market should stabilize, not dominate.

Reference price formula:

```text
marketPrice = basePrice × scarcity × distance × stability
```

Suggested base price bands:
- Food: `1.0`
- Wood: `2.0`
- Stone: `2.5`
- Iron: `5.0`
- Salt: `4.0`
- Cloth/wool: `4.0`
- Horse: `25.0`
- Gold: `50.0`

Multiplier rules:
- Common goods: `0.8x–1.5x`
- Regional goods: `0.9x–1.9x`
- Rare goods: `1.2x–2.5x`

Fallback rules:
- NPC market should satisfy at most `40%` of total late-game trade demand.
- Player trade should satisfy at least `60%` of healthy regional trade.

### 20.7 Upkeep by Force Size

Per banner per world day:
- Food: `30`
- Supply wear value: `1`
- Horse support if mounted: `+0.5`

Per company per world day:
- Administrative overhead: `5 food`
- Logistics overhead: `2 supply units`

Per army per world day:
- Coordination overhead: `10 food`
- Route overhead: `5 supply units`

Pressure targets:
- 1 banner: easy local upkeep
- 4 banners: manageable with one strong holding
- 12 banners: requires dedicated supply chain
- 20+ banners: requires strong route control or major base

### 20.8 Reinforcement and Repair Costs

#### Reinforcement
- Small reinforcement: `+0.10 claimStrength`, cost `wood 10`, `labor 3`
- Standard reinforcement: `+0.25 claimStrength`, cost `wood 25`, `stone 10`, `labor 6`
- Major reinforcement: `+0.50 claimStrength`, cost `wood 50`, `stone 25`, `iron 5`, `labor 12`

#### Repair
- Minor repair: restore `10%` integrity, cost `25%` of build cost
- Standard repair: restore `25%` integrity, cost `40%` of build cost
- Heavy repair: restore `50%` integrity, cost `65%` of build cost
- Rebuild threshold: if damage exceeds `75%`, rebuild may be cheaper than repair

### 20.9 Transport Detection Radius

Transport visibility should scale with terrain and scouting.

Recommended base visual radius:
- Foot transport: `150 meters`
- Caravan: `250 meters`
- Small escort: `300 meters`
- Large convoy: `400 meters`
- Army column: `600 meters`

Modifier rules:
- Scouts extend detection by `+25%`
- Bad weather or terrain reduces by `-25%`
- Enemy-controlled chokepoint increases local detection by `+20%`

### 20.10 V1 Tuning Note

These values are intentionally conservative v1 targets.

If playtests show one strategy dominating, adjust the smallest relevant number first:
- supply
- upkeep
- travel time
- toll pressure
- siege pressure
- territory decay

---

## Final Note

This sheet is intentionally numeric, not aspirational.

If the game is ever hard to tune, come back here and adjust numbers before adjusting philosophy.
