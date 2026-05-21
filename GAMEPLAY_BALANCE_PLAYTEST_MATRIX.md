# MedievalAR Balance Playtest Matrix

This document is not a design spec.

It is a verification tool.

Its purpose is to answer a different question than the numeric sheet:

**If we use the numbers we chose, what should happen in real play?**

If a feature passes the matrix here, it is probably balanced enough to ship into broader testing.

---

## 1. How to Use This Matrix

For each test case, check:

- setup
- expected outcome
- failure signal
- tuning direction

A test passes when the result is:

- understandable,
- counterable,
- not dominant,
- not trivial,
- and not punishing recovery beyond reason.

---

## 2. Balance Success Criteria

A good system should usually satisfy all of these:

1. A stronger position should feel stronger.
2. A weaker position should still have a plan.
3. Big advantages should cost something.
4. Small advantages should matter if used well.
5. No single tactic should work everywhere.
6. Supply, morale, terrain, and scouting should matter together.
7. Losing should be recoverable.
8. Winning should create opportunity, not automatic certainty.

---

## 3. Opening Game Tests

### 3.1 Solo Opening Stability

**Setup**
- One player
- Starter resources only
- One territory
- One commander
- One starter route
- No outside pressure for 3 world days

**Expected outcome**
- Player survives without immediate resource collapse
- Player can understand core loops
- Player can support basic consumption if they make at least one productive choice

**Pass condition**
- The player has enough time to learn, but not enough slack to ignore all systems

**Fail signals**
- They run out of food before meaningful interaction
- They never feel any pressure
- They can ignore economy and still progress efficiently

**Tuning direction**
- If too easy: raise consumption or maintenance pressure
- If too hard: increase starter output or reserve buffer

---

### 3.2 First Expansion Choice

**Setup**
- One player with one usable second territory nearby
- Both territories are publicly valid
- One is slightly better for economy, one for defense

**Expected outcome**
- The player must choose between growth and safety
- The better territory should not always be the obvious pick

**Pass condition**
- Either choice has a valid strategic reason

**Fail signals**
- One option is obviously superior in every situation
- The player can expand with no meaningful tradeoff

---

### 3.3 Early Pressure Window

**Setup**
- A fresh player is lightly contested after day 3 to day 5

**Expected outcome**
- They can survive if prepared
- They can lose if careless
- They can retreat or negotiate if overwhelmed

**Pass condition**
- Early play feels vulnerable, not hopeless

**Fail signals**
- New players are wiped before they understand the game
- Early defense is impossible

---

## 4. Territory and Claim Tests

### 4.1 Claim Contest Test

**Setup**
- Two players contest the same public-access area
- One has local support, the other has stronger raw resources

**Expected outcome**
- Local support should matter
- Raw strength alone should not guarantee permanent control

**Pass condition**
- The better-supported player can hold or retake the area

**Fail signals**
- The strongest stockpile automatically wins every contest
- Paper ownership beats geography and presence too hard

---

### 4.2 Territory Decay Test

**Setup**
- A claimed outpost is left unsupported for 14 world days

**Expected outcome**
- Control weakens visibly
- A simple holding should deteriorate faster than a fortified one

**Pass condition**
- The outpost becomes vulnerable before becoming irrelevant
- It is still possible to recover if support returns in time

**Fail signals**
- Decay is so slow that neglect never matters
- Decay is so fast that no one can hold remote land at all

---

### 4.3 Chokepoint Value Test

**Setup**
- One route segment is a bridge or gate
- One route segment is open land

**Expected outcome**
- The chokepoint should matter more than the open segment
- Control of the chokepoint should create toll or interception value

**Pass condition**
- Players can create a strategic difference by holding the chokepoint

**Fail signals**
- Geography does not matter
- Every segment is functionally the same

---

## 5. Economy and Production Tests

### 5.1 Starter Economy Viability

**Setup**
- Starter population and starter stockpile
- No extra trade
- Mild growth pressure

**Expected outcome**
- The player must start producing or trading within a few days
- Food should be the first major pressure

**Pass condition**
- The player is pushed into action without being hard-stopped

**Fail signals**
- Starter reserves last too long with no meaningful decision-making
- Starter reserves vanish before the player can do anything useful

---

### 5.2 Resource Specialization Test

**Setup**
- One settlement is clearly better at food
- One settlement is clearly better at stone or iron

**Expected outcome**
- Players should want to specialize, not homogenize everything

**Pass condition**
- Different settlement types create different strategic roles

**Fail signals**
- One generic settlement type does everything equally well
- The same build is optimal everywhere

---

### 5.3 Stockpile Pressure Test

**Setup**
- A mid-game player with 7 to 14 days of reserves

**Expected outcome**
- They feel stable but still have reasons to care about routes and production

