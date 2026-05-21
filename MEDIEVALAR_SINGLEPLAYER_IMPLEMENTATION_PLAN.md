# MedievalAR Singleplayer Implementation Plan

This is the working plan for the repo now that the project has moved away from AR multiplayer and into a **singleplayer medieval strategy game with AI enemies**.

**Audience:** Replit, v0, Codex, Zo, and the human owner.

Use this document as the current source of truth for:
- what the game is now
- what is already built
- what is missing
- what must not be reintroduced
- the correct order to build the rest

If a future change makes the project harder for the next AI to understand, this doc should be updated before the code.

---

## 1. Game Direction

### Current direction

- Singleplayer only
- AI enemy houses / rival powers
- Persistent world state
- Medieval strategy and logistics
- Map-based placement and control
- Buildings, villagers, units, walls, and defenses visible on the map
- Player chooses where to start instead of being forced into Europe or any fixed region
- Small, local, contestable territory growth

### What the game is not anymore

- Not AR-first
- Not multiplayer-first
- Not a generic city builder
- Not a giant land-blob territory game
- Not a game where one action claims tens of miles
- Not a game where buildings and troops exist only as hidden stats
- Not a fixed-Europe start game

---

## 2. Core Product Goal

The game should feel like a **living medieval strategy world** where the player can:

- choose a starting region
- establish a foothold locally
- place buildings on the map
- see villagers and units as real map objects
- build defenses that are visible and meaningful
- control territory in small, strategic steps
- face AI enemies that expand, defend, raid, and compete

The world must be readable at both close and far zoom levels.

---

## 3. What Is Already Done

The codebase already has the beginning of the simulation foundation.

### Session and persistence

- game bootstrap
- persistent save/load foundation
- world-day advancement
- local player creation
- faction assignment
- starter resource pools
- starter territory seed
- starter route network
- starter commander support

### World and strategy systems

- faction catalog with asymmetric identities
- commander system and commander stats
- army / company / banner data structures
- territory system foundation
- route graph and route travel model
- population and livestock state
- settlement and structure state foundation
- game state serialization container

### AI groundwork

- enemy house state exists
- enemy house seeding exists in the session layer
- enemy turn advancement groundwork exists

### Collaboration groundwork

- master gameplay and balance docs exist
- collaboration guidance exists for multiple AIs working on the repo
- this plan doc exists as the practical implementation roadmap

---

## 4. What Must Be Built Next

The next work should focus on making the game **playable, visible, and spatially understandable**.

### A. Start location selection must be real

This is the highest-priority correction.

The player should choose where to begin.

#### Requirements

- choose continent / region / start zone
- support multiple valid spawn regions
- never hardcode Europe as the only default start
- make the choice affect the actual map context, not just a label
- keep replayability by making different starts feel different
- if the world uses real geography, treat it as a selectable start region system, not a forced location

#### Acceptance criteria

- the first playable screen includes a start picker or start map
- the player can pick among multiple valid regions
- the starting area changes nearby terrain / entities / access
- the game does not boot the player into a fixed Europe-centered start

### B. Territory claims must become local and granular

The current scale is too large.

Claims should feel like **streets, blocks, intersections, lots, and local clusters**, not giant blobs.

#### Requirements

- claims should be small and local
- territory growth should happen through adjacency and infrastructure
- claims should be contestable at the neighborhood scale
- no single claim action should cover a huge area
- large regions should emerge from many local placements
- claim footprints should match the visible map footprint of the related structure or control point

#### Practical rule

A claim should usually expand by **one nearby cell / node / block / street segment at a time**, not by a massive radius.

Special structures can project influence farther, but the actual owned footprint should remain local and readable.

#### Acceptance criteria

- a claim never feels like a 10s-of-miles land grab
- local control grows gradually from a real anchor point
- the player can understand why one street is controlled and the next is not

### C. All owned things must be visible on the map

The player should be able to **see their world**.

#### Requirements

- show buildings on the map
- show resource placement on the map
- show villagers and individual units on the map
- show defensive walls / fortifications visibly on the map
- show the relationship between buildings, resources, territory, and population
- make owned objects selectable or inspectable
- use zoom-level abstraction so the map stays readable

#### Visibility rule

Every important owned object should have:
- a stable ID
- a position
- an owner
- a type
- a state
- a visual representation

### D. Buildings must be placed on real map coordinates

Buildings are not just menu items.
They must exist in the world.

#### Requirements

- place farms, mills, workshops, defenses, and other structures on map coordinates
- structure placement should depend on terrain / node / site type
- structures should show ownership and function visually
- resource generation should be tied to location and infrastructure
- build placement should snap to valid local sites when needed
- the map should show what the building is connected to or producing from

#### Acceptance criteria

- if the player builds something, it appears on the map immediately
- the building is placed on a meaningful local site
- the player can inspect why that placement matters

### E. Villagers and units must be visible actors

The player wants to see villagers and units individually or in small readable groups.

#### Requirements

- villagers should be represented on the map or in a clear world layer
- units should appear as individual actors or grouped entities depending on zoom level
- units should be distinguishable from buildings and territory
- unit movement should be visible and understandable
- unit selection should be possible at the map level

#### Zoom rule

- close zoom: show individuals or small groups
- mid zoom: show squads / work groups / stacks
- far zoom: show counts, banners, or summarized markers

