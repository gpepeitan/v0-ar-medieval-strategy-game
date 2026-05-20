// Battle Manager - Handles battle notifications, timers, and resolution

import { v4 as uuid } from 'uuid'
import { 
  GameState, 
  Battle, 
  BattlePhase, 
  BattleFormation, 
  BattleFocus, 
  BattleOrder,
  Army,
  GameEvent,
  Resources
} from '../types'
import { UNIT_STATS } from '../constants'

const DEFAULT_BATTLE_TIMER = 45 // seconds

/**
 * Check for army encounters and create battles
 */
export function checkForBattles(state: GameState): GameState {
  const armies = Array.from(state.armies.values())
  const newBattles = new Map(state.activeBattles)
  const updatedArmies = new Map(state.armies)
  const events: GameEvent[] = []
  
  // Find armies in the same territory that are at war
  const armiesByTerritory = new Map<string, Army[]>()
  
  for (const army of armies) {
    if (army.inBattle) continue // Already in battle
    
    const territoryId = army.currentTerritoryId
    if (!armiesByTerritory.has(territoryId)) {
      armiesByTerritory.set(territoryId, [])
    }
    armiesByTerritory.get(territoryId)!.push(army)
  }
  
  // Check each territory for hostile armies
  for (const [territoryId, armiesInTerritory] of armiesByTerritory) {
    if (armiesInTerritory.length < 2) continue
    
    // Group by owner
    const byOwner = new Map<string, Army[]>()
    for (const army of armiesInTerritory) {
      if (!byOwner.has(army.ownerId)) {
        byOwner.set(army.ownerId, [])
      }
      byOwner.get(army.ownerId)!.push(army)
    }
    
    if (byOwner.size < 2) continue // Only one faction's armies
    
    // Check each pair of factions for war status
    const ownerIds = Array.from(byOwner.keys())
    for (let i = 0; i < ownerIds.length; i++) {
      for (let j = i + 1; j < ownerIds.length; j++) {
        const faction1Id = ownerIds[i]
        const faction2Id = ownerIds[j]
        
        const faction1 = state.factions.get(faction1Id)
        const faction2 = state.factions.get(faction2Id)
        if (!faction1 || !faction2) continue
        
        // Check if at war
        const relation = faction1.relations.find(r => r.targetId === faction2Id)
        if (!relation || relation.status !== 'war') continue
        
        // Create battle between first available armies
        const army1 = byOwner.get(faction1Id)!.find(a => !a.inBattle)
        const army2 = byOwner.get(faction2Id)!.find(a => !a.inBattle)
        
        if (!army1 || !army2) continue
        
        // Determine attacker (army that moved into territory most recently)
        const attackerArmy = army1.movementProgress > 0 ? army1 : army2
        const defenderArmy = attackerArmy === army1 ? army2 : army1
        
        const playerFaction = Array.from(state.factions.values()).find(f => f.isPlayer)
        const battleId = uuid()
        
        const battle: Battle = {
          id: battleId,
          attackerArmyId: attackerArmy.id,
          defenderArmyId: defenderArmy.id,
          territoryId,
          phase: 'pending',
          startTime: Date.now(),
          timeRemaining: state.settings.battleTimer || DEFAULT_BATTLE_TIMER,
          playerIsAttacker: playerFaction?.id === attackerArmy.ownerId,
          playerIsDefender: playerFaction?.id === defenderArmy.ownerId,
          attackerCasualties: 0,
          defenderCasualties: 0,
          attackerMorale: attackerArmy.morale,
          defenderMorale: defenderArmy.morale,
          rounds: 0,
        }
        
        newBattles.set(battleId, battle)
        
        // Mark armies as in battle
        updatedArmies.set(army1.id, { ...army1, inBattle: battleId })
        updatedArmies.set(army2.id, { ...army2, inBattle: battleId })
        
        // Create event
        const territory = state.territories.get(territoryId)
        events.push({
          id: uuid(),
          turn: state.time.totalDays,
          type: 'battle',
          title: 'Battle Engaged!',
          description: `${attackerArmy.name} has engaged ${defenderArmy.name} at ${territory?.name || territoryId}!`,
          factionIds: [faction1Id, faction2Id],
          isRead: false,
        })
      }
    }
  }
  
  return {
    ...state,
    activeBattles: newBattles,
    armies: updatedArmies,
    eventLog: [...state.eventLog, ...events],
  }
}

/**
 * Update battle timers (called with real-time delta)
 */
export function updateBattleTimers(state: GameState, deltaMs: number): GameState {
  const updatedBattles = new Map(state.activeBattles)
  const deltaSec = deltaMs / 1000
  
  for (const [battleId, battle] of updatedBattles) {
    if (battle.phase === 'pending' || battle.phase === 'player_command') {
      const newTimeRemaining = Math.max(0, battle.timeRemaining - deltaSec)
      
      updatedBattles.set(battleId, {
        ...battle,
        timeRemaining: newTimeRemaining,
      })
      
      // Auto-resolve if timer expired
      if (newTimeRemaining <= 0 && battle.phase !== 'resolving') {
        // Will be resolved in the next cycle
        updatedBattles.set(battleId, {
          ...battle,
          timeRemaining: 0,
          phase: 'resolving',
        })
      }
    }
  }
  
  return {
    ...state,
    activeBattles: updatedBattles,
  }
}

