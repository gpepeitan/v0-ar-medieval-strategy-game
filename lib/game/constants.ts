// Game Constants and Configuration

import { 
  Resources, 
  TerrainType, 
  BuildingType,
  FactionPersonality,
} from './types'

// ==================== RESOURCE CONSTANTS ====================

export const INITIAL_RESOURCES: Resources = {
  gold: 500,
  food: 300,
  wood: 200,
  stone: 100,
  iron: 50,
  tradeGoods: 25,
}

export const TERRAIN_PRODUCTION: Record<TerrainType, Partial<Resources>> = {
  settlement: { gold: 15 },
  forest: { wood: 20, food: 5 },
  quarry: { stone: 10, iron: 5 },
  farmland: { food: 15 },
  water: { food: 10, gold: 5, tradeGoods: 3 },
  road: { gold: 10, tradeGoods: 5 },
  plains: { food: 8, gold: 3 },
  hills: { stone: 8, iron: 4, gold: 3 },
  mountains: { stone: 12, iron: 8 },
  marsh: { food: 4 },
  coastal: { food: 10, gold: 10, tradeGoods: 5 },
}

export const TERRAIN_DEFENSE_BONUS: Record<TerrainType, number> = {
  settlement: 10,
  forest: 10,
  quarry: 5,
  farmland: 0,
  water: -5,
  road: 0,
  plains: 0,
  hills: 15,
  mountains: 30,
  marsh: 5,
  coastal: 0,
}

export const TERRAIN_MOVEMENT_COST: Record<TerrainType, number> = {
  settlement: 1,
  forest: 1.5,
  quarry: 1.8,
  farmland: 1,
  water: 3,
  road: 0.7,
  plains: 1,
  hills: 1.5,
  mountains: 2.5,
  marsh: 2,
  coastal: 1,
}

// Combined terrain config for UI display
export const TERRAIN_CONFIG: Record<TerrainType, {
  name: string
  description: string
  color: string
  production: Partial<Record<'food' | 'gold' | 'wood' | 'stone' | 'iron' | 'tradeGoods', number>>
  defenseBonus: number
  movementCost: number
}> = {
  settlement: {
    name: 'Settlement',
    description: 'Residential or commercial zone',
    color: '#c0a060',
    production: TERRAIN_PRODUCTION.settlement,
    defenseBonus: TERRAIN_DEFENSE_BONUS.settlement,
    movementCost: TERRAIN_MOVEMENT_COST.settlement,
  },
  forest: {
    name: 'Forest',
    description: 'Dense woodland providing timber',
    color: '#4a7c4e',
    production: TERRAIN_PRODUCTION.forest,
    defenseBonus: TERRAIN_DEFENSE_BONUS.forest,
    movementCost: TERRAIN_MOVEMENT_COST.forest,
  },
  quarry: {
    name: 'Quarry',
    description: 'Industrial and construction zone',
    color: '#78909c',
    production: TERRAIN_PRODUCTION.quarry,
    defenseBonus: TERRAIN_DEFENSE_BONUS.quarry,
    movementCost: TERRAIN_MOVEMENT_COST.quarry,
  },
  farmland: {
    name: 'Farmland',
    description: 'Agricultural land',
    color: '#90b855',
    production: TERRAIN_PRODUCTION.farmland,
    defenseBonus: TERRAIN_DEFENSE_BONUS.farmland,
    movementCost: TERRAIN_MOVEMENT_COST.farmland,
  },
  water: {
    name: 'Water',
    description: 'River or lake edge',
    color: '#42a5f5',
    production: TERRAIN_PRODUCTION.water,
    defenseBonus: TERRAIN_DEFENSE_BONUS.water,
    movementCost: TERRAIN_MOVEMENT_COST.water,
  },
  road: {
    name: 'Road',
    description: 'Major road or bridge',
    color: '#b0a090',
    production: TERRAIN_PRODUCTION.road,
    defenseBonus: TERRAIN_DEFENSE_BONUS.road,
    movementCost: TERRAIN_MOVEMENT_COST.road,
  },
  plains: {
    name: 'Plains',
    description: 'Open ground with easy movement',
    color: '#c8d870',
    production: TERRAIN_PRODUCTION.plains,
    defenseBonus: TERRAIN_DEFENSE_BONUS.plains,
    movementCost: TERRAIN_MOVEMENT_COST.plains,
  },
  hills: {
    name: 'Hills',
    description: 'Rocky terrain with mineral deposits',
    color: '#a1887f',
    production: TERRAIN_PRODUCTION.hills,
    defenseBonus: TERRAIN_DEFENSE_BONUS.hills,
    movementCost: TERRAIN_MOVEMENT_COST.hills,
  },
  mountains: {
    name: 'Mountains',
    description: 'Impassable peaks with valuable ores',
    color: '#607d8b',
    production: TERRAIN_PRODUCTION.mountains,
    defenseBonus: TERRAIN_DEFENSE_BONUS.mountains,
    movementCost: TERRAIN_MOVEMENT_COST.mountains,
  },
  marsh: {
    name: 'Marsh',
    description: 'Swampy lowlands, difficult to traverse',
    color: '#6d8b74',
    production: TERRAIN_PRODUCTION.marsh,
    defenseBonus: TERRAIN_DEFENSE_BONUS.marsh,
    movementCost: TERRAIN_MOVEMENT_COST.marsh,
  },
  coastal: {
    name: 'Coastal',
    description: 'Shores ideal for fishing and trade',
    color: '#64b5f6',
    production: TERRAIN_PRODUCTION.coastal,
    defenseBonus: TERRAIN_DEFENSE_BONUS.coastal,
    movementCost: TERRAIN_MOVEMENT_COST.coastal,
  },
}

