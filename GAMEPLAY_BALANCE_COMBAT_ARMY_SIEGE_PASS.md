# MedievalAR Combat, Army, and Siege Tuning Pass

This is the next balance layer for MedievalAR.

It locks a concise numeric pass for combat, armies, and sieges so implementation stays legible and compatible with the existing gameplay spec and numeric sheet.

Use this as the preferred reference when tuning battle resolution, army readiness, and siege pressure.

---

## 1. Scope and Intent

This pass is built around four goals:

1. Battles should be decided by supply, morale, positioning, and command.
2. Armies should be powerful but fragile without logistics.
3. Sieges should be slower than field battles and strongly exposed to relief.
4. A smaller force should still have real counterplay through terrain, scouting, and disruption.

---

## 2. Locked Military Scale

Keep the existing scale from the numeric sheet.

- `1 banner = 25 soldiers` nominal
- `1 company = 4 banners = 100 soldiers` nominal
- `1 army = 4 companies = 400 soldiers` nominal

### Practical Range

- Banner: `20–30 soldiers` typical, `1–40` allowed
- Company: `80–120 soldiers` typical, `75–200` allowed
- Army: `320–480 soldiers` typical, `200–800` allowed

### Strategic Targets

- Solo player force: `1–3 banners`
- Small group force: `4–12 banners`
- Mid-tier force: `13–32 banners`
- Regional power: `33+ banners`

---

## 3. Army Readiness Lock

Use the existing readiness formula.

```text
readiness = average(commandQuality, morale, cohesion, supplyFactor)
```

### Readiness Bands

- `0.80–1.00`: elite
- `0.65–0.79`: combat-ready
- `0.40–0.64`: strained
- `<0.40`: broken

### Suggested Component Targets

- `commandQuality`: `0.55–0.90` common, `0.95+` exceptional
- `morale`: `0.50–1.00`
- `cohesion`: `0.45–1.00`
- `supplyFactor = clamp01(supplyDays / 7)`

### Supply Bands

- `7+ days`: fully supplied
- `3–7 days`: normal field force
- `1–3 days`: pressured
- `<1 day`: critical

### Daily Loss Targets

- Supply burn: `0.5–1.5 days/day`
- Morale decay: `0.01–0.05/day`
- Cohesion decay: `0.005–0.02/day`

### Army Pressure Threshold

A force should start feeling materially weaker at `below 3 days` of supply and become unstable at `below 1 day`.

---

## 4. Combat Power Lock

Use the existing effective power formula.

```text
effectivePower = troopCount × bannerQuality × moraleFactor × cohesionFactor × supplyFactor × commanderFactor × terrainFactor × factionFactor
```

### Recommended Multipliers

- `bannerQuality`: `0.85–1.15`
- `moraleFactor`: `0.60–1.15`
- `cohesionFactor`: `0.60–1.10`
- `supplyFactor`: `0.00–1.00`
- `commanderFactor`: `0.80–1.25`
- `terrainFactor`: `0.75–1.35`
- `factionFactor`: `0.90–1.25`

### Target Effective Power Bands

For a force at nominal banner strength:

- Poorly supplied, disordered force: `0.25–0.55` of nominal power
- Average field force: `0.70–1.05` of nominal power
- Strong elite force: `1.10–1.60` of nominal power

### Combat Readability Rule

A player should generally be able to infer battle advantage from:

- supply state
- visible commander quality
- terrain
- scouting information
- relative force size

Combat should not rely on hidden randomness as the main driver.

---

## 5. Battle Outcome Curve

Use a smooth power-ratio curve.

```text
a = attackerPower
d = defenderPower
attackShare = a / (a + d)
defenseShare = d / (a + d)
```

### Recommended Outcome Bands

- `attackShare < 0.40`: attacker should usually lose or retreat
- `0.40–0.49`: attacker is disadvantaged but can trade
- `0.50–0.59`: roughly even fight
- `0.60–0.69`: attacker advantage
- `>= 0.70`: decisive attacker advantage

### Casualty Target Bands

#### Winning side
- Clean victory: `5%–15%` losses
- Hard victory: `15%–25%` losses

