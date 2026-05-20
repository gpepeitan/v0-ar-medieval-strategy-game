// Turn Processor - Handles end of turn logic

import { v4 as uuid } from 'uuid'
import {
  GameState,
  GameSpeed,
  Faction,
  Territory,
  Army,
  SiegeState,
  GameEvent,
} from '../types'
import {
  SIEGE_CONSTANTS,
  SEASON_EFFECTS,
  TERRAIN_MOVEMENT_COST,
  UNIT_STATS,
} from '../constants'

export function processEndTurn(game: GameState): GameState {
  let updatedGame = { ...game }
  
  // 1. Process army movement
  updatedGame = processArmyMovement(updatedGame)
  
  // 2. Process sieges
  updatedGame = processSieges(updatedGame)
  
  // 3. Process resource production
  updatedGame = processResourceProduction(updatedGame)
  
  // 4. Process army upkeep
  updatedGame = processArmyUpkeep(updatedGame)
  
  // 5. Check victory conditions
  updatedGame = checkVictoryConditions(updatedGame)
  
  // 6. Check for defeated factions
  updatedGame = checkDefeatedFactions(updatedGame)
  
  return updatedGame
}

// Process army movement
function processArmyMovement(game: GameState): GameState {
  const updatedArmies = new Map(game.armies)
  const seasonEffects = SEASON_EFFECTS[game.time.season]
  
  for (const [armyId, army] of game.armies) {
    if (!army.targetTerritoryId || army.isSieging) continue
    
    const currentTerritory = game.territories.get(army.currentTerritoryId)
    const targetTerritory = game.territories.get(army.targetTerritoryId)
    
    if (!currentTerritory || !targetTerritory) continue
    
    // Calculate movement speed
    const terrainCost = TERRAIN_MOVEMENT_COST[targetTerritory.terrain]
    const baseSpeed = 25 // 25% progress per turn normally
    const adjustedSpeed = (baseSpeed / terrainCost) * seasonEffects.movementSpeed
    
    // Check for cavalry speed bonus
    const totalUnits = army.units.reduce((sum, u) => sum + u.count, 0)
    const cavalryUnits = army.units
      .filter(u => u.type === 'light_cavalry' || u.type === 'heavy_cavalry')
      .reduce((sum, u) => sum + u.count, 0)
    
    const cavalryRatio = cavalryUnits / totalUnits
    const cavalryBonus = cavalryRatio > 0.5 ? 1.3 : 1
    
    const newProgress = army.movementProgress + adjustedSpeed * cavalryBonus
    
    if (newProgress >= 100) {
      // Arrived at destination
      const updatedArmy = {
        ...army,
        currentTerritoryId: army.targetTerritoryId,
        targetTerritoryId: null,
        movementProgress: 0,
        isRaiding: false, // Raiding completes
      }
      updatedArmies.set(armyId, updatedArmy)
    } else {
      // Still moving
      const updatedArmy = { ...army, movementProgress: newProgress }
      updatedArmies.set(armyId, updatedArmy)
    }
  }
  
  return { ...game, armies: updatedArmies }
}

