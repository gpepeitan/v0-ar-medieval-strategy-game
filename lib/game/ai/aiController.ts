// AI Controller - Real-Time AI Decision Making

import { v4 as uuid } from 'uuid'
import {
  GameState,
  Faction,
  Territory,
  Army,
  AIState,
  AIPersonality,
  DiplomaticStatus,
  GameEvent,
  SiegeState,
} from '../types'
import {
  DIFFICULTY_MODIFIERS,
  AI_PERSONALITY_WEIGHTS,
  UNIT_STATS,
} from '../constants'

/**
 * Process AI decisions for all AI factions (real-time version)
 * Called periodically based on game speed
 */
export function processAIDecisions(state: GameState): GameState {
  let updatedState = state
  
  for (const [factionId, faction] of state.factions) {
    if (faction.isPlayer || faction.isDefeated) continue
    
    // Initialize AI state if needed
    if (!faction.aiState) {
      const newAIState = initializeAIState(faction)
      const updatedFactions = new Map(updatedState.factions)
      updatedFactions.set(factionId, { ...faction, aiState: newAIState })
      updatedState = { ...updatedState, factions: updatedFactions }
    }
    
    updatedState = processAIFaction(updatedState, factionId)
  }
  
  return updatedState
}

// Legacy export for backwards compatibility
export const processAITurns = processAIDecisions

function initializeAIState(faction: Faction): AIState {
  return {
    personality: faction.personality,
    currentStrategy: 'consolidate',
    targetFaction: null,
    targetTerritory: null,
    threatAssessment: new Map(),
    priorities: {
      expansion: AI_PERSONALITY_WEIGHTS[faction.personality].expansion,
      defense: AI_PERSONALITY_WEIGHTS[faction.personality].defense,
      economy: AI_PERSONALITY_WEIGHTS[faction.personality].economy,
      military: AI_PERSONALITY_WEIGHTS[faction.personality].military,
      diplomacy: AI_PERSONALITY_WEIGHTS[faction.personality].diplomacy,
    },
    memory: {
      brokenTreaties: [],
      betrayals: [],
      wars: [],
      gifts: [],
      negotiations: [],
    },
  }
}

function processAIFaction(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction?.aiState) return state
  
  let updatedState = state
  
  // 1. Assess threats
  const threats = assessThreats(state, faction)
  
  // 2. Decide strategy
  const strategy = decideStrategy(state, faction, threats)
  
  // 3. Update AI state
  const updatedAIState = { ...faction.aiState, currentStrategy: strategy }
  const updatedFactions = new Map(state.factions)
  updatedFactions.set(factionId, { ...faction, aiState: updatedAIState })
  updatedState = { ...updatedState, factions: updatedFactions }
  
  // 4. Execute strategy
  switch (strategy) {
    case 'expand':
      updatedState = executeExpansion(updatedState, factionId)
      break
    case 'defend':
      updatedState = executeDefense(updatedState, factionId)
      break
    case 'attack':
      updatedState = executeAttack(updatedState, factionId, threats)
      break
    case 'raid':
      updatedState = executeRaid(updatedState, factionId)
      break
    case 'consolidate':
      updatedState = executeConsolidation(updatedState, factionId)
      break
    case 'diplomacy':
      updatedState = executeDiplomacy(updatedState, factionId)
      break
  }
  
  // 5. Manage economy and recruitment
  updatedState = processAIEconomy(updatedState, factionId)
  
  return updatedState
}

function assessThreats(state: GameState, faction: Faction): Map<string, number> {
  const threats = new Map<string, number>()
  
  for (const [otherId, other] of state.factions) {
    if (otherId === faction.id || other.isDefeated) continue
    
    let threatLevel = 0
    
    const relation = faction.relations.find(r => r.targetId === otherId)
    if (relation?.status === 'war') {
      threatLevel += 50
    } else if (relation && relation.value < -30) {
      threatLevel += 20
    }
    
    const ourStrength = calculateMilitaryStrength(state, faction.id)
    const theirStrength = calculateMilitaryStrength(state, otherId)
    
    if (theirStrength > ourStrength * 1.5) {
      threatLevel += 30
    } else if (theirStrength > ourStrength) {
      threatLevel += 15
    }
    
    const bordersUs = faction.territories.some(tid => {
      const territory = state.territories.get(tid)
      return territory?.connectedTerritories.some(cid => 
        other.territories.includes(cid)
      )
    })
    
    if (bordersUs) threatLevel += 15
    
    if (faction.aiState?.memory.betrayals.some(b => b.factionId === otherId)) {
      threatLevel += 25
    }
    
    threats.set(otherId, threatLevel)
  }
  
  return threats
}

