// Labor System - Worker Assignment and Population Management

import { Territory, Population, Building, BuildingType, Resources } from '../types'

export interface LaborAllocation {
  farming: number
  mining: number
  logging: number
  crafting: number
  construction: number
  garrison: number
  idle: number
}

// Default labor allocation for a territory
export function getDefaultLaborAllocation(territory: Territory): LaborAllocation {
  const totalWorkers = territory.population.peasants + territory.population.craftsmen
  
  // Auto-allocate based on terrain and buildings
  const allocation: LaborAllocation = {
    farming: 0,
    mining: 0,
    logging: 0,
    crafting: 0,
    construction: 0,
    garrison: 0,
    idle: 0,
  }

  // Assign based on terrain
  switch (territory.terrain) {
    case 'plains':
    case 'river':
      allocation.farming = Math.floor(totalWorkers * 0.6)
      break
    case 'hills':
    case 'mountains':
      allocation.mining = Math.floor(totalWorkers * 0.5)
      allocation.farming = Math.floor(totalWorkers * 0.2)
      break
    case 'forest':
      allocation.logging = Math.floor(totalWorkers * 0.5)
      allocation.farming = Math.floor(totalWorkers * 0.2)
      break
    case 'coastal':
      allocation.farming = Math.floor(totalWorkers * 0.3) // Fishing
      allocation.crafting = Math.floor(totalWorkers * 0.3)
      break
    default:
      allocation.farming = Math.floor(totalWorkers * 0.4)
  }

  // Assign craftsmen to crafting
  allocation.crafting += territory.population.craftsmen

  // Calculate idle
  const assigned = Object.values(allocation).reduce((a, b) => a + b, 0)
  allocation.idle = Math.max(0, totalWorkers - assigned)

  return allocation
}

// Calculate production bonus from labor allocation
export function calculateLaborBonus(
  allocation: LaborAllocation,
  territory: Territory
): Partial<Resources> {
  const bonus: Partial<Resources> = {}

  // Each worker adds to their assigned production
  const WORKER_EFFICIENCY = {
    farming: { food: 0.5 },
    mining: { iron: 0.3, stone: 0.3 },
    logging: { wood: 0.4 },
    crafting: { gold: 0.2, tradeGoods: 0.15 },
  }

  if (allocation.farming > 0) {
    bonus.food = (bonus.food || 0) + allocation.farming * WORKER_EFFICIENCY.farming.food
  }
  if (allocation.mining > 0) {
    bonus.iron = (bonus.iron || 0) + allocation.mining * WORKER_EFFICIENCY.mining.iron
    bonus.stone = (bonus.stone || 0) + allocation.mining * WORKER_EFFICIENCY.mining.stone
  }
  if (allocation.logging > 0) {
    bonus.wood = (bonus.wood || 0) + allocation.logging * WORKER_EFFICIENCY.logging.wood
  }
  if (allocation.crafting > 0) {
    bonus.gold = (bonus.gold || 0) + allocation.crafting * WORKER_EFFICIENCY.crafting.gold
    bonus.tradeGoods = (bonus.tradeGoods || 0) + allocation.crafting * WORKER_EFFICIENCY.crafting.tradeGoods
  }

  return bonus
}

// Population growth calculation
export function calculatePopulationGrowth(
  territory: Territory,
  foodSurplus: number
): Partial<Population> {
  const growth: Partial<Population> = {}
  
  // Base growth rate
  let growthRate = 0.02 // 2% base growth

  // Food surplus increases growth
  if (foodSurplus > 10) growthRate += 0.02
  if (foodSurplus > 20) growthRate += 0.01
  
  // Food shortage decreases growth (or causes decline)
  if (foodSurplus < 0) growthRate = -0.03 // Population decline
  if (foodSurplus < -10) growthRate = -0.05 // Severe decline

  // Morale affects growth
  if (territory.morale > 70) growthRate += 0.01
  if (territory.morale < 30) growthRate -= 0.02

  // Under siege = no growth, decline
  if (territory.siegeState) {
    growthRate = -0.05
  }

  // Building bonuses
  const hasChurch = territory.buildings.some(b => b.type === 'church')
  if (hasChurch) growthRate += 0.01

  // Calculate actual growth for peasants
  const peasantGrowth = Math.floor(territory.population.peasants * growthRate)
  if (peasantGrowth !== 0) {
    growth.peasants = peasantGrowth
  }

  // Craftsmen grow slower and only if there are enough peasants
  if (territory.population.peasants > 50 && growthRate > 0) {
    growth.craftsmen = Math.floor(territory.population.craftsmen * growthRate * 0.5)
  }

  // Merchants grow in cities with markets
  const hasMarket = territory.buildings.some(b => b.type === 'market')
  if (hasMarket && growthRate > 0) {
    growth.merchants = Math.floor(territory.population.merchants * growthRate * 0.3) || 
                       (territory.population.merchants === 0 ? 1 : 0) // Bootstrap merchants
  }

  return growth
}