// ==================== UNIT CONSTANTS ====================

export type UnitType = 'levy' | 'infantry' | 'heavy_infantry' | 'archers' | 'crossbowmen' | 'light_cavalry' | 'heavy_cavalry' | 'siege_engines'

export const UNIT_STATS: Record<UnitType, {
  attack: number
  defense: number
  health: number
  speed: number
  upkeepGold: number
  upkeepFood: number
  recruitCostGold: number
  recruitCostIron: number
  turnsToRecruit: number
}> = {
  levy: {
    attack: 3, defense: 2, health: 50, speed: 1,
    upkeepGold: 1, upkeepFood: 2, recruitCostGold: 10, recruitCostIron: 0, turnsToRecruit: 1,
  },
  infantry: {
    attack: 6, defense: 5, health: 80, speed: 1,
    upkeepGold: 3, upkeepFood: 2, recruitCostGold: 30, recruitCostIron: 5, turnsToRecruit: 2,
  },
  heavy_infantry: {
    attack: 8, defense: 10, health: 120, speed: 0.8,
    upkeepGold: 6, upkeepFood: 3, recruitCostGold: 60, recruitCostIron: 15, turnsToRecruit: 3,
  },
  archers: {
    attack: 7, defense: 2, health: 50, speed: 1,
    upkeepGold: 3, upkeepFood: 2, recruitCostGold: 35, recruitCostIron: 2, turnsToRecruit: 2,
  },
  crossbowmen: {
    attack: 10, defense: 3, health: 60, speed: 0.9,
    upkeepGold: 5, upkeepFood: 2, recruitCostGold: 50, recruitCostIron: 8, turnsToRecruit: 3,
  },
  light_cavalry: {
    attack: 5, defense: 3, health: 70, speed: 2,
    upkeepGold: 5, upkeepFood: 4, recruitCostGold: 50, recruitCostIron: 5, turnsToRecruit: 2,
  },
  heavy_cavalry: {
    attack: 12, defense: 8, health: 150, speed: 1.5,
    upkeepGold: 10, upkeepFood: 5, recruitCostGold: 100, recruitCostIron: 20, turnsToRecruit: 4,
  },
  siege_engines: {
    attack: 20, defense: 1, health: 100, speed: 0.5,
    upkeepGold: 8, upkeepFood: 0, recruitCostGold: 150, recruitCostIron: 30, turnsToRecruit: 5,
  },
}

