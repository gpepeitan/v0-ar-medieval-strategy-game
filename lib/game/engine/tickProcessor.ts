// Tick Processor - Handles all per-tick game logic

import { GameState, Army, Territory, Resources } from '../types'
import { TERRAIN_PRODUCTION, SEASON_EFFECTS, UNIT_STATS } from '../constants'

/**
 * Process daily tick - resources, production, consumption
 */
export function processDayTick(state: GameState, day: number): GameState {
  let updatedState = state
  
  // Process resource production for all territories
  updatedState = processResourceProduction(updatedState)
  
  // Process army upkeep
  updatedState = processArmyUpkeep(updatedState)
  
  // Process building effects
  updatedState = processBuildingEffects(updatedState)
  
  // Process population changes (slower - check every 10 days)
  if (day % 10 === 0) {
    updatedState = processPopulationGrowth(updatedState)
  }
  
  return updatedState
}

/**
 * Process weekly tick - buildings, livestock
 */
export function processWeekTick(state: GameState): GameState {
  let updatedState = state
  
  // Process building construction progress
  updatedState = processBuildingConstruction(updatedState)
  
  // Process livestock breeding
  updatedState = processLivestockGrowth(updatedState)
  
  // Process trade route income
  updatedState = processTradeRouteIncome(updatedState)
  
  return updatedState
}

/**
 * Process season tick - seasonal effects, random events
 */
export function processSeasonTick(state: GameState): GameState {
  let updatedState = state
  
  // Apply seasonal modifiers (already handled in production via season check)
  
  // Process commander aging (1 year = 4 seasons)
  if (state.time.season === 'spring') {
    updatedState = processCommanderAging(updatedState)
  }
  
  // Check victory conditions
  updatedState = checkVictoryConditions(updatedState)
  
  return updatedState
}

/**
 * Process resource production from all territories
 */
function processResourceProduction(state: GameState): GameState {
  const updatedFactions = new Map(state.factions)
  const seasonEffects = SEASON_EFFECTS[state.time.season]
  
  for (const [factionId, faction] of updatedFactions) {
    if (faction.isDefeated) continue
    
    const resources = { ...faction.resources }
    
    for (const territoryId of faction.territories) {
      const territory = state.territories.get(territoryId)
      if (!territory) continue
      
      // Base production from terrain
      const terrainProd = TERRAIN_PRODUCTION[territory.terrain]
      
      // Daily production (divide by 365 for annual rate, or use direct daily values)
      const dailyMultiplier = 1 / 30 // Roughly monthly values divided by 30
      
      // Apply seasonal effects
      const foodMultiplier = seasonEffects.foodProduction * dailyMultiplier
      const otherMultiplier = dailyMultiplier
      
      resources.food += (terrainProd.food || 0) * foodMultiplier
      resources.gold += (terrainProd.gold || 0) * otherMultiplier
      resources.wood += (terrainProd.wood || 0) * otherMultiplier
      resources.stone += (terrainProd.stone || 0) * otherMultiplier
      resources.iron += (terrainProd.iron || 0) * otherMultiplier
      resources.tradeGoods += (terrainProd.tradeGoods || 0) * otherMultiplier
      
      // Building bonuses
      for (const building of territory.buildings) {
        const bonus = getBuildingDailyProduction(building.type, building.level)
        resources.food += bonus.food * foodMultiplier
        resources.gold += bonus.gold * otherMultiplier
        resources.wood += bonus.wood * otherMultiplier
        resources.stone += bonus.stone * otherMultiplier
        resources.iron += bonus.iron * otherMultiplier
      }
    }
    
    // Ensure non-negative and round
    resources.food = Math.max(0, Math.floor(resources.food * 100) / 100)
    resources.gold = Math.max(0, Math.floor(resources.gold * 100) / 100)
    resources.wood = Math.max(0, Math.floor(resources.wood * 100) / 100)
    resources.stone = Math.max(0, Math.floor(resources.stone * 100) / 100)
    resources.iron = Math.max(0, Math.floor(resources.iron * 100) / 100)
    resources.tradeGoods = Math.max(0, Math.floor(resources.tradeGoods * 100) / 100)
    
    updatedFactions.set(factionId, { ...faction, resources })
  }
  
  return { ...state, factions: updatedFactions }
}

