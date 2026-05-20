// Siege System - 6-Phase State Machine for Medieval Siege Warfare

import { 
  Territory, 
  Army, 
  SiegeState, 
  SiegePhase, 
  SiegeAction, 
  DefenderAction,
  Commander,
  GameState,
  GameEvent,
  Faction
} from '../types'
import { v4 as uuid } from 'uuid'
import { calculateArmyStrength, getArmyUnitCount } from './armySystem'
import { getEffectiveCommanderStats } from './commanderSystem'

// Fortification defense values
const FORTIFICATION_STRENGTH: Record<number, {
  wallStrength: number
  maxGarrison: number
  supplyCapacity: number
  siegeDuration: number // Base turns to complete siege
}> = {
  0: { wallStrength: 0, maxGarrison: 50, supplyCapacity: 30, siegeDuration: 2 },
  1: { wallStrength: 50, maxGarrison: 100, supplyCapacity: 60, siegeDuration: 5 },   // Palisade
  2: { wallStrength: 100, maxGarrison: 200, supplyCapacity: 100, siegeDuration: 10 }, // Fort
  3: { wallStrength: 200, maxGarrison: 400, supplyCapacity: 200, siegeDuration: 18 }, // Castle
  4: { wallStrength: 350, maxGarrison: 600, supplyCapacity: 350, siegeDuration: 28 }, // Citadel
  5: { wallStrength: 500, maxGarrison: 1000, supplyCapacity: 500, siegeDuration: 40 }, // Capital
}

// Siege action effectiveness
const SIEGE_ACTION_EFFECTS: Record<SiegeAction, {
  wallDamage: number
  supplyDrain: number
  moraleDamage: number
  attackerCasualties: number
  defenderCasualties: number
  turnsRequired: number
}> = {
  starve: {
    wallDamage: 0,
    supplyDrain: 15,
    moraleDamage: 5,
    attackerCasualties: 1,
    defenderCasualties: 2,
    turnsRequired: 1,
  },
  sap: {
    wallDamage: 15,
    supplyDrain: 5,
    moraleDamage: 3,
    attackerCasualties: 5,
    defenderCasualties: 2,
    turnsRequired: 2,
  },
  bombard: {
    wallDamage: 25,
    supplyDrain: 3,
    moraleDamage: 8,
    attackerCasualties: 2,
    defenderCasualties: 5,
    turnsRequired: 1,
  },
  assault: {
    wallDamage: 10,
    supplyDrain: 0,
    moraleDamage: 15,
    attackerCasualties: 20,
    defenderCasualties: 15,
    turnsRequired: 1,
  },
  negotiate: {
    wallDamage: 0,
    supplyDrain: 0,
    moraleDamage: 0,
    attackerCasualties: 0,
    defenderCasualties: 0,
    turnsRequired: 1,
  },
}

// Defender action effects
const DEFENDER_ACTION_EFFECTS: Record<DefenderAction, {
  wallRepair: number
  supplyGain: number
  moraleGain: number
  riskLevel: number // 0-100, chance of failure/casualties
}> = {
  hold: {
    wallRepair: 0,
    supplyGain: 0,
    moraleGain: 2,
    riskLevel: 0,
  },
  sally: {
    wallRepair: 0,
    supplyGain: 0,
    moraleGain: 10, // If successful
    riskLevel: 40,
  },
  repair: {
    wallRepair: 10,
    supplyGain: 0,
    moraleGain: 0,
    riskLevel: 10,
  },
  ration: {
    wallRepair: 0,
    supplyGain: 0, // Actually reduces consumption
    moraleGain: -5,
    riskLevel: 0,
  },
  negotiate: {
    wallRepair: 0,
    supplyGain: 0,
    moraleGain: -10,
    riskLevel: 0,
  },
  surrender: {
    wallRepair: 0,
    supplyGain: 0,
    moraleGain: 0,
    riskLevel: 0,
  },
}

// Initialize a new siege
export function initiateSiege(
  attackingArmy: Army,
  territory: Territory,
  attackerId: string,
  defenderId: string
): SiegeState {
  const fortLevel = territory.fortificationLevel
  const fortStats = FORTIFICATION_STRENGTH[fortLevel] || FORTIFICATION_STRENGTH[0]

  return {
    attackerId,
    attackingArmyId: attackingArmy.id,
    defenderId,
    territoryId: territory.id,
    phase: 'approach',
    turnsElapsed: 0,
    wallIntegrity: fortStats.wallStrength,
    defenderSupplies: territory.supplies,
    defenderMorale: territory.morale,
    attackerCasualties: 0,
    defenderCasualties: 0,
    breachPoints: 0,
    reliefForceExpected: false,
  }
}