export const UNIT_DISPLAY_NAMES: Record<UnitType, string> = {
  levy: 'Levy',
  infantry: 'Infantry',
  heavy_infantry: 'Heavy Infantry',
  archers: 'Archers',
  crossbowmen: 'Crossbowmen',
  light_cavalry: 'Light Cavalry',
  heavy_cavalry: 'Heavy Cavalry',
  siege_engines: 'Siege Engines',
}

// ==================== BUILDING CONSTANTS ====================

export const BUILDING_COSTS: Record<BuildingType, { gold: number; wood: number; stone: number; iron: number }> = {
  outpost:     { gold: 100, wood: 50,  stone: 30,  iron: 10 },
  watchtower:  { gold: 150, wood: 80,  stone: 50,  iron: 15 },
  market:      { gold: 200, wood: 100, stone: 50,  iron: 10 },
  farm:        { gold: 50,  wood: 50,  stone: 10,  iron: 5  },
  lumber_camp: { gold: 75,  wood: 25,  stone: 10,  iron: 10 },
  mine:        { gold: 150, wood: 100, stone: 50,  iron: 20 },
  barracks:    { gold: 200, wood: 150, stone: 100, iron: 30 },
  stables:     { gold: 250, wood: 200, stone: 80,  iron: 40 },
  storehouse:  { gold: 120, wood: 100, stone: 40,  iron: 10 },
  walls:       { gold: 300, wood: 50,  stone: 400, iron: 30 },
}

export const BUILDING_EFFECTS: Record<BuildingType, { description: string; effect: string }> = {
  outpost:     { description: 'Territory claim point', effect: 'Claims node, levies tolls' },
  watchtower:  { description: 'Vision extension', effect: '+3 sight range, early warning' },
  market:      { description: 'Trade hub', effect: '+20% trade income' },
  farm:        { description: 'Agricultural production', effect: '+10 food/turn' },
  lumber_camp: { description: 'Wood harvesting', effect: '+10 wood/turn' },
  mine:        { description: 'Resource extraction', effect: '+5 iron, +5 stone/turn' },
  barracks:    { description: 'Infantry training', effect: 'Enables infantry recruitment' },
  stables:     { description: 'Cavalry training', effect: 'Enables cavalry recruitment' },
  storehouse:  { description: 'Resource buffer', effect: '+100 storage capacity' },
  walls:       { description: 'City fortifications', effect: '+15 defense per level' },
}

// ==================== FACTION DEFINITIONS ====================

export interface FactionDefinition {
  id: string
  name: string
  color: string
  flag: string
  personality: FactionPersonality
  description: string
  startingBonus: string
  bonuses: Record<string, number>
}

