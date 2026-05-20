// AI Controller - Main AI decision-making system

import { v4 as uuid } from 'uuid'
import {
  GameState,
  Faction,
  Territory,
  Army,
  AIState,
  DiplomaticStatus,
  GameEvent,
  SiegeState,
} from '../types'
import {
  DIFFICULTY_MODIFIERS,
  AI_PERSONALITY_WEIGHTS,
  TERRAIN_DEFENSE_BONUS,
  UNIT_STATS,
} from '../constants'

export function processAITurns(game: GameState): GameState {
  let updatedGame = { ...game }
  
  // Process each AI faction
  for (const [factionId, faction] of game.factions) {
    if (faction.isPlayer || faction.isDefeated) continue
    
    updatedGame = processAIFaction(updatedGame, faction)
  }
  
  return updatedGame
}

function processAIFaction(game: GameState, faction: Faction): GameState {
  let updatedGame = { ...game }
  const aiState = faction.aiState
  if (!aiState) return game
  
  // 1. Update threat assessment
  const threats = assessThreats(game, faction)
  
  // 2. Decide on strategy based on personality and situation
  const strategy = decideStrategy(game, faction, threats)
  
  // 3. Execute strategy
  switch (strategy) {
    case 'expand':
      updatedGame = executeExpansion(updatedGame, faction)
      break
    case 'defend':
      updatedGame = executeDefense(updatedGame, faction)
      break
    case 'attack':
      updatedGame = executeAttack(updatedGame, faction, threats)
      break
    case 'raid':
      updatedGame = executeRaid(updatedGame, faction)
      break
    case 'consolidate':
      updatedGame = executeConsolidation(updatedGame, faction)
      break
    case 'diplomacy':
      updatedGame = executeDiplomacy(updatedGame, faction)
      break
  }
  
  // 4. Process resource collection
  updatedGame = processAIResources(updatedGame, faction)
  
  // 5. Recruit units if needed
  updatedGame = processAIRecruitment(updatedGame, faction)
  
  return updatedGame
}

// Assess threats from other factions
function assessThreats(game: GameState, faction: Faction): Map<string, number> {
  const threats = new Map<string, number>()
  
  for (const [otherId, other] of game.factions) {
    if (otherId === faction.id || other.isDefeated) continue
    
    let threatLevel = 0
    
    // Check if at war
    const relation = faction.relations.find(r => r.targetId === otherId)
    if (relation?.status === 'war') {
      threatLevel += 50
    } else if (relation && relation.value < -30) {
      threatLevel += 20
    }
    
    // Check military strength
    const ourStrength = calculateMilitaryStrength(game, faction.id)
    const theirStrength = calculateMilitaryStrength(game, otherId)
    
    if (theirStrength > ourStrength * 1.5) {
      threatLevel += 30
    } else if (theirStrength > ourStrength) {
      threatLevel += 15
    }
    
    // Check territory proximity
    const bordersUs = faction.territories.some(tid => {
      const territory = game.territories.get(tid)
      return territory?.connectedTerritories.some(cid => 
        other.territories.includes(cid)
      )
    })
    
    if (bordersUs) {
      threatLevel += 15
    }
    
    // Check past betrayals
    if (faction.aiState?.memory.betrayals.some(b => b.factionId === otherId)) {
      threatLevel += 25
    }
    
    threats.set(otherId, threatLevel)
  }
  
  return threats
}

// Calculate military strength
function calculateMilitaryStrength(game: GameState, factionId: string): number {
  let strength = 0
  
  for (const [armyId, army] of game.armies) {
    if (army.ownerId !== factionId) continue
    
    for (const unit of army.units) {
      const stats = UNIT_STATS[unit.type]
      strength += unit.count * (stats.attack + stats.defense) * (1 + unit.experience / 100)
    }
  }
  
  return strength
}