// Process ongoing sieges
function processSieges(game: GameState): GameState {
  const updatedTerritories = new Map(game.territories)
  const updatedFactions = new Map(game.factions)
  const updatedArmies = new Map(game.armies)
  const newEvents: GameEvent[] = []
  
  for (const [tid, territory] of game.territories) {
    if (!territory.siegeState) continue
    
    const siege = territory.siegeState
    const attackingArmy = game.armies.get(siege.attackingArmyId)
    
    if (!attackingArmy) {
      // Army no longer exists, end siege
      updatedTerritories.set(tid, { ...territory, siegeState: null })
      continue
    }
    
    // Advance siege
    const newSiege = { ...siege, daysElapsed: siege.daysElapsed + 1 }
    
    // Process siege phase
    switch (siege.phase) {
      case 'approach':
        // Move to encirclement after 1 turn
        newSiege.phase = 'encirclement'
        break
        
      case 'encirclement':
        // Move to active siege
        newSiege.phase = 'active'
        break
        
      case 'active':
        // Consume defender supplies
        newSiege.defenderSupplies -= SIEGE_CONSTANTS.suppliesPerTurn
        
        if (newSiege.defenderSupplies <= 0) {
          newSiege.defenderSupplies = 0
          newSiege.defenderMorale -= SIEGE_CONSTANTS.starvationMoraleHit
        }
        
        // Automatic bombardment if attacker has siege engines
        const siegeEngines = attackingArmy.units.find(u => u.type === 'siege_engines')
        if (siegeEngines && siegeEngines.count > 0) {
          newSiege.wallIntegrity -= SIEGE_CONSTANTS.bombardDamage * Math.min(siegeEngines.count, 5)
          newSiege.breachPoints += SIEGE_CONSTANTS.bombardDamage
        }
        
        // Check for breach
        if (newSiege.wallIntegrity <= SIEGE_CONSTANTS.breachThreshold) {
          newSiege.phase = 'breach'
        }
        
        // Check for surrender
        if (newSiege.defenderMorale <= SIEGE_CONSTANTS.surrenderMoraleThreshold) {
          newSiege.phase = 'surrender'
        }
        
        // Max siege duration
        if (newSiege.daysElapsed >= SIEGE_CONSTANTS.maxSiegeTurns) {
          newSiege.phase = 'surrender'
        }
        break
        
      case 'breach':
        // Assault is automatic once breached
        // Calculate casualties
        const attackerStrength = attackingArmy.units.reduce((sum, u) => {
          const stats = UNIT_STATS[u.type]
          return sum + u.count * stats.attack
        }, 0)
        
        // Defender strength based on remaining morale
        const defenderStrength = territory.fortificationLevel * 50 * (newSiege.defenderMorale / 100)
        
        if (attackerStrength > defenderStrength * 0.8) {
          // Successful assault
          newSiege.phase = 'assault'
          newSiege.attackerCasualties += Math.floor(attackerStrength * 0.15)
          newSiege.defenderCasualties += Math.floor(defenderStrength * 0.5)
          
          // Transfer territory
          const attacker = game.factions.get(siege.attackerId)
          const defender = game.factions.get(siege.defenderId)
          
          if (attacker && defender) {
            // Update attacker
            const updatedAttacker = {
              ...attacker,
              territories: [...attacker.territories, tid],
            }
            updatedFactions.set(attacker.id, updatedAttacker)
            
            // Update defender
            const updatedDefender = {
              ...defender,
              territories: defender.territories.filter(t => t !== tid),
            }
            updatedFactions.set(defender.id, updatedDefender)
            
            // Update territory ownership
            const capturedTerritory = {
              ...territory,
              ownerId: attacker.id,
              siegeState: null,
              morale: 30,
              supplies: 20,
            }
            updatedTerritories.set(tid, capturedTerritory)
            
            // Update army
            const updatedArmy = { ...attackingArmy, isSieging: false }
            updatedArmies.set(attackingArmy.id, updatedArmy)
            
            // Add event
            newEvents.push({
              id: uuid(),
              day: game.time.totalDays,
              type: 'territory_captured',
              title: 'Territory Captured!',
              description: `${attacker.name} has captured ${territory.name} from ${defender.name}!`,
              factionIds: [attacker.id, defender.id],
              isRead: false,
            })
          }
        }
        break
        
      case 'surrender':
        // Territory surrenders
        const attackerFaction = game.factions.get(siege.attackerId)
        const defenderFaction = game.factions.get(siege.defenderId)
        
        if (attackerFaction && defenderFaction) {
          const updatedAttacker = {
            ...attackerFaction,
            territories: [...attackerFaction.territories, tid],
          }
          updatedFactions.set(attackerFaction.id, updatedAttacker)
          
          const updatedDefender = {
            ...defenderFaction,
            territories: defenderFaction.territories.filter(t => t !== tid),
          }
          updatedFactions.set(defenderFaction.id, updatedDefender)
          
          const surrenderedTerritory = {
            ...territory,
            ownerId: attackerFaction.id,
            siegeState: null,
            morale: 50,
          }
          updatedTerritories.set(tid, surrenderedTerritory)
          
          const updatedArmy = { ...attackingArmy, isSieging: false }
          updatedArmies.set(attackingArmy.id, updatedArmy)
          
          newEvents.push({
            id: uuid(),
            day: game.time.totalDays,
            type: 'siege_ended',
            title: 'Siege Ended - Surrender',
            description: `${territory.name} has surrendered to ${attackerFaction.name}!`,
            factionIds: [attackerFaction.id, defenderFaction.id],
            isRead: false,
          })
        }
        break
    }
    
    // Update siege state if not captured
    if (newSiege.phase !== 'assault' && newSiege.phase !== 'surrender') {
      updatedTerritories.set(tid, { ...territory, siegeState: newSiege })
    }
  }
  
  return {
    ...game,
    territories: updatedTerritories,
    factions: updatedFactions,
    armies: updatedArmies,
    eventLog: [...game.eventLog, ...newEvents],
  }
}

