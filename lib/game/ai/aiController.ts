// AI Controller - Real-Time AI Decision Making

import { v4 as uuid } from 'uuid'
import {
  GameState,
  Faction,
  Territory,
  Army,
  FactionPersonality,
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
    updatedState = processAIFaction(updatedState, factionId)
  }

  return updatedState
}

// Legacy export for backwards compatibility
export const processAITurns = processAIDecisions

function processAIFaction(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state

  // 1. Assess threats
  const threats = assessThreats(state, faction)

  // 2. Decide strategy
  const strategy = decideStrategy(state, faction, threats)

  // 3. Execute strategy
  switch (strategy) {
    case 'expand':    return executeExpansion(state, factionId)
    case 'defend':    return executeDefense(state, factionId)
    case 'attack':    return executeAttack(state, factionId, threats)
    case 'raid':      return executeRaid(state, factionId)
    case 'consolidate': return executeConsolidation(state, factionId)
    case 'diplomacy': return executeDiplomacy(state, factionId)
    default:          return processAIEconomy(state, factionId)
  }
}

function assessThreats(state: GameState, faction: Faction): Map<string, number> {
  const threats = new Map<string, number>()

  for (const [otherId, other] of state.factions) {
    if (otherId === faction.id || other.isDefeated) continue

    let threatLevel = 0

    const relation = faction.relations.get(otherId)
    if (relation?.status === 'war') {
      threatLevel += 50
    } else if (relation && relation.value < -30) {
      threatLevel += 20
    }

    const ourStrength = calculateMilitaryStrength(state, faction.id)
    const theirStrength = calculateMilitaryStrength(state, otherId)

    if (theirStrength > ourStrength * 1.5) threatLevel += 30
    else if (theirStrength > ourStrength) threatLevel += 15

    const bordersUs = faction.territories.some(tid => {
      const territory = state.territories.get(tid)
      return territory?.connectedTerritories.some(cid =>
        other.territories.includes(cid)
      )
    })
    if (bordersUs) threatLevel += 15

    threats.set(otherId, threatLevel)
  }

  return threats
}

function calculateMilitaryStrength(state: GameState, factionId: string): number {
  let strength = 0
  for (const [, army] of state.armies) {
    if (army.ownerId !== factionId) continue
    for (const unit of army.units) {
      const stats = UNIT_STATS[unit.type as keyof typeof UNIT_STATS]
      if (!stats) continue
      strength += unit.count * (stats.attack + stats.defense) * (1 + unit.strength / 100)
    }
  }
  return strength
}

function decideStrategy(
  state: GameState,
  faction: Faction,
  threats: Map<string, number>
): string {
  const personality = faction.personality
  const weights = AI_PERSONALITY_WEIGHTS[personality]
  const maxThreat = Math.max(0, ...Array.from(threats.values()))

  if (maxThreat > 70) return 'defend'

  const scores: Record<string, number> = {
    expand:      weights.expansion,
    defend:      weights.defense,
    attack:      weights.military,
    consolidate: weights.economy,
    diplomacy:   weights.diplomacy,
    raid:        personality === 'raider' ? 30 : 10,
  }

  const controlPercent = faction.territories.length / state.territories.size
  if (controlPercent < 0.1) { scores.consolidate += 20; scores.defend += 15 }
  else if (controlPercent > 0.3) { scores.attack += 15; scores.expand += 10 }

  if (faction.resources.gold < 200 || faction.resources.food < 100) {
    scores.consolidate += 25
    scores.raid += 15
  }

  const atWar = Array.from(faction.relations.values()).some(r => r.status === 'war')
  if (atWar) { scores.attack += 30; scores.defend += 20 }

  let bestStrategy = 'consolidate'
  let bestScore = 0
  for (const [strategy, score] of Object.entries(scores)) {
    const finalScore = score + Math.random() * 20
    if (finalScore > bestScore) { bestScore = finalScore; bestStrategy = strategy }
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
      if (adj && !adj.ownerId) unownedAdjacent.push(adj)
    }
  }

  if (unownedAdjacent.length > 0) {
    const target = unownedAdjacent[0]
    updatedTerritories.set(target.id, { ...target, ownerId: factionId })
    updatedFactions.set(factionId, { ...faction, territories: [...faction.territories, target.id] })
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
    if (!army || army.targetTerritoryId || army.isInBattle) continue

    if (!borderTerritories.includes(army.currentTerritoryId) && borderTerritories.length > 0) {
      const target = borderTerritories[Math.floor(Math.random() * borderTerritories.length)]
      updatedArmies.set(armyId, { ...army, targetTerritoryId: target, movementProgress: 0 })
      break
    }
  }
  return { ...state, armies: updatedArmies }
}