// Decide on overall strategy
function decideStrategy(
  game: GameState,
  faction: Faction,
  threats: Map<string, number>
): string {
  const aiState = faction.aiState
  if (!aiState) return 'consolidate'
  
  const weights = aiState.priorities
  
  // Check for immediate threats
  const maxThreat = Math.max(...Array.from(threats.values()))
  
  if (maxThreat > 70) {
    return 'defend'
  }
  
  // Calculate strategy scores
  const scores: Record<string, number> = {
    expand: weights.expansion,
    defend: weights.defense,
    attack: weights.military,
    consolidate: weights.economy,
    diplomacy: weights.diplomacy,
    raid: aiState.personality === 'raider' ? 30 : 10,
  }
  
  // Adjust based on situation
  const territoryCount = faction.territories.length
  const totalTerritories = game.territories.size
  const controlPercent = territoryCount / totalTerritories
  
  if (controlPercent < 0.1) {
    scores.consolidate += 20
    scores.defend += 15
  } else if (controlPercent > 0.3) {
    scores.attack += 15
    scores.expand += 10
  }
  
  // Check resource levels
  if (faction.resources.gold < 200 || faction.resources.food < 100) {
    scores.consolidate += 25
    scores.raid += 15
  }
  
  // At war? Prioritize military
  const atWar = faction.relations.some(r => r.status === 'war')
  if (atWar) {
    scores.attack += 30
    scores.defend += 20
  }
  
  // Find highest scoring strategy
  let bestStrategy = 'consolidate'
  let bestScore = 0
  
  for (const [strategy, score] of Object.entries(scores)) {
    // Add some randomness
    const finalScore = score + Math.random() * 20
    if (finalScore > bestScore) {
      bestScore = finalScore
      bestStrategy = strategy
    }
  }
  
  return bestStrategy
}

// Execute expansion strategy
function executeExpansion(game: GameState, faction: Faction): GameState {
  let updatedGame = { ...game }
  const updatedTerritories = new Map(game.territories)
  const updatedFactions = new Map(game.factions)
  
  // Find unowned adjacent territories
  const unownedAdjacent: Territory[] = []
  
  for (const tid of faction.territories) {
    const territory = game.territories.get(tid)
    if (!territory) continue
    
    for (const adjId of territory.connectedTerritories) {
      const adj = game.territories.get(adjId)
      if (adj && !adj.ownerId) {
        unownedAdjacent.push(adj)
      }
    }
  }
  
  // Claim the best unowned territory
  if (unownedAdjacent.length > 0) {
    // Sort by value (trade route + resources)
    unownedAdjacent.sort((a, b) => b.tradeRouteValue - a.tradeRouteValue)
    
    const target = unownedAdjacent[0]
    target.ownerId = faction.id
    updatedTerritories.set(target.id, target)
    
    const updatedFaction = {
      ...faction,
      territories: [...faction.territories, target.id],
    }
    updatedFactions.set(faction.id, updatedFaction)
    
    updatedGame = { ...updatedGame, territories: updatedTerritories, factions: updatedFactions }
  }
  
  return updatedGame
}

// Execute defense strategy
function executeDefense(game: GameState, faction: Faction): GameState {
  let updatedGame = { ...game }
  const updatedArmies = new Map(game.armies)
  
  // Move armies to threatened territories
  const borderTerritories = faction.territories.filter(tid => {
    const territory = game.territories.get(tid)
    return territory?.connectedTerritories.some(adjId => {
      const adj = game.territories.get(adjId)
      return adj && adj.ownerId && adj.ownerId !== faction.id
    })
  })
  
  // Find armies not on borders
  for (const armyId of faction.armies) {
    const army = game.armies.get(armyId)
    if (!army || army.destination || army.isSieging) continue
    
    // Check if army is on border
    if (!borderTerritories.includes(army.position)) {
      // Move to nearest border territory
      if (borderTerritories.length > 0) {
        const target = borderTerritories[Math.floor(Math.random() * borderTerritories.length)]
        const updatedArmy = { ...army, destination: target, movementProgress: 0 }
        updatedArmies.set(armyId, updatedArmy)
      }
    }
  }
  
  return { ...updatedGame, armies: updatedArmies }
}

