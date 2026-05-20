// Livestock System - Animal Economy and Management

import { Territory, Livestock, Resources, GameState } from '../types'

// Livestock growth rates per turn
const LIVESTOCK_GROWTH_RATES: Record<keyof Livestock, number> = {
  cattle: 0.05,    // 5% growth
  sheep: 0.08,     // 8% growth
  horses: 0.03,    // 3% growth (slower)
  pigs: 0.12,      // 12% growth (fast breeders)
  chickens: 0.15,  // 15% growth
}

// Maximum livestock per pasture unit
const LIVESTOCK_CAPACITY: Record<keyof Livestock, number> = {
  cattle: 5,
  sheep: 10,
  horses: 3,
  pigs: 8,
  chickens: 20,
}

// Food consumption per animal type (per turn)
const LIVESTOCK_FOOD_CONSUMPTION: Record<keyof Livestock, number> = {
  cattle: 0.5,
  sheep: 0.2,
  horses: 0.4,
  pigs: 0.3,
  chickens: 0.05,
}

// Products from livestock
const LIVESTOCK_PRODUCTS: Record<keyof Livestock, Partial<Resources>> = {
  cattle: { food: 2, gold: 1 },      // Milk, meat, leather
  sheep: { food: 1, gold: 2 },       // Wool is valuable
  horses: { gold: 0 },                // Military use only
  pigs: { food: 3 },                  // Efficient meat
  chickens: { food: 1 },              // Eggs
}

// Calculate pasture capacity based on terrain
export function calculatePastureCapacity(territory: Territory): number {
  let baseCapacity = 10

  switch (territory.terrain) {
    case 'plains':
      baseCapacity = 50
      break
    case 'hills':
      baseCapacity = 30
      break
    case 'river':
      baseCapacity = 40
      break
    case 'forest':
      baseCapacity = 15
      break
    case 'marsh':
      baseCapacity = 20
      break
    case 'coastal':
      baseCapacity = 25
      break
    case 'mountains':
    case 'desert':
      baseCapacity = 10
      break
  }

  // Farm buildings increase capacity
  const farms = territory.buildings.filter(b => b.type === 'farm')
  for (const farm of farms) {
    baseCapacity += 10 * farm.level
  }

  // Stables increase horse capacity specifically
  const stables = territory.buildings.filter(b => b.type === 'stables')
  if (stables.length > 0) {
    baseCapacity += 20 * stables.reduce((sum, s) => sum + s.level, 0)
  }

  return baseCapacity
}

// Calculate current livestock "size" in pasture units
export function calculateLivestockSize(livestock: Livestock): number {
  let size = 0
  for (const [animal, count] of Object.entries(livestock)) {
    const capacity = LIVESTOCK_CAPACITY[animal as keyof Livestock]
    size += count / capacity
  }
  return size
}

// Process livestock growth for a territory
export function processLivestockGrowth(territory: Territory): Livestock {
  const newLivestock = { ...territory.livestock }
  const capacity = calculatePastureCapacity(territory)
  const currentSize = calculateLivestockSize(territory.livestock)

  // Growth is reduced if over capacity
  const capacityRatio = Math.min(1, capacity / Math.max(1, currentSize))

  for (const [animal, count] of Object.entries(territory.livestock)) {
    const key = animal as keyof Livestock
    const growthRate = LIVESTOCK_GROWTH_RATES[key] * capacityRatio

    // Calculate growth (at least 1 if any exist and there's capacity)
    let growth = Math.floor(count * growthRate)
    if (count > 0 && growth === 0 && capacityRatio > 0.5) {
      growth = Math.random() < growthRate ? 1 : 0
    }

    newLivestock[key] = count + growth
  }

  return newLivestock
}

// Calculate food consumption by livestock
export function calculateLivestockFoodConsumption(livestock: Livestock): number {
  let totalConsumption = 0

  for (const [animal, count] of Object.entries(livestock)) {
    const consumption = LIVESTOCK_FOOD_CONSUMPTION[animal as keyof Livestock]
    totalConsumption += count * consumption
  }

  return Math.ceil(totalConsumption)
}

// Calculate production from livestock
export function calculateLivestockProduction(livestock: Livestock): Resources {
  const production: Resources = {
    gold: 0,
    food: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    tradeGoods: 0,
  }

  for (const [animal, count] of Object.entries(livestock)) {
    const products = LIVESTOCK_PRODUCTS[animal as keyof Livestock]
    for (const [resource, amount] of Object.entries(products)) {
      production[resource as keyof Resources] += amount * count
    }
  }

  return production
}