**Pass condition**
- Stockpiles provide safety without eliminating logistics gameplay

**Fail signals**
- Reserve pressure never matters
- Reserve pressure is so severe that every mistake is fatal

---

## 6. Labor and Population Tests

### 6.1 Labor Allocation Choice

**Setup**
- The player has a population mix that can be assigned toward food, trade, or military support

**Expected outcome**
- More labor in one area should create a visible opportunity cost elsewhere

**Pass condition**
- The best allocation depends on strategy and context

**Fail signals**
- One labor split is always superior
- Population is just an abstract number with no meaningful choices

---

### 6.2 Population Morale Stress

**Setup**
- Settlement under raid pressure, low food, or disrupted routes

**Expected outcome**
- Loyalty and health should decline if the player ignores the settlement
- Recovery should be possible with food and safety

**Pass condition**
- Population can break, but also recover

**Fail signals**
- Population never responds to pressure
- Population collapses permanently from one bad event

---

## 7. Unit Composition Tests

### 7.1 Infantry Spam Test

**Setup**
- Army uses almost all one infantry subtype
- Opponent uses a mixed force

**Expected outcome**
- The spammed army should have a niche advantage somewhere
- The mixed army should have more overall resilience and answer options

**Pass condition**
- Single-type spam is viable but easier to counter

**Fail signals**
- One infantry subtype dominates every matchup
- Mixed armies feel strictly worse in all cases

---

### 7.2 Cavalry Punish Test

**Setup**
- Fast cavalry force meets slower mixed force in open terrain

**Expected outcome**
- Cavalry should punish exposed units and weak scouting
- Cavalry should suffer against prepared spear blocks, rough terrain, and supply denial

**Pass condition**
- Cavalry is terrifying in the right place, not everywhere

**Fail signals**
- Cavalry always wins by speed alone
- Cavalry is never worth building

---

### 7.3 Ranged Support Test

**Setup**
- An army with ranged support backs a frontline

**Expected outcome**
- Ranged units should improve battle shape, not replace frontline troops

**Pass condition**
- Ranged power is meaningful but needs protection

**Fail signals**
- Ranged units decide battles without risk
- Ranged units are too weak to justify their cost

---

### 7.4 Siege Unit Purpose Test

**Setup**
- Siege units attack a fort or castle

**Expected outcome**
- Siege units should be powerful against structures and weak in direct field fighting

**Pass condition**
- Siege is a specialized investment, not a general-purpose combat tool

**Fail signals**
- Siege units are efficient in all combat types
- Siege units are never worth the logistical cost

---

### 7.5 Support Unit Value Test

**Setup**
- Army includes support banners instead of adding more frontline

**Expected outcome**
- Support should improve sustain, morale, repair, or logistics enough to matter

**Pass condition**
- Support units create composition depth

**Fail signals**
- Support is ignored because more damage is always better
- Support is so strong that combat becomes passive

---

## 8. Morale Tests

### 8.1 Morale as a Force Multiplier

**Setup**
- Two equal armies
- One starts high morale, one starts wavering

**Expected outcome**
- The high-morale side should win more often or win more cleanly
- The low-morale side should still be capable of a comeback if conditions change

**Pass condition**
- Morale influences outcome without becoming magical

**Fail signals**
- Morale does nothing
- Morale overpowers supply, terrain, and command entirely

---

### 8.2 Morale Collapse Test

**Setup**
- Army loses a major skirmish, then gets cut off from supply

**Expected outcome**
- The army should deteriorate faster
- Retreat should become rational
- A collapse should be possible but not automatic

**Pass condition**
- Morale creates tension and momentum shifts

**Fail signals**
- Armies never break
- Armies break instantly from one event

---

### 8.3 Presence Morale Test

**Setup**
- Player physically present in a battle zone

**Expected outcome**
- Nearby units should gain a noticeable but bounded morale bonus
- Presence should matter more in critical moments than in clean stomps

**Pass condition**
- Presence is valuable without being mandatory for every fight

**Fail signals**
- Presence is irrelevant
- Presence makes every nearby fight unwinnable for the other side

---

## 9. Supply and Attrition Tests

### 9.1 Short Supply Test

**Setup**
- Field force with 2 days of supply

**Expected outcome**
- It should still fight, but worse
- It should want a quick result or retreat

**Pass condition**
- Supply pressure creates urgency

**Fail signals**
- Low supply barely changes anything
- Low supply is an instant death sentence

---

### 9.2 Long Campaign Test

**Setup**
- Army operates far from base for 14+ days

**Expected outcome**
- The army should need convoys, staging, or local support

**Pass condition**
- Long-range power requires infrastructure

**Fail signals**
- Distance does not matter
- Distance matters so much that expansion becomes impossible

---