// Process siege phase transitions
export function processSiegePhaseTransition(siege: SiegeState, territory: Territory): SiegePhase {
  const fortLevel = territory.fortificationLevel
  const fortStats = FORTIFICATION_STRENGTH[fortLevel] || FORTIFICATION_STRENGTH[0]

  switch (siege.phase) {
    case 'approach':
      // After 1 turn, move to encirclement
      if (siege.turnsElapsed >= 1) return 'encirclement'
      break

    case 'encirclement':
      // After 2 turns, move to active siege
      if (siege.turnsElapsed >= 3) return 'active'
      break

    case 'active':
      // Check for breach condition
      if (siege.wallIntegrity <= fortStats.wallStrength * 0.3) {
        return 'breach'
      }
      // Check for surrender (morale or supplies depleted)
      if (siege.defenderMorale <= 10 || siege.defenderSupplies <= 5) {
        return 'surrender'
      }
      break

    case 'breach':
      // Can assault or wait for surrender
      if (siege.defenderMorale <= 5) {
        return 'surrender'
      }
      break

    case 'assault':
    case 'surrender':
      // Terminal states
      break
  }

  return siege.phase
}

// Execute attacker's siege action
export function executeSiegeAction(
  siege: SiegeState,
  action: SiegeAction,
  attackingArmy: Army,
  attackerCommander: Commander | null
): SiegeState {
  const effects = SIEGE_ACTION_EFFECTS[action]
  
  // Calculate effectiveness based on commander and army
  let effectiveness = 1.0
  if (attackerCommander) {
    const stats = getEffectiveCommanderStats(attackerCommander)
    effectiveness += (stats.siege / 100) * 0.5 // Up to 50% bonus from siege skill
  }

  // Check for siege engines (huge bonus to bombardment)
  const hasSiegeEngines = attackingArmy.units.some(u => u.type === 'siege_engines')
  if (action === 'bombard' && hasSiegeEngines) {
    effectiveness *= 2.0
  }

  // Apply effects
  const wallDamage = Math.floor(effects.wallDamage * effectiveness)
  const supplyDrain = Math.floor(effects.supplyDrain * effectiveness)
  const moraleDamage = Math.floor(effects.moraleDamage * effectiveness)

  return {
    ...siege,
    wallIntegrity: Math.max(0, siege.wallIntegrity - wallDamage),
    defenderSupplies: Math.max(0, siege.defenderSupplies - supplyDrain),
    defenderMorale: Math.max(0, siege.defenderMorale - moraleDamage),
    attackerCasualties: siege.attackerCasualties + effects.attackerCasualties,
    defenderCasualties: siege.defenderCasualties + effects.defenderCasualties,
    breachPoints: siege.breachPoints + (action === 'sap' || action === 'bombard' ? wallDamage : 0),
  }
}

// Execute defender's response action
export function executeDefenderAction(
  siege: SiegeState,
  action: DefenderAction,
  defenderArmy: Army | null,
  defenderCommander: Commander | null,
  attackingArmy: Army
): { siege: SiegeState; sallyResult?: 'success' | 'failure' } {
  const effects = DEFENDER_ACTION_EFFECTS[action]
  let sallyResult: 'success' | 'failure' | undefined

  let updatedSiege = { ...siege }

  // Special handling for sally
  if (action === 'sally' && defenderArmy) {
    const defenderStrength = calculateArmyStrength(defenderArmy, defenderCommander, true, 'plains')
    const attackerStrength = calculateArmyStrength(attackingArmy, null, false, 'plains')
    
    const successChance = (defenderStrength / (defenderStrength + attackerStrength)) * 100
    const roll = Math.random() * 100

    if (roll < successChance) {
      // Sally succeeded - damage to attackers, morale boost
      sallyResult = 'success'
      updatedSiege.attackerCasualties += Math.floor(getArmyUnitCount(attackingArmy) * 0.1)
      updatedSiege.defenderMorale = Math.min(100, updatedSiege.defenderMorale + effects.moraleGain)
    } else {
      // Sally failed - casualties and morale loss
      sallyResult = 'failure'
      updatedSiege.defenderCasualties += Math.floor(getArmyUnitCount(defenderArmy) * 0.15)
      updatedSiege.defenderMorale = Math.max(0, updatedSiege.defenderMorale - 15)
    }
  }

  // Apply standard effects
  if (action === 'repair') {
    const repairAmount = effects.wallRepair
    // Check if repair fails (bombardment during repair)
    if (Math.random() * 100 < effects.riskLevel) {
      updatedSiege.defenderCasualties += 5 // Workers killed
    } else {
      updatedSiege.wallIntegrity = Math.min(
        FORTIFICATION_STRENGTH[5].wallStrength, // Max wall strength
        updatedSiege.wallIntegrity + repairAmount
      )
    }
  }

  if (action === 'hold') {
    updatedSiege.defenderMorale = Math.min(100, updatedSiege.defenderMorale + effects.moraleGain)
  }

  if (action === 'ration') {
    // Reduce supply consumption this turn but hurt morale
    updatedSiege.defenderMorale = Math.max(0, updatedSiege.defenderMorale + effects.moraleGain)
  }

  return { siege: updatedSiege, sallyResult }
}