// Raid livestock from a territory
export function raidLivestock(
  territory: Territory,
  raiderStrength: number
): { stolen: Livestock; killed: Livestock; remaining: Livestock } {
  const stolen: Livestock = { cattle: 0, sheep: 0, horses: 0, pigs: 0, chickens: 0 }
  const killed: Livestock = { cattle: 0, sheep: 0, horses: 0, pigs: 0, chickens: 0 }
  const remaining: Livestock = { ...territory.livestock }

  // Raiders prioritize horses (military value) then cattle
  const stealRate = Math.min(0.5, raiderStrength / 100) // Max 50% can be stolen
  const killRate = stealRate * 0.3 // Some are killed in the chaos

  // Horses first
  const horsesStolen = Math.floor(territory.livestock.horses * stealRate)
  const horsesKilled = Math.floor(territory.livestock.horses * killRate)
  stolen.horses = horsesStolen
  killed.horses = horsesKilled
  remaining.horses = Math.max(0, remaining.horses - horsesStolen - horsesKilled)

  // Then cattle
  const cattleStolen = Math.floor(territory.livestock.cattle * stealRate)
  const cattleKilled = Math.floor(territory.livestock.cattle * killRate)
  stolen.cattle = cattleStolen
  killed.cattle = cattleKilled
  remaining.cattle = Math.max(0, remaining.cattle - cattleStolen - cattleKilled)

  // Sheep
  const sheepStolen = Math.floor(territory.livestock.sheep * stealRate)
  const sheepKilled = Math.floor(territory.livestock.sheep * killRate)
  stolen.sheep = sheepStolen
  killed.sheep = sheepKilled
  remaining.sheep = Math.max(0, remaining.sheep - sheepStolen - sheepKilled)

  // Pigs (harder to herd, mostly killed)
  const pigsKilled = Math.floor(territory.livestock.pigs * (stealRate + killRate))
  killed.pigs = pigsKilled
  remaining.pigs = Math.max(0, remaining.pigs - pigsKilled)

  // Chickens (too hard to steal)
  const chickensKilled = Math.floor(territory.livestock.chickens * killRate * 2)
  killed.chickens = chickensKilled
  remaining.chickens = Math.max(0, remaining.chickens - chickensKilled)

  return { stolen, killed, remaining }
}

// Transfer livestock to raider's nearest territory
export function transferStolenLivestock(
  destination: Territory,
  stolen: Livestock
): Territory {
  // Some livestock is lost in transit
  const transitLossRate = 0.2

  const received: Livestock = {
    cattle: Math.floor(stolen.cattle * (1 - transitLossRate)),
    sheep: Math.floor(stolen.sheep * (1 - transitLossRate)),
    horses: Math.floor(stolen.horses * (1 - transitLossRate * 0.5)), // Horses travel well
    pigs: Math.floor(stolen.pigs * (1 - transitLossRate * 1.5)), // Pigs travel poorly
    chickens: 0, // Can't really steal chickens
  }

  return {
    ...destination,
    livestock: {
      cattle: destination.livestock.cattle + received.cattle,
      sheep: destination.livestock.sheep + received.sheep,
      horses: destination.livestock.horses + received.horses,
      pigs: destination.livestock.pigs + received.pigs,
      chickens: destination.livestock.chickens,
    },
  }
}

// Slaughter livestock for emergency food
export function slaughterLivestock(
  territory: Territory,
  type: keyof Livestock,
  count: number
): { territory: Territory; foodGained: number } {
  const available = territory.livestock[type]
  const actualSlaughter = Math.min(count, available)

  // Food yield varies by animal
  const foodYield: Record<keyof Livestock, number> = {
    cattle: 10,
    sheep: 4,
    horses: 6,
    pigs: 6,
    chickens: 1,
  }

  const foodGained = actualSlaughter * foodYield[type]

  const newLivestock = { ...territory.livestock }
  newLivestock[type] = available - actualSlaughter

  return {
    territory: {
      ...territory,
      livestock: newLivestock,
    },
    foodGained,
  }
}

// Process siege starvation effect on livestock
export function processSiegeLivestockConsumption(
  territory: Territory,
  turnsUnderSiege: number
): Territory {
  // During siege, livestock is consumed at accelerated rate
  const consumptionRate = Math.min(0.3, 0.05 * turnsUnderSiege)

  const newLivestock: Livestock = {
    cattle: Math.floor(territory.livestock.cattle * (1 - consumptionRate)),
    sheep: Math.floor(territory.livestock.sheep * (1 - consumptionRate)),
    horses: Math.floor(territory.livestock.horses * (1 - consumptionRate * 0.5)), // Preserve horses
    pigs: Math.floor(territory.livestock.pigs * (1 - consumptionRate * 1.2)), // Eat pigs first
    chickens: Math.floor(territory.livestock.chickens * (1 - consumptionRate * 1.5)), // Chickens first
  }

  return {
    ...territory,
    livestock: newLivestock,
  }
}

// Check if territory has enough horses for cavalry recruitment
export function hasEnoughHorses(territory: Territory, cavalryCount: number): boolean {
  return territory.livestock.horses >= cavalryCount
}

// Consume horses for cavalry recruitment
export function consumeHorsesForCavalry(
  territory: Territory,
  cavalryCount: number
): Territory | null {
  if (!hasEnoughHorses(territory, cavalryCount)) return null

  return {
    ...territory,
    livestock: {
      ...territory.livestock,
      horses: territory.livestock.horses - cavalryCount,
    },
  }
}

// Calculate draft power bonus from cattle and horses
export function calculateDraftPowerBonus(livestock: Livestock): number {
  // Draft animals help with farming and construction
  const cattlePower = livestock.cattle * 0.5
  const horsePower = livestock.horses * 0.3 // Horses are less efficient for draft
  
  // Diminishing returns
  const totalPower = cattlePower + horsePower
  return Math.min(50, Math.floor(Math.sqrt(totalPower) * 3))
}

// Process all livestock systems for end of turn
export function processLivestockTick(game: GameState): GameState {
  const updatedTerritories = new Map(game.territories)

  for (const [territoryId, territory] of game.territories) {
    if (!territory.ownerId) continue

    let updatedTerritory = territory

    // Process siege effects
    if (territory.siegeState) {
      updatedTerritory = processSiegeLivestockConsumption(
        updatedTerritory,
        territory.siegeState.turnsElapsed
      )
    } else {
      // Normal growth
      const newLivestock = processLivestockGrowth(updatedTerritory)
      updatedTerritory = { ...updatedTerritory, livestock: newLivestock }
    }

    updatedTerritories.set(territoryId, updatedTerritory)
  }

  return {
    ...game,
    territories: updatedTerritories,
  }
}
