// Army Movement System - Smooth real-time army movement

import { GameState, Army, Territory } from '../types'
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
    // Skip armies not moving or in battle/siege
    if (!army.targetTerritoryId || army.inBattle || army.isSieging) {
      continue
    }
    
    const targetTerritory = state.territories.get(army.targetTerritoryId)
    if (!targetTerritory) continue
    
    // Calculate movement speed based on terrain and season
    const terrainCost = TERRAIN_MOVEMENT_COST[targetTerritory.terrain] || 1
    const seasonMultiplier = seasonEffects.movementSpeed
    
    // Faction cavalry speed bonus
    const faction = state.factions.get(army.ownerId)
    const cavalryBonus = faction?.bonuses.cavalrySpeed ? (1 + faction.bonuses.cavalrySpeed / 100) : 1
    
    // Commander logistics bonus
    const commander = army.commanderId ? state.commanders.get(army.commanderId) : null
    const logisticsBonus = commander ? (1 + commander.stats.logistics * 0.01) : 1
    
    // Calculate actual speed
    const speed = (BASE_MOVEMENT_SPEED / terrainCost) * seasonMultiplier * cavalryBonus * logisticsBonus
    
    // Update progress
    const newProgress = Math.min(1, army.movementProgress + (speed * deltaMs))
    
    // Interpolate position
    const currentTerritory = state.territories.get(army.currentTerritoryId)
    if (!currentTerritory) continue
    
    const newPosition = interpolatePosition(
      currentTerritory.center,
      targetTerritory.center,
      newProgress
    )
    
    // Check if arrived
    if (newProgress >= 1) {
      updatedArmies.set(armyId, {
        ...army,
        position: targetTerritory.center,
        currentTerritoryId: army.targetTerritoryId,
        targetTerritoryId: null,
        targetPosition: null,
        movementProgress: 0,
      })
      hasChanges = true
    } else {
      updatedArmies.set(armyId, {
        ...army,
        position: newPosition,
        movementProgress: newProgress,
      })
      hasChanges = true
    }
  }
  
  if (!hasChanges) return state
  
  return { ...state, armies: updatedArmies }
}

/**
 * Order army to move to a territory
 */
export function orderArmyMove(
  state: GameState,
  armyId: string,
  targetTerritoryId: string
): GameState {
  const army = state.armies.get(armyId)
  const targetTerritory = state.territories.get(targetTerritoryId)
  
  if (!army || !targetTerritory) return state
  
  // Can't move if in battle or siege
  if (army.inBattle || army.isSieging) return state
  
  // Can't move to same territory
  if (army.currentTerritoryId === targetTerritoryId) return state
  
  // Check if territories are connected
  const currentTerritory = state.territories.get(army.currentTerritoryId)
  if (!currentTerritory) return state
  
  const isConnected = currentTerritory.connectedTerritories.includes(targetTerritoryId)
  if (!isConnected) {
    // Find a path (simplified - just check if any path exists)
    // For now, allow movement to any territory (pathfinding would be more complex)
  }
  
  const updatedArmies = new Map(state.armies)
  updatedArmies.set(armyId, {
    ...army,
    targetTerritoryId,
    targetPosition: targetTerritory.center,
    movementProgress: 0,
  })
  
  return { ...state, armies: updatedArmies }
}

/**
 * Cancel army movement
 */
export function cancelArmyMove(state: GameState, armyId: string): GameState {
  const army = state.armies.get(armyId)
  if (!army || !army.targetTerritoryId) return state
  
  // Return to current territory center if partially moved
  const currentTerritory = state.territories.get(army.currentTerritoryId)
  if (!currentTerritory) return state
  
  const updatedArmies = new Map(state.armies)
  updatedArmies.set(armyId, {
    ...army,
    position: currentTerritory.center,
    targetTerritoryId: null,
    targetPosition: null,
    movementProgress: 0,
  })
  
  return { ...state, armies: updatedArmies }
}

/**
 * Linear interpolation between two positions
 */
function interpolatePosition(
  from: [number, number],
  to: [number, number],
  progress: number
): [number, number] {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
  ]
}

/**
 * Calculate estimated travel time in days
 */
export function estimateTravelTime(
  state: GameState,
  army: Army,
  targetTerritoryId: string
): number {
  const targetTerritory = state.territories.get(targetTerritoryId)
  if (!targetTerritory) return Infinity
  
  const terrainCost = TERRAIN_MOVEMENT_COST[targetTerritory.terrain] || 1
  const seasonEffects = SEASON_EFFECTS[state.time.season]
  const seasonMultiplier = seasonEffects.movementSpeed
  
  const faction = state.factions.get(army.ownerId)
  const cavalryBonus = faction?.bonuses.cavalrySpeed ? (1 + faction.bonuses.cavalrySpeed / 100) : 1
  
  const commander = army.commanderId ? state.commanders.get(army.commanderId) : null
  const logisticsBonus = commander ? (1 + commander.stats.logistics * 0.01) : 1
  
  const speed = (BASE_MOVEMENT_SPEED / terrainCost) * seasonMultiplier * cavalryBonus * logisticsBonus
  
  // Convert to days (1000ms = 1 day at 1x)
  const msToComplete = 1 / speed
  const days = msToComplete / 1000
  
  return Math.ceil(days)
}

/**
 * Get all armies that can reach a territory
 */
export function getArmiesInRange(
  state: GameState,
  factionId: string,
  targetTerritoryId: string,
  maxDays: number
): Army[] {
  const armies = Array.from(state.armies.values()).filter(a => a.ownerId === factionId)
  
  return armies.filter(army => {
    if (army.inBattle || army.isSieging) return false
    const travelTime = estimateTravelTime(state, army, targetTerritoryId)
    return travelTime <= maxDays
  })
}