function calculateMilitaryStrength(state: GameState, factionId: string): number {
  let strength = 0
  
  for (const [, army] of state.armies) {
    if (army.ownerId !== factionId) continue
    
    for (const unit of army.units) {
      const stats = UNIT_STATS[unit.type]
      strength += unit.count * (stats.attack + stats.defense) * (1 + unit.experience / 100)
    }
  }
  
  return strength
}

function decideStrategy(
  state: GameState,
  faction: Faction,
  threats: Map<string, number>
): string {
  const aiState = faction.aiState
  if (!aiState) return 'consolidate'
  
  const weights = aiState.priorities
  const maxThreat = Math.max(0, ...Array.from(threats.values()))
  
  if (maxThreat > 70) return 'defend'
  
  const scores: Record<string, number> = {
    expand: weights.expansion,
    defend: weights.defense,
    attack: weights.military,
    consolidate: weights.economy,
    diplomacy: weights.diplomacy,
    raid: aiState.personality === 'raider' ? 30 : 10,
  }
  
  const territoryCount = faction.territories.length
  const totalTerritories = state.territories.size
  const controlPercent = territoryCount / totalTerritories
  
  if (controlPercent < 0.1) {
    scores.consolidate += 20
    scores.defend += 15
  } else if (controlPercent > 0.3) {
    scores.attack += 15
    scores.expand += 10
  }
  
  if (faction.resources.gold < 200 || faction.resources.food < 100) {
    scores.consolidate += 25
    scores.raid += 15
  }
  
  const atWar = faction.relations.some(r => r.status === 'war')
  if (atWar) {
    scores.attack += 30
    scores.defend += 20
  }
  
  let bestStrategy = 'consolidate'
  let bestScore = 0
  
  for (const [strategy, score] of Object.entries(scores)) {
    const finalScore = score + Math.random() * 20
    if (finalScore > bestScore) {
      bestScore = finalScore
      bestStrategy = strategy
    }
  }
  
  return bestStrategy
}

function executeExpansion(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state
  
  const updatedTerritories = new Map(state.territories)
  const updatedFactions = new Map(state.factions)
  
  const unownedAdjacent: Territory[] = []
  
  for (const tid of faction.territories) {
    const territory = state.territories.get(tid)
    if (!territory) continue
    
    for (const adjId of territory.connectedTerritories) {
      const adj = state.territories.get(adjId)
      if (adj && !adj.ownerId) {
        unownedAdjacent.push(adj)
      }
    }
  }
  
  if (unownedAdjacent.length > 0) {
    unownedAdjacent.sort((a, b) => b.tradeRouteValue - a.tradeRouteValue)
    
    const target = unownedAdjacent[0]
    const updatedTarget = { ...target, ownerId: factionId }
    updatedTerritories.set(target.id, updatedTarget)
    
    const updatedFaction = {
      ...faction,
      territories: [...faction.territories, target.id],
    }
    updatedFactions.set(factionId, updatedFaction)
    
    return { ...state, territories: updatedTerritories, factions: updatedFactions }
  }
  
  return state
}

function executeDefense(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state
  
  const updatedArmies = new Map(state.armies)
  
  const borderTerritories = faction.territories.filter(tid => {
    const territory = state.territories.get(tid)
    return territory?.connectedTerritories.some(adjId => {
      const adj = state.territories.get(adjId)
      return adj && adj.ownerId && adj.ownerId !== factionId
    })
  })
  
  for (const armyId of faction.armies) {
    const army = state.armies.get(armyId)
    if (!army || army.targetTerritoryId || army.isSieging || army.inBattle) continue
    
    if (!borderTerritories.includes(army.currentTerritoryId)) {
      if (borderTerritories.length > 0) {
        const target = borderTerritories[Math.floor(Math.random() * borderTerritories.length)]
        const targetTerritory = state.territories.get(target)
        if (targetTerritory) {
          const updatedArmy = {
            ...army,
            targetTerritoryId: target,
            targetPosition: targetTerritory.center,
            movementProgress: 0,
          }
          updatedArmies.set(armyId, updatedArmy)
          break
        }
      }
    }
  }
  
  return { ...state, armies: updatedArmies }
}

