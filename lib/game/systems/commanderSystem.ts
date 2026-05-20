// Commander System - Leadership, Skills, and Lifecycle

import { Commander, Army, Faction, GameState, GameEvent } from '../types'
import { v4 as uuid } from 'uuid'

// Commander name pools by faction culture
const COMMANDER_NAMES: Record<string, string[]> = {
  frankish: ['Charles', 'Louis', 'Robert', 'Odo', 'Hugh', 'Ralph', 'Baldwin', 'Arnulf', 'Carloman', 'Lothair'],
  byzantine: ['Constantine', 'Leo', 'Basil', 'Michael', 'Nikephoros', 'Alexios', 'John', 'Theodore', 'Isaac', 'Andronikos'],
  mongol: ['Temujin', 'Jochi', 'Chagatai', 'Ogedei', 'Tolui', 'Batu', 'Berke', 'Hulagu', 'Kublai', 'Mongke'],
  abbasid: ['Harun', 'Mamun', 'Mutasim', 'Wathiq', 'Mutawakkil', 'Mustain', 'Mutazz', 'Muhtadi', 'Mutamid', 'Muwaffaq'],
  norse: ['Ragnar', 'Bjorn', 'Ivar', 'Sigurd', 'Harald', 'Erik', 'Leif', 'Olaf', 'Sweyn', 'Canute'],
  slavic: ['Vladimir', 'Yaroslav', 'Sviatoslav', 'Igor', 'Oleg', 'Rurik', 'Vsevolod', 'Mstislav', 'Iziaslav', 'Boris'],
  germanic: ['Otto', 'Heinrich', 'Conrad', 'Frederick', 'Ludwig', 'Arnulf', 'Albert', 'Werner', 'Burkhard', 'Herman'],
  celtic: ['Brian', 'Niall', 'Cormac', 'Aed', 'Domnall', 'Mael', 'Fergal', 'Cathal', 'Diarmait', 'Flaithbertach'],
  default: ['Marcus', 'Victor', 'Alexander', 'William', 'Richard', 'Edward', 'Henry', 'Philip', 'Raymond', 'Geoffrey'],
}

// Trait definitions
export const COMMANDER_TRAITS: Record<string, {
  description: string
  effects: Partial<{
    leadership: number
    tactics: number
    siege: number
    logistics: number
    moraleBonus: number
    attackBonus: number
    defenseBonus: number
  }>
}> = {
  brave: {
    description: 'Inspires troops with personal courage',
    effects: { leadership: 5, moraleBonus: 10 },
  },
  cautious: {
    description: 'Careful planner, avoids unnecessary risks',
    effects: { tactics: 5, defenseBonus: 5 },
  },
  aggressive: {
    description: 'Favors bold attacks over defense',
    effects: { tactics: 3, attackBonus: 10, defenseBonus: -5 },
  },
  siege_master: {
    description: 'Expert in siege warfare',
    effects: { siege: 10 },
  },
  cavalry_commander: {
    description: 'Skilled at leading mounted troops',
    effects: { tactics: 5, attackBonus: 5 },
  },
  administrator: {
    description: 'Efficient at managing supplies and logistics',
    effects: { logistics: 10 },
  },
  inspiring: {
    description: 'Troops fight harder under their command',
    effects: { leadership: 10, moraleBonus: 15 },
  },
  cruel: {
    description: 'Feared by enemies and allies alike',
    effects: { attackBonus: 10, moraleBonus: -5 },
  },
  merciful: {
    description: 'Respected for honorable conduct',
    effects: { leadership: 5 },
  },
  strategic: {
    description: 'Master of grand strategy',
    effects: { tactics: 10, logistics: 5 },
  },
  reckless: {
    description: 'Takes dangerous risks for glory',
    effects: { attackBonus: 15, defenseBonus: -10 },
  },
  veteran: {
    description: 'Years of combat experience',
    effects: { tactics: 5, leadership: 5 },
  },
}

