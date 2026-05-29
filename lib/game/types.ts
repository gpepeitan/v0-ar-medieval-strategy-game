// Core Game Types — Hyper-Local Medieval Strategy
// Scale: street-level. 1 real-world hour = 1 in-game day.
// Geography: OpenStreetMap global coverage, centered on player's real location.

// ==================== RESOURCES ====================

export interface Resources {
  gold: number
  food: number
  wood: number
  stone: number
  iron: number
  tradeGoods: number
}

export interface Livestock {
  cattle: number
  sheep: number
  horses: number
  pigs: number
  chickens: number
}

export interface Population {
  peasants: number
  craftsmen: number
  merchants: number
  soldiers: number
  nobles: number
}

// ==================== TERRITORY (HYPER-LOCAL) ====================
// A territory is a real-world block, park, industrial zone, or bridge.
// Claims are individual road intersections; an Outpost on an intersection
// controls the surrounding block and can levy tolls.

export type TerrainType =
  | 'settlement'   // Residential block — Labor / Population
  | 'forest'       // Park / green space — Wood / Livestock forage
  | 'quarry'       // Industrial / construction zone — Stone / Iron
  | 'farmland'     // Agricultural / allotment land — Food
  | 'water'        // River, lake edge — Fish / transport
  | 'road'         // Major road / bridge intersection — Toll income
  | 'plains'       // Open ground
  | 'hills'
  | 'mountains'
  | 'marsh'
  | 'coastal'

// OSM land-use tags that map to terrain types
export const OSM_LANDUSE_TO_TERRAIN: Record<string, TerrainType> = {
  residential: 'settlement',
  retail: 'settlement',
  commercial: 'settlement',
  mixed: 'settlement',
  park: 'forest',
  forest: 'forest',
  nature_reserve: 'forest',
  grass: 'forest',
  meadow: 'farmland',
  farmland: 'farmland',
  farmyard: 'farmland',
  allotments: 'farmland',
  industrial: 'quarry',
  construction: 'quarry',
  quarry: 'quarry',
  water: 'water',
  reservoir: 'water',
}

export type BuildingType =
  | 'outpost'       // Claims intersection, levies tolls
  | 'watchtower'    // Vision range extension, early warning
  | 'market'        // Trade income boost
  | 'farm'          // Food production on farmland
  | 'lumber_camp'   // Wood from forest nodes
  | 'mine'          // Iron/stone from quarry nodes
  | 'barracks'      // Troop training
  | 'stables'       // Horse / cavalry
  | 'storehouse'    // Resource buffer
  | 'walls'         // Defense bonus

export interface Building {
  type: BuildingType
  level: number
  condition: number       // 0-100
  builtAt: number         // real epoch ms
}

export interface Territory {
  id: string
  name: string
  ownerId: string | null
  terrain: TerrainType
  // Polygon bounds in [lat, lng] pairs for Leaflet
  bounds: [number, number][]
  center: [number, number]
  // OSM feature id (way or relation id) for data sync
  osmId?: string
  osmTags?: Record<string, string>
  resources: Resources
  resourceProduction: Resources          // Per real-15-min tick
  livestock: Livestock
  population: Population
  buildings: Building[]
  fortificationLevel: number             // 0-5
  supplies: number
  maxSupplies: number
  morale: number                         // 0-100
  isCapital: boolean
  isIntersection: boolean                // True = road intersection claim point
  tollRate: number                       // Gold per caravan passing through
  connectedTerritories: string[]
  siegeState: SiegeState | null
  // Real-world distance to player spawn (metres)
  distanceFromSpawn?: number
}

// ==================== SIEGE ====================

export type SiegePhase =
  | 'approach'
  | 'bombardment'
  | 'sapping'
  | 'starvation'
  | 'assault'
  | 'resolved'

export interface SiegeState {
  attackerId: string
  daysElapsed: number        // in-game days
  phase: SiegePhase
  attackerStrength: number
  defenderStrength: number
}