## 10. Siege Tests

### 10.1 Fort Siege Test

**Setup**
- Standard fort under siege with moderate supply and repair

**Expected outcome**
- Siege lasts multiple days
- Relief can matter
- The defender has real but costly options

**Pass condition**
- Siege is a strategic operation, not a button press

**Fail signals**
- Forts fall immediately
- Forts are effectively unbreakable

---

### 10.2 Castle Siege Test

**Setup**
- Castle with strong walls, supply, and nearby support

**Expected outcome**
- Castle sieges should be slower than fort sieges
- Assault should be expensive and often wrong unless conditions are favorable

**Pass condition**
- Large defensive investments are meaningful but not permanent

**Fail signals**
- Castles are just bigger forts with no different decision space

---

### 10.3 Relief Race Test

**Setup**
- Siege begins while a relief force is en route

**Expected outcome**
- Timing should matter
- A late relief force should still be able to change the outcome if strong enough

**Pass condition**
- Siege is a race of logistics and timing

**Fail signals**
- Relief never matters
- Relief always breaks the siege regardless of conditions

---

## 11. Trade and Toll Tests

### 11.1 Toll Pressure Test

**Setup**
- One route has a toll gate
- Another route is longer but free

**Expected outcome**
- Players should choose based on time, cost, safety, and trust

**Pass condition**
- Tolls create strategy, not annoyance

**Fail signals**
- Everyone always avoids tolls
- Everyone always uses tolls because the fee is trivial

---

### 11.2 NPC Market Fallback Test

**Setup**
- Player trade is thin or absent

**Expected outcome**
- NPC market prevents collapse
- NPC market does not become the best long-term solution

**Pass condition**
- The fallback helps, but player trade remains the target

**Fail signals**
- NPC market replaces the economy
- NPC market is too weak to stabilize the world

---

## 12. Faction Tests

### 12.1 Identity Test

Each faction must feel different.

**Expected outcome**
- Frankish: direct power and siege strength
- Mongol: mobility and raiding
- Abbasid: logistics and economy
- Byzantine: defense and intelligence
- Khazar: chokepoints and tolls

**Pass condition**
- Factions are clearly distinct but still compatible with the same core rules

**Fail signals**
- Factions are cosmetic only
- One faction is best in every stage

---

### 12.2 Counterplay Test

**Setup**
- Each faction’s best strategy is pushed against its counter

**Expected outcome**
- Every faction should have a bad matchup and a way to respond

**Pass condition**
- No faction is statically dominant

**Fail signals**
- One faction dominates open field, defense, trade, and siege all at once

---

## 13. Solo vs Group Tests

### 13.1 Solo Agility Test

**Setup**
- One solo player against a larger but slower group

**Expected outcome**
- The solo player should be able to exploit timing, route knowledge, and focused defense

**Pass condition**
- Solo play is viable through precision and responsiveness

**Fail signals**
- Solo play is impossible against organized groups

---

### 13.2 Group Coordination Cost Test

**Setup**
- Large alliance with many holdings

**Expected outcome**
- The alliance should have power, but also bureaucracy, logistics overhead, and vulnerability to disruption

**Pass condition**
- More players helps, but does not erase problems

**Fail signals**
- Large groups are always better in every metric

---

## 14. Recovery Tests

### 14.1 Comeback Path Test

**Setup**
- Player loses a territory, a commander, or a trade route

**Expected outcome**
- The player should still have a smaller safe base and a way to rebuild

**Pass condition**
- Losing hurts, but does not end the run

**Fail signals**
- One loss creates irreversible death spiral

---

### 14.2 Partial Failure Test

**Setup**
- Player survives but loses major advantages

**Expected outcome**
- They can downshift to defense, trade, or mobility and recover over time

**Pass condition**
- The game remains interesting after defeat

**Fail signals**
- Defeat is either meaningless or permanent

---

## 15. Practical Balance Watchlist

If these appear, the system needs tuning:

- One infantry subtype becomes the only choice
- Cavalry dominates every battle regardless of terrain
- Morale is ignored except during collapse
- Supply matters only in sieges
- Forts are either too weak or impossible to crack
- Tolls are either irrelevant or oppressive
- NPC market becomes the main economy
- Solo players cannot recover
- Large groups become unbeatable
- Geography stops mattering

---

## 16. Next Things to Test

When this matrix is passing, the next valuable tests are:

1. exact unit upgrade economics
2. exact production chain efficiency
3. exact claim density and spacing rules
4. exact route visibility and scouting rules
5. exact damage-to-morale conversion
6. exact siege repair timing
7. exact faction-by-faction matchup tables

---

## Final Rule

If the game can be played in multiple ways and each way has a weakness, the balance is probably healthy.

If there is one best way to play, keep tuning.