export const FACTION_DEFINITIONS: FactionDefinition[] = [
  {
    id: 'frankish',
    name: 'Frankish Kingdom',
    color: '#2563eb',
    flag: '⚜️',
    personality: 'militarist',
    description: 'The Carolingian heirs, masters of heavy cavalry warfare.',
    startingBonus: 'Heavy Cavalry +20% effectiveness',
    bonuses: { heavy_cavalry: 20, siegeDefense: 10 },
  },
  {
    id: 'mongol',
    name: 'Mongol Khanate',
    color: '#dc2626',
    flag: '🏹',
    personality: 'raider',
    description: 'The unstoppable horde from the steppes.',
    startingBonus: 'Light Cavalry +30%, +50% movement speed',
    bonuses: { light_cavalry: 30, cavalrySpeed: 50 },
  },
  {
    id: 'abbasid',
    name: 'Abbasid Caliphate',
    color: '#059669',
    flag: '☪️',
    personality: 'merchant',
    description: 'The golden age of Islamic civilization and trade.',
    startingBonus: '+30% trade income',
    bonuses: { tradeIncome: 30 },
  },
  {
    id: 'byzantine',
    name: 'Byzantine Empire',
    color: '#7c3aed',
    flag: '🦅',
    personality: 'diplomat',
    description: 'The continuation of Rome, masters of intrigue.',
    startingBonus: '+20% diplomatic effectiveness, Greek Fire',
    bonuses: { diplomatic: 20, siegeDefense: 15 },
  },
  {
    id: 'khazar',
    name: 'Khazar Khaganate',
    color: '#0891b2',
    flag: '🔯',
    personality: 'opportunist',
    description: 'The trading empire between East and West.',
    startingBonus: '+25% trade goods, cavalry archers',
    bonuses: { tradeIncome: 25, light_cavalry: 15 },
  },
  {
    id: 'norse',
    name: 'Norse Kingdoms',
    color: '#475569',
    flag: '⚔️',
    personality: 'raider',
    description: 'Viking warriors seeking glory and plunder.',
    startingBonus: 'Raiding +50% loot, coastal territory bonus',
    bonuses: { infantry: 15 },
  },
  {
    id: 'hre',
    name: 'Holy Roman Empire',
    color: '#ca8a04',
    flag: '🏰',
    personality: 'defender',
    description: 'The Germanic confederation claiming Roman legacy.',
    startingBonus: '+25% fortress defense, +10% heavy infantry',
    bonuses: { siegeDefense: 25, heavy_infantry: 10 },
  },
  {
    id: 'rus',
    name: 'Kievan Rus',
    color: '#be123c',
    flag: '🐻',
    personality: 'expansionist',
    description: 'The emerging power of the eastern Slavs.',
    startingBonus: 'Forest terrain bonus, +15% all units in winter',
    bonuses: { infantry: 10, archers: 10 },
  },
  {
    id: 'umayyad',
    name: 'Umayyad Remnant',
    color: '#16a34a',
    flag: '🌙',
    personality: 'expansionist',
    description: 'The exiled caliphate rebuilding in Iberia.',
    startingBonus: '+20% cavalry, desert terrain bonus',
    bonuses: { light_cavalry: 20 },
  },
  {
    id: 'bulgarian',
    name: 'Bulgarian Empire',
    color: '#9333ea',
    flag: '🦁',
    personality: 'militarist',
    description: 'The fierce Balkan power threatening Byzantium.',
    startingBonus: '+15% all military, mountain bonus',
    bonuses: { infantry: 15, heavy_infantry: 15 },
  },
  {
    id: 'lombard',
    name: 'Lombard Duchies',
    color: '#ea580c',
    flag: '👑',
    personality: 'merchant',
    description: 'The wealthy Italian city-states.',
    startingBonus: '+40% trade income, wealthy cities',
    bonuses: { tradeIncome: 40 },
  },
  {
    id: 'pictish',
    name: 'Pictish Alliance',
    color: '#1d4ed8',
    flag: '🗡️',
    personality: 'defender',
    description: 'The unconquered peoples of the north.',
    startingBonus: '+30% defense in home territory',
    bonuses: { siegeDefense: 30 },
  },
]

// Convert FACTION_DEFINITIONS to a keyed object for easier access
export const FACTION_CONFIG: Record<string, FactionDefinition & { strengths: string[]; weaknesses: string[] }> = Object.fromEntries(
  FACTION_DEFINITIONS.map(f => [
    f.id,
    {
      ...f,
      strengths: [f.startingBonus],
      weaknesses: [getWeaknessForPersonality(f.personality)],
    }
  ])
)

function getWeaknessForPersonality(personality: FactionPersonality): string {
  const weaknesses: Record<FactionPersonality, string> = {
    militarist: 'Poor diplomacy',
    merchant: 'Weak military',
    diplomat: 'Slow expansion',
    opportunist: 'Unpredictable allies',
    raider: 'Poor defense',
    expansionist: 'Overextension',
    defender: 'Slow growth',
  }
  return weaknesses[personality]
}

export const FACTION_TEMPLATES = FACTION_DEFINITIONS

// ==================== AI CONSTANTS ====================

export const AI_PERSONALITY_WEIGHTS: Record<FactionPersonality, {
  expansion: number
  defense: number
  economy: number
  military: number
  diplomacy: number
}> = {
  expansionist: { expansion: 40, defense: 15, economy: 20, military: 15, diplomacy: 10 },
  merchant:     { expansion: 15, defense: 20, economy: 40, military: 10, diplomacy: 15 },
  militarist:   { expansion: 25, defense: 15, economy: 15, military: 35, diplomacy: 10 },
  diplomat:     { expansion: 10, defense: 20, economy: 20, military: 10, diplomacy: 40 },
  opportunist:  { expansion: 25, defense: 15, economy: 20, military: 25, diplomacy: 15 },
  raider:       { expansion: 20, defense: 10, economy: 15, military: 40, diplomacy: 15 },
  defender:     { expansion: 10, defense: 40, economy: 25, military: 15, diplomacy: 10 },
}

