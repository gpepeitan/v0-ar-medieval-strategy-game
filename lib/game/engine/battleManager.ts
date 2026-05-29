// Battle Manager - Handles battle notifications, timers, and resolution

import { v4 as uuid } from 'uuid'
import {
  GameState,
  Battle,
  BattleFormation,
  BattleFocus,
  BattleOrder,
  Army,
  GameEvent,
  Resources,
} from '../types'
import { UNIT_STATS } from '../constants'

const DEFAULT_BATTLE_TIMER = 45 // seconds

/**
 * Check for army encounters and create battles
 */
export function checkForBattles(state: GameState): GameState {
  const armies = Array.from(state.armies.values())
  const newBattles = new Map(state.battles)
  const updatedArmies = new Map(state.armies)
  const events: GameEvent[] = []

  // Group armies by territory
  const armiesByTerritory = new Map<string, Army[]>()
  for (const army of armies) {
    if (army.isInBattle) continue
    const tid = army.currentTerritoryId
    if (!armiesByTerritory.has(tid)) armiesByTerritory.set(tid, [])
    armiesByTerritory.get(tid)!.push(army)
  }

  for (const [territoryId, armiesInTerritory] of armiesByTerritory) {
    if (armiesInTerritory.length < 2) continue

    const byOwner = new Map<string, Army[]>()
    for (const army of armiesInTerritory) {
      if (!byOwner.has(army.ownerId)) byOwner.set(army.ownerId, [])
      byOwner.get(army.ownerId)!.push(army)
    }
    if (byOwner.size < 2) continue

    const ownerIds = Array.from(byOwner.keys())
    for (let i = 0; i < ownerIds.length; i++) {
      for (let j = i + 1; j < ownerIds.length; j++) {
        const f1Id = ownerIds[i]
        const f2Id = ownerIds[j]
        const f1 = state.factions.get(f1Id)
        const f2 = state.factions.get(f2Id)
        if (!f1 || !f2) continue

        const relation = f1.relations.get(f2Id)
        if (!relation || relation.status !== 'war') continue

        const army1 = byOwner.get(f1Id)!.find(a => !a.isInBattle)
        const army2 = byOwner.get(f2Id)!.find(a => !a.isInBattle)
        if (!army1 || !army2) continue

        const attackerArmy = army1.movementProgress > 0 ? army1 : army2
        const defenderArmy = attackerArmy === army1 ? army2 : army1

        const playerFaction = Array.from(state.factions.values()).find(f => f.isPlayer)
        const battleId = uuid()

        const battle: Battle = {
          id: battleId,
          attackerId: attackerArmy.id,
          defenderId: defenderArmy.id,
          territoryId,
          status: 'pending',
          startTime: Date.now(),
          timerRemainingMs: (state.settings.battleTimer || DEFAULT_BATTLE_TIMER) * 1000,
          attackerCasualties: 0,
          defenderCasualties: 0,
          attackerStrength: calculateArmyStrength(attackerArmy, 'attack'),
          defenderStrength: calculateArmyStrength(defenderArmy, 'defense'),
          rounds: 0,
        }

        newBattles.set(battleId, battle)
        updatedArmies.set(army1.id, { ...army1, isInBattle: true, battleId })
        updatedArmies.set(army2.id, { ...army2, isInBattle: true, battleId })

        const territory = state.territories.get(territoryId)
        events.push({
          id: uuid(),
          day: state.time.totalDays,
          type: 'battle',
          title: 'Battle Engaged!',
          description: `${attackerArmy.name} has engaged ${defenderArmy.name} at ${territory?.name || territoryId}!`,
          factionId: f1Id,
          isRead: false,
        })
      }
    }
  }

  return { ...state, battles: newBattles, armies: updatedArmies, events: [...state.events, ...events] }
}

/**
 * Update battle timers (called with real-time delta)
 */
export function updateBattleTimers(state: GameState, deltaMs: number): GameState {
  const updatedBattles = new Map(state.battles)

  for (const [battleId, battle] of updatedBattles) {
    if (battle.status !== 'pending' && battle.status !== 'active') continue

    const newTimer = Math.max(0, battle.timerRemainingMs - deltaMs)
    updatedBattles.set(battleId, { ...battle, timerRemainingMs: newTimer })

    if (newTimer <= 0 && battle.status === 'pending') {
      updatedBattles.set(battleId, { ...battle, timerRemainingMs: 0, status: 'active' })
    }
  }

  return { ...state, battles: updatedBattles }
}

