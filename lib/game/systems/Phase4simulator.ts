/**
 * Phase 4 Simulator
 *
 * Authoritative simulation layer for advanced game mechanics.
 * Per ARCHITECTURE_GUIDE.md: one real-world hour = one in-game day.
 * Target tick cadence: 15 real-world minutes = 6 in-game hours.
 *
 * This module is the canonical engine for:
 *   - OSM-routing-based movement cost calculation
 *   - Claim contest resolution at intersection nodes
 *   - Labor allocation and construction progress
 *   - Toll and access-fee collection along route graphs
 *   - Polity-level AI reasoning (build, recruit, expand, diplomacy)
 *   - Fog-of-war visibility sampling
 *   - Deterministic, auditable state writes
 *
 * Status: Stub — structure is final, implementations follow Phase 3 → 4 progression.
 */

import type { Coordinate, OsmClaimFeature, BannerMovement, WeatherSnapshot } from './state/gameStore'

// ─── Spatial types ────────────────────────────────────────────────────────────

export interface IntersectionNode {
  id: string
  osmNodeId: number | null
  coordinate: Coordinate
  /** Controlling polity id, or null if contested/neutral */
  controlledBy: string | null
  /** 0–1 control strength for the current owner */
  controlStrength: number
  isContested: boolean
  fortificationLevel: number
  connectedSegmentIds: string[]
}

export interface StreetSegment {
  id: string
  osmWayId: number | null
  fromNodeId: string
  toNodeId: string
  lengthMeters: number
  /** Base movement cost multiplier (1.0 = normal road) */
  costMultiplier: number
  surfaceType: 'paved' | 'unpaved' | 'path' | 'bridge' | 'restricted'
  controlledBy: string | null
  tollActive: boolean
  tollAmountGold: number
}

export interface Polity {
  id: string
  name: string
  color: string
  isPlayer: boolean
  claimedFeatureIds: string[]
  controlledNodeIds: string[]
  resources: { gold: number; food: number; wood: number; stone: number }
  /** AI personality — governs strategy weights */
  personality: 'builder' | 'expansionist' | 'defender' | 'trader' | 'raider'
  aiState: PolityAiState
}

export interface PolityAiState {
  /** How many consecutive ticks the polity has spent in build/recruit mode */
  buildTicksAccumulated: number
  /** Minimum build ticks before aggression is considered — calmer AI */
  buildTicksBeforeAggression: number
  lastStrategyTick: number
  currentStrategy: 'build' | 'recruit' | 'expand' | 'consolidate' | 'diplomacy' | 'raid'
}

// ─── Simulation tick result ───────────────────────────────────────────────────

export interface Phase4TickResult {
  tickId: string
  tickIndex: number
  realWorldAt: string
  inGameDay: number
  inGameHour: number
  stateChanges: Phase4StateChange[]
  events: Phase4Event[]
}

export interface Phase4StateChange {
  entityType: 'node' | 'segment' | 'feature' | 'polity' | 'banner'
  entityId: string
  field: string
  previousValue: unknown
  nextValue: unknown
  sourceActorId: string
  tickId: string
}

export interface Phase4Event {
  id: string
  tickId: string
  type:
    | 'claim_captured'
    | 'claim_contested'
    | 'banner_arrived'
    | 'toll_collected'
    | 'construction_completed'
    | 'polity_at_war'
    | 'polity_peace'
    | 'resource_depleted'
  title: string
  description: string
  involvedPolityIds: string[]
  coordinate?: Coordinate
}

// ─── Movement cost ────────────────────────────────────────────────────────────

/**
 * Calculate real-world travel time in milliseconds from OSM route data.
 * Per ARCHITECTURE_GUIDE.md: movement must use physical OSM routing data.
 *
 * @param distanceMeters - Route distance from OSM routing engine
 * @param segment - Street segment properties
 * @param weather - Active weather snapshot
 * @param polity - Moving polity (for logistics bonuses)
 */
export function calculateMovementMs(
  distanceMeters: number,
  segment: Pick<StreetSegment, 'costMultiplier' | 'surfaceType'>,
  weather: WeatherSnapshot,
  polity?: Pick<Polity, 'personality'>
): number {
  const BASE_KPH = 4.5 // walking pace for infantry banner

  const surfacePenalty =
    segment.surfaceType === 'path' ? 0.65
    : segment.surfaceType === 'unpaved' ? 0.80
    : segment.surfaceType === 'bridge' ? 0.90
    : segment.surfaceType === 'restricted' ? 0.40
    : 1.0

  const personalityBonus = polity?.personality === 'raider' ? 1.15 : 1.0

  const effectiveKph = BASE_KPH
    * segment.costMultiplier
    * surfacePenalty
    * weather.movementMultiplier
    * personalityBonus

  const metersPerMs = (Math.max(0.5, effectiveKph) * 1000) / (3600 * 1000)
  return Math.ceil(distanceMeters / metersPerMs)
}