#### Losing side
- Controlled retreat: `15%–30%` losses
- Defeat: `30%–55%` losses
- Rout or collapse: `55%+` losses

### Retreat Trigger

Retreat should become likely when any two of these are true:

- power ratio below `0.75`
- morale below `0.45`
- supply below `2 days`
- losses above `25%`
- commander quality disadvantage of `0.10+`

---

## 6. Commander Effect Lock

Keep command bonuses meaningful but bounded.

### Commander Factor

```text
commanderFactor = 1.0 + commanderBonus
```

### Suggested Commander Bonus Range

- Poor commander: `-0.10` to `0.00`
- Average commander: `0.00` to `+0.08`
- Strong commander: `+0.09` to `+0.18`
- Exceptional commander: `+0.19` to `+0.25`

### Role Emphasis Targets

- Field commander: tactics + leadership
- Logistics commander: logistics + leadership
- Defensive marshal: leadership + infantry
- Siege commander: siege + tactics
- Cavalry leader: cavalry + tactics

### Commander Scarcity Target

- Minor competent commanders: common
- Very strong commanders: uncommon
- Exceptional commanders: rare but not unique

A good commander should be worth preserving, but not so rare that losing one ends a playthrough.

---

## 7. Terrain and Positioning Lock

Terrain should matter, but not dominate.

### Terrain Factor Bands

- Open ground: `1.00`
- Favorable terrain: `1.05–1.15`
- Strong favorable terrain: `1.16–1.25`
- Bad terrain: `0.85–0.95`
- Severe bad terrain: `0.75–0.84`

### Suggested Terrain Values

- Roads / open plains: `1.00`
- Woods: `0.90–1.05`
- Hills: `1.05–1.15`
- River crossing without bridge: `0.80–0.90`
- Chokepoint: defender `1.10–1.25`, attacker `0.80–0.95`
- Fortified gate or wall approach: attacker `0.75–0.90`

### Positioning Rule

A force that controls a chokepoint, bridge, gate, or narrow route should be able to force a bad fight or deny it entirely.

---

## 8. Morale and Cohesion Lock

### Morale Bands

- `0.80–1.00`: high morale
- `0.60–0.79`: stable
- `0.40–0.59`: wavering
- `<0.40`: brittle

### Cohesion Bands

- `0.80–1.00`: tight formation
- `0.60–0.79`: acceptable
- `0.40–0.59`: loose
- `<0.40`: disorganized

### Morale Shock Events

Suggested morale shocks:

- Losing `10%+` of troops in a short window: `-0.05 to -0.12`
- Commander wounded or captured: `-0.08 to -0.15`
- Supply drops below `1 day`: `-0.10 to -0.20`
- Reinforcement arrives: `+0.05 to +0.10`
- Winning a skirmish: `+0.03 to +0.08`

### Cohesion Loss Events

- Forced march: `-0.03 to -0.08`
- Terrain disruption: `-0.05 to -0.12`
- Ambush: `-0.08 to -0.15`
- Siege pressure: `-0.03 to -0.10/day`

Morale should move faster than cohesion. Cohesion should recover more slowly than morale.

---

## 9. Field Battle Duration and Tempo

### Target Battle Length

- Small skirmish: `30 seconds–3 minutes`
- Medium engagement: `3–10 minutes`
- Major battle: `10–30 minutes`

### Suggested Tempo Targets

- Opening scouting / positioning: `20%–30%` of battle time
- Main exchange: `50%–60%`
- Collapse / retreat phase: `15%–25%`

### Casualty Pace

Average casualty pace should be slow enough for retreat and command response, but fast enough that fights resolve cleanly.

- Small engagement: `5%–10%` casualties per minute for the losing side
- Major engagement: `3%–8%` casualties per minute on average
- Rout phase: `10%+` casualties per minute briefly

---

## 10. Supply and Attrition Lock

### Field Supply Days

- Light raiding force: `3–5 days`
- Standard field force: `5–7 days`
- Siege force: `7–14 days`
- Long campaign force: `14+ days` with a base or convoy network

### Supply Rule

A force should not fight at full effectiveness if it cannot support itself.

Suggested supply effects:

- `7+ days`: `1.00x` supplyFactor
- `3–6 days`: `0.80–0.95x`
- `1–2 days`: `0.50–0.75x`
- `<1 day`: `0.00–0.40x`

### Attrition Targets

- Marching with poor supply: `0.5%–1.5%` daily attrition equivalent
- Fighting while undersupplied: `1%–3%` additional effective loss pressure/day
- Prolonged siege without supply: `2%–5%` daily degradation pressure/day

Attrition should be visible but not instantly fatal.

---

## 11. Siege Pressure Lock

Use the existing siege pressure structure.

```text
siegePressure = bombardment + starvation + sapping + isolation
```

### Pressure by Source

- Bombardment: `0.5–2.5 pressure/day`
- Starvation: `0.5–2.0 pressure/day`
- Sapping: `0.25–1.5 pressure/day`
- Isolation: `0.25–1.5 pressure/day`

### Total Pressure Target

- Weak siege: `1–3 pressure/day`
- Standard siege: `3–5 pressure/day`
- Hard siege: `5–8 pressure/day`

### Suggested Siege Duration

- Outpost: `1–2 days`
- Fort: `3–7 days`
- Castle: `7–21 days`
- Major fortified city: `14+ days`

### Defender Repair Capacity Per Day

- Wood: `5–20`
- Stone: `2–10`
- Labor: `5–20`
- Morale cost: `0.05–0.20`

### Relief Force Rule

A relief force should be decisive if it can do at least one of these:

- bring `25%+` more effective power than the siege line
- restore supply above the `3 day` threshold
- force a mobility advantage at the siege perimeter

### Assault Rule

Assault should be the highest-risk option and should be attractive mainly when:

- breach exists
- defender morale is low
- relief is blocked
- the siege target is isolated

---

## 12. Faction Combat Modifiers

Use narrow faction bands so combat remains readable.

### Recommended Combat-Facing Modifiers

#### Frankish Kingdom
- Cavalry: `1.20`
- Siege: `1.15`
- Defense: `1.10`
- Mobility: `0.95`

#### Mongol Khanate
- Cavalry: `1.20`
- Mobility: `1.20`
- Scouting: `1.10`
- Siege: `0.90`
- Defense: `0.90`

#### Abbasid Caliphate
- Logistics: `1.15`
- Trade support: `1.10`
- Siege endurance: `1.05`
- Direct shock combat: `0.95`

#### Byzantine Empire
- Defense: `1.15`
- Scouting: `1.15`
- Siege resilience: `1.10`
- Expansion speed: `0.95`

#### Khazar Khaganate
- Toll control: `1.10`
- Mixed-force flexibility: `1.05`
- Static defense: `0.95`
- Siege pressure: `0.95`

### Faction Cap Rule

No combat modifier should exceed `1.25` or fall below `0.90` in this pass unless a later system explicitly needs stronger asymmetry.

---

## 13. Quick Calibration Targets

If the battle model is working, these should hold:

- A force with `2x` effective power should usually win, but not always without losses.
- A force with `1.25x` effective power should win, but may need to retreat if terrain is bad.
- A force below `0.75x` effective power should rarely choose a straight fight.
- A siege without relief should feel dangerous after `3–7 days` depending on fortification.
- A force below `3 days` of supply should visibly deteriorate.

---

## 14. Tuning Guardrails

Do not break these rules while tuning combat, armies, or sieges:

- no binary combat
- no instant city capture
- no invincible commander bonuses
- no army that ignores supply
- no terrain bonus above `1.35x`
- no faction combat bonus above `1.25x`
- no retreat-less defeat loop
- no siege that is faster than an ordinary battle by default
- no single stat that dominates power on its own

---

## 15. Minimal Implementation Order

If these values need to be implemented later, use this order:

1. Read army supply and readiness.
2. Compute effective power.
3. Apply terrain and commander bonuses.
4. Resolve casualties and retreat.
5. Apply morale and cohesion loss.
6. Apply siege pressure and repair.
7. Add relief force checks.
8. Add faction modifiers last.

---

## Final Note

This pass is intentionally narrow.

It locks the next useful combat layer without overcomplicating the broader economy or territory model.
