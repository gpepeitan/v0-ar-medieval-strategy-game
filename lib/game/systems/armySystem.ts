// Army System - Unit Management, Movement, and Combat

import { 
  Army, 
  UnitStack, 
  UnitType, 
  Territory, 
  Commander, 
  Resources,
  GameState,
  Faction 
} from '../types'
import { v4 as uuid } from 'uuid'

// Unit stats and costs
export const UNIT_STATS: Record<UnitType, {
  attack: number
  defense: number
  speed: number
  cost: Resources
  upkeep: { gold: number; food: number }
  requiredBuilding?: string
}> = {
  levy: {
    attack: 2,
    defense: 2,
    speed: 2,
    cost: { gold: 5, food: 5, wood: 0, stone: 0, iron: 0, tradeGoods: 0 },
    upkeep: { gold: 1, food: 1 },
  },
  infantry: {
    attack: 5,
    defense: 6,
    speed: 2,
    cost: { gold: 15, food: 5, wood: 0, stone: 0, iron: 5, tradeGoods: 0 },
    upkeep: { gold: 2, food: 1 },
    requiredBuilding: 'barracks',
  },
  heavy_infantry: {
    attack: 7,
    defense: 10,
    speed: 1,
    cost: { gold: 30, food: 5, wood: 0, stone: 0, iron: 15, tradeGoods: 0 },
    upkeep: { gold: 4, food: 2 },
    requiredBuilding: 'barracks',
  },
  archers: {
    attack: 6,
    defense: 3,
    speed: 2,
    cost: { gold: 20, food: 5, wood: 10, stone: 0, iron: 2, tradeGoods: 0 },
    upkeep: { gold: 2, food: 1 },
    requiredBuilding: 'barracks',
  },
  crossbowmen: {
    attack: 8,
    defense: 3,
    speed: 1,
    cost: { gold: 35, food: 5, wood: 15, stone: 0, iron: 5, tradeGoods: 0 },
    upkeep: { gold: 3, food: 1 },
    requiredBuilding: 'barracks',
  },
  light_cavalry: {
    attack: 6,
    defense: 4,
    speed: 5,
    cost: { gold: 40, food: 10, wood: 0, stone: 0, iron: 5, tradeGoods: 0 },
    upkeep: { gold: 4, food: 2 },
    requiredBuilding: 'stables',
  },
  heavy_cavalry: {
    attack: 12,
    defense: 8,
    speed: 3,
    cost: { gold: 80, food: 15, wood: 0, stone: 0, iron: 20, tradeGoods: 0 },
    upkeep: { gold: 8, food: 3 },
    requiredBuilding: 'stables',
  },
  siege_engines: {
    attack: 15,
    defense: 1,
    speed: 1,
    cost: { gold: 100, food: 10, wood: 50, stone: 20, iron: 30, tradeGoods: 0 },
    upkeep: { gold: 5, food: 1 },
    requiredBuilding: 'barracks',
  },
}

// Terrain combat modifiers
const TERRAIN_COMBAT_MODIFIERS: Record<string, { attackMod: number; defenseMod: number }> = {
  plains: { attackMod: 1.0, defenseMod: 0.9 },
  hills: { attackMod: 0.9, defenseMod: 1.2 },
  mountains: { attackMod: 0.7, defenseMod: 1.5 },
  forest: { attackMod: 0.8, defenseMod: 1.3 },
  marsh: { attackMod: 0.6, defenseMod: 1.1 },
  coastal: { attackMod: 1.0, defenseMod: 1.0 },
  river: { attackMod: 0.8, defenseMod: 1.1 },
  desert: { attackMod: 0.9, defenseMod: 0.8 },
}

// Calculate army's total combat strength
export function calculateArmyStrength(
  army: Army, 
  commander: Commander | null,
  isAttacking: boolean,
  terrain: string
): number {
  let totalStrength = 0
  const terrainMod = TERRAIN_COMBAT_MODIFIERS[terrain] || { attackMod: 1, defenseMod: 1 }

  for (const unit of army.units) {
    const stats = UNIT_STATS[unit.type]
    const baseValue = isAttacking ? stats.attack : stats.defense
    const modifier = isAttacking ? terrainMod.attackMod : terrainMod.defenseMod
    
    // Experience bonus (0-50% at max experience)
    const expBonus = 1 + (unit.experience / 200)
    
    // Morale factor
    const moraleFactor = 0.5 + (unit.morale / 200)
    
    totalStrength += baseValue * unit.count * modifier * expBonus * moraleFactor
  }

  // Commander bonus
  if (commander) {
    const commanderBonus = 1 + (commander.stats.tactics / 100) + (commander.stats.leadership / 200)
    totalStrength *= commanderBonus
  } else {
    // Leaderless penalty
    totalStrength *= 0.7
  }

  // Army morale
  const armyMoraleFactor = 0.5 + (army.morale / 200)
  totalStrength *= armyMoraleFactor

  return Math.floor(totalStrength)
}

