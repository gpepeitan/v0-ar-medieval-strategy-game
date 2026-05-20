// Territory Generation - Creates game territories from map regions

import { v4 as uuid } from 'uuid'
import { Territory, TerrainType, Resources, Livestock, Population, Building } from '../types'
import { TERRAIN_PRODUCTION } from '../constants'

// European territory definitions with rough polygon bounds
const EUROPE_TERRITORIES: Array<{
  name: string
  terrain: TerrainType
  center: [number, number]
  bounds: [number, number][]
  isCapitalCandidate: boolean
  tradeValue: number
}> = [
  // Western Europe
  {
    name: 'Paris Basin',
    terrain: 'plains',
    center: [48.8, 2.3],
    bounds: [[47.5, 0.5], [47.5, 4], [50, 4], [50, 0.5]],
    isCapitalCandidate: true,
    tradeValue: 30,
  },
  {
    name: 'Normandy',
    terrain: 'coastal',
    center: [49.2, -0.5],
    bounds: [[48.5, -2], [48.5, 1], [50, 1], [50, -2]],
    isCapitalCandidate: false,
    tradeValue: 25,
  },
  {
    name: 'Brittany',
    terrain: 'coastal',
    center: [48.1, -3],
    bounds: [[47.5, -5], [47.5, -1.5], [48.8, -1.5], [48.8, -5]],
    isCapitalCandidate: false,
    tradeValue: 20,
  },
  {
    name: 'Aquitaine',
    terrain: 'plains',
    center: [44.8, -0.5],
    bounds: [[43.5, -2], [43.5, 1], [46, 1], [46, -2]],
    isCapitalCandidate: true,
    tradeValue: 25,
  },
  {
    name: 'Provence',
    terrain: 'coastal',
    center: [43.5, 5],
    bounds: [[42.5, 3.5], [42.5, 7], [44.5, 7], [44.5, 3.5]],
    isCapitalCandidate: false,
    tradeValue: 35,
  },
  {
    name: 'Burgundy',
    terrain: 'hills',
    center: [47, 4.5],
    bounds: [[46, 3.5], [46, 6], [48, 6], [48, 3.5]],
    isCapitalCandidate: false,
    tradeValue: 20,
  },
  
  // Germany/HRE
  {
    name: 'Rhineland',
    terrain: 'river',
    center: [50.5, 7],
    bounds: [[49.5, 5.5], [49.5, 8.5], [51.5, 8.5], [51.5, 5.5]],
    isCapitalCandidate: true,
    tradeValue: 40,
  },
  {
    name: 'Bavaria',
    terrain: 'hills',
    center: [48.5, 11.5],
    bounds: [[47.5, 10], [47.5, 13.5], [49.5, 13.5], [49.5, 10]],
    isCapitalCandidate: true,
    tradeValue: 25,
  },
  {
    name: 'Saxony',
    terrain: 'plains',
    center: [51, 12],
    bounds: [[50, 10.5], [50, 14], [52, 14], [52, 10.5]],
    isCapitalCandidate: false,
    tradeValue: 20,
  },
  {
    name: 'Swabia',
    terrain: 'forest',
    center: [48.5, 9],
    bounds: [[47.5, 8], [47.5, 10.5], [49.5, 10.5], [49.5, 8]],
    isCapitalCandidate: false,
    tradeValue: 15,
  },
  {
    name: 'Franconia',
    terrain: 'hills',
    center: [49.8, 10.5],
    bounds: [[49, 9.5], [49, 11.5], [50.5, 11.5], [50.5, 9.5]],
    isCapitalCandidate: false,
    tradeValue: 18,
  },
  
  // Italy
  {
    name: 'Lombardy',
    terrain: 'plains',
    center: [45.5, 9.5],
    bounds: [[45, 8], [45, 11], [46.5, 11], [46.5, 8]],
    isCapitalCandidate: true,
    tradeValue: 45,
  },
  {
    name: 'Tuscany',
    terrain: 'hills',
    center: [43.3, 11],
    bounds: [[42.5, 10], [42.5, 12.5], [44, 12.5], [44, 10]],
    isCapitalCandidate: false,
    tradeValue: 35,
  },
  {
    name: 'Rome',
    terrain: 'hills',
    center: [41.9, 12.5],
    bounds: [[41, 11.5], [41, 14], [43, 14], [43, 11.5]],
    isCapitalCandidate: true,
    tradeValue: 50,
  },
  {
    name: 'Naples',
    terrain: 'coastal',
    center: [40.8, 14.2],
    bounds: [[39.5, 13], [39.5, 16], [41.5, 16], [41.5, 13]],
    isCapitalCandidate: false,
    tradeValue: 30,
  },
  {
    name: 'Sicily',
    terrain: 'coastal',
    center: [37.5, 14],
    bounds: [[36.5, 12.5], [36.5, 15.5], [38.5, 15.5], [38.5, 12.5]],
    isCapitalCandidate: false,
    tradeValue: 35,
  },
  {
    name: 'Venice',
    terrain: 'coastal',
    center: [45.4, 12.3],
    bounds: [[45, 11.5], [45, 13.5], [46, 13.5], [46, 11.5]],
    isCapitalCandidate: true,
    tradeValue: 60,
  },
  
  // Iberia
  {
    name: 'Castile',
    terrain: 'plains',
    center: [40.4, -3.7],
    bounds: [[39, -5], [39, -2], [42, -2], [42, -5]],
    isCapitalCandidate: true,
    tradeValue: 20,
  },
  {
    name: 'Catalonia',
    terrain: 'coastal',
    center: [41.4, 2.2],
    bounds: [[40.5, 0.5], [40.5, 3], [42.5, 3], [42.5, 0.5]],
    isCapitalCandidate: false,
    tradeValue: 30,
  },
  {
    name: 'Andalusia',
    terrain: 'plains',
    center: [37.5, -5],
    bounds: [[36, -7], [36, -3], [38.5, -3], [38.5, -7]],
    isCapitalCandidate: true,
    tradeValue: 35,
  },
  {
    name: 'Galicia',
    terrain: 'coastal',
    center: [42.8, -8],
    bounds: [[41.5, -9], [41.5, -6.5], [43.5, -6.5], [43.5, -9]],
    isCapitalCandidate: false,
    tradeValue: 15,
  },
  
  // British Isles
  {
    name: 'Wessex',
    terrain: 'plains',
    center: [51, -1.5],
    bounds: [[50.5, -3], [50.5, 0], [51.5, 0], [51.5, -3]],
    isCapitalCandidate: true,
    tradeValue: 25,
  },
  {
    name: 'Mercia',
    terrain: 'plains',
    center: [52.5, -1.5],
    bounds: [[51.5, -3], [51.5, 0], [53.5, 0], [53.5, -3]],
    isCapitalCandidate: false,
    tradeValue: 20,
  },
  {
    name: 'Northumbria',
    terrain: 'hills',
    center: [55, -1.5],
    bounds: [[53.5, -3], [53.5, 0], [56, 0], [56, -3]],
    isCapitalCandidate: false,
    tradeValue: 15,
  },
  {
    name: 'Scotland',
    terrain: 'mountains',
    center: [56.5, -4],
    bounds: [[55.5, -6], [55.5, -2], [58.5, -2], [58.5, -6]],
    isCapitalCandidate: true,
    tradeValue: 10,
  },
  {
    name: 'Ireland',
    terrain: 'forest',
    center: [53.5, -8],
    bounds: [[51.5, -10], [51.5, -6], [55, -6], [55, -10]],
    isCapitalCandidate: true,
    tradeValue: 15,
  },
  
  // Scandinavia
  {
    name: 'Denmark',
    terrain: 'coastal',
    center: [55.7, 9.5],
    bounds: [[54.5, 8], [54.5, 12.5], [57.5, 12.5], [57.5, 8]],
    isCapitalCandidate: true,
    tradeValue: 30,
  },
  {
    name: 'Southern Norway',
    terrain: 'mountains',
    center: [60, 9],
    bounds: [[58, 5], [58, 12], [62, 12], [62, 5]],
    isCapitalCandidate: true,
    tradeValue: 15,
  },
  {
    name: 'Sweden',
    terrain: 'forest',
    center: [59, 16],
    bounds: [[57, 13], [57, 19], [61, 19], [61, 13]],
    isCapitalCandidate: true,
    tradeValue: 20,
  },
  
  // Eastern Europe
  {
    name: 'Poland',
    terrain: 'plains',
    center: [52, 19],
    bounds: [[50, 16], [50, 22], [54, 22], [54, 16]],
    isCapitalCandidate: true,
    tradeValue: 25,
  },
  {
    name: 'Bohemia',
    terrain: 'hills',
    center: [50, 14.5],
    bounds: [[49, 13], [49, 16], [51, 16], [51, 13]],
    isCapitalCandidate: true,
    tradeValue: 25,
  },
  {
    name: 'Hungary',
    terrain: 'plains',
    center: [47, 19],
    bounds: [[45.5, 16], [45.5, 22], [48.5, 22], [48.5, 16]],
    isCapitalCandidate: true,
    tradeValue: 20,
  },
  {
    name: 'Kiev',
    terrain: 'plains',
    center: [50.5, 30.5],
    bounds: [[49, 28], [49, 33], [52, 33], [52, 28]],
    isCapitalCandidate: true,
    tradeValue: 30,
  },
  {
    name: 'Novgorod',
    terrain: 'forest',
    center: [58.5, 31],
    bounds: [[56, 28], [56, 34], [61, 34], [61, 28]],
    isCapitalCandidate: true,
    tradeValue: 25,
  },
  
  // Balkans
  {
    name: 'Constantinople',
    terrain: 'coastal',
    center: [41, 29],
    bounds: [[40, 27], [40, 31], [42, 31], [42, 27]],
    isCapitalCandidate: true,
    tradeValue: 70,
  },
  {
    name: 'Thrace',
    terrain: 'plains',
    center: [42, 26],
    bounds: [[41, 24], [41, 28], [43, 28], [43, 24]],
    isCapitalCandidate: false,
    tradeValue: 25,
  },
  {
    name: 'Bulgaria',
    terrain: 'hills',
    center: [43, 25],
    bounds: [[42, 23], [42, 28], [44, 28], [44, 23]],
    isCapitalCandidate: true,
    tradeValue: 20,
  },
  {
    name: 'Serbia',
    terrain: 'mountains',
    center: [44, 21],
    bounds: [[43, 19], [43, 23], [45, 23], [45, 19]],
    isCapitalCandidate: false,
    tradeValue: 15,
  },
  {
    name: 'Croatia',
    terrain: 'coastal',
    center: [45, 16],
    bounds: [[43.5, 14], [43.5, 18], [46, 18], [46, 14]],
    isCapitalCandidate: false,
    tradeValue: 25,
  },
  {
    name: 'Greece',
    terrain: 'coastal',
    center: [39, 22],
    bounds: [[37, 20], [37, 25], [41, 25], [41, 20]],
    isCapitalCandidate: true,
    tradeValue: 35,
  },
  
  // Steppes
  {
    name: 'Crimea',
    terrain: 'coastal',
    center: [45, 34],
    bounds: [[44, 32], [44, 36], [46, 36], [46, 32]],
    isCapitalCandidate: false,
    tradeValue: 25,
  },
  {
    name: 'Pontic Steppe',
    terrain: 'plains',
    center: [48, 35],
    bounds: [[46, 32], [46, 40], [50, 40], [50, 32]],
    isCapitalCandidate: true,
    tradeValue: 15,
  },
  {
    name: 'Khazaria',
    terrain: 'plains',
    center: [46, 45],
    bounds: [[44, 42], [44, 50], [48, 50], [48, 42]],
    isCapitalCandidate: true,
    tradeValue: 30,
  },
  
  // Middle East / Caucasus
  {
    name: 'Anatolia',
    terrain: 'hills',
    center: [39, 32],
    bounds: [[37, 28], [37, 36], [41, 36], [41, 28]],
    isCapitalCandidate: true,
    tradeValue: 35,
  },
  {
    name: 'Armenia',
    terrain: 'mountains',
    center: [40, 44],
    bounds: [[38.5, 42], [38.5, 46], [41.5, 46], [41.5, 42]],
    isCapitalCandidate: false,
    tradeValue: 15,
  },
  {
    name: 'Syria',
    terrain: 'desert',
    center: [35, 38],
    bounds: [[33, 35], [33, 41], [37, 41], [37, 35]],
    isCapitalCandidate: true,
    tradeValue: 40,
  },
  {
    name: 'Mesopotamia',
    terrain: 'river',
    center: [33, 44],
    bounds: [[31, 42], [31, 47], [35, 47], [35, 42]],
    isCapitalCandidate: true,
    tradeValue: 50,
  },
  {
    name: 'Persia',
    terrain: 'desert',
    center: [32, 53],
    bounds: [[29, 48], [29, 58], [35, 58], [35, 48]],
    isCapitalCandidate: true,
    tradeValue: 45,
  },
  {
    name: 'Egypt',
    terrain: 'river',
    center: [30, 31],
    bounds: [[26, 28], [26, 34], [32, 34], [32, 28]],
    isCapitalCandidate: true,
    tradeValue: 55,
  },
  
  // North Africa
  {
    name: 'Maghreb',
    terrain: 'coastal',
    center: [35, 0],
    bounds: [[33, -5], [33, 5], [37, 5], [37, -5]],
    isCapitalCandidate: true,
    tradeValue: 30,
  },
  {
    name: 'Tunisia',
    terrain: 'coastal',
    center: [36, 10],
    bounds: [[34, 8], [34, 12], [38, 12], [38, 8]],
    isCapitalCandidate: true,
    tradeValue: 35,
  },
]