function executeAttack(state: GameState, factionId: string, threats: Map<string, number>): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state
  
  let updatedState = state
  const updatedArmies = new Map(state.armies)
  const updatedTerritories = new Map(state.territories)
  const updatedFactions = new Map(state.factions)
  
  // Find target faction
  let targetFactionId: string | null = null
  let bestTarget = -Infinity
  
  for (const relation of faction.relations) {
    if (relation.status === 'war') {
      targetFactionId = relation.targetId
      break
    }
    
    if (relation.value < -30) {
      const targetFaction = state.factions.get(relation.targetId)
      if (targetFaction && !targetFaction.isDefeated) {
        const ourStrength = calculateMilitaryStrength(state, factionId)
        const theirStrength = calculateMilitaryStrength(state, relation.targetId)
        
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
  
  if (!targetFactionId) return state
  
  // Declare war if needed
  const relation = faction.relations.find(r => r.targetId === targetFactionId)
  if (relation && relation.status !== 'war') {
    const updatedRelations = faction.relations.map(r =>
      r.targetId === targetFactionId
        ? { ...r, status: 'war' as DiplomaticStatus, value: Math.max(-100, r.value - 40) }
        : r
    )
    
    updatedFactions.set(factionId, { ...faction, relations: updatedRelations })
    
    const targetFaction = state.factions.get(targetFactionId)
    if (targetFaction) {
      const targetRelations = targetFaction.relations.map(r =>
        r.targetId === factionId
          ? { ...r, status: 'war' as DiplomaticStatus, value: Math.max(-100, r.value - 40) }
          : r
      )
      updatedFactions.set(targetFactionId, { ...targetFaction, relations: targetRelations })
    }
    
    const event: GameEvent = {
      id: uuid(),
      day: state.time.totalDays,
      type: 'war_declared',
      title: 'War Declared!',
      description: `${faction.name} has declared war on ${targetFaction?.name}!`,
      factionIds: [factionId, targetFactionId],
      isRead: false,
    }
    
    updatedState = {
      ...state,
      factions: updatedFactions,
      eventLog: [...state.eventLog, event],
    }
  }
  
  // Find enemy territory to attack
  const targetFaction = updatedState.factions.get(targetFactionId)
  if (!targetFaction) return updatedState
  
  const attackableTargets: Territory[] = []
  
  for (const tid of faction.territories) {
    const ourTerritory = state.territories.get(tid)
    if (!ourTerritory) continue
    
    for (const adjId of ourTerritory.connectedTerritories) {
      if (targetFaction.territories.includes(adjId)) {
        const adj = state.territories.get(adjId)
        if (adj) attackableTargets.push(adj)
      }
    }
  }
  
  if (attackableTargets.length === 0) return updatedState
  
  attackableTargets.sort((a, b) => a.fortificationLevel - b.fortificationLevel)
  const target = attackableTargets[0]
  
  // Move armies toward target
  for (const armyId of faction.armies) {
    const army = state.armies.get(armyId)
    if (!army || army.isSieging || army.inBattle) continue
    
    const armyTerritory = state.territories.get(army.currentTerritoryId)
    if (armyTerritory?.connectedTerritories.includes(target.id)) {
      // Start siege
      if (!target.siegeState) {
        const siegeState: SiegeState = {
          attackerId: factionId,
          attackingArmyId: armyId,
          defenderId: target.ownerId!,
          territoryId: target.id,
          phase: 'approach',
          startDay: state.time.totalDays,
          daysElapsed: 0,
          wallIntegrity: 100,
          defenderSupplies: target.supplies,
          defenderMorale: target.morale,
          attackerCasualties: 0,
          defenderCasualties: 0,
          breachPoints: 0,
          reliefForceExpected: false,
          lastTickDay: state.time.totalDays,
        }
        
        const updatedArmy = { ...army, isSieging: true, targetTerritoryId: null }
        updatedArmies.set(armyId, updatedArmy)
        
        const updatedTarget = { ...target, siegeState }
        updatedTerritories.set(target.id, updatedTarget)
        
        break
      }
    } else if (!army.targetTerritoryId) {
      // Move toward target
      const stagingPoint = faction.territories.find(tid => {
        const t = state.territories.get(tid)
        return t?.connectedTerritories.includes(target.id)
      })
      
      if (stagingPoint) {
        const stagingTerritory = state.territories.get(stagingPoint)
        if (stagingTerritory) {
          const updatedArmy = {
            ...army,
            targetTerritoryId: stagingPoint,
            targetPosition: stagingTerritory.center,
            movementProgress: 0,
          }
          updatedArmies.set(armyId, updatedArmy)
        }
      }
    }
  }
  
  return {
    ...updatedState,
    armies: updatedArmies,
    territories: updatedTerritories,
  }
}

function executeRaid(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state
  
  const updatedFactions = new Map(state.factions)
  
  // Find adjacent enemy territories
  const enemyTerritories: Territory[] = []
  
  for (const [tid, territory] of state.territories) {
    if (territory.ownerId && territory.ownerId !== factionId) {
      const isAdjacent = faction.territories.some(ourTid => {
        const our = state.territories.get(ourTid)
        return our?.connectedTerritories.includes(tid)
      })
      
      if (isAdjacent) enemyTerritories.push(territory)
    }
  }
  
  if (enemyTerritories.length === 0) return state
  
  // Raid weakest target
  enemyTerritories.sort((a, b) => a.fortificationLevel - b.fortificationLevel)
  const target = enemyTerritories[0]
  
  // Gain resources from raid
  const raidGold = Math.floor(10 + Math.random() * 30)
  const raidFood = Math.floor(15 + Math.random() * 40)
  
  const updatedFaction = {
    ...faction,
    resources: {
      ...faction.resources,
      gold: faction.resources.gold + raidGold,
      food: faction.resources.food + raidFood,
    },
  }
  updatedFactions.set(factionId, updatedFaction)
  
  // Damage relations with target
  const targetOwner = state.factions.get(target.ownerId!)
  if (targetOwner) {
    const targetRelations = targetOwner.relations.map(r =>
      r.targetId === factionId
        ? { ...r, value: Math.max(-100, r.value - 10) }
        : r
    )
    updatedFactions.set(targetOwner.id, { ...targetOwner, relations: targetRelations })
  }
  
  return { ...state, factions: updatedFactions }
}

function executeConsolidation(state: GameState, factionId: string): GameState {
  // Focus on building economy - handled elsewhere
  return state
}

function executeDiplomacy(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state
  
  const updatedFactions = new Map(state.factions)
  
  for (const relation of faction.relations) {
    if (relation.status === 'war') continue
    
    const other = state.factions.get(relation.targetId)
    if (!other || other.isDefeated || other.isPlayer) continue
    
    // Look for common enemies
    const ourEnemies = faction.relations.filter(r => r.value < -30).map(r => r.targetId)
    const theirEnemies = other.relations.filter(r => r.value < -30).map(r => r.targetId)
    const commonEnemies = ourEnemies.filter(e => theirEnemies.includes(e))
    
    if (commonEnemies.length > 0 && relation.value > -20) {
      const updatedRelations = faction.relations.map(r =>
        r.targetId === relation.targetId
          ? { ...r, value: Math.min(100, r.value + 3) }
          : r
      )
      updatedFactions.set(factionId, { ...faction, relations: updatedRelations })
      
      const theirRelations = other.relations.map(r =>
        r.targetId === factionId
          ? { ...r, value: Math.min(100, r.value + 3) }
          : r
      )
      updatedFactions.set(other.id, { ...other, relations: theirRelations })
    }
  }
  
  return { ...state, factions: updatedFactions }
}

function processAIEconomy(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state
  
  const updatedArmies = new Map(state.armies)
  const updatedFactions = new Map(state.factions)
  
  // Count total troops
  let totalTroops = 0
  for (const armyId of faction.armies) {
    const army = state.armies.get(armyId)
    if (army) {
      totalTroops += army.units.reduce((sum, u) => sum + u.count, 0)
    }
  }
  
  // Recruit if we have resources and few troops
  if (totalTroops < faction.territories.length * 15 && faction.resources.gold > 150) {
    const army = faction.armies.length > 0 ? state.armies.get(faction.armies[0]) : null
    
    if (army) {
      const toRecruit = Math.min(10, Math.floor(faction.resources.gold / 20))
      const existingInfantry = army.units.find(u => u.type === 'infantry')
      
      const updatedUnits = existingInfantry
        ? army.units.map(u => u.type === 'infantry' ? { ...u, count: u.count + toRecruit } : u)
        : [...army.units, { type: 'infantry' as const, count: toRecruit, morale: 80, experience: 0 }]
      
      updatedArmies.set(army.id, { ...army, units: updatedUnits })
      
      const cost = toRecruit * 15
      updatedFactions.set(factionId, {
        ...faction,
        resources: { ...faction.resources, gold: faction.resources.gold - cost },
      })
      
      return { ...state, armies: updatedArmies, factions: updatedFactions }
    }
  }
  
  return state
}