// Generate a random commander
export function generateCommander(
  ownerId: string,
  culture: string = 'default',
  minAge: number = 20,
  maxAge: number = 45
): Commander {
  const names = COMMANDER_NAMES[culture] || COMMANDER_NAMES.default
  const name = names[Math.floor(Math.random() * names.length)]
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge))

  // Generate stats with some randomness
  const generateStat = () => Math.floor(20 + Math.random() * 60) // 20-80 range

  // Random traits (1-3)
  const traitKeys = Object.keys(COMMANDER_TRAITS)
  const numTraits = 1 + Math.floor(Math.random() * 3)
  const traits: string[] = []
  for (let i = 0; i < numTraits; i++) {
    const trait = traitKeys[Math.floor(Math.random() * traitKeys.length)]
    if (!traits.includes(trait)) {
      traits.push(trait)
    }
  }

  // Apply trait bonuses to stats
  let leadership = generateStat()
  let tactics = generateStat()
  let siege = generateStat()
  let logistics = generateStat()

  for (const trait of traits) {
    const effects = COMMANDER_TRAITS[trait].effects
    leadership += effects.leadership || 0
    tactics += effects.tactics || 0
    siege += effects.siege || 0
    logistics += effects.logistics || 0
  }

  // Cap stats at 100
  leadership = Math.min(100, leadership)
  tactics = Math.min(100, tactics)
  siege = Math.min(100, siege)
  logistics = Math.min(100, logistics)

  return {
    id: uuid(),
    name,
    ownerId,
    portrait: `commander_${Math.floor(Math.random() * 10)}`, // Placeholder portrait ID
    age,
    stats: { leadership, tactics, siege, logistics },
    traits,
    experience: 0,
    assignedArmyId: null,
    isAlive: true,
    capturedBy: null,
  }
}

// Generate starting commanders for a faction
export function generateStartingCommanders(
  factionId: string,
  culture: string,
  count: number = 3
): Commander[] {
  const commanders: Commander[] = []
  
  // Generate a strong leader first
  const leader = generateCommander(factionId, culture, 35, 55)
  // Boost the leader's stats
  leader.stats.leadership = Math.min(100, leader.stats.leadership + 15)
  leader.stats.tactics = Math.min(100, leader.stats.tactics + 10)
  commanders.push(leader)

  // Generate other commanders
  for (let i = 1; i < count; i++) {
    commanders.push(generateCommander(factionId, culture))
  }

  return commanders
}

// Award experience to commander after battle
export function awardCommanderExperience(
  commander: Commander,
  experienceGained: number,
  wasVictory: boolean
): Commander {
  const newExperience = Math.min(100, commander.experience + experienceGained)
  
  // Check for stat improvements
  const leveledUp = Math.floor(newExperience / 20) > Math.floor(commander.experience / 20)
  
  let newStats = { ...commander.stats }
  if (leveledUp) {
    // Random stat increase
    const statKeys = ['leadership', 'tactics', 'siege', 'logistics'] as const
    const statToIncrease = statKeys[Math.floor(Math.random() * statKeys.length)]
    newStats = {
      ...newStats,
      [statToIncrease]: Math.min(100, newStats[statToIncrease] + 3),
    }
  }

  return {
    ...commander,
    experience: newExperience,
    stats: newStats,
  }
}

// Process commander aging
export function processCommanderAging(commander: Commander): Commander {
  const newAge = commander.age + 1

  // Stat decay for older commanders
  let newStats = { ...commander.stats }
  if (newAge > 60) {
    // 2% stat loss per year after 60
    const decayRate = 0.98
    newStats = {
      leadership: Math.floor(newStats.leadership * decayRate),
      tactics: Math.floor(newStats.tactics * decayRate),
      siege: Math.floor(newStats.siege * decayRate),
      logistics: Math.floor(newStats.logistics * decayRate),
    }
  }

  return {
    ...commander,
    age: newAge,
    stats: newStats,
  }
}

// Check for commander death (age, battle, etc.)
export function checkCommanderDeath(
  commander: Commander,
  inBattle: boolean,
  battleLossRate: number = 0
): { died: boolean; cause: string | null } {
  // Age-based death chance
  let deathChance = 0
  if (commander.age > 50) deathChance += 0.01
  if (commander.age > 60) deathChance += 0.03
  if (commander.age > 70) deathChance += 0.08
  if (commander.age > 80) deathChance += 0.15

  // Battle death chance
  if (inBattle) {
    deathChance += battleLossRate * 0.1 // Higher losses = higher commander death risk
  }

  if (Math.random() < deathChance) {
    return { died: true, cause: inBattle ? 'battle' : 'natural' }
  }

  return { died: false, cause: null }
}