// Execute attack strategy
function executeAttack(game: GameState, faction: Faction, threats: Map<string, number>): GameState {
  let updatedGame = { ...game }
  const updatedArmies = new Map(game.armies)
  const updatedTerritories = new Map(game.territories)
  const updatedFactions = new Map(game.factions)
  
  // Find target faction (at war or hostile)
  let targetFactionId: string | null = null
  let bestTarget = -Infinity
  
  for (const relation of faction.relations) {
    if (relation.status === 'war') {
      targetFactionId = relation.targetId
      break
    }
    
    if (relation.value < -30) {
      const targetFaction = game.factions.get(relation.targetId)
      if (targetFaction && !targetFaction.isDefeated) {
        const ourStrength = calculateMilitaryStrength(game, faction.id)
        const theirStrength = calculateMilitaryStrength(game, relation.targetId)
        
        // Only attack if we're stronger
        if (ourStrength > theirStrength * 1.2) {
          const score = ourStrength / theirStrength - relation.value / 100
          if (score > bestTarget) {
            bestTarget = score
            targetFactionId = relation.targetId
          }
        }
      }
    }
  }
  
  if (!targetFactionId) return game
  
  // Declare war if not already at war
  const relation = faction.relations.find(r => r.targetId === targetFactionId)
  if (relation && relation.status !== 'war') {
    // Declare war
    const updatedRelations = faction.relations.map(r =>
      r.targetId === targetFactionId
        ? { ...r, status: 'war' as DiplomaticStatus, value: Math.max(-100, r.value - 40) }
        : r
    )
    
    const updatedFaction = { ...faction, relations: updatedRelations }
    updatedFactions.set(faction.id, updatedFaction)
    
    // Update target's relations too
    const targetFaction = game.factions.get(targetFactionId)
    if (targetFaction) {
      const targetRelations = targetFaction.relations.map(r =>
        r.targetId === faction.id
          ? { ...r, status: 'war' as DiplomaticStatus, value: Math.max(-100, r.value - 40) }
          : r
      )
      updatedFactions.set(targetFactionId, { ...targetFaction, relations: targetRelations })
    }
    
    // Add war event
    const event: GameEvent = {
      id: uuid(),
      turn: game.turn,
      type: 'war_declared',
      title: 'War Declared!',
      description: `${faction.name} has declared war on ${targetFaction?.name}!`,
      factionIds: [faction.id, targetFactionId],
      isRead: false,
    }
    
    updatedGame = {
      ...updatedGame,
      factions: updatedFactions,
      eventLog: [...game.eventLog, event],
    }
  }
  
  // Find enemy territories to attack
  const targetFaction = game.factions.get(targetFactionId)
  if (!targetFaction) return updatedGame
  
  const enemyTerritories = targetFaction.territories
    .map(tid => game.territories.get(tid))
    .filter((t): t is Territory => t !== undefined)
  
  // Find adjacent enemy territories
  const attackableTargets: Territory[] = []
  
  for (const tid of faction.territories) {
    const ourTerritory = game.territories.get(tid)
    if (!ourTerritory) continue
    
    for (const adjId of ourTerritory.connectedTerritories) {
      const adj = enemyTerritories.find(t => t.id === adjId)
      if (adj) {
        attackableTargets.push(adj)
      }
    }
  }
  
  if (attackableTargets.length === 0) return updatedGame
  
  // Sort by weakness (lower fortification = easier)
  attackableTargets.sort((a, b) => a.fortificationLevel - b.fortificationLevel)
  
  const target = attackableTargets[0]
  
  // Move armies to attack
  for (const armyId of faction.armies) {
    const army = game.armies.get(armyId)
    if (!army || army.isSieging) continue
    
    // Check if army is adjacent to target
    const armyTerritory = game.territories.get(army.position)
    if (armyTerritory?.connectedTerritories.includes(target.id)) {
      // Start siege or attack
      if (!target.siegeState) {
        const siegeState: SiegeState = {
          attackerId: faction.id,
          attackingArmyId: armyId,
          defenderId: target.ownerId!,
          territoryId: target.id,
          phase: 'approach',
          turnsElapsed: 0,
          wallIntegrity: 100,
          defenderSupplies: target.supplies,
          defenderMorale: target.morale,
          attackerCasualties: 0,
          defenderCasualties: 0,
          breachPoints: 0,
          reliefForceExpected: false,
        }
        
        const updatedArmy = { ...army, isSieging: true, destination: null }
        updatedArmies.set(armyId, updatedArmy)
        
        const updatedTarget = { ...target, siegeState }
        updatedTerritories.set(target.id, updatedTarget)
        
        break // Only one siege at a time
      }
    } else if (!army.destination) {
      // Move toward target
      // Find adjacent territory to target that we own
      const stagingPoint = faction.territories.find(tid => {
        const t = game.territories.get(tid)
        return t?.connectedTerritories.includes(target.id)
      })
      
      if (stagingPoint) {
        const updatedArmy = { ...army, destination: stagingPoint, movementProgress: 0 }
        updatedArmies.set(armyId, updatedArmy)
      }
    }
  }
  
  return {
    ...updatedGame,
    armies: updatedArmies,
    territories: updatedTerritories,
    factions: updatedFactions,
  }
}

