// Core Game Types for Medieval Strategy Game

import { LatLngBounds } from 'leaflet'

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
  cattle: number      // Food + leather
  sheep: number       // Food + wool
  horses: number      // Cavalry requirement
  pigs: number        // Fast food production
  chickens: number    // Eggs, steady food
}

export interface Population {
  peasants: number    // Workers, food consumers
  craftsmen: number   // Production bonus
  merchants: number   // Trade bonus
  soldiers: number    // Military (from armies)
  nobles: number      // Administration, morale
}

// ==================== TERRITORY ====================

export type TerrainType = 
  | 'plains' 
  | 'hills' 
  | 'mountains' 
  | 'forest' 
  | 'marsh' 
  | 'coastal' 
  | 'river' 
  | 'desert'

export type BuildingType =
  | 'castle'      // Defense, administration
  | 'fortress'    // Strong defense
  | 'market'      // Trade income
  | 'farm'        // Food production
  | 'mine'        // Iron/stone
  | 'lumber_camp' // Wood production
  | 'barracks'    // Troop training
  | 'stables'     // Cavalry training
  | 'port'        // Naval trade (coastal only)
  | 'church'      // Morale, legitimacy
  | 'walls'       // Defense bonus

export interface Building {
  type: BuildingType
  level: number
  condition: number  // 0-100, damaged in sieges
}

export interface Territory {
  id: string
  name: string
  ownerId: string | null
  terrain: TerrainType
  bounds: [number, number][]  // Polygon coordinates
  center: [number, number]
  resources: Resources
  resourceProduction: Resources
  livestock: Livestock
  population: Population
  buildings: Building[]
  fortificationLevel: number  // 0-5
  supplies: number            // For sieges
  maxSupplies: number
  morale: number              // 0-100
  isCapital: boolean
  connectedTerritories: string[]
  tradeRouteValue: number
  siegeState: SiegeState | null
}

// ==================== MILITARY ====================

export type UnitType =
  | 'levy'          // Cheap peasant infantry
  | 'infantry'      // Regular foot soldiers
  | 'heavy_infantry'// Armored infantry
  | 'archers'       // Ranged units
  | 'crossbowmen'   // Armor-piercing ranged
  | 'light_cavalry' // Fast scouts/raiders
  | 'heavy_cavalry' // Knights, shock troops
  | 'siege_engines' // Catapults, trebuchets

export interface UnitStack {
  type: UnitType
  count: number
  morale: number
  experience: number  // 0-100
}

export interface Army {
  id: string
  name: string
  ownerId: string
  commanderId: string | null
  units: UnitStack[]
  position: [number, number]      // Current lat/lng position (for smooth movement)
  currentTerritoryId: string      // Territory the army is in
  targetTerritoryId: string | null
  targetPosition: [number, number] | null
  movementProgress: number        // 0-1 interpolation progress
  movementSpeed: number           // Units per second based on terrain
  supplies: number
  maxSupplies: number
  morale: number
  isRaiding: boolean
  isSieging: boolean
  inBattle: string | null         // Battle ID if in combat
}

export interface Commander {
  id: string
  name: string
  ownerId: string
  portrait: string
  age: number
  stats: {
    leadership: number   // Morale bonus
    tactics: number      // Battle bonus
    siege: number        // Siege effectiveness
    logistics: number    // Supply efficiency
  }
  traits: string[]
  experience: number
  assignedArmyId: string | null
  isAlive: boolean
  capturedBy: string | null
}

// ==================== SIEGE ====================

export type SiegePhase =
  | 'approach'      // Army moving to siege
  | 'encirclement'  // Blocking supplies
  | 'active'        // Siege ongoing
  | 'breach'        // Walls breached
  | 'assault'       // Final attack
  | 'surrender'     // Defenders gave up

export type SiegeAction =
  | 'starve'        // Wait out supplies
  | 'sap'           // Undermine walls
  | 'bombard'       // Use siege engines
  | 'assault'       // Direct attack
  | 'negotiate'     // Offer terms

export type DefenderAction =
  | 'hold'          // Maintain defense
  | 'sally'         // Counter-attack
  | 'repair'        // Fix walls
  | 'ration'        // Extend supplies
  | 'negotiate'     // Seek terms
  | 'surrender'