export function generateTerritories(region: string): Territory[] {
  const definitions = EUROPE_TERRITORIES // We use Europe as default
  
  return definitions.map((def, index) => {
    const production = TERRAIN_PRODUCTION[def.terrain] || {}
    
    const territory: Territory = {
      id: `territory_${index}_${def.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: def.name,
      ownerId: null,
      terrain: def.terrain,
      bounds: def.bounds,
      center: def.center,
      resources: {
        gold: Math.floor(50 + Math.random() * 100),
        food: Math.floor(100 + Math.random() * 150),
        wood: Math.floor(50 + Math.random() * 100),
        stone: Math.floor(30 + Math.random() * 70),
        iron: Math.floor(10 + Math.random() * 40),
        tradeGoods: Math.floor(10 + Math.random() * 30),
      },
      resourceProduction: {
        gold: production.gold || 5,
        food: production.food || 10,
        wood: production.wood || 5,
        stone: production.stone || 2,
        iron: production.iron || 1,
        tradeGoods: production.tradeGoods || 2,
      },
      livestock: {
        cattle: Math.floor(20 + Math.random() * 50),
        sheep: Math.floor(30 + Math.random() * 70),
        horses: Math.floor(5 + Math.random() * 20),
        pigs: Math.floor(15 + Math.random() * 40),
        chickens: Math.floor(50 + Math.random() * 100),
      },
      population: {
        peasants: Math.floor(500 + Math.random() * 1500),
        craftsmen: Math.floor(50 + Math.random() * 150),
        merchants: Math.floor(20 + Math.random() * 80),
        soldiers: 0,
        nobles: Math.floor(5 + Math.random() * 20),
      },
      buildings: [],
      fortificationLevel: def.isCapitalCandidate ? 2 : Math.floor(Math.random() * 2),
      supplies: 100,
      maxSupplies: 100,
      morale: 75 + Math.floor(Math.random() * 25),
      isCapital: false,
      connectedTerritories: [], // Will be computed based on adjacency
      tradeRouteValue: def.tradeValue,
      siegeState: null,
    }
    
    return territory
  })
}

// Compute territory adjacency based on geographic proximity
export function computeAdjacency(territories: Territory[]): void {
  const MAX_DISTANCE = 5 // Degrees of lat/lng for adjacency
  
  for (const territory of territories) {
    territory.connectedTerritories = territories
      .filter(other => {
        if (other.id === territory.id) return false
        
        const dx = Math.abs(territory.center[0] - other.center[0])
        const dy = Math.abs(territory.center[1] - other.center[1])
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        return distance < MAX_DISTANCE
      })
      .map(t => t.id)
  }
}
