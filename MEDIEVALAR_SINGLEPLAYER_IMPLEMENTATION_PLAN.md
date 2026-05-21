# MedievalAR Singleplayer Implementation Plan

This document is the current working plan for the game now that the project has shifted away from AR multiplayer and toward a **singleplayer medieval strategy game with AI enemies**.

Use this as the guide for what has already been built, what still needs to be built, and how future work should be done.

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

### What the game is not anymore

- Not AR-first
- Not multiplayer-first
- Not a generic city builder
- Not a mass-claim territory game
- Not a game where land claims cover huge unrealistic chunks at a time

---

## 2. What Is Already Done

The current codebase already has the beginnings of the core simulation layer:

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

### Documentation groundwork

- master gameplay and balance docs exist
- collaboration guidance exists for multiple AIs working on the repo
- this plan doc now exists as the practical implementation roadmap

---

## 3. What Needs To Be Built Next

The current code is a foundation, not a finished game. The next work should focus on making the world **playable, visible, and spatially understandable**.

### A. Start location selection

This is a priority.

The player should choose a start area instead of being forced into a fixed world location.

#### Requirements

- choose continent / region / starting zone
- support multiple valid spawn regions
- do not always default to Europe
- allow the start choice to affect starting nearby map context, not just a label
- preserve replayability by making starts different each run

### B. Claim size and land control

Current claim chunks are too large.

The game should work at a much finer spatial scale.

#### Requirements

- claims should feel like streets, blocks, intersections, lots, or small local clusters
- no giant 10s-of-miles claim blobs
- control should be granular and contestable
- the player should grow from a local base outward
- larger areas should emerge through many smaller placements, not one huge claim action

### C. Map visibility of everything the player owns

The player asked to actually **see** the world objects on the map.

#### Requirements

- show buildings on the map
- show resource placement on the map
- show villagers and individual units on the map
- show defensive walls / fortifications visibly on the map
- show the relationship between buildings, resources, and territory
- keep the map readable at both zoomed-in and zoomed-out levels

### D. Buildings tied to map resources

Buildings should not just be abstract menu entries.
They should be placed on actual map locations and should interact with the underlying resource source.

#### Requirements

- place farms, mills, workshops, defenses, and other structures on map coordinates
- structure placement should depend on terrain / node / site type
- structures should show ownership and function visually
- resource generation should be tied to location and infrastructure

### E. Villagers and units as visible actors

The player wants to see villagers and unit-level presence.

#### Requirements

- villagers should be represented on the map or in a clear world layer
- units should appear as individual actors or grouped entities depending on zoom level
- units should be distinguishable from buildings and territory
- unit movement should be visible and understandable

### F. Defense visibility

Defensive works should be obvious in the world.

#### Requirements

- walls, towers, gates, forts, and similar defenses should render on the map
- defense strength should be readable from the map layer
- defensive zones should visually match their actual strategic role
- fortification should not be hidden behind abstract stats only

---

## 4. Recommended Build Order

This is the order that will keep the game from becoming a mess.

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

## 5. Design Rules That Must Stay True

These are the important rules the other AIs should not break.

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

## 6. Technical Notes for Implementation

### Suggested data model additions

The code will likely need explicit types for:

- start region / spawn selection
- map cell or map tile locations
- building instances with coordinates
- resource nodes with ownership and capacity
- villager and unit entities with positions
- structure visuals / map markers
- fine-grained claim cells or claim nodes
- defense objects with map geometry

### Suggested UI needs

- world map view
- start location picker
- zoom and layer controls
- object inspection panel
- build placement mode
- ownership and territory overlay
- unit visibility overlay
- defense overlay

### Suggested simulation needs

- per-tile or per-node ownership updates
- per-structure production and upkeep
- unit movement and presence updates
- AI decision ticks
- visibility / reveal rules
- persistence for all of the above

---

## 7. What Is Missing Right Now

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

## 8. Near-Term Implementation Goal

The next milestone should be:

**A playable singleplayer strategy prototype where the player chooses a start region, places buildings on the map, sees villagers and units visibly, controls small local claims, and faces AI enemies that expand and defend intelligently.**

That is the target shape of the game.

If a future change does not move the project toward that shape, it should be questioned before being added.

---

## 9. Practical Guidance For Future AI Work

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

---

## 10. Summary

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