// Attempt final assault on breached/weakened walls
export interface AssaultResult {
  success: boolean
  attackerCasualties: number
  defenderCasualties: number
  defenderSurrendered: boolean
}

export function executeAssault(
  siege: SiegeState,
  attackingArmy: Army,
  attackerCommander: Commander | null,
  defenderArmy: Army | null,
  defenderCommander: Commander | null,
  territory: Territory
): AssaultResult {
  const attackerStrength = calculateArmyStrength(attackingArmy, attackerCommander, true, territory.terrain)
  const defenderStrength = defenderArmy 
    ? calculateArmyStrength(defenderArmy, defenderCommander, false, territory.terrain)
    : territory.population.soldiers * 3 // Garrison without army

  // Wall integrity affects defender strength
  const fortLevel = territory.fortificationLevel
  const maxWalls = FORTIFICATION_STRENGTH[fortLevel]?.wallStrength || 0
  const wallBonus = maxWalls > 0 ? (siege.wallIntegrity / maxWalls) : 0
  const effectiveDefenderStrength = defenderStrength * (1 + wallBonus)

  // Calculate odds
  const totalStrength = attackerStrength + effectiveDefenderStrength
  const attackerOdds = attackerStrength / totalStrength

  // Random factor
  const roll = Math.random()
  const success = roll < attackerOdds + 0.1 // Slight attacker advantage in assaults

  // Calculate casualties (assaults are bloody)
  let attackerCasualties: number
  let defenderCasualties: number

  if (success) {
    attackerCasualties = Math.floor(getArmyUnitCount(attackingArmy) * 0.25)
    defenderCasualties = defenderArmy 
      ? Math.floor(getArmyUnitCount(defenderArmy) * 0.6)
      : Math.floor(territory.population.soldiers * 0.6)
  } else {
    attackerCasualties = Math.floor(getArmyUnitCount(attackingArmy) * 0.4)
    defenderCasualties = defenderArmy
      ? Math.floor(getArmyUnitCount(defenderArmy) * 0.2)
      : Math.floor(territory.population.soldiers * 0.2)
  }

  return {
    success,
    attackerCasualties,
    defenderCasualties,
    defenderSurrendered: false,
  }
}

// Process surrender terms
export interface SurrenderTerms {
  territoryCeded: boolean
  goldTribute: number
  garrisonSpared: boolean
  populationSpared: boolean
}

export function processSurrender(
  siege: SiegeState,
  terms: 'merciful' | 'standard' | 'brutal'
): SurrenderTerms {
  switch (terms) {
    case 'merciful':
      return {
        territoryCeded: true,
        goldTribute: 50,
        garrisonSpared: true,
        populationSpared: true,
      }
    case 'standard':
      return {
        territoryCeded: true,
        goldTribute: 200,
        garrisonSpared: false, // Garrison becomes prisoners
        populationSpared: true,
      }
    case 'brutal':
      return {
        territoryCeded: true,
        goldTribute: 500,
        garrisonSpared: false,
        populationSpared: false, // Population suffers
      }
  }
}

// Check for relief force arrival
export function checkReliefForce(
  siege: SiegeState,
  defenderFaction: Faction,
  armies: Map<string, Army>
): Army | null {
  // Check if any defender armies are moving toward the besieged territory
  for (const armyId of defenderFaction.armies) {
    const army = armies.get(armyId)
    if (!army) continue
    
    if (army.destination === siege.territoryId || army.position === siege.territoryId) {
      if (army.id !== siege.attackingArmyId) {
        return army
      }
    }
  }
  return null
}

// Process relief force battle (breaks siege if defender wins)
export function processReliefBattle(
  siege: SiegeState,
  reliefArmy: Army,
  attackingArmy: Army,
  reliefCommander: Commander | null,
  attackerCommander: Commander | null,
  terrain: string
): { siegeBroken: boolean; battleResult: 'relief_victory' | 'attacker_victory' | 'draw' } {
  const reliefStrength = calculateArmyStrength(reliefArmy, reliefCommander, true, terrain)
  const attackerStrength = calculateArmyStrength(attackingArmy, attackerCommander, false, terrain)

  const totalStrength = reliefStrength + attackerStrength
  const reliefOdds = reliefStrength / totalStrength
  const roll = Math.random()

  if (roll < reliefOdds - 0.1) {
    return { siegeBroken: true, battleResult: 'relief_victory' }
  } else if (roll > reliefOdds + 0.1) {
    return { siegeBroken: false, battleResult: 'attacker_victory' }
  } else {
    return { siegeBroken: false, battleResult: 'draw' }
  }
}