// Calculate army movement speed
export function calculateArmySpeed(army: Army, commander: Commander | null): number {
  if (army.units.length === 0) return 0

  // Army moves at speed of slowest unit
  let minSpeed = Infinity
  for (const unit of army.units) {
    const stats = UNIT_STATS[unit.type]
    minSpeed = Math.min(minSpeed, stats.speed)
  }

  // Commander logistics bonus
  if (commander) {
    minSpeed *= 1 + (commander.stats.logistics / 100)
  }

  return Math.floor(minSpeed)
}

// Resolve battle between two armies
export interface BattleResult {
  winner: 'attacker' | 'defender' | 'draw'
  attackerLosses: UnitStack[]
  defenderLosses: UnitStack[]
  attackerMoraleLoss: number
  defenderMoraleLoss: number
  experienceGained: number
}

export function resolveBattle(
  attacker: Army,
  defender: Army,
  attackerCommander: Commander | null,
  defenderCommander: Commander | null,
  terrain: string
): BattleResult {
  const attackerStrength = calculateArmyStrength(attacker, attackerCommander, true, terrain)
  const defenderStrength = calculateArmyStrength(defender, defenderCommander, false, terrain)

  // Calculate odds
  const totalStrength = attackerStrength + defenderStrength
  const attackerOdds = attackerStrength / totalStrength
  
  // Random factor (20% variance)
  const randomFactor = 0.9 + Math.random() * 0.2
  const finalAttackerScore = attackerOdds * randomFactor

  // Determine winner
  let winner: 'attacker' | 'defender' | 'draw'
  if (finalAttackerScore > 0.55) {
    winner = 'attacker'
  } else if (finalAttackerScore < 0.45) {
    winner = 'defender'
  } else {
    winner = 'draw'
  }

  // Calculate losses based on strength differential
  const strengthRatio = attackerStrength / Math.max(1, defenderStrength)
  
  // Loser loses more
  let attackerLossRate: number
  let defenderLossRate: number
  
  if (winner === 'attacker') {
    attackerLossRate = 0.1 + (0.2 / strengthRatio)
    defenderLossRate = 0.2 + (0.3 * strengthRatio)
  } else if (winner === 'defender') {
    attackerLossRate = 0.2 + (0.3 / strengthRatio)
    defenderLossRate = 0.1 + (0.2 * strengthRatio)
  } else {
    attackerLossRate = 0.15
    defenderLossRate = 0.15
  }

  // Cap losses
  attackerLossRate = Math.min(0.8, attackerLossRate)
  defenderLossRate = Math.min(0.8, defenderLossRate)

  // Calculate actual unit losses
  const attackerLosses: UnitStack[] = attacker.units.map(unit => ({
    type: unit.type,
    count: Math.floor(unit.count * attackerLossRate),
    morale: unit.morale,
    experience: unit.experience,
  }))

  const defenderLosses: UnitStack[] = defender.units.map(unit => ({
    type: unit.type,
    count: Math.floor(unit.count * defenderLossRate),
    morale: unit.morale,
    experience: unit.experience,
  }))

  // Morale loss
  const attackerMoraleLoss = winner === 'defender' ? 25 : winner === 'draw' ? 15 : 10
  const defenderMoraleLoss = winner === 'attacker' ? 25 : winner === 'draw' ? 15 : 10

  // Experience gained
  const experienceGained = Math.floor(10 + (totalStrength / 100))

  return {
    winner,
    attackerLosses,
    defenderLosses,
    attackerMoraleLoss,
    defenderMoraleLoss,
    experienceGained,
  }
}

// Apply battle results to armies
export function applyBattleResults(
  attacker: Army,
  defender: Army,
  result: BattleResult
): { attacker: Army; defender: Army } {
  // Apply losses
  const updatedAttackerUnits = attacker.units.map((unit, i) => ({
    ...unit,
    count: Math.max(0, unit.count - result.attackerLosses[i].count),
    experience: Math.min(100, unit.experience + result.experienceGained),
  })).filter(u => u.count > 0)

  const updatedDefenderUnits = defender.units.map((unit, i) => ({
    ...unit,
    count: Math.max(0, unit.count - result.defenderLosses[i].count),
    experience: Math.min(100, unit.experience + result.experienceGained),
  })).filter(u => u.count > 0)

  return {
    attacker: {
      ...attacker,
      units: updatedAttackerUnits,
      morale: Math.max(0, attacker.morale - result.attackerMoraleLoss),
    },
    defender: {
      ...defender,
      units: updatedDefenderUnits,
      morale: Math.max(0, defender.morale - result.defenderMoraleLoss),
    },
  }
}