export const DIFFICULTY_MODIFIERS: Record<string, {
  aiResourceBonus: number
  aiMilitaryBonus: number
  aiAggressiveness: number
  playerStartingBonus: number
}> = {
  easy:   { aiResourceBonus: 0.8, aiMilitaryBonus: 0.8, aiAggressiveness: 0.7, playerStartingBonus: 1.3 },
  normal: { aiResourceBonus: 1,   aiMilitaryBonus: 1,   aiAggressiveness: 1,   playerStartingBonus: 1   },
  hard:   { aiResourceBonus: 1.3, aiMilitaryBonus: 1.2, aiAggressiveness: 1.3, playerStartingBonus: 0.8 },
  brutal: { aiResourceBonus: 1.6, aiMilitaryBonus: 1.5, aiAggressiveness: 1.5, playerStartingBonus: 0.6 },
}

// ==================== SIEGE CONSTANTS ====================

export const SIEGE_CONSTANTS = {
  suppliesPerTurn: 10,
  starvationMoraleHit: 15,
  bombardDamage: 8,
  sapDamage: 5,
  breachThreshold: 30,
  assaultCasualtyMultiplier: 1.5,
  surrenderMoraleThreshold: 20,
  reliefForceMoraleBoost: 30,
  maxSiegeTurns: 30,
}

// ==================== DIPLOMATIC CONSTANTS ====================

export const DIPLOMATIC_MODIFIERS = {
  unprovoked_war: -40,
  broken_treaty: -30,
  raid: -15,
  trade_agreement: 10,
  gift_small: 5,
  gift_medium: 10,
  gift_large: 20,
  alliance_honored: 15,
  common_enemy: 10,
  border_tension: -5,
  territory_captured: -20,
  commander_killed: -10,
  betrayal: -50,
}

export const RELATION_THRESHOLDS = {
  blood_feud: -100,
  hostile: -50,
  unfriendly: -20,
  neutral: 0,
  friendly: 20,
  warm: 50,
  allied: 80,
  eternal_alliance: 100,
}

// ==================== NEGOTIATION CONSTANTS ====================

export const NEGOTIATION_VALUE_THRESHOLDS = {
  autoReject: -50,
  reluctantAccept: 0,
  normalAccept: 20,
  eagerAccept: 50,
}

export const AI_DIALOGUE = {
  hostile: {
    greeting: [
      'You dare approach us? Speak quickly.',
      'What could you possibly offer to make amends?',
      'Your presence is unwelcome. Make it brief.',
    ],
    reject: [
      'Unacceptable. Leave now.',
      'You insult us with this pathetic offer.',
      'There is nothing you have that we want.',
    ],
    counteroffer: [
      'Perhaps... if you improve your terms significantly.',
      'You will need to do much better than that.',
      'Double your offer, and we may consider it.',
    ],
  },
  suspicious: {
    greeting: [
      'We are listening, but our patience is limited.',
      'Speak your piece. We make no promises.',
      'What brings you to our court?',
    ],
    reject: [
      'This does not serve our interests.',
      'Your terms are insufficient.',
      'We require more favorable conditions.',
    ],
    counteroffer: [
      'We might agree, with some modifications...',
      'Close, but not quite. Consider this instead.',
      'Add something more and we have a deal.',
    ],
  },
  neutral: {
    greeting: [
      'Greetings. What do you propose?',
      'We are open to discussion.',
      'State your terms.',
    ],
    reject: [
      'We must decline at this time.',
      'This arrangement does not suit us.',
      'Perhaps another time.',
    ],
    counteroffer: [
      'We can work with this, with minor adjustments.',
      'Nearly acceptable. How about...',
      'A reasonable proposal. We suggest...',
    ],
  },
  friendly: {
    greeting: [
      'Welcome, friend! What brings you?',
      'Always a pleasure. What can we do for you?',
      'Our doors are open to you.',
    ],
    reject: [
      'We wish we could agree, but this is difficult.',
      'Unfortunately, this is not possible right now.',
      'We value our friendship, but cannot accept this.',
    ],
    counteroffer: [
      'For you, we can make this work with small changes.',
      'Consider this modification, and we agree.',
      'Just a slight adjustment and you have a deal.',
    ],
  },
  eager: {
    greeting: [
      'Our trusted ally! How may we assist?',
      'Name your terms, dear friend.',
      'We are honored by your visit.',
    ],
    accept: [
      'Agreed! A fine arrangement.',
      'Done. Our alliance grows stronger.',
      'You have our word.',
    ],
    counteroffer: [
      'Perhaps we can even improve upon this...',
      'We would be happy to give you more.',
      'Let us make this even better for both of us.',
    ],
  },
}

