// Army Movement System - Smooth real-time army movement

import { GameState, Army } from '../types'
import { TERRAIN_MOVEMENT_COST, SEASON_EFFECTS } from '../constants'

const BASE_MOVEMENT_SPEED = 0.0005 // Progress per millisecond at 1x speed

/**
 * Process army movement - called every frame for smooth animation
 */
export function processArmyMovement(state: GameState, deltaMs: number): GameState {
  const updatedArmies = new Map(state.armies)
  let hasChanges = false

  const seasonEffects = SEASON_EFFECTS[state.time.season]

  for (const [armyId, army] of state.armies) {
    if (!army.targetTerritoryId || army.isInBattle) continue

    const targetTerritory = state.territories.get(army.targetTerritoryId)
    if (!targetTerritory) continue

    const terrainCost = TERRAIN_MOVEMENT_COST[targetTerritory.terrain] || 1
    const seasonMultiplier = seasonEffects.movementSpeed

    // Commander logistics bonus
    const commander = army.commander ? state.commanders.get(army.commander) : null
    const logisticsBonus = commander ? (1 + commander.stats.logistics * 0.01) : 1

    const speed = (BASE_MOVEMENT_SPEED / terrainCost) * seasonMultiplier * logisticsBonus
    const newProgress = Math.min(1, army.movementProgress + (speed * deltaMs))

    const currentTerritory = state.territories.get(army.currentTerritoryId)
    if (!currentTerritory) continue

    const newPosition = interpolatePosition(currentTerritory.center, targetTerritory.center, newProgress)

    if (newProgress >= 1) {
      updatedArmies.set(armyId, {
        ...army,
        position: targetTerritory.center,
        currentTerritoryId: army.targetTerritoryId,
        targetTerritoryId: null,
        movementProgress: 0,
      })
      hasChanges = true
    } else {
      updatedArmies.set(armyId, { ...army, position: newPosition, movementProgress: newProgress })
      hasChanges = true
    }
  }

  if (!hasChanges) return state
  return { ...state, armies: updatedArmies }
}

/**
 * Order army to move to a territory
 */
export function orderArmyMove(state: GameState, armyId: string, targetTerritoryId: string): GameState {
  const army = state.armies.get(armyId)
  const targetTerritory = state.territories.get(targetTerritoryId)

  if (!army || !targetTerritory) return state
  if (army.isInBattle) return state
  if (army.currentTerritoryId === targetTerritoryId) return state

  const updatedArmies = new Map(state.armies)
  updatedArmies.set(armyId, { ...army, targetTerritoryId, movementProgress: 0 })
  return { ...state, armies: updatedArmies }
}

/**
 * Cancel army movement
 */
export function cancelArmyMove(state: GameState, armyId: string): GameState {
  const army = state.armies.get(armyId)
  if (!army || !army.targetTerritoryId) return state

  const currentTerritory = state.territories.get(army.currentTerritoryId)
  if (!currentTerritory) return state

  const updatedArmies = new Map(state.armies)
  updatedArmies.set(armyId, {
    ...army,
    position: currentTerritory.center,
    targetTerritoryId: null,
    movementProgress: 0,
  })
  return { ...state, armies: updatedArmies }
}

function interpolatePosition(
  from: [number, number],
  to: [number, number],
  progress: number,
): [number, number] {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
  ]
}

/**
 * Calculate estimated travel time in days
 */
export function estimateTravelTime(state: GameState, army: Army, targetTerritoryId: string): number {
  const targetTerritory = state.territories.get(targetTerritoryId)
  if (!targetTerritory) return Infinity

  const terrainCost = TERRAIN_MOVEMENT_COST[targetTerritory.terrain] || 1
  const seasonEffects = SEASON_EFFECTS[state.time.season]
  const seasonMultiplier = seasonEffects.movementSpeed

  const commander = army.commander ? state.commanders.get(army.commander) : null
  const logisticsBonus = commander ? (1 + commander.stats.logistics * 0.01) : 1

  const speed = (BASE_MOVEMENT_SPEED / terrainCost) * seasonMultiplier * logisticsBonus
  const msToComplete = 1 / speed
  return Math.ceil(msToComplete / 1000)
}

/**
 * Get all armies that can reach a territory
 */
export function getArmiesInRange(state: GameState, factionId: string, targetTerritoryId: string, maxDays: number): Army[] {
  return Array.from(state.armies.values())
    .filter(army => army.ownerId === factionId && !army.isInBattle)
    .filter(army => estimateTravelTime(state, army, targetTerritoryId) <= maxDays)
}