// Check if army can recruit a unit type in territory
export function canRecruitUnit(
  unitType: UnitType,
  territory: Territory,
  faction: Faction
): { canRecruit: boolean; reason?: string } {
  const stats = UNIT_STATS[unitType]

  // Check building requirement
  if (stats.requiredBuilding) {
    const hasBuilding = territory.buildings.some(b => b.type === stats.requiredBuilding)
    if (!hasBuilding) {
      return { canRecruit: false, reason: `Requires ${stats.requiredBuilding}` }
    }
  }

  // Check resources
  for (const [resource, cost] of Object.entries(stats.cost)) {
    if (faction.resources[resource as keyof Resources] < cost) {
      return { canRecruit: false, reason: `Not enough ${resource}` }
    }
  }

  // Check horses for cavalry
  if (unitType === 'light_cavalry' || unitType === 'heavy_cavalry') {
    const horsesNeeded = 1 // Per unit
    if (territory.livestock.horses < horsesNeeded) {
      return { canRecruit: false, reason: 'Not enough horses' }
    }
  }

  return { canRecruit: true }
}

// Recruit units into army
export function recruitUnits(
  army: Army,
  unitType: UnitType,
  count: number,
  territory: Territory,
  faction: Faction
): { army: Army; territory: Territory; faction: Faction } | null {
  const { canRecruit, reason } = canRecruitUnit(unitType, territory, faction)
  if (!canRecruit) return null

  const stats = UNIT_STATS[unitType]

  // Deduct resources
  const newResources = { ...faction.resources }
  for (const [resource, cost] of Object.entries(stats.cost)) {
    newResources[resource as keyof Resources] -= cost * count
  }

  // Deduct horses if cavalry
  let newTerritory = territory
  if (unitType === 'light_cavalry' || unitType === 'heavy_cavalry') {
    newTerritory = {
      ...territory,
      livestock: {
        ...territory.livestock,
        horses: territory.livestock.horses - count,
      },
    }
  }

  // Add units to army
  const existingUnit = army.units.find(u => u.type === unitType)
  let newUnits: UnitStack[]
  
  if (existingUnit) {
    newUnits = army.units.map(u =>
      u.type === unitType
        ? { ...u, count: u.count + count }
        : u
    )
  } else {
    newUnits = [
      ...army.units,
      { type: unitType, count, morale: 100, experience: 0 },
    ]
  }

  return {
    army: { ...army, units: newUnits },
    territory: newTerritory,
    faction: { ...faction, resources: newResources },
  }
}

// Create a new army
export function createArmy(
  name: string,
  ownerId: string,
  territoryId: string
): Army {
  return {
    id: uuid(),
    name,
    ownerId,
    commanderId: null,
    units: [],
    position: [0, 0] as [number, number],  // Will be set to territory center on spawn
    currentTerritoryId: territoryId,
    targetTerritoryId: null,
    targetPosition: null,
    movementProgress: 0,
    movementSpeed: 1,
    supplies: 100,
    maxSupplies: 100,
    morale: 100,
    isRaiding: false,
    isSieging: false,
    inBattle: null,
  }
}

// Process army movement
export function processArmyMovement(
  army: Army,
  territories: Map<string, Territory>,
  commander: Commander | null
): Army {
  if (!army.targetTerritoryId || army.targetTerritoryId === army.currentTerritoryId) {
    return { ...army, targetTerritoryId: null, movementProgress: 0 }
  }

  const speed = calculateArmySpeed(army, commander)
  const newProgress = army.movementProgress + (speed * 25)

  if (newProgress >= 100) {
    return {
      ...army,
      currentTerritoryId: army.targetTerritoryId,
      targetTerritoryId: null,
      movementProgress: 0,
    }
  }

  return {
    ...army,
    movementProgress: newProgress,
  }
}

// Calculate army supply consumption
export function calculateSupplyConsumption(army: Army): number {
  let totalConsumption = 0
  for (const unit of army.units) {
    const stats = UNIT_STATS[unit.type]
    totalConsumption += stats.upkeep.food * unit.count
  }
  return Math.ceil(totalConsumption)
}

// Process army supplies
export function processArmySupplies(
  army: Army,
  territory: Territory,
  isFriendly: boolean
): Army {
  const consumption = calculateSupplyConsumption(army)

  if (isFriendly) {
    // Resupply from friendly territory
    const supplyGain = Math.min(army.maxSupplies - army.supplies, 30)
    return {
      ...army,
      supplies: Math.min(army.maxSupplies, army.supplies + supplyGain - consumption),
    }
  } else {
    // In enemy/neutral territory - only consume
    const newSupplies = army.supplies - consumption

    // Low supplies hurt morale
    let moralePenalty = 0
    if (newSupplies < 30) moralePenalty = 5
    if (newSupplies < 10) moralePenalty = 15

    return {
      ...army,
      supplies: Math.max(0, newSupplies),
      morale: Math.max(0, army.morale - moralePenalty),
    }
  }
}

// Check if army is destroyed (no units left)
export function isArmyDestroyed(army: Army): boolean {
  return army.units.length === 0 || army.units.every(u => u.count === 0)
}

// Get total unit count in army
export function getArmyUnitCount(army: Army): number {
  return army.units.reduce((sum, unit) => sum + unit.count, 0)
}

// Get army composition summary
export function getArmyComposition(army: Army): Record<string, number> {
  const composition: Record<string, number> = {}
  for (const unit of army.units) {
    composition[unit.type] = (composition[unit.type] || 0) + unit.count
  }
  return composition
}
