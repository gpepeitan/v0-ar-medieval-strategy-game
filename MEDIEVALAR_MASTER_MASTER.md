# MedievalAR Master-Master Playbook

This is the operational brain for the MedievalAR repo.

Use this document when you need to understand:
- what the game is
- what the project is trying to become
- how AIs should work together
- what rules are fixed
- what should be tuned next
- what not to break

If this document conflicts with a narrow balance draft, the master balance docs still control the numbers.
If this document conflicts with code, the docs win unless the code change is explicitly intentional and documented.

---

## 1. What MedievalAR Is

MedievalAR is a persistent medieval strategy game built for real-world public-access geography.
It is not a fantasy game.
It is not a reset-based survival game.
It is not a settlement-tier city builder.
It is a long-term logistics, territory, trade, military, and dynasty game.

### Core fantasy

Players should feel like they are building real power from:
- land
- labor
- food
- routes
- commanders
- armies
- forts
- castles
- trade
- timing
- geography

### Core pillars

1. **Persistent world**
   - No reset.
   - No final win screen.
   - Old power can decline.
   - New power can rise.

2. **Real geography matters**
   - Roads, rivers, bridges, chokepoints, hills, and access matter.
   - Public-access land is the map.

3. **Supply matters**
   - Armies, sieges, and settlements need support.
   - Raw numbers alone should never be enough.

4. **Morale matters**
   - Battles, sieges, and retreats depend on human stress, not just stats.

5. **Many viable strategies**
   - No single best path.
   - Every strong strategy should have a weakness.

6. **Depth over simplicity**
   - Separate structure upgrades.
   - Multiple unit types.
   - Multiple economic roles.
   - Multiple counters.

7. **Anti-exploit by design**
   - The game should assume players will optimize hard.
   - If something can be abused, it probably will be.

---

## 2. Source of Truth Hierarchy

When working in this repo, use this order:

1. `GAMEPLAY_BALANCE_MASTER.md`
   - canonical gameplay, economy, combat, faction, fairness, and tuning reference

2. Supporting balance docs
   - numeric sheet
   - unit roster and morale pass
   - combat / army / siege pass
   - economy deep pass
   - exploit and fairness pass
   - playtest matrix

3. This master-master playbook
   - explains how AIs should use the repo and what to do next

4. Code
   - implementation should follow the docs unless a deliberate change is documented

5. Temporary discussion
   - never treat chat memory as source of truth unless it is written into docs

---

## 3. Collaboration Model

This repo is intended for shared work between multiple AIs and the human owner.

Known collaborators include:
- Codex
- Zo
- Echo
- Claude

### Collaboration rule

Every AI should be able to continue the work of another AI without guessing.
That means:
- docs must be explicit
- balance values must be centralized
- changes should be incremental
- important decisions should be recorded
- breadcrumbs should be left in the repo

### What the human owner must provide

If a collaborator needs GitHub access, the human owner must provide:
- the GitHub username or GitHub App name
- repo access / invite
- any org membership needed
- any branch or PR workflow preference

If exact GitHub identities are unknown, do not invent them.

### Preferred collaboration pattern

- One AI writes or updates docs.
- Another AI can implement or verify.
- Another AI can review for balance or exploit risk.
- Humans keep ownership of final approval.

### Good repo behavior for AIs

- Read before editing.
- Prefer additive edits.
- Keep files organized.
- Avoid giant unstructured rewrites unless requested.
- When changing a rule, update the relevant doc first.
- When a rule has numbers, keep the numeric sheet in sync.
- When a rule affects systems, update the relevant supporting pass.

---

## 4. What the AI Should Know About the Game

### World and territory

- Public-access land only.
- Private property is excluded.
- Territory is valuable because it controls access, visibility, support, production, and routes.
- Territory weakens if neglected.
- Bigger holdings create more upkeep and more exposure.

### Claims and new players

- New players must be able to start in dense cities.
- Veterans should be able to contest land, but not erase the future of new players.
- Dense cities should have multiple claimable public-access nodes.
- Land should change hands over time.
- No one should permanently lock down an entire city just by being first.

### Information and fog of war

- The world map is visible.
- Claims are visible.
- Cities and economic production are visible.
- Military units, forts, castles, and military-only structures are hidden or partially hidden unless scouted or locally observed.
- Scouting should reveal gradually, not all at once.
- Deception and ambush must remain possible.

### Castles

Castles are not production hubs.
They are smaller than cities.
They are self-sufficient enough to hold in a siege.
They are meant to protect an area, anchor defense, and store reserves.
They are not meant to replace cities or become industrial centers.

### Economy

- Local production first.
- Trade second.
- Transport creates value and cost.
- No automatic spoilage.
- No global settlement tier.
- Structures upgrade individually.
- A strong economy must support building, upgrading, training, trade, reserves, and military upkeep.

