# Neighborhood Strategy Game Architecture Guide

## Mission

This document is the canonical implementation contract for all local and cloud agents working on the neighborhood strategy game. Every generated task, code change, map layer, simulation rule, and deployment step must conform to these parameters unless a later committed architecture guide explicitly supersedes them.

## System Scale

The project must pivot completely away from any macro-Europe or continent-bound strategy framework. The playable world is a global OpenStreetMap canvas initialized from browser geolocation when the player grants permission, with graceful manual location selection when permission is denied or unavailable.

The map engine must support any global coordinate covered by OpenStreetMap data. Initial viewport selection should center on the user location, then load progressively outward by tile, bounding box, and game relevance. No hard-coded regional assumptions are allowed in territory ownership, resource generation, army movement, routing, seasonal logic, or naming.

Territories must map down to micro-scale neighborhood geography:

- Street segments are first-class territorial units.
- Intersections are claim nodes and tactical choke points.
- Individual landmarks such as neighborhood parks, bridges, schools, hospitals, factories, warehouses, construction sites, residential blocks, transit stops, civic buildings, utility structures, and waterfront features must be addressable as strategic objects.
- Claims must use micro-scale intersection grids rather than broad province polygons.
- A player claim may include one or more intersection nodes, adjacent street edges, and attached landmark/resource points.
- Territorial control should expand along walkable and drivable route graphs, not abstract hex adjacency.

The canonical spatial model is:

- `WorldCoordinate`: latitude, longitude, elevation when available, OSM ids, and source metadata.
- `IntersectionNode`: normalized OSM graph node with claim status, visibility, fortification, conflict state, connected street edges, and controlling faction.
- `StreetSegment`: normalized OSM way segment between intersection nodes, with route cost, surface type, access rules, congestion modifiers, weather modifiers, and ownership state.
- `InfrastructureLandmark`: OSM node, way, or relation mapped to a game object with tags, resource role, labor role, tactical role, and interaction state.
- `ClaimCell`: micro-grid cell derived from local intersection geometry, used for claim influence, contest resolution, patrol areas, construction placement, and fog-of-war sampling.

## Political Topology

The game must not collapse the world into a single monolithic enemy list. Broad factions are cultural or ideological umbrellas; active rulers are separate polity instances that can split into breakaway nations, city-states, client realms, or independent AI-controlled shards.

Rules:

- Each broad faction may spawn multiple breakaway nations or local polity fragments.
- Faction identity and polity identity are not the same thing.
- Different polity instances may share the same faction culture, unit roster, iconography, and diplomacy baseline while still acting as separate rulers.
- Players choosing the same faction are not the same actor; they are separate political instances with distinct names, goals, diplomacy, and claim maps.
- The same physical town can contain multiple claims from the same broad faction, controlled by different AI rulers.
- Keep the visible political landscape readable. Do not spawn 11 or 12 generic enemies; instead, surface a smaller number of meaningful political actors with nested breakaway states.

Example:

- Great Neck may contain two Byzantine claims controlled by two different Byzantine AI polities.
- Those claims should be diplomatically and mechanically distinct even though they share a culture tag.

## Unit, Building, and Resource Granularity

Every soldier, villager, worker, scout, banner, building, wall, gate, tower, defense, and production site must exist as an independent object with its own state.

Rules:

- Soldiers and villagers are not abstract dots; they are movable, damageable, ordered entities.
- Buildings are not just territory badges; they are individual structures with ownership, garrison state, durability, production, and upgrade state.
- Defenses such as walls, towers, gates, trenches, watch posts, and barricades are independent map objects.
- Resources must exist on the map at the places they are harvested, mined, gathered, or processed.
- Mines, quarries, forests, farms, fisheries, workshops, wells, and warehouses are physical game objects, not off-map counters.
- Dots may be used only as temporary low-zoom clusters or debug placeholders. The primary presentation must be detailed, spatial, and object-rich.

## OpenStreetMap Integration

The client map must use Leaflet as the interactive map shell. OSM data ingestion must read global `amenity`, `landuse`, `leisure`, `natural`, `building`, `highway`, `bridge`, `railway`, `waterway`, `shop`, `office`, `industrial`, `construction`, and related tags through a structured OSM data provider.

Recommended data access order:

1. Client-safe cached API layer owned by the game backend.
2. Overpass-compatible query service with rate limiting and bounding-box controls.
3. Preprocessed server tiles for high-traffic areas.
4. Direct OSM-derived static extracts only for development fixtures and tests.

The client must not fire unbounded global Overpass queries. All OSM reads must be bounded by viewport, zoom level, player location, simulation relevance, and cache state.

Every OSM-derived object must retain:

- OSM id and element type.
- Original tags.
- Last fetch timestamp.
- Provider/source name.
- Geometry precision.
- Normalized game classification.
- Confidence score when classification is inferred.

## Land-Use Visual Data

Leaflet component layers must actively read and render global OSM amenity and land-use data as interactive strategic resource points.

Parks, forests, woodland, grassland, nature reserves, community gardens, farms, allotments, and similar green features must display interactive `Forest` resource tags. Forest tags produce or influence:

- Wood.
- Livestock forage.
- Woodland concealment.
- Seasonal agriculture adjacency.
- Ambush probability.

Construction sites, quarries, industrial areas, mines, warehouses, factories, workshops, rail yards, material suppliers, brownfields, and heavy commercial centers must display interactive `Quarry` resource tags. Quarry tags produce or influence:

- Stone.
- Iron.
- Construction throughput.
- Repair capacity.
- Siege equipment staging.

Residential buildings, apartments, houses, dormitories, mixed-use blocks, shelters, and neighborhood housing clusters must display interactive `Settlements` tags. Settlement tags produce or influence:

- Labor.
- Population.
- Recruitment capacity.
- Local unrest.
- Consumption demand.
- Nighttime activity patterns.

Floating resource icons must render directly over their spatial points, anchored to the underlying OSM geometry. Icons must:

- Cluster at low zoom.
- Separate into exact points or polygon centroids at high zoom.
- Remain clickable/tappable.
- Expose source tags and game classification in the inspection panel.
- Update when refreshed OSM data changes classification.
- Respect fog-of-war visibility.

## Territory Claims

Claim mechanics are based on micro-scale intersection grids. The player claims territory by controlling intersections, then extending influence across connected street segments and nearby landmarks.

A valid claim action requires:

- A reachable source claim, base, unit, diplomatic grant, or starting position.
- Route connectivity through accessible street segments.
- Sufficient influence, labor, or unit presence.
- No unresolved conflict state blocking the claim edge.
- Simulation tick confirmation.

Claim contest resolution must evaluate:

- Control strength at each intersection node.
- Connected street segment ownership.
- Nearby settlement labor support.
- Nearby forest concealment and ambush risk.
- Nearby quarry construction and fortification support.
- Weather-driven movement and supply modifiers.
- Day/night visibility.
- Active patrol and army banner presence.

Claim state must be deterministic on the server or authoritative simulation layer. The client may preview claims, but final ownership updates must come from the authoritative state engine.

## Trade, Toll, and Access Infrastructure

The economy must support localized tolls and access fees. Bridges, gates, checkpoints, ferries, controlled crossings, harbor entries, commercial roads, and defensive chokepoints may collect tolls or tribute.

Rules:

- Toll rights belong to the current claim holder unless explicitly granted, leased, or revoked.
- Tolls may be denominated in gold, food, goods, labor, military passage, or diplomatic rights.
- Tolls must influence movement decisions, diplomacy, and route selection.
- A toll can be a political instrument, not just a revenue source.

## Diplomacy and Statecraft

Diplomacy must be deep, persistent, and polity-specific.

Supported relationships and actions should include:

- Peace, war, ceasefire, truce, alliance, non-aggression, trade pact, tribute, vassalage, protectorate, hostage exchange, safe passage, toll treaty, sanctions, and espionage.
- Separate relation tracking for each polity instance, even when two instances share the same faction culture.
- Diplomatic drift over time based on borders, toll abuse, raids, trade, gifts, warfare, and treaty violations.
- Local diplomacy may differ from faction-wide diplomacy if the game model requires it.
- Same-faction breakaway polities may cooperate, compete, or go to war.

Diplomacy must be stateful and auditable. It is not a one-off chat window.

## Engine Temporal Pacing

The state engine must run continuously in the background. One real-world hour equals one in-game day.

Canonical conversion:

- 1 real-world minute equals 24 in-game minutes.
- 2.5 real-world minutes equals 1 in-game hour.
- 15 real-world minutes equals 6 in-game hours.
- 1 real-world hour equals 1 in-game day.

The target loop cadence is one simulation tick every 15 real-world minutes. Each tick advances the game clock by 6 in-game hours.

The engine must support:

- Server-authoritative scheduled ticks.
- Catch-up processing after downtime.
- Idempotent tick application.
- Per-player and global event queues.
- Client-side countdown and prediction.
- Audit logs for state changes.

Tick jobs must process, in order:

1. Clock advancement.
2. Weather and daylight refresh.
3. Route and movement progression.
4. Resource production and consumption.
5. Labor allocation.
6. Construction progress.
7. Claim influence spread and decay.
8. Conflict resolution.
9. Fog-of-war visibility refresh.
10. Notifications and event log materialization.

## Movement And Routing

Asset movement and army marching must use physical OpenStreetMap routing data. Movement duration is measured in real-world minutes or hours, calculated from actual OSM street paths and modifiers.

Routing must consider:

- OSM highway class.
- Foot, bicycle, vehicle, and access tags.
- Surface quality.
- Bridges and tunnels.
- Barriers, gates, waterways, rail crossings, and disconnected ways.
- Elevation when available.
- Real route distance.
- Unit type.
- Encumbrance and supply.
- Weather.
- Day/night state.
- Enemy control and ambush risk.

Movement must not teleport between abstract territories. Every moving army banner or asset convoy must have:

- Origin coordinate.
- Destination coordinate.
- Chosen OSM route.
- Current route progress.
- Estimated arrival time in real-world time.
- Estimated arrival time in game time.
- Current speed multiplier.
- Weather and night penalties.
- Interception windows.
- Visibility state.

Recommended base speeds:

- Foot army banner: 4.5 km/h before modifiers.
- Mounted or light vehicle convoy: route-class dependent, capped by local road type.
- Heavy equipment: slow route-class dependent speed with major penalties for unsuitable streets.
- Scout: faster foot movement, lower road dependency, improved night behavior.

Real weather and street conditions must apply multiplicative penalties. For example:

- Rain: reduce movement speed based on intensity and surface type.
- Snow: reduce speed more sharply, especially on minor roads, paths, and unsurfaced ways.
- Night: reduce speed for labor and heavy movement, but may increase stealth for scouts.

## Eco-System Sync

The client must include a fetch hook communicating with the free Open-Meteo API. The hook must request weather for the active coordinate set and expose normalized simulation weather to the engine.

The weather hook must support:

- Current weather.
- Hourly precipitation.
- Rain and snowfall.
- Temperature.
- Wind speed.
- Cloud cover.
- Sunrise and sunset.
- Timezone-aware local time.
- Seasonal inference from coordinates and date.

The hook must cache responses, debounce map movement, and avoid excessive API calls. Server-side caching is preferred for production, but the client hook must be functional for development and preview environments.

Weather effects:

- Real-world rain triggers movement speed penalties for army banners.
- Real-world snow triggers stronger movement penalties and may increase supply consumption.
- Freezing temperatures reduce agriculture yields and construction efficiency.
- High winds may reduce ranged visibility and slow banners in exposed areas.
- Cloud cover may reduce solar/daylight-derived visibility modifiers if used.

Season effects must align with actual coordinates:

- Winter reduces agriculture yields, slows construction, increases heating or supply needs, and increases snow risk where applicable.
- Spring accelerates production, increases forage recovery, and improves agriculture yields.
- Summer increases agriculture output but may increase unrest, water demand, or fatigue during heat.
- Autumn improves harvest outputs and may slow production as daylight decreases.
- Southern Hemisphere seasons must invert relative to Northern Hemisphere seasons.
- Tropical and equatorial regions must use wet/dry seasonal patterns where latitude and weather data support that model.

Day/night effects must align with local sunrise and sunset:

- Night limits map visibility.
- Night increases woodland ambush rates.
- Night reduces labor speed.
- Night changes settlement activity patterns.
- Dawn and dusk provide intermediate visibility states.

## Client Weather Hook Contract

The weather hook should expose a stable interface similar to:

```ts
type SimulationWeather = {
  coordinate: { lat: number; lon: number };
  timezone: string;
  observedAt: string;
  temperatureC: number;
  precipitationMm: number;
  rainMm: number;
  snowfallCm: number;
  windKph: number;
  cloudCoverPercent: number;
  isDaylight: boolean;
  sunrise: string;
  sunset: string;
  season: 'winter' | 'spring' | 'summer' | 'autumn' | 'wet' | 'dry';
  movementMultiplier: number;
  agricultureMultiplier: number;
  laborMultiplier: number;
  visibilityMultiplier: number;
  ambushMultiplier: number;
};
```

Open-Meteo requests should include the active latitude and longitude plus current and hourly fields needed for movement, agriculture, visibility, and day/night calculations.

## Simulation State

The state engine must model:

- Factions.
- Players.
- Claims.
- Intersections.
- Street segments.
- Landmarks.
- Resources.
- Labor pools.
- Army banners.
- Movement orders.
- Construction projects.
- Weather snapshots.
- Day/night snapshots.
- Events.
- Fog-of-war samples.

Every simulation write must be attributable to:

- Tick id.
- Actor or system source.
- Prior state hash when practical.
- New state hash when practical.
- Timestamp.
- Affected spatial ids.

## Frontend Requirements

The first screen must be the playable map interface, not a marketing page. The app must open into a dense, game-focused operational view with:

- Full-screen Leaflet map.
- Geolocation prompt flow.
- Manual location fallback.
- Resource overlays.
- Claim overlays.
- Army banner overlays.
- Time and tick display.
- Weather/daylight display.
- Selected-object inspector.
- Claim action controls.
- Movement order controls.
- Simulation event log.

The interface must remain readable and usable on desktop and mobile. Floating map controls must not overlap critical map attribution, mobile browser chrome, or each other. Resource icons must stay legible without creating visual clutter.

## Visual Presentation Standard

The game must be presented as detailed and tactile, not as dots on a map.

Rules:

- Use detailed 3D models where possible for units, buildings, defenses, and landmarks.
- Primary asset format should be modular glTF or GLB models unless the implementation explicitly documents another format.
- Use Level of Detail behavior to preserve performance at distance, but keep the close view rich and recognizable.
- Low-zoom clustering may simplify presentation, but high-zoom gameplay must resolve into distinct soldiers, civilians, buildings, roads, fortifications, and resource sites.
- Do not rely on dot-only markers as the main visual language.
- Temporary placeholders are acceptable during development, but the target standard is a world that feels built, occupied, and geographically specific.

## Backend Requirements

The backend must provide:

- OSM query/cache endpoints.
- Weather cache endpoints when available.
- Simulation tick scheduler.
- State persistence.
- Movement route calculation.
- Claim resolution.
- Event log persistence.
- Authentication-ready player identity boundaries.
- Deployment-ready environment configuration.

For routing, prefer proven routing engines or APIs compatible with OSM data. Do not hand-roll shortest-path routing for production unless it is explicitly limited to a small cached graph and covered by tests.

## Agent Implementation Rules

All agents must:

- Treat this file as the source of truth.
- Avoid restoring macro-Europe assumptions.
- Avoid abstract province-only mechanics.
- Preserve global coordinate support.
- Preserve OSM provenance fields.
- Use bounded data fetching.
- Respect Open-Meteo free API usage with caching and debouncing.
- Keep simulation writes deterministic and auditable.
- Keep UI controls game-functional, not promotional.
- Add or update tests when changing simulation math, routing, resource classification, weather modifiers, or claim resolution.

## Milestone Acceptance Criteria

The architecture implementation is acceptable when:

- The app can initialize from browser geolocation.
- The map can render OSM-based neighborhood street segments.
- Intersections can become claim nodes.
- Parks or green land-use features render Forest resource tags.
- Industrial or construction features render Quarry resource tags.
- Residential features render Settlements tags.
- Resource icons float over real spatial points.
- The weather hook fetches Open-Meteo data for active coordinates.
- Rain or snow changes army banner movement multipliers.
- Seasonal logic changes production based on coordinate and date.
- Day/night logic follows local sunrise and sunset.
- The simulation clock maps 1 real-world hour to 1 in-game day.
- The tick loop targets 15 real-world minutes.
- Movement orders calculate real-world arrival durations from OSM routing data.
- Local and cloud agents can parse this file without extra human explanation.