// Main siege tick - process all active sieges
export function processSiegeTick(game: GameState): GameState {
  const updatedTerritories = new Map(game.territories)
  const newEvents: GameEvent[] = []

  for (const [territoryId, territory] of game.territories) {
    if (!territory.siegeState) continue

    const siege = territory.siegeState
    
    // Update turn counter
    let updatedSiege: SiegeState = {
      ...siege,
      turnsElapsed: siege.turnsElapsed + 1,
    }

    // Natural supply drain during siege
    updatedSiege.defenderSupplies = Math.max(0, updatedSiege.defenderSupplies - 5)
    
    // Morale drain from prolonged siege
    if (updatedSiege.turnsElapsed > 5) {
      updatedSiege.defenderMorale = Math.max(0, updatedSiege.defenderMorale - 3)
    }

    // Check phase transition
    const newPhase = processSiegePhaseTransition(updatedSiege, territory)
    if (newPhase !== updatedSiege.phase) {
      updatedSiege.phase = newPhase

      // Log phase change
      newEvents.push({
        id: uuid(),
        turn: game.turn,
        type: 'siege_started', // Reuse for phase changes
        title: `Siege Phase: ${newPhase}`,
        description: `The siege of ${territory.name} has entered the ${newPhase} phase.`,
        factionIds: [siege.attackerId, siege.defenderId],
        isRead: false,
      })
    }

    // Check for surrender condition
    if (updatedSiege.phase === 'surrender') {
      // Siege ends - territory changes hands
      const attackerFaction = game.factions.get(siege.attackerId)
      
      updatedTerritories.set(territoryId, {
        ...territory,
        ownerId: siege.attackerId,
        siegeState: null,
        morale: 30, // Low morale after conquest
        supplies: 20,
      })

      newEvents.push({
        id: uuid(),
        turn: game.turn,
        type: 'territory_captured',
        title: 'Territory Captured!',
        description: `${territory.name} has fallen to ${attackerFaction?.name || 'the enemy'}!`,
        factionIds: [siege.attackerId, siege.defenderId],
        isRead: false,
      })
    } else {
      updatedTerritories.set(territoryId, {
        ...territory,
        siegeState: updatedSiege,
      })
    }
  }

  return {
    ...game,
    territories: updatedTerritories,
    eventLog: [...game.eventLog, ...newEvents],
  }
}

// Calculate estimated siege duration
export function estimateSiegeDuration(
  territory: Territory,
  attackingArmy: Army,
  attackerCommander: Commander | null
): { minTurns: number; maxTurns: number } {
  const fortLevel = territory.fortificationLevel
  const baseDuration = FORTIFICATION_STRENGTH[fortLevel]?.siegeDuration || 5

  // Siege engines reduce duration significantly
  const hasSiegeEngines = attackingArmy.units.some(u => u.type === 'siege_engines')
  const siegeEngineMod = hasSiegeEngines ? 0.6 : 1.0

  // Commander siege skill reduces duration
  let commanderMod = 1.0
  if (attackerCommander) {
    commanderMod = 1 - (attackerCommander.stats.siege / 200) // Up to 50% reduction
  }

  // Army size affects duration (larger = faster encirclement)
  const armySize = getArmyUnitCount(attackingArmy)
  const sizeMod = armySize > 500 ? 0.8 : armySize > 200 ? 0.9 : 1.0

  const estimatedDuration = baseDuration * siegeEngineMod * commanderMod * sizeMod

  return {
    minTurns: Math.floor(estimatedDuration * 0.7),
    maxTurns: Math.ceil(estimatedDuration * 1.3),
  }
}

// Get available siege actions based on current phase
export function getAvailableSiegeActions(phase: SiegePhase): SiegeAction[] {
  switch (phase) {
    case 'approach':
      return ['negotiate']
    case 'encirclement':
      return ['starve', 'negotiate']
    case 'active':
      return ['starve', 'sap', 'bombard', 'assault', 'negotiate']
    case 'breach':
      return ['assault', 'starve', 'negotiate']
    case 'assault':
    case 'surrender':
      return []
  }
}

// Get available defender actions based on current phase
export function getAvailableDefenderActions(phase: SiegePhase): DefenderAction[] {
  switch (phase) {
    case 'approach':
      return ['hold', 'sally']
    case 'encirclement':
      return ['hold', 'sally', 'ration']
    case 'active':
      return ['hold', 'sally', 'repair', 'ration', 'negotiate', 'surrender']
    case 'breach':
      return ['hold', 'repair', 'negotiate', 'surrender']
    case 'assault':
      return ['hold', 'surrender']
    case 'surrender':
      return []
  }
}