// ==================== ARMY ====================
// Armies march at real-world walking pace (~5 km/h) scaled to game clock.
// 1 in-game day = 1 real-world hour, so 5 km/h = 5 km per in-game day.

export interface ArmyUnit {
  type: 'infantry' | 'cavalry' | 'archer' | 'siege'
  count: number
  strength: number          // 0-100 per unit
  morale: number            // 0-100
}

export interface Army {
  id: string
  name: string
  ownerId: string
  // Visual position on map [lat, lng]
  position: [number, number]
  currentTerritoryId: string
  targetTerritoryId: string | null
  // Movement progress 0-1 toward target
  movementProgress: number
  // Real-world distance to target in metres
  distanceToTarget: number
  // Estimated real-world arrival time (epoch ms)
  estimatedArrival: number | null
  units: ArmyUnit[]
  commander: string | null         // Commander id
  isInBattle: boolean
  battleId: string | null
  supplies: number
  supplyConsumptionPerDay: number
  // Night penalty: speed halved during local nighttime
  nightPenalty: boolean
}

// ==================== BATTLE ====================

export type BattleFormation = 'line' | 'wedge' | 'defensive' | 'flanking'
export type BattleFocus = 'aggressive' | 'balanced' | 'defensive'
export type BattleOrder = 'advance' | 'hold' | 'retreat' | 'flank'

export interface Battle {
  id: string
  attackerId: string
  defenderId: string
  territoryId: string
  startedAt: number               // real epoch ms
  timerRemainingMs: number        // countdown before auto-resolve
  phase: 'pending' | 'active' | 'resolved'
  playerCommanded: boolean
  attackerFormation?: BattleFormation
  attackerFocus?: BattleFocus
  attackerOrder?: BattleOrder
  result?: 'attacker_wins' | 'defender_wins' | 'draw'
  casualties: { attacker: number; defender: number }
}

// ==================== COMMANDER ====================

export interface CommanderStats {
  leadership: number      // 0-100: troop morale bonus
  tactics: number         // 0-100: battle effectiveness
  siege: number           // 0-100: siege speed bonus
  logistics: number       // 0-100: supply efficiency
}

export interface Commander {
  id: string
  name: string
  factionId: string
  armyId: string | null
  stats: CommanderStats
  xp: number
  age: number
  traits: string[]
  isAlive: boolean
}

// ==================== FACTION ====================

export type FactionPersonality =
  | 'expansionist'
  | 'diplomat'
  | 'militarist'
  | 'trader'
  | 'defender'
  | 'opportunist'

export interface Faction {
  id: string
  name: string
  color: string               // CSS hex
  personality: FactionPersonality
  isPlayer: boolean
  isDefeated: boolean
  resources: Resources
  livestock: Livestock
  territories: string[]       // Territory ids
  armies: string[]            // Army ids
  commanders: string[]
  relations: Map<string, DiplomaticRelation>
  // Spawn point in real-world coords
  spawnPoint: [number, number]
  // Neighborhood name (derived from OSM reverse geocode)
  neighborhoodName: string
}

// ==================== DIPLOMACY ====================

export type DiplomaticStatus =
  | 'war'
  | 'hostile'
  | 'neutral'
  | 'friendly'
  | 'allied'
  | 'vassal'
  | 'suzerain'

export interface DiplomaticRelation {
  status: DiplomaticStatus
  value: number               // -100 to +100
  treaties: Treaty[]
  lastInteractionDay: number
}

export type TreatyType = 'peace' | 'trade' | 'alliance' | 'tribute' | 'passage'

export interface Treaty {
  id: string
  type: TreatyType
  factionAId: string
  factionBId: string
  terms: string
  startDay: number
  expirationDay: number
  isActive: boolean
}

// ==================== NEGOTIATION ====================

export type AIMood = 'receptive' | 'neutral' | 'hostile' | 'desperate' | 'triumphant'

export interface ChatMessage {
  id: string
  sender: 'player' | 'ai'
  content: string
  timestamp: number
}

export interface Proposal {
  type: TreatyType
  terms: Record<string, unknown>
  playerInitiated: boolean
}

