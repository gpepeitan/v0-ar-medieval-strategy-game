// Economy System - Resource Production, Consumption, and Trade

import { 
  Territory, 
  Faction, 
  Resources, 
  Army, 
  TerrainType, 
  Building,
  GameState,
  Livestock 
} from '../types'

// Base production rates by terrain type
const TERRAIN_PRODUCTION: Record<TerrainType, Partial<Resources>> = {
  plains: { food: 8, gold: 2 },
  hills: { stone: 5, iron: 3, gold: 2 },
  mountains: { stone: 8, iron: 6, gold: 1 },
  forest: { wood: 10, food: 2 },
  marsh: { food: 3 },
  coastal: { food: 5, gold: 4, tradeGoods: 3 },
  river: { food: 6, gold: 3, tradeGoods: 2 },
  desert: { gold: 2, tradeGoods: 4 },
}

// Building production bonuses
const BUILDING_PRODUCTION: Record<string, Partial<Resources>> = {
  farm: { food: 10 },
  mine: { iron: 8, stone: 4 },
  lumber_camp: { wood: 12 },
  market: { gold: 8, tradeGoods: 4 },
  port: { gold: 12, tradeGoods: 8 },
  church: { gold: 2 },
}

// Building maintenance costs
const BUILDING_MAINTENANCE: Record<string, Partial<Resources>> = {
  castle: { gold: 5, stone: 1 },
  fortress: { gold: 8, stone: 2 },
  market: { gold: 2 },
  farm: { gold: 1 },
  mine: { gold: 2, wood: 1 },
  lumber_camp: { gold: 1 },
  barracks: { gold: 3, food: 2 },
  stables: { gold: 4, food: 3 },
  port: { gold: 4, wood: 2 },
  church: { gold: 2 },
  walls: { gold: 1, stone: 1 },
}

// Season modifiers
const SEASON_MODIFIERS: Record<string, Partial<Record<keyof Resources, number>>> = {
  spring: { food: 1.0 },
  summer: { food: 1.3 },
  autumn: { food: 1.2 },
  winter: { food: 0.4, wood: 0.7 },
}

// Livestock production rates
const LIVESTOCK_PRODUCTION: Record<keyof Livestock, Partial<Resources>> = {
  cattle: { food: 3, gold: 1 },    // Milk, meat, leather
  sheep: { food: 1, gold: 2 },     // Wool is valuable
  horses: { gold: 0 },              // Military value, not direct production
  pigs: { food: 4 },                // Efficient food
  chickens: { food: 2 },            // Eggs
}

// Calculate total production for a territory
export function calculateTerritoryProduction(
  territory: Territory,
  season: string
): Resources {
  const production: Resources = {
    gold: 0,
    food: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    tradeGoods: 0,
  }

  // Base terrain production
  const terrainProd = TERRAIN_PRODUCTION[territory.terrain] || {}
  for (const [resource, amount] of Object.entries(terrainProd)) {
    production[resource as keyof Resources] += amount
  }

  // Building bonuses
  for (const building of territory.buildings) {
    const buildingProd = BUILDING_PRODUCTION[building.type] || {}
    const efficiency = building.condition / 100 // Damaged buildings produce less
    for (const [resource, amount] of Object.entries(buildingProd)) {
      production[resource as keyof Resources] += (amount * building.level * efficiency)
    }
  }

  // Livestock production
  for (const [animal, count] of Object.entries(territory.livestock)) {
    const livestockProd = LIVESTOCK_PRODUCTION[animal as keyof Livestock] || {}
    for (const [resource, amount] of Object.entries(livestockProd)) {
      production[resource as keyof Resources] += (amount * count)
    }
  }

  // Population modifier (workers increase production)
  const workerBonus = 1 + (territory.population.peasants * 0.02) + (territory.population.craftsmen * 0.05)
  for (const resource of Object.keys(production) as (keyof Resources)[]) {
    production[resource] = Math.floor(production[resource] * workerBonus)
  }

  // Merchant bonus for gold and trade goods
  const merchantBonus = 1 + (territory.population.merchants * 0.03)
  production.gold = Math.floor(production.gold * merchantBonus)
  production.tradeGoods = Math.floor(production.tradeGoods * merchantBonus)

  // Season modifier
  const seasonMod = SEASON_MODIFIERS[season] || {}
  for (const [resource, modifier] of Object.entries(seasonMod)) {
    production[resource as keyof Resources] = Math.floor(
      production[resource as keyof Resources] * modifier
    )
  }

  // Morale affects production (low morale = less work)
  const moraleMod = 0.5 + (territory.morale / 200) // 50% at 0 morale, 100% at 100 morale
  for (const resource of Object.keys(production) as (keyof Resources)[]) {
    production[resource] = Math.floor(production[resource] * moraleMod)
  }

  // Under siege = severely reduced production
  if (territory.siegeState) {
    for (const resource of Object.keys(production) as (keyof Resources)[]) {
      production[resource] = Math.floor(production[resource] * 0.2)
    }
  }

  return production
}