/**
 * Set player battle commands
 */
export function setPlayerBattleCommands(
  state: GameState,
  battleId: string,
  formation: BattleFormation,
  focus: BattleFocus,
  order: BattleOrder,
): GameState {
  const battle = state.battles.get(battleId)
  if (!battle) return state

  const updatedBattles = new Map(state.battles)
  updatedBattles.set(battleId, {
    ...battle,
    status: 'active',
    playerFormation: formation,
    playerFocus: focus,
    playerOrder: order,
  })

  return { ...state, battles: updatedBattles }
}

/**
 * Resolve active battles
 */
export function resolveBattles(state: GameState): GameState {
  const updatedBattles = new Map(state.battles)
  const updatedArmies = new Map(state.armies)
  const events: GameEvent[] = []

  for (const [battleId, battle] of updatedBattles) {
    if (battle.status !== 'active' || battle.timerRemainingMs > 0) continue

    const attackerArmy = state.armies.get(battle.attackerId)
    const defenderArmy = state.armies.get(battle.defenderId)

    if (!attackerArmy || !defenderArmy) {
      updatedBattles.delete(battleId)
      continue
    }

    const result = calculateBattleResult(attackerArmy, defenderArmy, battle, state)
    const [newAttacker, newDefender] = applyCasualties(attackerArmy, defenderArmy, result.attackerCasualties, result.defenderCasualties)

    const finalAttacker = { ...newAttacker, isInBattle: false, battleId: null }
    const finalDefender = { ...newDefender, isInBattle: false, battleId: null }

    updatedArmies.set(attackerArmy.id, finalAttacker)
    updatedArmies.set(defenderArmy.id, finalDefender)

    if (getTotalUnits(finalAttacker) <= 0) updatedArmies.delete(attackerArmy.id)
    if (getTotalUnits(finalDefender) <= 0) updatedArmies.delete(defenderArmy.id)

    updatedBattles.set(battleId, {
      ...battle,
      status: 'resolved',
      result: result.result,
      attackerCasualties: result.attackerCasualties,
      defenderCasualties: result.defenderCasualties,
    })

    const territory = state.territories.get(battle.territoryId)
    events.push({
      id: uuid(),
      day: state.time.totalDays,
      type: 'battle',
      title: `Battle Result: ${result.result.replace('_', ' ').toUpperCase()}`,
      description: `Battle at ${territory?.name || battle.territoryId}: ${attackerArmy.name} vs ${defenderArmy.name}. Casualties: ${result.attackerCasualties} vs ${result.defenderCasualties}`,
      factionId: attackerArmy.ownerId,
      isRead: false,
    })
  }

  // Clean up resolved battles
  for (const [battleId, battle] of updatedBattles) {
    if (battle.status === 'resolved') updatedBattles.delete(battleId)
  }

  return { ...state, battles: updatedBattles, armies: updatedArmies, events: [...state.events, ...events] }
}

interface BattleResult {
  result: 'attacker_victory' | 'defender_victory' | 'draw'
  attackerCasualties: number
  defenderCasualties: number
  loot?: Partial<Resources>
}