export interface NegotiationState {
  factionId: string
  mood: AIMood
  messages: ChatMessage[]
  currentProposal: Proposal | null
  round: number
}

// ==================== GAME EVENTS ====================

export interface GameEvent {
  id: string
  type: string
  title: string
  description: string
  day: number
  factionId?: string
  territoryId?: string
  importance: 'low' | 'medium' | 'high' | 'critical'
}

export interface DiplomaticEvent {
  id: string
  type: string
  fromFactionId: string
  toFactionId: string
  day: number
  description: string
}

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
  timestamp: number
  duration?: number
  actionLabel?: string
  onAction?: () => void
}

// ==================== TIME — REAL-WORLD ALIGNED ====================
// 1 real-world hour = 1 in-game day
// Resource tick: every 15 real-world minutes
// Army march speed: based on real-world distance (metres) at ~80 m/min walking pace

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type GameSpeed = 0 | 1 | 2 | 3 | 4

// At 1x: 1 real hour = 1 in-game day
// Faster speeds compress time for testing
export const GAME_SPEED_MULTIPLIERS: Record<GameSpeed, number> = {
  0: 0,       // Paused
  1: 1,       // 1x: 1 real hour = 1 in-game day
  2: 60,      // 2x: 1 real minute = 1 in-game day (testing)
  3: 360,     // 3x: 10 real seconds = 1 in-game day (testing)
  4: 3600,    // 4x: 1 real second = 1 in-game day (testing)
}

export interface TimeState {
  // In-game calendar
  day: number                  // 1-365
  season: Season
  year: number
  totalDays: number
  // Real-world alignment
  realWorldStartMs: number     // epoch ms when game was started
  lastTickTime: number         // performance.now() of last frame
  accumulatedTime: number      // ms accumulated toward next day tick
  // Real-world local time (updated each tick from Date.now())
  localHour: number            // 0-23, used for day/night cycle
  isDaytime: boolean
}

// ==================== WEATHER (REAL-WORLD) ====================

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'blizzard'
  | 'fog'
  | 'storm'

export interface WeatherState {
  condition: WeatherCondition
  temperatureCelsius: number
  windSpeedKmh: number
  precipitationMm: number
  // Computed modifiers
  movementSpeedMultiplier: number    // 0.2 – 1.0
  livestockAttritionBonus: number    // extra % loss per day
  agricultureMultiplier: number      // 0.0 – 1.5
  ambushSuccessBonus: number         // 0 – 0.3 extra probability
  // Meta
  lastFetchedAt: number              // epoch ms
  fetchCoords: [number, number] | null
}

export const DEFAULT_WEATHER: WeatherState = {
  condition: 'clear',
  temperatureCelsius: 15,
  windSpeedKmh: 10,
  precipitationMm: 0,
  movementSpeedMultiplier: 1.0,
  livestockAttritionBonus: 0,
  agricultureMultiplier: 1.0,
  ambushSuccessBonus: 0,
  lastFetchedAt: 0,
  fetchCoords: null,
}