export interface SiegeState {
  attackerId: string
  attackingArmyId: string
  defenderId: string
  territoryId: string
  phase: SiegePhase
  startDay: number              // Game day when siege started
  daysElapsed: number
  wallIntegrity: number         // 0-100
  defenderSupplies: number
  defenderMorale: number
  attackerCasualties: number
  defenderCasualties: number
  breachPoints: number          // Accumulates from sapping/bombardment
  reliefForceExpected: boolean
  lastTickDay: number           // Last day siege was processed
}

// ==================== DIPLOMACY ====================

export type DiplomaticStatus =
  | 'war'
  | 'hostile'
  | 'neutral'
  | 'non_aggression'
  | 'trade_agreement'
  | 'alliance'
  | 'vassal'

export interface Treaty {
  id: string
  type: DiplomaticStatus
  parties: [string, string]
  terms: TreatyTerms
  startTurn: number
  expirationTurn: number | null
  isActive: boolean
}

export interface TreatyTerms {
  tributeAmount?: number
  tributeDirection?: string  // Who pays whom
  sharedEnemy?: string
  territoryExchange?: string[]
  militaryAccess?: boolean
}

export interface DiplomaticRelation {
  factionId: string
  targetId: string
  value: number  // -100 to 100
  status: DiplomaticStatus
  treaties: Treaty[]
  history: DiplomaticEvent[]
}

export interface DiplomaticEvent {
  turn: number
  type: string
  description: string
  impact: number
}

// ==================== FACTIONS ====================

export type AIPersonality =
  | 'expansionist'
  | 'merchant'
  | 'militarist'
  | 'diplomat'
  | 'opportunist'
  | 'raider'
  | 'defender'

export interface FactionBonuses {
  military?: Partial<Record<UnitType, number>>
  economic?: Partial<keyof Resources>
  diplomatic?: number
  siegeAttack?: number
  siegeDefense?: number
  tradeIncome?: number
  cavalrySpeed?: number
}

export interface Faction {
  id: string
  name: string
  color: string
  flag: string
  personality: AIPersonality
  isPlayer: boolean
  isDefeated: boolean
  capital: string | null
  resources: Resources
  territories: string[]
  armies: string[]
  commanders: string[]
  relations: DiplomaticRelation[]
  reputation: number  // Global reputation
  bonuses: FactionBonuses
  aiState: AIState | null
}

// ==================== AI ====================

export interface AIState {
  personality: AIPersonality
  currentStrategy: string
  targetFaction: string | null
  targetTerritory: string | null
  threatAssessment: Map<string, number>
  priorities: {
    expansion: number
    defense: number
    economy: number
    military: number
    diplomacy: number
  }
  memory: AIMemory
}

export interface AIMemory {
  brokenTreaties: { factionId: string; turn: number; type: string }[]
  betrayals: { factionId: string; turn: number; description: string }[]
  wars: { factionId: string; startTurn: number; endTurn?: number; result?: string }[]
  gifts: { factionId: string; turn: number; value: number }[]
  negotiations: NegotiationMemory[]
}

export interface NegotiationMemory {
  factionId: string
  turn: number
  proposal: string
  accepted: boolean
  counterOffer?: string
}

// ==================== NEGOTIATION ====================

export type AIMood = 'hostile' | 'suspicious' | 'neutral' | 'friendly' | 'eager'

export interface ChatMessage {
  id: string
  sender: 'player' | 'ai'
  content: string
  timestamp: number
  proposal?: Proposal
}

export interface Proposal {
  type: ProposalType
  offeredResources?: Partial<Resources>
  demandedResources?: Partial<Resources>
  offeredTerritories?: string[]
  demandedTerritories?: string[]
  targetFaction?: string  // For joint war
  treatyType?: DiplomaticStatus
  duration?: number
}

export type ProposalType =
  | 'gift'
  | 'trade'
  | 'peace'
  | 'alliance'
  | 'joint_war'
  | 'non_aggression'
  | 'tribute'
  | 'territory_exchange'
  | 'surrender'
  | 'threat'

export interface NegotiationState {
  factionId: string
  messages: ChatMessage[]
  currentOffer: Proposal | null
  aiMood: AIMood
  concessionsMade: number
  playerConcessions: number
  deadlockCount: number
  isOpen: boolean
}

export interface ProposalValue {
  economicValue: number
  strategicValue: number
  relationshipValue: number
  vengeanceValue: number
  riskValue: number
  total: number
}