### Military

- Multiple unit types exist.
- Mixed armies should usually outperform spammed armies.
- One unit type should never dominate everywhere.
- Morale, supply, terrain, and command quality matter.
- Factions bias composition, but do not force it.

### Combat and sieges

- Combat should be readable.
- Siege should be slow, strategic, and breakable.
- Relief forces should matter.
- Assault should be risky.
- Forts should not be immortal shells.

### Exploits

- The game must be designed around likely abuse.
- Alt abuse, route sniping, blob dominance, tower spam, market abuse, and AFK growth should all have counterdesign.
- If a tactic is too efficient, players will find it.

---

## 5. What AIs Should Do First

When an AI starts work in this repo, it should:

1. Read this playbook.
2. Read `GAMEPLAY_BALANCE_MASTER.md`.
3. Read the supporting doc for the area it is touching.
4. Identify the player problem being solved.
5. Identify exploit risk.
6. Identify the counterplay.
7. Update the doc first if the change affects design.
8. Then update code only if requested or needed.

### If the change is about numbers

Update:
- `GAMEPLAY_BALANCE_MASTER.md`
- `GAMEPLAY_BALANCE_NUMERIC_SHEET.md`
- the relevant deep pass doc

### If the change is about economy

Update:
- master balance doc
- economy deep pass
- numeric sheet if values changed

### If the change is about military, morale, or armies

Update:
- master balance doc
- unit roster and morale pass
- combat / army / siege pass
- numeric sheet if values changed

### If the change is about exploit risk

Update:
- master balance doc
- exploit and fairness pass
- playtest matrix if the behavior should be tested

### If the change is about collaboration or repo process

Update:
- this playbook
- `AGENTS.md`
- `GITHUB_COLLABORATION_BRIEF.md`

---

## 6. Game Rules That Should Stay Stable

These are the important invariants.

### Fixed rules

- Persistent world
- No final win screen
- Public-access land only
- No global settlement tier
- No automatic spoilage
- Structures upgrade individually
- Supply matters
- Morale matters
- Geography matters
- Mixed armies matter
- Faction identity matters but does not lock players in
- New players must have a path in dense cities
- Castles are defensive anchors, not production engines
- Exploits should be designed against, not merely punished after the fact

### Soft rules that can still be tuned

- exact claim radius handling
- exact reserve pressure numbers
- exact market spreads
- exact military upkeep numbers
- exact siege durations
- exact visibility radius and intel decay
- exact faction modifiers
- exact structure upgrade curves

---

## 7. What “Good Work” Looks Like Here

A change is good if it:
- is understandable
- is balanced
- has counterplay
- does not flatten the game
- does not create a new obvious best strategy
- does not destroy new-player viability
- does not make veterans untouchable
- does not make the map unreadable
- does not make production or combat trivial

### In practice

If a feature is strong, it should also be:
- costly
- visible
- contestable
- maintainable
- and vulnerable in some way

---

## 8. Recommended Implementation Order

If building the game from scratch or continuing work, the safest order is:

1. world state and persistence
2. claims and territory
3. route graph and transport
4. economy and production
5. structure upgrades
6. unit roster and morale
7. combat and sieges
8. faction modifiers
9. anti-exploit hardening
10. telemetry and tuning

This order minimizes the chance of rebuilding systems twice.

---

## 9. AI Writing Style for This Repo

When writing docs or code notes:
- be explicit
- be organized
- use clear headings
- avoid vague language
- avoid repeated fluff
- note tradeoffs
- note counterplay
- note what is not allowed
- note what must be tested

When unsure:
- do not invent hidden rules
- add an open question
- or make the smallest safe assumption and document it

---

## 10. GitHub Shared-Work Expectations

This repo is intended to support collaboration between multiple AIs working through GitHub.

### Recommended workflow

- Keep the master docs in the repo root.
- Use supporting docs for detail.
- Use branches or PRs for changes if the workflow supports it.
- Make each change traceable.
- Leave clear commit / PR descriptions.

### Human-owned details required for sharing

The human owner must provide:
- GitHub usernames or GitHub App names for collaborators
- repo permissions
- invite or installation access
- any branch rules or PR preferences

### When another AI picks up the repo

It should be able to answer:
- What is this game?
- What are the fixed rules?
- What can still be tuned?
- What should be built next?
- What must not be broken?
- Where are the canonical docs?

If it cannot answer those quickly, the docs are not ready enough.

---

## 11. Final Operating Rule

The repo should always make the next AI smarter than the last one.

If a change helps the game but makes the project harder for another AI to understand, the change is incomplete.

If the docs are clear, the code can follow.
If the docs are unclear, pause and fix the docs first.