// Calculate total consumption for a territory
export function calculateTerritoryConsumption(territory: Territory): Resources {
  const consumption: Resources = {
    gold: 0,
    food: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    tradeGoods: 0,
  }

  // Building maintenance
  for (const building of territory.buildings) {
    const maintenance = BUILDING_MAINTENANCE[building.type] || {}
    for (const [resource, amount] of Object.entries(maintenance)) {
      consumption[resource as keyof Resources] += (amount * building.level)
    }
  }

  // Population food consumption
  const totalPop = territory.population.peasants + 
                   territory.population.craftsmen + 
                   territory.population.merchants + 
                   territory.population.nobles
  consumption.food += Math.ceil(totalPop * 0.5) // Each pop unit needs 0.5 food

  // Livestock food consumption (animals need food too!)
  const totalAnimals = territory.livestock.cattle + 
                       territory.livestock.sheep + 
                       territory.livestock.horses + 
                       territory.livestock.pigs
  consumption.food += Math.ceil(totalAnimals * 0.2)

  return consumption
}

// Calculate army upkeep costs
export function calculateArmyUpkeep(army: Army): Resources {
  const upkeep: Resources = {
    gold: 0,
    food: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    tradeGoods: 0,
  }

  const UNIT_UPKEEP: Record<string, { gold: number; food: number }> = {
    levy: { gold: 1, food: 1 },
    infantry: { gold: 2, food: 1 },
    heavy_infantry: { gold: 4, food: 2 },
    archers: { gold: 2, food: 1 },
    crossbowmen: { gold: 3, food: 1 },
    light_cavalry: { gold: 4, food: 2 },
    heavy_cavalry: { gold: 8, food: 3 },
    siege_engines: { gold: 5, food: 1 },
  }

  for (const unit of army.units) {
    const unitUpkeep = UNIT_UPKEEP[unit.type] || { gold: 1, food: 1 }
    upkeep.gold += unitUpkeep.gold * unit.count
    upkeep.food += unitUpkeep.food * unit.count
  }

  return upkeep
}

// Calculate faction's total income and expenses
export function calculateFactionEconomy(
  faction: Faction,
  territories: Map<string, Territory>,
  armies: Map<string, Army>,
  season: string
): { income: Resources; expenses: Resources; net: Resources } {
  const income: Resources = { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 }
  const expenses: Resources = { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 }

  // Territory income
  for (const territoryId of faction.territories) {
    const territory = territories.get(territoryId)
    if (territory) {
      const production = calculateTerritoryProduction(territory, season)
      const consumption = calculateTerritoryConsumption(territory)
      
      for (const resource of Object.keys(income) as (keyof Resources)[]) {
        income[resource] += production[resource]
        expenses[resource] += consumption[resource]
      }
    }
  }

  // Army upkeep
  for (const armyId of faction.armies) {
    const army = armies.get(armyId)
    if (army) {
      const upkeep = calculateArmyUpkeep(army)
      for (const resource of Object.keys(expenses) as (keyof Resources)[]) {
        expenses[resource] += upkeep[resource]
      }
    }
  }

  // Calculate net
  const net: Resources = { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 }
  for (const resource of Object.keys(net) as (keyof Resources)[]) {
    net[resource] = income[resource] - expenses[resource]
  }

  return { income, expenses, net }
}