// Apply population growth to territory
export function applyPopulationGrowth(
  territory: Territory,
  growth: Partial<Population>
): Territory {
  const newPopulation = { ...territory.population }

  for (const [popType, change] of Object.entries(growth)) {
    const key = popType as keyof Population
    newPopulation[key] = Math.max(0, newPopulation[key] + (change || 0))
  }

  // Cap population based on territory capacity
  const maxPop = calculatePopulationCap(territory)
  const totalPop = newPopulation.peasants + newPopulation.craftsmen + 
                   newPopulation.merchants + newPopulation.nobles
  
  if (totalPop > maxPop) {
    // Reduce proportionally
    const ratio = maxPop / totalPop
    newPopulation.peasants = Math.floor(newPopulation.peasants * ratio)
    newPopulation.craftsmen = Math.floor(newPopulation.craftsmen * ratio)
    newPopulation.merchants = Math.floor(newPopulation.merchants * ratio)
  }

  return { ...territory, population: newPopulation }
}

// Calculate maximum population a territory can support
export function calculatePopulationCap(territory: Territory): number {
  let baseCap = 50 // Default cap

  // Terrain affects cap
  switch (territory.terrain) {
    case 'plains':
    case 'river':
      baseCap = 100
      break
    case 'coastal':
      baseCap = 80
      break
    case 'forest':
    case 'hills':
      baseCap = 60
      break
    case 'mountains':
    case 'marsh':
    case 'desert':
      baseCap = 40
      break
  }

  // Buildings increase cap
  for (const building of territory.buildings) {
    switch (building.type) {
      case 'farm':
        baseCap += 20 * building.level
        break
      case 'market':
        baseCap += 15 * building.level
        break
      case 'castle':
        baseCap += 30 * building.level
        break
      case 'church':
        baseCap += 10 * building.level
        break
    }
  }

  // Capital gets bonus
  if (territory.isCapital) {
    baseCap += 50
  }

  return baseCap
}

// Conscript workers into soldiers
export function conscriptWorkers(
  territory: Territory,
  count: number
): { territory: Territory; soldiers: number } {
  const available = territory.population.peasants
  const actualConscripts = Math.min(count, available)

  const newPopulation = {
    ...territory.population,
    peasants: territory.population.peasants - actualConscripts,
    soldiers: territory.population.soldiers + actualConscripts,
  }

  // Conscription hurts morale
  const moraleLoss = Math.floor(actualConscripts / 10)

  return {
    territory: {
      ...territory,
      population: newPopulation,
      morale: Math.max(0, territory.morale - moraleLoss),
    },
    soldiers: actualConscripts,
  }
}

// Return soldiers to peasant workforce
export function demobilizeSoldiers(
  territory: Territory,
  count: number
): Territory {
  const available = territory.population.soldiers
  const actualDemob = Math.min(count, available)

  return {
    ...territory,
    population: {
      ...territory.population,
      peasants: territory.population.peasants + actualDemob,
      soldiers: territory.population.soldiers - actualDemob,
    },
  }
}

// Worker migration when territory is unstable
export function calculateWorkerFlight(
  territory: Territory
): number {
  if (territory.morale > 50) return 0
  if (!territory.siegeState && territory.morale > 30) return 0

  // Calculate how many workers flee
  let flightRate = 0

  if (territory.siegeState) {
    flightRate = 0.1 // 10% flee during siege
  } else if (territory.morale < 20) {
    flightRate = 0.05
  } else if (territory.morale < 30) {
    flightRate = 0.02
  }

  const totalWorkers = territory.population.peasants + territory.population.craftsmen
  return Math.floor(totalWorkers * flightRate)
}

// Process worker flight (they flee to adjacent friendly territories)
export function processWorkerFlight(
  territory: Territory,
  fleeCount: number,
  adjacentFriendly: Territory | null
): { source: Territory; destination: Territory | null } {
  const actualFlee = Math.min(fleeCount, territory.population.peasants)

  const updatedSource: Territory = {
    ...territory,
    population: {
      ...territory.population,
      peasants: territory.population.peasants - actualFlee,
    },
  }

  let updatedDestination: Territory | null = null
  if (adjacentFriendly) {
    updatedDestination = {
      ...adjacentFriendly,
      population: {
        ...adjacentFriendly.population,
        peasants: adjacentFriendly.population.peasants + actualFlee,
      },
    }
  }
  // If no friendly territory, workers just disappear (died/scattered)

  return { source: updatedSource, destination: updatedDestination }
}
