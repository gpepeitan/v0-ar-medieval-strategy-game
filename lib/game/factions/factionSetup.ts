// Faction Setup - Initialize factions for a new game

import { v4 as uuid } from 'uuid'
import {
  Faction,
  Territory,
  Army,
  Commander,
  GameSettings,
  DiplomaticRelation,
  DiplomaticStatus,
  UnitStack,
  AIState,
} from '../types'
import {
  FACTION_DEFINITIONS,
  INITIAL_RESOURCES,
  DIFFICULTY_MODIFIERS,
  COMMANDER_NAMES,
  COMMANDER_TRAITS,
  AI_PERSONALITY_WEIGHTS,
} from '../constants'
import { computeAdjacency } from '../map/territories'

interface InitializationResult {
  factions: Faction[]
  commanders: Commander[]
  armies: Army[]
}

export function initializeFactions(
  settings: GameSettings,
  playerFactionId: string,
  territories: Territory[]
): InitializationResult {
  const factions: Faction[] = []
  const commanders: Commander[] = []
  const armies: Army[] = []
  
  // Compute territory adjacency
  computeAdjacency(territories)
  
  // Select factions to use (player + AI count)
  const totalFactions = settings.aiCount + 1
  const selectedDefinitions = FACTION_DEFINITIONS.slice(0, Math.min(totalFactions, FACTION_DEFINITIONS.length))
  
  // Find good starting territories (capitals)
  const capitalTerritories = territories
    .filter(t => t.tradeRouteValue >= 25)
    .sort((a, b) => b.tradeRouteValue - a.tradeRouteValue)
  
  // Ensure we have enough capitals spread out geographically
  const assignedCapitals: Territory[] = []
  const MIN_CAPITAL_DISTANCE = 8 // Minimum distance between capitals
  
  for (const territory of capitalTerritories) {
    if (assignedCapitals.length >= totalFactions) break
    
    // Check if far enough from existing capitals
    const isFarEnough = assignedCapitals.every(cap => {
      const dx = Math.abs(territory.center[0] - cap.center[0])
      const dy = Math.abs(territory.center[1] - cap.center[1])
      return Math.sqrt(dx * dx + dy * dy) >= MIN_CAPITAL_DISTANCE
    })
    
    if (isFarEnough || assignedCapitals.length === 0) {
      assignedCapitals.push(territory)
    }
  }
  
  // If we don't have enough, just add more
  while (assignedCapitals.length < totalFactions) {
    const remaining = capitalTerritories.find(t => !assignedCapitals.includes(t))
    if (remaining) {
      assignedCapitals.push(remaining)
    } else {
      break
    }
  }
  
  const difficultyMod = DIFFICULTY_MODIFIERS[settings.difficulty]
  
  // Create factions
  for (let i = 0; i < selectedDefinitions.length; i++) {
    const def = selectedDefinitions[i]
    const isPlayer = def.id === playerFactionId
    const capital = assignedCapitals[i]
    
    // Get starting territories (capital + adjacent)
    const startingTerritories = capital
      ? [
          capital.id,
          ...capital.connectedTerritories.slice(0, 2), // Start with capital + 2 adjacent
        ]
      : []
    
    // Calculate resource bonus
    const resourceMultiplier = isPlayer ? difficultyMod.playerStartingBonus : difficultyMod.aiResourceBonus
    
    // Initialize diplomatic relations with other factions
    const relations: DiplomaticRelation[] = selectedDefinitions
      .filter(other => other.id !== def.id)
      .map(other => ({
        factionId: def.id,
        targetId: other.id,
        value: -20 + Math.floor(Math.random() * 40), // Random starting relations
        status: 'neutral' as DiplomaticStatus,
        treaties: [],
        history: [],
      }))
    
    // Create starting commanders
    const factionCommanders = createStartingCommanders(def.id, isPlayer ? 3 : 2)
    commanders.push(...factionCommanders)
    
    // Create starting army
    const startingArmy = createStartingArmy(
      def.id,
      capital?.id || '',
      isPlayer,
      difficultyMod.aiMilitaryBonus
    )
    
    // Assign first commander to army
    if (factionCommanders.length > 0) {
      startingArmy.commanderId = factionCommanders[0].id
      factionCommanders[0].assignedArmyId = startingArmy.id
    }
    
    armies.push(startingArmy)
    
    // Create faction
    const faction: Faction = {
      id: def.id,
      name: def.name,
      color: def.color,
      flag: def.flag,
      personality: def.personality,
      isPlayer,
      isDefeated: false,
      capital: capital?.id || null,
      resources: {
        gold: Math.floor(INITIAL_RESOURCES.gold * resourceMultiplier),
        food: Math.floor(INITIAL_RESOURCES.food * resourceMultiplier),
        wood: Math.floor(INITIAL_RESOURCES.wood * resourceMultiplier),
        stone: Math.floor(INITIAL_RESOURCES.stone * resourceMultiplier),
        iron: Math.floor(INITIAL_RESOURCES.iron * resourceMultiplier),
        tradeGoods: Math.floor(INITIAL_RESOURCES.tradeGoods * resourceMultiplier),
      },
      territories: startingTerritories,
      armies: [startingArmy.id],
      commanders: factionCommanders.map(c => c.id),
      relations,
      reputation: 50,
      bonuses: def.bonuses,
      aiState: isPlayer ? null : createAIState(def.personality),
    }
    
    factions.push(faction)
    
    // Assign territories to faction
    for (const territoryId of startingTerritories) {
      const territory = territories.find(t => t.id === territoryId)
      if (territory) {
        territory.ownerId = def.id
        if (territory.id === capital?.id) {
          territory.isCapital = true
          territory.fortificationLevel = 3
          territory.buildings.push(
            { type: 'castle', level: 1, condition: 100 },
            { type: 'market', level: 1, condition: 100 },
            { type: 'barracks', level: 1, condition: 100 }
          )
        }
      }
    }
  }
  
  return { factions, commanders, armies }
}