// ─── Claim contest resolution ─────────────────────────────────────────────────

/**
 * Resolve claim contest at an intersection node.
 * Control strength decays toward the attacker at a rate proportional to:
 * - Attacker's nearby banner count
 * - Forest concealment (ambush multiplier from weather)
 * - Distance from nearest attacker banner
 *
 * Stub: returns whether the attacker gains control this tick.
 */
export function resolveClaimContest(
  node: IntersectionNode,
  attackerPolityId: string,
  attackerBanners: BannerMovement[],
  weather: WeatherSnapshot
): { captured: boolean; newStrength: number } {
  const DECAY_PER_TICK = 0.15 * weather.ambushMultiplier
  const nearbyBanners = attackerBanners.filter(b => {
    const dlat = b.current.lat - node.coordinate.lat
    const dlon = b.current.lon - node.coordinate.lon
    return Math.sqrt(dlat * dlat + dlon * dlon) < 0.005
  })

  if (nearbyBanners.length === 0) return { captured: false, newStrength: node.controlStrength }

  const newStrength = Math.max(0, node.controlStrength - DECAY_PER_TICK * nearbyBanners.length)
  return { captured: newStrength === 0, newStrength }
}

// ─── AI strategy selection (calmer build-first) ───────────────────────────────

/**
 * Select the next AI strategy for a polity.
 * Design principle (ARCHITECTURE_GUIDE.md): AI should reason at the polity level.
 * Calmer AI: must complete buildTicksBeforeAggression build ticks before attacking.
 *
 * Priority order:
 *   1. Build / recruit if under resource threshold or under build quota
 *   2. Expand to adjacent unclaimed features if resources are healthy
 *   3. Diplomacy if neighbors are neutral
 *   4. Raid / attack only after sustained build phase and only if much stronger
 */
export function selectAiStrategy(
  polity: Polity,
  currentTick: number,
  claimFeatures: OsmClaimFeature[]
): PolityAiState['currentStrategy'] {
  const { aiState, resources } = polity

  // Always build first until quota met
  const builtEnough = aiState.buildTicksAccumulated >= aiState.buildTicksBeforeAggression
  const lowResources = resources.gold < 150 || resources.food < 80 || resources.wood < 50

  if (!builtEnough || lowResources) {
    return resources.gold < 80 ? 'consolidate' : 'build'
  }

  // Count unclaimed features nearby
  const ownedCount = polity.claimedFeatureIds.length
  const unclaimedNearby = claimFeatures.filter(f => !f.claimedBy && f.resourceTag !== 'Intersection').length

  if (unclaimedNearby > 0 && ownedCount < 8) return 'expand'
  if (resources.gold > 400) return 'recruit'

  // Raiding / war only if polity has significant strength and has been building for a long time
  const wellBuilt = aiState.buildTicksAccumulated >= aiState.buildTicksBeforeAggression * 2
  if (wellBuilt && resources.gold > 600) return 'raid'

  return 'diplomacy'
}

// ─── Toll collection ──────────────────────────────────────────────────────────

/**
 * Evaluate toll charge for a banner crossing a street segment.
 * Returns gold amount owed, or 0 if no toll applies.
 */
export function evaluateTollCharge(
  segment: StreetSegment,
  movingPolityId: string,
  allPolities: Pick<Polity, 'id' | 'aiState'>[]
): number {
  if (!segment.tollActive) return 0
  if (segment.controlledBy === movingPolityId) return 0 // own road
  if (segment.controlledBy === null) return 0 // neutral road
  return segment.tollAmountGold
}

// ─── Stub: full tick processor ────────────────────────────────────────────────

/**
 * Process one Phase 4 simulation tick.
 * Full implementation: Phase 4 build sprint.
 * Current: returns an empty tick result — safe to call from the engine loop.
 */
export function processPhase4Tick(
  tickIndex: number,
  inGameDay: number,
  inGameHour: number,
  _polities: Polity[],
  _nodes: IntersectionNode[],
  _segments: StreetSegment[],
  _claimFeatures: OsmClaimFeature[],
  _banners: BannerMovement[],
  _weather: WeatherSnapshot
): Phase4TickResult {
  const tickId = `p4-tick-${tickIndex}-${Date.now()}`
  return {
    tickId, tickIndex, realWorldAt: new Date().toISOString(),
    inGameDay, inGameHour,
    stateChanges: [],
    events: [],
  }
}