// Weather condition derived modifiers
export function computeWeatherModifiers(
  condition: WeatherCondition,
  tempC: number,
  precipMm: number,
): Omit<WeatherState, 'condition' | 'temperatureCelsius' | 'windSpeedKmh' | 'precipitationMm' | 'lastFetchedAt' | 'fetchCoords'> {
  switch (condition) {
    case 'clear':
      return { movementSpeedMultiplier: 1.0, livestockAttritionBonus: 0, agricultureMultiplier: 1.1, ambushSuccessBonus: 0 }
    case 'cloudy':
      return { movementSpeedMultiplier: 1.0, livestockAttritionBonus: 0, agricultureMultiplier: 1.0, ambushSuccessBonus: 0.05 }
    case 'rain':
      return { movementSpeedMultiplier: 0.75, livestockAttritionBonus: 0.01, agricultureMultiplier: 1.0, ambushSuccessBonus: 0.1 }
    case 'heavy_rain':
      return { movementSpeedMultiplier: 0.5, livestockAttritionBonus: 0.02, agricultureMultiplier: 0.8, ambushSuccessBonus: 0.15 }
    case 'snow':
      return { movementSpeedMultiplier: 0.4, livestockAttritionBonus: 0.03, agricultureMultiplier: 0.2, ambushSuccessBonus: 0.1 }
    case 'blizzard':
      return { movementSpeedMultiplier: 0.2, livestockAttritionBonus: 0.08, agricultureMultiplier: 0.0, ambushSuccessBonus: 0.0 }
    case 'fog':
      return { movementSpeedMultiplier: 0.7, livestockAttritionBonus: 0.005, agricultureMultiplier: 0.9, ambushSuccessBonus: 0.25 }
    case 'storm':
      return { movementSpeedMultiplier: 0.3, livestockAttritionBonus: 0.05, agricultureMultiplier: 0.5, ambushSuccessBonus: 0.05 }
    default:
      return { movementSpeedMultiplier: 1.0, livestockAttritionBonus: 0, agricultureMultiplier: 1.0, ambushSuccessBonus: 0 }
  }
}

// ==================== OSM OVERPASS DATA ====================

export interface OsmNode {
  id: string
  lat: number
  lng: number
  tags: Record<string, string>
}

export interface OsmWay {
  id: string
  nodes: [number, number][]
  tags: Record<string, string>
}

export interface LocalMapData {
  territories: Territory[]
  intersections: OsmNode[]        // Road intersections that can be claimed
  lastFetchedAt: number
  fetchBounds: [[number, number], [number, number]] | null
}

// ==================== AI STATE ====================

export interface AIState {
  factionId: string
  lastDecisionDay: number
  currentStrategy: 'expand' | 'consolidate' | 'defend' | 'negotiate' | 'raid'
  targetTerritoryId: string | null
  threatAssessment: Map<string, number>
}

// ==================== FULL GAME STATE ====================

export interface GameState {
  id: string
  settings: GameSettings
  // Core entities
  territories: Map<string, Territory>
  factions: Map<string, Faction>
  armies: Map<string, Army>
  commanders: Map<string, Commander>
  battles: Map<string, Battle>
  aiStates: Map<string, AIState>
  // Selection
  selectedTerritoryId: string | null
  selectedArmyId: string | null
  // Time
  time: TimeState
  // Speed
  speed: GameSpeed
  isRunning: boolean
  // Weather
  weather: WeatherState
  // Local map data (from OSM Overpass API)
  localMapData: LocalMapData
  // Spawn
  playerSpawnCoords: [number, number] | null
  // Events
  events: GameEvent[]
  diplomaticEvents: DiplomaticEvent[]
  notifications: Notification[]
  // Negotiation
  activeNegotiation: NegotiationState | null
  // Victory
  isVictory: boolean
  isDefeated: boolean
  victoryCondition: string | null
}

export interface GameSettings {
  mapRegion: string
  difficulty: 'easy' | 'normal' | 'hard' | 'brutal'
  aiCount: number
  startingResources: 'poor' | 'normal' | 'rich'
  fogOfWar: boolean
  battleTimer: number       // seconds
  // New: player's real-world coordinates for spawn
  spawnLat: number
  spawnLng: number
  // Pacing: how many speed-2 multiplier to use (default 60 = 1 min/day for dev)
  devSpeedOverride: boolean
}

// ==================== UI STATE ====================

export interface UIState {
  activePanel: 'territory' | 'army' | 'diplomacy' | 'economy' | 'commander' | null
  showNewGameDialog: boolean
  showNegotiationChat: boolean
  showBattleCommand: boolean | null
  commandingBattleId: string | null
  // Extended dialog flags
  showSiegeDialog?: boolean
  showTradeDialog?: boolean
  showDiplomacyDialog?: boolean
  showSaveLoad?: boolean
  showEventLog?: boolean
  selectedFactionForDiplomacy?: string | null
  // Notifications
  notifications: Notification[]
  battleNotifications?: unknown[]
  mapCenter: [number, number]
  mapZoom: number
}