// Check for commander capture in battle
export function checkCommanderCapture(
  commander: Commander,
  wasDefeated: boolean,
  retreatSuccessful: boolean
): boolean {
  if (!wasDefeated) return false
  if (retreatSuccessful) return false

  // 30% chance of capture if army is destroyed
  return Math.random() < 0.3
}

// Ransom a captured commander
export function ransomCommander(
  commander: Commander,
  ransom: number
): { commander: Commander; goldCost: number } {
  return {
    commander: { ...commander, capturedBy: null },
    goldCost: ransom,
  }
}

// Calculate ransom cost based on commander value
export function calculateRansomCost(commander: Commander): number {
  const statTotal = commander.stats.leadership + commander.stats.tactics + 
                    commander.stats.siege + commander.stats.logistics
  const baseRansom = 100
  return Math.floor(baseRansom + (statTotal * 2) + (commander.experience * 5))
}

// Get commander's effective stats (including trait bonuses)
export function getEffectiveCommanderStats(commander: Commander): {
  leadership: number
  tactics: number
  siege: number
  logistics: number
  moraleBonus: number
  attackBonus: number
  defenseBonus: number
} {
  let moraleBonus = 0
  let attackBonus = 0
  let defenseBonus = 0

  for (const trait of commander.traits) {
    const effects = COMMANDER_TRAITS[trait]?.effects || {}
    moraleBonus += effects.moraleBonus || 0
    attackBonus += effects.attackBonus || 0
    defenseBonus += effects.defenseBonus || 0
  }

  return {
    ...commander.stats,
    moraleBonus,
    attackBonus,
    defenseBonus,
  }
}

// Assign commander to army
export function assignCommanderToArmy(
  commander: Commander,
  armyId: string,
  armies: Map<string, Army>,
  commanders: Map<string, Commander>
): { armies: Map<string, Army>; commanders: Map<string, Commander> } {
  const newArmies = new Map(armies)
  const newCommanders = new Map(commanders)

  // Unassign from previous army
  if (commander.assignedArmyId) {
    const oldArmy = newArmies.get(commander.assignedArmyId)
    if (oldArmy) {
      newArmies.set(oldArmy.id, { ...oldArmy, commanderId: null })
    }
  }

  // Unassign current commander from target army
  const targetArmy = newArmies.get(armyId)
  if (targetArmy && targetArmy.commanderId) {
    const oldCommander = newCommanders.get(targetArmy.commanderId)
    if (oldCommander) {
      newCommanders.set(oldCommander.id, { ...oldCommander, assignedArmyId: null })
    }
  }

  // Make new assignment
  if (targetArmy) {
    newArmies.set(armyId, { ...targetArmy, commanderId: commander.id })
    newCommanders.set(commander.id, { ...commander, assignedArmyId: armyId })
  }

  return { armies: newArmies, commanders: newCommanders }
}

// Process all commanders for end of turn
export function processCommandersTick(game: GameState): GameState {
  const newCommanders = new Map(game.commanders)
  const newEvents: GameEvent[] = []

  for (const [commanderId, commander] of game.commanders) {
    if (!commander.isAlive) continue

    // Age commanders (once per year = every 365 days)
    if (game.time.totalDays % 365 === 0) {
      const aged = processCommanderAging(commander)
      newCommanders.set(commanderId, aged)

      // Check for natural death
      const { died, cause } = checkCommanderDeath(aged, false)
      if (died) {
        newCommanders.set(commanderId, { ...aged, isAlive: false })
        newEvents.push({
          id: uuid(),
          day: game.time.totalDays,
          type: 'commander_death',
          title: 'Commander Died',
          description: `${aged.name} has died of ${cause === 'natural' ? 'natural causes' : 'unknown causes'}.`,
          factionIds: [commander.ownerId],
          isRead: false,
        })
      }
    }
  }

  return {
    ...game,
    commanders: newCommanders,
    eventLog: [...game.eventLog, ...newEvents],
  }
}