// Execute raid strategy
function executeRaid(game: GameState, faction: Faction): GameState {
  let updatedGame = { ...game }
  const updatedArmies = new Map(game.armies)
  const updatedFactions = new Map(game.factions)
  
  // Find enemy territories to raid
  const enemyTerritories: Territory[] = []
  
  for (const [tid, territory] of game.territories) {
    if (territory.ownerId && territory.ownerId !== faction.id) {
      // Check if adjacent
      const isAdjacent = faction.territories.some(ourTid => {
        const our = game.territories.get(ourTid)
        return our?.connectedTerritories.includes(tid)
      })
      
      if (isAdjacent) {
        enemyTerritories.push(territory)
      }
    }
  }
  
  if (enemyTerritories.length === 0) return game
  
  // Pick weakest target
  enemyTerritories.sort((a, b) => a.fortificationLevel - b.fortificationLevel)
  const target = enemyTerritories[0]
  
  // Find army to raid with
  for (const armyId of faction.armies) {
    const army = game.armies.get(armyId)
    if (!army || army.isSieging || army.isRaiding) continue
    
    // Check if has light cavalry (good for raiding)
    const hasRaiders = army.units.some(u => u.type === 'light_cavalry' && u.count > 20)
    
    if (hasRaiders) {
      // Start raid
      const updatedArmy = { ...army, isRaiding: true, destination: target.id }
      updatedArmies.set(armyId, updatedArmy)
      
      // Raiding damages relations
      const targetOwner = game.factions.get(target.ownerId!)
      if (targetOwner) {
        const targetRelations = targetOwner.relations.map(r =>
          r.targetId === faction.id
            ? { ...r, value: Math.max(-100, r.value - 15) }
            : r
        )
        updatedFactions.set(targetOwner.id, { ...targetOwner, relations: targetRelations })
      }
      
      // Gain resources from raid
      const raidGold = Math.floor(20 + Math.random() * 50)
      const raidFood = Math.floor(30 + Math.random() * 70)
      
      const updatedFaction = {
        ...faction,
        resources: {
          ...faction.resources,
          gold: faction.resources.gold + raidGold,
          food: faction.resources.food + raidFood,
        },
      }
      updatedFactions.set(faction.id, updatedFaction)
      
      break
    }
  }
  
  return { ...updatedGame, armies: updatedArmies, factions: updatedFactions }
}

// Execute consolidation strategy
function executeConsolidation(game: GameState, faction: Faction): GameState {
  // Focus on building and economy - handled in resource processing
  return game
}