function executeAttack(state: GameState, factionId: string, _threats: Map<string, number>): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state

  let updatedState = state
  const updatedArmies = new Map(state.armies)
  const updatedTerritories = new Map(state.territories)
  const updatedFactions = new Map(state.factions)

  // Find target faction
  let targetFactionId: string | null = null
  let bestTarget = -Infinity

  for (const [otherId, relation] of faction.relations) {
    if (relation.status === 'war') { targetFactionId = otherId; break }

    if (relation.value < -30) {
      const targetFaction = state.factions.get(otherId)
      if (targetFaction && !targetFaction.isDefeated) {
        const ourStrength = calculateMilitaryStrength(state, factionId)
        const theirStrength = calculateMilitaryStrength(state, otherId)
        if (ourStrength > theirStrength * 1.2) {
          const score = ourStrength / theirStrength - relation.value / 100
          if (score > bestTarget) { bestTarget = score; targetFactionId = otherId }
        }
      }
    }
  }

  if (!targetFactionId) return state

  // Declare war if needed
  const relation = faction.relations.get(targetFactionId)
  if (relation && relation.status !== 'war') {
    const newRelations = new Map(faction.relations)
    newRelations.set(targetFactionId, { ...relation, status: 'war' as DiplomaticStatus, value: Math.max(-100, relation.value - 40) })
    updatedFactions.set(factionId, { ...faction, relations: newRelations })

    const targetFaction = state.factions.get(targetFactionId)
    if (targetFaction) {
      const targetRelations = new Map(targetFaction.relations)
      const theirRelation = targetFaction.relations.get(factionId)
      if (theirRelation) {
        targetRelations.set(factionId, { ...theirRelation, status: 'war' as DiplomaticStatus, value: Math.max(-100, theirRelation.value - 40) })
        updatedFactions.set(targetFactionId, { ...targetFaction, relations: targetRelations })
      }
    }

    const event: GameEvent = {
      id: uuid(),
      day: state.time.totalDays,
      type: 'war_declared',
      title: 'War Declared!',
      description: `${faction.name} has declared war on ${state.factions.get(targetFactionId)?.name}!`,
      factionId: factionId,
      isRead: false,
    }
    updatedState = { ...state, factions: updatedFactions, events: [...state.events, event] }
  }

  // Find enemy territory to attack
  const currentFaction = updatedState.factions.get(factionId)
  if (!currentFaction) return updatedState

  const attackableTargets: Territory[] = []
  for (const tid of currentFaction.territories) {
    const ourTerritory = state.territories.get(tid)
    if (!ourTerritory) continue
    for (const adjId of ourTerritory.connectedTerritories) {
      const adj = state.territories.get(adjId)
      if (adj && state.factions.get(targetFactionId)?.territories.includes(adjId)) {
        attackableTargets.push(adj)
      }
    }
  }

  if (attackableTargets.length === 0) return updatedState
  attackableTargets.sort((a, b) => a.fortificationLevel - b.fortificationLevel)
  const target = attackableTargets[0]

  for (const armyId of currentFaction.armies) {
    const army = state.armies.get(armyId)
    if (!army || army.isInBattle) continue

    const armyTerritory = state.territories.get(army.currentTerritoryId)
    if (armyTerritory?.connectedTerritories.includes(target.id)) {
      if (!target.siegeState) {
        const siegeState: SiegeState = {
          attackerId: factionId,
          defenderId: target.ownerId!,
          territoryId: target.id,
          phase: 'approach',
          startDay: state.time.totalDays,
          daysElapsed: 0,
          wallIntegrity: 100,
          attackerStrength: calculateMilitaryStrength(state, factionId),
          defenderStrength: calculateMilitaryStrength(state, target.ownerId!),
          attackerCasualties: 0,
          defenderCasualties: 0,
        }
        updatedTerritories.set(target.id, { ...target, siegeState })
        break
      }
    } else if (!army.targetTerritoryId) {
      const stagingPoint = currentFaction.territories.find(tid => {
        const t = state.territories.get(tid)
        return t?.connectedTerritories.includes(target.id)
      })
      if (stagingPoint) {
        updatedArmies.set(armyId, { ...army, targetTerritoryId: stagingPoint, movementProgress: 0 })
      }
    }
  }

  return { ...updatedState, armies: updatedArmies, territories: updatedTerritories }
}