### F. Defenses must be obvious and spatial

Defensive works should not be hidden behind abstract stats.

#### Requirements

- walls, towers, gates, forts, and similar defenses should render on the map
- defense strength should be readable from the map layer
- defensive zones should visually match their strategic role
- fortification should be tied to placement and footprint
- players should understand where a defense actually protects

#### Acceptance criteria

- a wall is visibly a wall
- a tower is visibly a tower
- a defense line reads clearly at a glance
- the map shows what is protected and what is exposed

---

## 5. Map Rules That Must Stay True

These are the rules that should not drift.

- the player chooses where to start
- the map must not assume Europe as the only start
- claims should be small and local
- land control should grow gradually
- the world should be visible and readable
- buildings should be physically placed on the map
- villagers and units should be visible
- defenses should be visible
- the simulation should feel grounded and strategic
- AI enemies should create pressure, not just filler state
- the game should remain singleplayer-first

---

## 6. Suggested World Representation

The implementation will likely need explicit types for:

- start region / spawn selection
- map cell or map tile locations
- building instances with coordinates
- resource nodes with ownership and capacity
- villager and unit entities with positions
- structure visuals / map markers
- fine-grained claim cells or claim nodes
- defense objects with map geometry
- visibility / fog / reveal state

### Recommended structure for map data

Use a layered model:

1. **World layer** — large-scale regions and selected start areas
2. **Local layer** — claims, buildings, units, villagers, defenses, resource sites
3. **Zoomed layer** — individual actors and detailed placement

This prevents the map from becoming unreadable.

---

## 7. Suggested UI Needs

The playable prototype should eventually include:

- world map view
- start location picker
- zoom and layer controls
- object inspection panel
- build placement mode
- ownership and territory overlay
- unit visibility overlay
- defense overlay
- resource overlay
- clear selection feedback

### UI behavior rule

When zoomed out, the game should summarize.
When zoomed in, the game should show the actual entities.

---

## 8. Suggested Simulation Needs

The game will need simulation systems for:

- per-tile or per-node ownership updates
- per-structure production and upkeep
- unit movement and presence updates
- villager assignment and work state
- AI decision ticks
- visibility / reveal rules
- persistence for all of the above

### Important simulation principle

The simulation should support the map the player sees.
Do not simulate one thing and display another unrelated thing.

---

## 9. Recommended Build Order

This order keeps the project from turning into a mess.

### Phase 1: Map and starting setup

1. start region selection
2. map coordinate system
3. zoom levels / layered visibility
4. player spawn placement
5. local exploration and initial settlement anchor

### Phase 2: Fine-grained territory

1. replace oversized claims with small claim tiles / local zones
2. define claim propagation rules
3. tie claims to proximity and infrastructure
4. support contesting and gradual expansion

### Phase 3: Visible world objects

1. render buildings on the map
2. render villagers and units
3. render defensive works
4. render resource nodes and ownership
5. add icons / density rules for zoomed-out readability

### Phase 4: Economy and production loop

1. production buildings
2. worker assignment
3. resource gathering
4. storage and logistics
5. upkeep and consumption

### Phase 5: Enemy AI

1. enemy house goals
2. enemy expansion logic
3. enemy defense logic
4. enemy economic decisions
5. enemy pressure on the player

### Phase 6: Combat and siege visibility

1. unit confrontation
2. defense interaction
3. siege setup
4. siege outcomes
5. retreat, morale, and reinforcement handling

---

## 10. What Is Missing Right Now

From the current codebase, the biggest missing pieces are:

- actual playable map UI
- start location selection flow
- real fine-grained land claim logic
- visible map entities for buildings, villagers, units, and defenses
- placement tools for structures
- full enemy AI behavior
- combat and siege gameplay loops
- test coverage or runtime verification in Unity

---

## 11. Implementation Rules for Future AIs

When working in this repo:

1. Read this plan first.
2. Read the master gameplay docs next.
3. Make sure the feature fits the singleplayer direction.
4. Keep claims small.
5. Keep the map readable.
6. Make buildings, villagers, units, and defenses visible.
7. Do not hardcode the world start to Europe.
8. Add code in small, traceable steps.
9. Update docs when the design changes.
10. Leave the repo easier for the next AI, not harder.

### Strong do-not-do list

- Do not reintroduce AR assumptions into core gameplay.
- Do not silently force a Europe start.
- Do not make territory expansion abstract and oversized.
- Do not hide all ownership behind menus or counters.
- Do not build a system where the player cannot see what they own.
- Do not let AI enemies exist only as invisible numbers.

---

## 12. Near-Term Implementation Goal

The next milestone should be:

**A playable singleplayer strategy prototype where the player chooses a start region, places buildings on the map, sees villagers and units visibly, controls small local claims, and faces AI enemies that expand and defend intelligently.**

If a future change does not move the project toward that shape, it should be questioned before being added.

---

## 13. Summary

### Already done

- foundation systems exist
- session/persistence exists
- factions, commanders, armies, settlements, population, routes, territory, and AI house scaffolding exist
- docs for collaboration and balance exist

### Still needed

- start region selection
- much smaller claim units
- visible map buildings
- visible villagers and units
- visible defenses
- AI enemy behavior
- combat and siege loops
- proper playable UI and world interaction

### Most important correction

The map must feel like a **local, living medieval strategy world**, not a giant abstract territory blob.