// ==================== SEASON EFFECTS ====================

export const SEASON_EFFECTS = {
  spring: { foodProduction: 1.2, movementSpeed: 1.0, siegeEffectiveness: 1.0, moraleModifier: 1.1 },
  summer: { foodProduction: 1.5, movementSpeed: 1.0, siegeEffectiveness: 1.1, moraleModifier: 1.0 },
  autumn: { foodProduction: 1.3, movementSpeed: 0.9, siegeEffectiveness: 0.9, moraleModifier: 0.95 },
  winter: { foodProduction: 0.5, movementSpeed: 0.7, siegeEffectiveness: 0.7, moraleModifier: 0.8  },
}

// ==================== MAP REGIONS ====================

export const MAP_REGIONS = {
  europe: {
    center: [50, 10] as [number, number],
    zoom: 5,
    bounds: [[35, -10], [60, 40]] as [[number, number], [number, number]],
  },
  mediterranean: {
    center: [40, 15] as [number, number],
    zoom: 5,
    bounds: [[30, -5], [50, 35]] as [[number, number], [number, number]],
  },
  middle_east: {
    center: [33, 44] as [number, number],
    zoom: 5,
    bounds: [[20, 25], [45, 60]] as [[number, number], [number, number]],
  },
}

// ==================== COMMANDER NAMES ====================

export const COMMANDER_NAMES: Record<string, string[]> = {
  frankish: ['Charles', 'Louis', 'Roland', 'Pepin', 'Odo', 'Hugh', 'Robert', 'Eudes'],
  mongol:   ['Genghis', 'Ogedei', 'Chagatai', 'Jochi', 'Subotai', 'Jebe', 'Mongke', 'Batu'],
  abbasid:  ['Harun', 'Mamun', 'Rashid', 'Fadl', 'Tahir', 'Afshin', 'Babak', 'Ahmad'],
  byzantine:['Basil', 'Constantine', 'Leo', 'Justinian', 'Belisarius', 'Narses', 'Heraclius', 'Nikephoros'],
  khazar:   ['Bulan', 'Obadiah', 'Hezekiah', 'Manasseh', 'Isaac', 'Zebulun', 'Moses', 'Nisi'],
  norse:    ['Ragnar', 'Bjorn', 'Ivar', 'Sigurd', 'Harald', 'Erik', 'Leif', 'Olaf'],
  hre:      ['Otto', 'Henry', 'Frederick', 'Conrad', 'Lothar', 'Ludwig', 'Arnulf', 'Welf'],
  rus:      ['Vladimir', 'Sviatoslav', 'Yaroslav', 'Igor', 'Oleg', 'Rurik', 'Askold', 'Dir'],
  umayyad:  ['Abd al-Rahman', 'Hisham', 'Muhammad', 'Abdullah', 'Umar', 'Tariq', 'Musa', 'Yusuf'],
  bulgarian:['Krum', 'Simeon', 'Samuel', 'Boris', 'Tervel', 'Asparuh', 'Malamir', 'Presian'],
  lombard:  ['Alboin', 'Cleph', 'Authari', 'Agilulf', 'Arioald', 'Rothari', 'Grimoald', 'Liutprand'],
  pictish:  ['Bridei', 'Nechtan', 'Oengus', 'Drest', 'Taran', 'Ciniod', 'Alpin', 'Unuist'],
}