function executeRaid(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state

  const updatedFactions = new Map(state.factions)
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

  enemyTerritories.sort((a, b) => a.fortificationLevel - b.fortificationLevel)
  const target = enemyTerritories[0]

  const raidGold = Math.floor(10 + Math.random() * 30)
  const raidFood = Math.floor(15 + Math.random() * 40)

  updatedFactions.set(factionId, {
    ...faction,
    resources: { ...faction.resources, gold: faction.resources.gold + raidGold, food: faction.resources.food + raidFood },
  })

  const targetOwner = target.ownerId ? state.factions.get(target.ownerId) : null
  if (targetOwner) {
    const theirRelations = new Map(targetOwner.relations)
    const rel = theirRelations.get(factionId)
    if (rel) theirRelations.set(factionId, { ...rel, value: Math.max(-100, rel.value - 10) })
    updatedFactions.set(targetOwner.id, { ...targetOwner, relations: theirRelations })
  }

  return { ...state, factions: updatedFactions }
}

function executeConsolidation(state: GameState, _factionId: string): GameState {
  return state
}

function executeDiplomacy(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state

  const updatedFactions = new Map(state.factions)

  for (const [otherId, relation] of faction.relations) {
    if (relation.status === 'war') continue

    const other = state.factions.get(otherId)
    if (!other || other.isDefeated || other.isPlayer) continue

    const ourEnemies = Array.from(faction.relations.entries())
      .filter(([, r]) => r.value < -30).map(([id]) => id)
    const theirEnemies = Array.from(other.relations.entries())
      .filter(([, r]) => r.value < -30).map(([id]) => id)
    const commonEnemies = ourEnemies.filter(e => theirEnemies.includes(e))

    if (commonEnemies.length > 0 && relation.value > -20) {
      const newOurRelations = new Map(faction.relations)
      newOurRelations.set(otherId, { ...relation, value: Math.min(100, relation.value + 3) })
      updatedFactions.set(factionId, { ...faction, relations: newOurRelations })

      const theirRelation = other.relations.get(factionId)
      if (theirRelation) {
        const newTheirRelations = new Map(other.relations)
        newTheirRelations.set(factionId, { ...theirRelation, value: Math.min(100, theirRelation.value + 3) })
        updatedFactions.set(otherId, { ...other, relations: newTheirRelations })
      }
    }
  }
  return { ...state, factions: updatedFactions }
}

function processAIEconomy(state: GameState, factionId: string): GameState {
  const faction = state.factions.get(factionId)
  if (!faction) return state

  const updatedArmies = new Map(state.armies)
  const updatedFactions = new Map(state.factions)

  let totalTroops = 0
  for (const armyId of faction.armies) {
    const army = state.armies.get(armyId)
    if (army) totalTroops += army.units.reduce((sum, u) => sum + u.count, 0)
  }

  if (totalTroops < faction.territories.length * 15 && faction.resources.gold > 150) {
    const army = faction.armies.length > 0 ? state.armies.get(faction.armies[0]) : null
    if (army) {
      const toRecruit = Math.min(10, Math.floor(faction.resources.gold / 20))
      const existingInfantry = army.units.find(u => u.type === 'infantry')

      const updatedUnits = existingInfantry
        ? army.units.map(u => u.type === 'infantry' ? { ...u, count: u.count + toRecruit } : u)
        : [...army.units, { type: 'infantry' as const, count: toRecruit, morale: 80, strength: 100 }]

      updatedArmies.set(army.id, { ...army, units: updatedUnits })
      updatedFactions.set(factionId, {
        ...faction,
        resources: { ...faction.resources, gold: faction.resources.gold - toRecruit * 15 },
      })
      return { ...state, armies: updatedArmies, factions: updatedFactions }
    }
  }
  return state
}