/**
 * Process army upkeep costs
 */
function processArmyUpkeep(state: GameState): GameState {
  const updatedFactions = new Map(state.factions)
  const updatedArmies = new Map(state.armies)
  const dailyMultiplier = 1 / 30 // Monthly cost divided by 30
  
  for (const [armyId, army] of state.armies) {
    const faction = updatedFactions.get(army.ownerId)
    if (!faction) continue
    
    let totalGoldUpkeep = 0
    let totalFoodUpkeep = 0
    
    for (const unit of army.units) {
      const stats = UNIT_STATS[unit.type]
      totalGoldUpkeep += stats.upkeepGold * unit.count * dailyMultiplier
      totalFoodUpkeep += stats.upkeepFood * unit.count * dailyMultiplier
    }
    
    const resources = { ...faction.resources }
    resources.gold = Math.max(0, resources.gold - totalGoldUpkeep)
    resources.food = Math.max(0, resources.food - totalFoodUpkeep)
    
    // If can't pay upkeep, reduce morale
    if (resources.gold < 0 || resources.food < 0) {
      const updatedArmy = {
        ...army,
        morale: Math.max(10, army.morale - 1),
      }
      updatedArmies.set(armyId, updatedArmy)
    }
    
    updatedFactions.set(army.ownerId, { ...faction, resources })
  }
  
  return { ...state, factions: updatedFactions, armies: updatedArmies }
}

/**
 * Process building effects
 */
function processBuildingEffects(state: GameState): GameState {
  // Buildings provide passive bonuses, handled in resource production
  return state
}

/**
 * Process population growth
 */
function processPopulationGrowth(state: GameState): GameState {
  const updatedTerritories = new Map(state.territories)
  
  for (const [territoryId, territory] of updatedTerritories) {
    if (!territory.ownerId) continue
    
    const faction = state.factions.get(territory.ownerId)
    if (!faction) continue
    
    // Growth rate based on food surplus and morale
    const hasFood = faction.resources.food > 0
    const moraleBonus = territory.morale / 100
    
    if (hasFood && territory.morale > 30) {
      const population = { ...territory.population }
      const growthRate = 0.001 * moraleBonus // 0.1% growth per 10 days at 100 morale
      
      population.peasants = Math.floor(population.peasants * (1 + growthRate))
      
      updatedTerritories.set(territoryId, { ...territory, population })
    }
  }
  
  return { ...state, territories: updatedTerritories }
}

/**
 * Process building construction
 */
function processBuildingConstruction(state: GameState): GameState {
  // Buildings are constructed instantly for now (can add queue later)
  return state
}

/**
 * Process livestock growth
 */
function processLivestockGrowth(state: GameState): GameState {
  const updatedTerritories = new Map(state.territories)
  
  for (const [territoryId, territory] of updatedTerritories) {
    if (!territory.ownerId) continue
    
    const livestock = { ...territory.livestock }
    const growthRate = 0.01 // 1% growth per week
    
    livestock.cattle = Math.floor(livestock.cattle * (1 + growthRate))
    livestock.sheep = Math.floor(livestock.sheep * (1 + growthRate))
    livestock.horses = Math.floor(livestock.horses * (1 + growthRate * 0.5)) // Horses grow slower
    livestock.pigs = Math.floor(livestock.pigs * (1 + growthRate * 1.5)) // Pigs grow faster
    livestock.chickens = Math.floor(livestock.chickens * (1 + growthRate * 2))
    
    updatedTerritories.set(territoryId, { ...territory, livestock })
  }
  
  return { ...state, territories: updatedTerritories }
}

/**
 * Process trade route income
 */