// Process resource production for player
function processResourceProduction(game: GameState): GameState {
  const updatedFactions = new Map(game.factions)
  const seasonEffects = SEASON_EFFECTS[game.time.season]
  
  for (const [factionId, faction] of game.factions) {
    if (!faction.isPlayer) continue // AI processed separately
    
    let totalProduction = {
      gold: 0,
      food: 0,
      wood: 0,
      stone: 0,
      iron: 0,
      tradeGoods: 0,
    }
    
    for (const tid of faction.territories) {
      const territory = game.territories.get(tid)
      if (!territory || territory.siegeState) continue // No production during siege
      
      totalProduction.gold += territory.resourceProduction.gold
      totalProduction.food += Math.floor(territory.resourceProduction.food * seasonEffects.foodProduction)
      totalProduction.wood += territory.resourceProduction.wood
      totalProduction.stone += territory.resourceProduction.stone
      totalProduction.iron += territory.resourceProduction.iron
      totalProduction.tradeGoods += territory.resourceProduction.tradeGoods
      
      // Trade route bonus
      totalProduction.gold += Math.floor(territory.tradeRouteValue / 5)
      
      // Building bonuses
      for (const building of territory.buildings) {
        if (building.condition < 50) continue // Damaged buildings don't produce
        
        switch (building.type) {
          case 'market':
            totalProduction.gold += 10 * building.level
            break
          case 'farm':
            totalProduction.food += 10 * building.level
            break
          case 'mine':
            totalProduction.iron += 5 * building.level
            totalProduction.stone += 5 * building.level
            break
          case 'lumber_camp':
            totalProduction.wood += 10 * building.level
            break
          case 'port':
            totalProduction.tradeGoods += 8 * building.level
            totalProduction.gold += 15 * building.level
            break
        }
      }
    }
    
    const updatedFaction = {
      ...faction,
      resources: {
        gold: faction.resources.gold + totalProduction.gold,
        food: faction.resources.food + totalProduction.food,
        wood: faction.resources.wood + totalProduction.wood,
        stone: faction.resources.stone + totalProduction.stone,
        iron: faction.resources.iron + totalProduction.iron,
        tradeGoods: faction.resources.tradeGoods + totalProduction.tradeGoods,
      },
    }
    
    updatedFactions.set(factionId, updatedFaction)
  }
  
  return { ...game, factions: updatedFactions }
}

// Process army upkeep costs
function processArmyUpkeep(game: GameState): GameState {
  const updatedFactions = new Map(game.factions)
  const updatedArmies = new Map(game.armies)
  
  for (const [factionId, faction] of game.factions) {
    let totalGoldUpkeep = 0
    let totalFoodUpkeep = 0
    
    for (const armyId of faction.armies) {
      const army = game.armies.get(armyId)
      if (!army) continue
      
      for (const unit of army.units) {
        const stats = UNIT_STATS[unit.type]
        totalGoldUpkeep += unit.count * stats.upkeepGold
        totalFoodUpkeep += unit.count * stats.upkeepFood
      }
    }
    
    // Deduct upkeep
    let newGold = faction.resources.gold - totalGoldUpkeep
    let newFood = faction.resources.food - totalFoodUpkeep
    
    // If can't afford upkeep, units desert
    if (newGold < 0 || newFood < 0) {
      for (const armyId of faction.armies) {
        const army = game.armies.get(armyId)
        if (!army) continue
        
        // Lose 10% of units
        const updatedUnits = army.units.map(u => ({
          ...u,
          count: Math.floor(u.count * 0.9),
          morale: Math.max(20, u.morale - 10),
        }))
        
        updatedArmies.set(armyId, { ...army, units: updatedUnits, morale: Math.max(20, army.morale - 10) })
      }
      
      newGold = Math.max(0, newGold)
      newFood = Math.max(0, newFood)
    }
    
    const updatedFaction = {
      ...faction,
      resources: {
        ...faction.resources,
        gold: newGold,
        food: newFood,
      },
    }
    
    updatedFactions.set(factionId, updatedFaction)
  }
  
  return { ...game, factions: updatedFactions, armies: updatedArmies }
}

// Check victory conditions
function checkVictoryConditions(game: GameState): GameState {
  const playerFaction = Array.from(game.factions.values()).find(f => f.isPlayer)
  if (!playerFaction) return game
  
  const totalTerritories = game.territories.size
  const playerTerritories = playerFaction.territories.length
  const controlPercent = playerTerritories / totalTerritories
  
  const condition = game.victoryCondition
  
  if (condition?.type === 'domination' && controlPercent >= condition.threshold) {
    const event: GameEvent = {
      id: uuid(),
      day: game.time.totalDays,
      type: 'victory',
      title: 'Victory!',
      description: `${playerFaction.name} has achieved domination by controlling ${Math.floor(controlPercent * 100)}% of all territories!`,
      factionIds: [playerFaction.id],
      isRead: false,
    }
    
    return {
      ...game,
      isRunning: false,
      speed: 0 as GameSpeed,
      eventLog: [...game.eventLog, event],
    }
  }
  
  return game
}

// Check for defeated factions
function checkDefeatedFactions(game: GameState): GameState {
  const updatedFactions = new Map(game.factions)
  const newEvents: GameEvent[] = []
  
  for (const [factionId, faction] of game.factions) {
    if (faction.isDefeated) continue
    
    // Faction is defeated if they have no territories
    if (faction.territories.length === 0) {
      const updatedFaction = { ...faction, isDefeated: true }
      updatedFactions.set(factionId, updatedFaction)
      
      newEvents.push({
        id: uuid(),
        day: game.time.totalDays,
        type: 'battle',
        title: 'Faction Defeated!',
        description: `${faction.name} has been eliminated!`,
        factionIds: [factionId],
        isRead: false,
      })
    }
  }
  
  return {
    ...game,
    factions: updatedFactions,
    eventLog: [...game.eventLog, ...newEvents],
  }
}