// ==================== BATTLE SYSTEM ====================

export type BattlePhase = 'pending' | 'player_command' | 'resolving' | 'complete'

export type BattleFormation = 'shield_wall' | 'skirmish' | 'charge' | 'defensive'
export type BattleFocus = 'infantry' | 'archers' | 'cavalry' | 'commander'
export type BattleOrder = 'flank' | 'feigned_retreat' | 'hold_ground' | 'all_out_attack'

export interface Battle {
  id: string
  attackerArmyId: string
  defenderArmyId: string
  territoryId: string
  phase: BattlePhase
  startTime: number           // Real timestamp when battle started
  timeRemaining: number       // Seconds until auto-resolve
  playerIsAttacker: boolean
  playerIsDefender: boolean
  
  // Player commands (if attending)
  playerFormation?: BattleFormation
  playerFocus?: BattleFocus
  playerOrder?: BattleOrder
  
  // Battle progress
  attackerCasualties: number
  defenderCasualties: number
  attackerMorale: number
  defenderMorale: number
  rounds: number
  
  // Result (after resolution)
  result?: 'attacker_victory' | 'defender_victory' | 'draw' | 'retreat'
  loot?: Partial<Resources>
}

// ==================== GAME STATE ====================

export type GameSpeed = 0 | 1 | 2 | 3 | 4  // 0=pause, 1=1x, 2=2x, 3=5x, 4=10x

export const GAME_SPEED_MULTIPLIERS: Record<GameSpeed, number> = {
  0: 0,    // Paused
  1: 1,    // 1x - 1 second = 1 day
  2: 2,    // 2x
  3: 5,    // 5x
  4: 10,   // 10x
}

export interface TimeState {
  day: number                 // Current day (1-365)
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  year: number
  totalDays: number           // Total days elapsed
  lastTickTime: number        // Last real-world timestamp
  accumulatedTime: number     // Accumulated ms since last day tick
}

export interface GameState {
  settings: GameSettings
  time: TimeState
  speed: GameSpeed
  isRunning: boolean          // Is the game loop active
  selectedTerritoryId: string | null
  selectedArmyId: string | null
  factions: Map<string, Faction>
  territories: Map<string, Territory>
  armies: Map<string, Army>
  commanders: Map<string, Commander>
  activeBattles: Map<string, Battle>
  activeNegotiation: NegotiationState | null
  eventLog: GameEvent[]
  victoryCondition: VictoryCondition | null
}

export interface GameSettings {
  mapRegion: 'europe' | 'mediterranean' | 'middle_east'
  difficulty: 'easy' | 'normal' | 'hard' | 'brutal'
  aiCount: number
  startingResources: 'scarce' | 'normal' | 'abundant'
  fogOfWar: boolean
  battleTimer: 30 | 45 | 60 | 90  // Seconds before auto-resolve
}

export interface GameEvent {
  id: string
  day: number
  type: EventType
  title: string
  description: string
  factionIds: string[]
  isRead: boolean
}

export type EventType =
  | 'war_declared'
  | 'peace_treaty'
  | 'territory_captured'
  | 'siege_started'
  | 'siege_ended'
  | 'battle'
  | 'commander_death'
  | 'commander_captured'
  | 'alliance_formed'
  | 'betrayal'
  | 'trade_route'
  | 'famine'
  | 'rebellion'
  | 'victory'

export type VictoryCondition =
  | { type: 'domination'; threshold: number }
  | { type: 'economic'; goldRequired: number }
  | { type: 'military'; enemiesDefeated: number }
  | { type: 'diplomatic'; alliancesRequired: number }

// ==================== UI STATE ====================

export interface BattleNotification {
  battleId: string
  title: string
  location: string
  timeRemaining: number
  isUrgent: boolean
}

export interface UIState {
  activePanel: 'territory' | 'army' | 'diplomacy' | 'economy' | 'commanders'
  showNewGameDialog: boolean
  showSiegeDialog: boolean
  showTradeDialog: boolean
  showDiplomacyDialog: boolean
  showNegotiationChat: boolean
  showBattleCommand: string | null  // Battle ID or null
  selectedFactionForDiplomacy: string | null
  mapCenter: [number, number]
  mapZoom: number
  notifications: Notification[]
  battleNotifications: BattleNotification[]
}

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'danger'
  title: string
  message: string
  duration: number
}