function createStartingCommanders(factionId: string, count: number): Commander[] {
  const factionKey = factionId as keyof typeof COMMANDER_NAMES
  const names = COMMANDER_NAMES[factionKey] || COMMANDER_NAMES.frankish
  
  const commanders: Commander[] = []
  
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length]
    const age = 25 + Math.floor(Math.random() * 30)
    
    // Random traits (2-3)
    const traitCount = 2 + Math.floor(Math.random() * 2)
    const shuffledTraits = [...COMMANDER_TRAITS].sort(() => Math.random() - 0.5)
    const traits = shuffledTraits.slice(0, traitCount)
    
    const commander: Commander = {
      id: uuid(),
      name,
      ownerId: factionId,
      portrait: getCommanderPortrait(factionId),
      age,
      stats: {
        leadership: 5 + Math.floor(Math.random() * 10),
        tactics: 5 + Math.floor(Math.random() * 10),
        siege: 3 + Math.floor(Math.random() * 8),
        logistics: 3 + Math.floor(Math.random() * 8),
      },
      traits,
      experience: Math.floor(Math.random() * 50),
      assignedArmyId: null,
      isAlive: true,
      capturedBy: null,
    }
    
    commanders.push(commander)
  }
  
  return commanders
}

function getCommanderPortrait(factionId: string): string {
  // Simple portrait placeholders based on faction
  const portraits: Record<string, string> = {
    frankish: '🤴',
    mongol: '🏇',
    abbasid: '👳',
    byzantine: '👑',
    khazar: '🧔',
    norse: '🪖',
    hre: '⚔️',
    rus: '🐻',
    umayyad: '🌙',
    bulgarian: '🦁',
    lombard: '👸',
    pictish: '🗡️',
  }
  
  return portraits[factionId] || '🎖️'
}

function createStartingArmy(
  factionId: string,
  territoryId: string,
  isPlayer: boolean,
  militaryBonus: number
): Army {
  const baseUnits: UnitStack[] = [
    { type: 'levy', count: 200, morale: 60, experience: 0 },
    { type: 'infantry', count: 100, morale: 70, experience: 10 },
    { type: 'archers', count: 50, morale: 70, experience: 10 },
  ]
  
  // Add faction-specific units
  if (['mongol', 'khazar', 'umayyad'].includes(factionId)) {
    baseUnits.push({ type: 'light_cavalry', count: 75, morale: 80, experience: 20 })
  } else if (['frankish', 'hre', 'byzantine'].includes(factionId)) {
    baseUnits.push({ type: 'heavy_cavalry', count: 30, morale: 85, experience: 25 })
  } else {
    baseUnits.push({ type: 'light_cavalry', count: 25, morale: 75, experience: 15 })
  }
  
  // Apply AI military bonus
  if (!isPlayer && militaryBonus !== 1) {
    for (const unit of baseUnits) {
      unit.count = Math.floor(unit.count * militaryBonus)
    }
  }
  
  return {
    id: uuid(),
    name: `${factionId.charAt(0).toUpperCase() + factionId.slice(1)} Host`,
    ownerId: factionId,
    commanderId: null,
    units: baseUnits,
    position: [0, 0] as [number, number],
    currentTerritoryId: territoryId,
    targetTerritoryId: null,
    targetPosition: null,
    movementProgress: 0,
    movementSpeed: 1,
    supplies: 100,
    maxSupplies: 100,
    morale: 80,
    isRaiding: false,
    isSieging: false,
    inBattle: null,
  }
}

function createAIState(personality: string): AIState {
  const weights = AI_PERSONALITY_WEIGHTS[personality as keyof typeof AI_PERSONALITY_WEIGHTS]
    || AI_PERSONALITY_WEIGHTS.expansionist
  
  return {
    personality: personality as AIState['personality'],
    currentStrategy: 'consolidate',
    targetFaction: null,
    targetTerritory: null,
    threatAssessment: new Map(),
    priorities: weights,
    memory: {
      brokenTreaties: [],
      betrayals: [],
      wars: [],
      gifts: [],
      negotiations: [],
    },
  }
}