// Process economy tick for all factions
export function processEconomyTick(game: GameState): GameState {
  const updatedFactions = new Map(game.factions)
  const updatedTerritories = new Map(game.territories)

  for (const [factionId, faction] of game.factions) {
    if (faction.isDefeated) continue

    const { income, expenses, net } = calculateFactionEconomy(
      faction,
      game.territories,
      game.armies,
      game.season
    )

    // Update faction resources
    const newResources: Resources = { ...faction.resources }
    for (const resource of Object.keys(newResources) as (keyof Resources)[]) {
      newResources[resource] = Math.max(0, newResources[resource] + net[resource])
    }

    // Check for negative food effects
    if (newResources.food === 0 && net.food < 0) {
      // Starvation! Reduce morale in all territories
      for (const territoryId of faction.territories) {
        const territory = updatedTerritories.get(territoryId)
        if (territory) {
          updatedTerritories.set(territoryId, {
            ...territory,
            morale: Math.max(0, territory.morale - 10),
          })
        }
      }
    }

    // Check for bankruptcy
    if (newResources.gold === 0 && net.gold < 0) {
      // Can't pay armies - reduce morale
      for (const armyId of faction.armies) {
        const army = game.armies.get(armyId)
        if (army) {
          const updatedArmies = new Map(game.armies)
          updatedArmies.set(armyId, {
            ...army,
            morale: Math.max(0, army.morale - 15),
          })
        }
      }
    }

    updatedFactions.set(factionId, {
      ...faction,
      resources: newResources,
    })
  }

  return {
    ...game,
    factions: updatedFactions,
    territories: updatedTerritories,
  }
}

// Trade route calculation
export function calculateTradeRouteIncome(
  territory: Territory,
  connectedTerritories: Territory[],
  ownerFaction: Faction
): number {
  let tradeIncome = territory.tradeRouteValue

  // Bonus for connected markets
  for (const connected of connectedTerritories) {
    if (connected.ownerId === ownerFaction.id) {
      const hasMarket = connected.buildings.some(b => b.type === 'market')
      const hasPort = connected.buildings.some(b => b.type === 'port')
      if (hasMarket) tradeIncome += 2
      if (hasPort) tradeIncome += 4
    }
  }

  // Apply faction trade bonus if any
  if (ownerFaction.bonuses.tradeIncome) {
    tradeIncome = Math.floor(tradeIncome * (1 + ownerFaction.bonuses.tradeIncome))
  }

  return tradeIncome
}

// Toll collection for chokepoint territories
export function calculateTollIncome(
  territory: Territory,
  allFactions: Map<string, Faction>
): number {
  if (territory.tradeRouteValue < 5) return 0 // Not a significant trade route

  let tollIncome = 0
  const ownerFaction = allFactions.get(territory.ownerId || '')
  if (!ownerFaction) return 0

  // Check if this is on a trade route between other factions
  for (const [, faction] of allFactions) {
    if (faction.id === ownerFaction.id) continue
    if (faction.isDefeated) continue

    // Simplified: each active faction pays some toll
    const relation = ownerFaction.relations.find(r => r.targetId === faction.id)
    if (relation && (relation.status === 'trade_agreement' || relation.status === 'alliance')) {
      tollIncome += Math.floor(territory.tradeRouteValue * 0.5)
    }
  }

  return tollIncome
}