/**
 * Set player battle commands
 */
export function setPlayerBattleCommands(
  state: GameState,
  battleId: string,
  formation: BattleFormation,
  focus: BattleFocus,
  order: BattleOrder
): GameState {
  const battle = state.activeBattles.get(battleId)
  if (!battle || (!battle.playerIsAttacker && !battle.playerIsDefender)) {
    return state
  }
  
  const updatedBattles = new Map(state.activeBattles)
  updatedBattles.set(battleId, {
    ...battle,
    phase: 'resolving',
    playerFormation: formation,
    playerFocus: focus,
    playerOrder: order,
  })
  
  return {
    ...state,
    activeBattles: updatedBattles,
  }
}

/**
 * Resolve pending battles
 */
export function resolveBattles(state: GameState): GameState {
  let updatedState = state
  const updatedBattles = new Map(state.activeBattles)
  const updatedArmies = new Map(state.armies)
  const events: GameEvent[] = []
  
  for (const [battleId, battle] of updatedBattles) {
    if (battle.phase !== 'resolving') continue
    
    const attackerArmy = state.armies.get(battle.attackerArmyId)
    const defenderArmy = state.armies.get(battle.defenderArmyId)
    
    if (!attackerArmy || !defenderArmy) {
      updatedBattles.delete(battleId)
      continue
    }
    
    // Calculate battle outcome
    const result = calculateBattleResult(
      attackerArmy,
      defenderArmy,
      battle,
      state
    )
    
    // Apply casualties
    const [newAttacker, newDefender] = applyCasualties(
      attackerArmy,
      defenderArmy,
      result.attackerCasualties,
      result.defenderCasualties
    )
    
    // Clear battle status from armies
    const finalAttacker = {
      ...newAttacker,
      inBattle: null,
      morale: Math.max(10, newAttacker.morale - (result.result === 'defender_victory' ? 20 : 5)),
    }
    const finalDefender = {
      ...newDefender,
      inBattle: null,
      morale: Math.max(10, newDefender.morale - (result.result === 'attacker_victory' ? 20 : 5)),
    }
    
    updatedArmies.set(attackerArmy.id, finalAttacker)
    updatedArmies.set(defenderArmy.id, finalDefender)
    
    // Remove destroyed armies
    if (getTotalUnits(finalAttacker) <= 0) {
      updatedArmies.delete(attackerArmy.id)
    }
    if (getTotalUnits(finalDefender) <= 0) {
      updatedArmies.delete(defenderArmy.id)
    }
    
    // Mark battle as complete
    updatedBattles.set(battleId, {
      ...battle,
      phase: 'complete',
      result: result.result,
      attackerCasualties: result.attackerCasualties,
      defenderCasualties: result.defenderCasualties,
      loot: result.loot,
    })
    
    // Create result event
    const territory = state.territories.get(battle.territoryId)
    events.push({
      id: uuid(),
      turn: state.time.totalDays,
      type: 'battle',
      title: `Battle Result: ${result.result.replace('_', ' ').toUpperCase()}`,
      description: `Battle at ${territory?.name || battle.territoryId}: ${attackerArmy.name} vs ${defenderArmy.name}. Attacker casualties: ${result.attackerCasualties}, Defender casualties: ${result.defenderCasualties}`,
      factionIds: [attackerArmy.ownerId, defenderArmy.ownerId],
      isRead: false,
    })
  }
  
  // Clean up completed battles after a delay (keep for UI)
  for (const [battleId, battle] of updatedBattles) {
    if (battle.phase === 'complete') {
      // Remove completed battles (they'll be shown in event log)
      updatedBattles.delete(battleId)
    }
  }
  
  return {
    ...state,
    activeBattles: updatedBattles,
    armies: updatedArmies,
    eventLog: [...state.eventLog, ...events],
  }
}

interface BattleResult {
  result: 'attacker_victory' | 'defender_victory' | 'draw' | 'retreat'
  attackerCasualties: number
  defenderCasualties: number
  loot?: Partial<Resources>
}