function processTradeRouteIncome(state: GameState): GameState {
  const updatedFactions = new Map(state.factions)
  
  for (const [factionId, faction] of updatedFactions) {
    if (faction.isDefeated) continue
    
    let tradeIncome = 0
    
    for (const territoryId of faction.territories) {
      const territory = state.territories.get(territoryId)
      if (!territory) continue
      
      tradeIncome += territory.tradeRouteValue
      
      // Market building bonus
      const market = territory.buildings.find(b => b.type === 'market')
      if (market) {
        tradeIncome *= 1 + (market.level * 0.2)
      }
    }
    
    const resources = { ...faction.resources }
    resources.gold += tradeIncome
    
    // Apply faction trade bonus
    if (faction.bonuses.tradeIncome) {
      resources.gold += tradeIncome * (faction.bonuses.tradeIncome / 100)
    }
    
    updatedFactions.set(factionId, { ...faction, resources })
  }
  
  return { ...state, factions: updatedFactions }
}

/**
 * Process commander aging
 */
function processCommanderAging(state: GameState): GameState {
  const updatedCommanders = new Map(state.commanders)
  const events = [...state.eventLog]
  
  for (const [commanderId, commander] of updatedCommanders) {
    if (!commander.isAlive) continue
    
    const newAge = commander.age + 1
    
    // Death chance increases with age
    if (newAge > 50) {
      const deathChance = (newAge - 50) * 0.02 // 2% per year over 50
      if (Math.random() < deathChance) {
        updatedCommanders.set(commanderId, {
          ...commander,
          age: newAge,
          isAlive: false,
        })
        
        events.push({
          id: crypto.randomUUID(),
          day: state.time.totalDays,
          type: 'commander_death',
          title: 'Commander Died',
          description: `${commander.name} has died of old age at ${newAge}.`,
          factionIds: [commander.ownerId],
          isRead: false,
        })
        
        continue
      }
    }
    
    updatedCommanders.set(commanderId, { ...commander, age: newAge })
  }
  
  return { ...state, commanders: updatedCommanders, eventLog: events }
}

/**
 * Check victory conditions
 */
function checkVictoryConditions(state: GameState): GameState {
  const playerFaction = Array.from(state.factions.values()).find(f => f.isPlayer)
  if (!playerFaction) return state
  
  const totalTerritories = state.territories.size
  const playerTerritories = playerFaction.territories.length
  const territoryPercentage = playerTerritories / totalTerritories
  
  // Check domination victory
  if (state.victoryCondition?.type === 'domination') {
    if (territoryPercentage >= state.victoryCondition.threshold) {
      return {
        ...state,
        eventLog: [
          ...state.eventLog,
          {
            id: crypto.randomUUID(),
            day: state.time.totalDays,
            type: 'victory',
            title: 'VICTORY!',
            description: `You have conquered ${Math.floor(territoryPercentage * 100)}% of the known world! Your dynasty will be remembered forever!`,
            factionIds: [playerFaction.id],
            isRead: false,
          },
        ],
      }
    }
  }
  
  // Check if player is defeated
  if (playerTerritories === 0) {
    return {
      ...state,
      eventLog: [
        ...state.eventLog,
        {
          id: crypto.randomUUID(),
          day: state.time.totalDays,
          type: 'victory',
          title: 'DEFEAT',
          description: 'Your dynasty has fallen. All territories have been lost.',
          factionIds: [playerFaction.id],
          isRead: false,
        },
      ],
    }
  }
  
  return state
}

/**
 * Get daily production from a building
 */
function getBuildingDailyProduction(
  type: string,
  level: number
): Partial<Resources> & { food: number; gold: number; wood: number; stone: number; iron: number } {
  const base = { food: 0, gold: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 }
  
  switch (type) {
    case 'farm':
      return { ...base, food: 10 * level }
    case 'mine':
      return { ...base, iron: 5 * level, stone: 5 * level }
    case 'lumber_camp':
      return { ...base, wood: 10 * level }
    case 'market':
      return { ...base, gold: 5 * level }
    case 'port':
      return { ...base, gold: 8 * level, tradeGoods: 3 * level }
    default:
      return base
  }
}