// Execute diplomacy strategy
function executeDiplomacy(game: GameState, faction: Faction): GameState {
  let updatedGame = { ...game }
  const updatedFactions = new Map(game.factions)
  
  // Find factions to improve relations with
  for (const relation of faction.relations) {
    if (relation.status === 'war') continue
    
    const other = game.factions.get(relation.targetId)
    if (!other || other.isDefeated || other.isPlayer) continue
    
    // Check if we have common enemies
    const ourEnemies = faction.relations
      .filter(r => r.value < -30)
      .map(r => r.targetId)
    
    const theirEnemies = other.relations
      .filter(r => r.value < -30)
      .map(r => r.targetId)
    
    const commonEnemies = ourEnemies.filter(e => theirEnemies.includes(e))
    
    if (commonEnemies.length > 0 && relation.value > -20) {
      // Improve relations
      const updatedRelations = faction.relations.map(r =>
        r.targetId === relation.targetId
          ? { ...r, value: Math.min(100, r.value + 5) }
          : r
      )
      
      updatedFactions.set(faction.id, { ...faction, relations: updatedRelations })
      
      // Mirror improvement
      const theirRelations = other.relations.map(r =>
        r.targetId === faction.id
          ? { ...r, value: Math.min(100, r.value + 5) }
          : r
      )
      
      updatedFactions.set(other.id, { ...other, relations: theirRelations })
    }
  }
  
  return { ...updatedGame, factions: updatedFactions }
}

// Process AI resource collection
function processAIResources(game: GameState, faction: Faction): GameState {
  const updatedFactions = new Map(game.factions)
  
  let totalProduction = {
    gold: 0,
    food: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    tradeGoods: 0,
  }
  
  // Sum production from all territories
  for (const tid of faction.territories) {
    const territory = game.territories.get(tid)
    if (!territory) continue
    
    totalProduction.gold += territory.resourceProduction.gold
    totalProduction.food += territory.resourceProduction.food
    totalProduction.wood += territory.resourceProduction.wood
    totalProduction.stone += territory.resourceProduction.stone
    totalProduction.iron += territory.resourceProduction.iron
    totalProduction.tradeGoods += territory.resourceProduction.tradeGoods
    
    // Trade route bonus
    totalProduction.gold += Math.floor(territory.tradeRouteValue / 5)
  }
  
  // Apply difficulty bonus
  const difficultyMod = DIFFICULTY_MODIFIERS[game.settings.difficulty]
  totalProduction.gold = Math.floor(totalProduction.gold * difficultyMod.aiResourceBonus)
  totalProduction.food = Math.floor(totalProduction.food * difficultyMod.aiResourceBonus)
  
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
  
  updatedFactions.set(faction.id, updatedFaction)
  
  return { ...game, factions: updatedFactions }
}

// Process AI recruitment
function processAIRecruitment(game: GameState, faction: Faction): GameState {
  const updatedArmies = new Map(game.armies)
  const updatedFactions = new Map(game.factions)
  
  // Check if can afford units
  const resources = faction.resources
  
  for (const armyId of faction.armies) {
    const army = game.armies.get(armyId)
    if (!army) continue
    
    // Calculate current army size
    const armySize = army.units.reduce((sum, u) => sum + u.count, 0)
    
    // Recruit if army is small and we have resources
    if (armySize < 300 && resources.gold > 200 && resources.food > 150) {
      // Recruit infantry
      const infantryToRecruit = Math.min(50, Math.floor(resources.gold / 30))
      
      const existingInfantry = army.units.find(u => u.type === 'infantry')
      if (existingInfantry) {
        existingInfantry.count += infantryToRecruit
      } else {
        army.units.push({ type: 'infantry', count: infantryToRecruit, morale: 70, experience: 0 })
      }
      
      // Deduct costs
      const cost = infantryToRecruit * 30
      const updatedFaction = {
        ...updatedFactions.get(faction.id) || faction,
        resources: {
          ...resources,
          gold: resources.gold - cost,
          iron: resources.iron - infantryToRecruit * 5,
        },
      }
      updatedFactions.set(faction.id, updatedFaction)
      updatedArmies.set(armyId, { ...army })
    }
  }
  
  return { ...game, armies: updatedArmies, factions: updatedFactions }
}