function calculateBattleResult(attacker: Army, defender: Army, battle: Battle, state: GameState): BattleResult {
  let attackerStrength = calculateArmyStrength(attacker, 'attack')
  let defenderStrength = calculateArmyStrength(defender, 'defense')

  // Commander bonuses
  const attackerCommander = attacker.commander ? state.commanders.get(attacker.commander) : null
  const defenderCommander = defender.commander ? state.commanders.get(defender.commander) : null
  if (attackerCommander) attackerStrength *= 1 + (attackerCommander.stats.tactics * 0.02 + attackerCommander.stats.leadership * 0.01)
  if (defenderCommander) defenderStrength *= 1 + (defenderCommander.stats.tactics * 0.02 + defenderCommander.stats.leadership * 0.01)

  // Terrain bonus
  const territory = state.territories.get(battle.territoryId)
  if (territory) {
    const terrainBonus: Record<string, number> = {
      plains: 0, hills: 15, mountains: 30, forest: 10, marsh: 5, coastal: 0,
      settlement: 10, road: 0, farmland: 0, water: -5, quarry: 5,
    }
    defenderStrength *= 1 + ((terrainBonus[territory.terrain] || 0) / 100)
  }

  // Formation bonuses
  if (battle.playerFormation) {
    const formationBonuses: Record<BattleFormation, { attack: number; defense: number }> = {
      line:      { attack: 1.0, defense: 1.2 },
      wedge:     { attack: 1.3, defense: 0.8 },
      defensive: { attack: 0.7, defense: 1.4 },
      flanking:  { attack: 1.2, defense: 0.9 },
    }
    const bonus = formationBonuses[battle.playerFormation]
    // Apply to the army that is the player's
    const playerFaction = Array.from(state.factions.values()).find(f => f.isPlayer)
    if (playerFaction) {
      if (attacker.ownerId === playerFaction.id) attackerStrength *= bonus.attack
      else defenderStrength *= bonus.defense
    }
  }

  const totalStrength = attackerStrength + defenderStrength
  const attackerChance = attackerStrength / totalStrength
  const attackerWins = Math.random() < attackerChance

  let attackerCasualtyRate = 0.15 + Math.random() * 0.1
  let defenderCasualtyRate = 0.15 + Math.random() * 0.1
  if (attackerWins) { defenderCasualtyRate *= 1.5; attackerCasualtyRate *= 0.7 }
  else              { attackerCasualtyRate *= 1.5; defenderCasualtyRate *= 0.7 }

  const attackerCasualties = Math.floor(getTotalUnits(attacker) * attackerCasualtyRate)
  const defenderCasualties = Math.floor(getTotalUnits(defender) * defenderCasualtyRate)

  let result: BattleResult['result'] = 'draw'
  if (attackerWins && defenderCasualties >= getTotalUnits(defender) * 0.5) result = 'attacker_victory'
  else if (!attackerWins && attackerCasualties >= getTotalUnits(attacker) * 0.5) result = 'defender_victory'
  else result = attackerWins ? 'attacker_victory' : 'defender_victory'

  return {
    result,
    attackerCasualties,
    defenderCasualties,
    loot: result === 'attacker_victory' ? { gold: Math.floor(Math.random() * 50) + 10 } : undefined,
  }
}

export function calculateArmyStrength(army: Army, mode: 'attack' | 'defense'): number {
  let total = 0
  for (const unit of army.units) {
    const stats = UNIT_STATS[unit.type as keyof typeof UNIT_STATS]
    if (!stats) continue
    const baseStat = mode === 'attack' ? stats.attack : stats.defense
    const strengthBonus = 1 + (unit.strength / 200)
    total += unit.count * baseStat * strengthBonus
  }
  return total
}

function getTotalUnits(army: Army): number {
  return army.units.reduce((sum, u) => sum + u.count, 0)
}

function applyCasualties(attacker: Army, defender: Army, attackerCasualties: number, defenderCasualties: number): [Army, Army] {
  const newAttacker = { ...attacker, units: [...attacker.units] }
  const newDefender = { ...defender, units: [...defender.units] }
  distributeCasualties(newAttacker, attackerCasualties)
  distributeCasualties(newDefender, defenderCasualties)
  return [newAttacker, newDefender]
}

function distributeCasualties(army: Army, totalCasualties: number) {
  const totalUnits = getTotalUnits(army)
  if (totalUnits <= 0) return
  let remaining = totalCasualties
  for (let i = 0; i < army.units.length && remaining > 0; i++) {
    const unit = army.units[i]
    const casualties = Math.min(unit.count, Math.ceil(totalCasualties * (unit.count / totalUnits)))
    army.units[i] = { ...unit, count: Math.max(0, unit.count - casualties) }
    remaining -= casualties
  }
  army.units = army.units.filter(u => u.count > 0)
}

/**
 * Get battles that need player attention
 */
export function getPlayerBattles(state: GameState): Battle[] {
  const playerFaction = Array.from(state.factions.values()).find(f => f.isPlayer)
  if (!playerFaction) return []
  return Array.from(state.battles.values()).filter(b => {
    const attacker = state.armies.get(b.attackerId)
    const defender = state.armies.get(b.defenderId)
    return (attacker?.ownerId === playerFaction.id || defender?.ownerId === playerFaction.id)
      && b.status === 'pending'
  })
}