function calculateBattleResult(
  attacker: Army,
  defender: Army,
  battle: Battle,
  state: GameState
): BattleResult {
  // Calculate army strength
  let attackerStrength = calculateArmyStrength(attacker, 'attack')
  let defenderStrength = calculateArmyStrength(defender, 'defense')
  
  // Get commanders
  const attackerCommander = attacker.commanderId 
    ? state.commanders.get(attacker.commanderId)
    : null
  const defenderCommander = defender.commanderId
    ? state.commanders.get(defender.commanderId)
    : null
  
  // Commander bonuses
  if (attackerCommander) {
    attackerStrength *= 1 + (attackerCommander.stats.tactics * 0.02)
    attackerStrength *= 1 + (attackerCommander.stats.leadership * 0.01)
  }
  if (defenderCommander) {
    defenderStrength *= 1 + (defenderCommander.stats.tactics * 0.02)
    defenderStrength *= 1 + (defenderCommander.stats.leadership * 0.01)
  }
  
  // Terrain bonus for defender
  const territory = state.territories.get(battle.territoryId)
  if (territory) {
    const terrainBonus = getTerrainDefenseBonus(territory.terrain)
    defenderStrength *= 1 + (terrainBonus / 100)
  }
  
  // Morale modifier
  attackerStrength *= battle.attackerMorale / 100
  defenderStrength *= battle.defenderMorale / 100
  
  // Player command bonuses
  if (battle.playerIsAttacker && battle.playerFormation) {
    attackerStrength *= getFormationBonus(battle.playerFormation, 'attack')
  }
  if (battle.playerIsDefender && battle.playerFormation) {
    defenderStrength *= getFormationBonus(battle.playerFormation, 'defense')
  }
  
  // Calculate outcome
  const totalStrength = attackerStrength + defenderStrength
  const attackerChance = attackerStrength / totalStrength
  
  // Add randomness
  const roll = Math.random()
  const attackerWins = roll < attackerChance
  
  // Calculate casualties (base percentage + random)
  const baseCasualtyRate = 0.15
  const casualtyVariance = 0.1
  
  let attackerCasualtyRate = baseCasualtyRate + (Math.random() * casualtyVariance)
  let defenderCasualtyRate = baseCasualtyRate + (Math.random() * casualtyVariance)
  
  // Winner takes fewer casualties
  if (attackerWins) {
    defenderCasualtyRate *= 1.5
    attackerCasualtyRate *= 0.7
  } else {
    attackerCasualtyRate *= 1.5
    defenderCasualtyRate *= 0.7
  }
  
  const attackerCasualties = Math.floor(getTotalUnits(attacker) * attackerCasualtyRate)
  const defenderCasualties = Math.floor(getTotalUnits(defender) * defenderCasualtyRate)
  
  // Determine result
  let result: BattleResult['result']
  if (attackerWins && defenderCasualties >= getTotalUnits(defender) * 0.5) {
    result = 'attacker_victory'
  } else if (!attackerWins && attackerCasualties >= getTotalUnits(attacker) * 0.5) {
    result = 'defender_victory'
  } else if (Math.abs(attackerCasualties - defenderCasualties) < getTotalUnits(attacker) * 0.1) {
    result = 'draw'
  } else {
    result = attackerWins ? 'attacker_victory' : 'defender_victory'
  }
  
  return {
    result,
    attackerCasualties,
    defenderCasualties,
    loot: result === 'attacker_victory' ? { gold: Math.floor(Math.random() * 50) + 10 } : undefined,
  }
}

function calculateArmyStrength(army: Army, mode: 'attack' | 'defense'): number {
  let total = 0
  for (const unit of army.units) {
    const stats = UNIT_STATS[unit.type]
    const baseStat = mode === 'attack' ? stats.attack : stats.defense
    const experienceBonus = 1 + (unit.experience / 200)
    total += unit.count * baseStat * experienceBonus
  }
  return total
}

function getTotalUnits(army: Army): number {
  return army.units.reduce((sum, u) => sum + u.count, 0)
}

function getTerrainDefenseBonus(terrain: string): number {
  const bonuses: Record<string, number> = {
    plains: 0,
    hills: 15,
    mountains: 30,
    forest: 10,
    marsh: 5,
    coastal: 0,
    river: 5,
    desert: -5,
  }
  return bonuses[terrain] || 0
}

function getFormationBonus(formation: BattleFormation, mode: 'attack' | 'defense'): number {
  const bonuses: Record<BattleFormation, { attack: number; defense: number }> = {
    shield_wall: { attack: 0.8, defense: 1.4 },
    skirmish: { attack: 1.1, defense: 0.9 },
    charge: { attack: 1.4, defense: 0.6 },
    defensive: { attack: 0.7, defense: 1.3 },
  }
  return bonuses[formation][mode]
}

function applyCasualties(
  attacker: Army,
  defender: Army,
  attackerCasualties: number,
  defenderCasualties: number
): [Army, Army] {
  const newAttacker = { ...attacker, units: [...attacker.units] }
  const newDefender = { ...defender, units: [...defender.units] }
  
  // Distribute casualties proportionally across unit types
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
    const proportion = unit.count / totalUnits
    const casualties = Math.min(unit.count, Math.ceil(totalCasualties * proportion))
    
    army.units[i] = {
      ...unit,
      count: Math.max(0, unit.count - casualties),
    }
    remaining -= casualties
  }
  
  // Remove empty unit stacks
  army.units = army.units.filter(u => u.count > 0)
}

/**
 * Get battles that need player attention
 */
export function getPlayerBattles(state: GameState): Battle[] {
  return Array.from(state.activeBattles.values()).filter(
    b => (b.playerIsAttacker || b.playerIsDefender) && 
         (b.phase === 'pending' || b.phase === 'player_command')
  )
}
