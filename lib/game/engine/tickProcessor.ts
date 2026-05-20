// Tick Processor — Hyper-Local Medieval Strategy
// Handles per-tick game logic aligned to new types.

import { GameState, Resources, WeatherState, computeWeatherModifiers } from '../types'
import { TERRAIN_PRODUCTION, SEASON_EFFECTS, UNIT_STATS } from '../constants'

// ─── Resource tick (every 15 real minutes) ───────────────────────────────────

export function processResourceTick(state: GameState): GameState {
  let updatedState = processResourceProduction(state)
  updatedState = processArmyUpkeep(updatedState)
  updatedState = processLivestockAttrition(updatedState)
  updatedState = processTollIncome(updatedState)
  return updatedState
}

// ─── Day tick ────────────────────────────────────────────────────────────────

export function processDayTick(state: GameState, day: number): GameState {
  let updatedState = state

  // Population every 10 in-game days
  if (day % 10 === 0) {
    updatedState = processPopulationGrowth(updatedState)
  }

  return updatedState
}

// ─── Week tick ───────────────────────────────────────────────────────────────

export function processWeekTick(state: GameState): GameState {
  let updatedState = processLivestockGrowth(state)
  return updatedState
}

// ─── Season tick ─────────────────────────────────────────────────────────────

export function processSeasonTick(state: GameState): GameState {
  let updatedState = state

  if (state.time.season === 'spring') {
    updatedState = processCommanderAging(updatedState)
  }

  updatedState = checkVictoryConditions(updatedState)
  return updatedState
}

// ─── Resource production ─────────────────────────────────────────────────────

function processResourceProduction(state: GameState): GameState {
  const updatedFactions = new Map(state.factions)
  const seasonEffects = SEASON_EFFECTS[state.time.season]
  const weather = state.weather
  const isNight = !state.time.isDaytime

  // Night lowers worker efficiency
  const nightEfficiency = isNight ? 0.6 : 1.0

  for (const [factionId, faction] of updatedFactions) {
    if (faction.isDefeated) continue

    const resources = { ...faction.resources }

    for (const territoryId of faction.territories) {
      const territory = state.territories.get(territoryId)
      if (!territory) continue

      const terrainProd = TERRAIN_PRODUCTION[territory.terrain] ?? TERRAIN_PRODUCTION['plains']

      // Per-tick multiplier: production is defined per in-game day,
      // resource tick fires every 15 real min = ¼ of an in-game day at 1x.
      // At higher speeds the loop compresses time, so we emit a flat per-tick amount.
      const tickMult = 0.25 * nightEfficiency

      // Food is affected by season + agriculture weather modifier
      const foodMult = tickMult * (seasonEffects.foodProduction ?? 1) * weather.agricultureMultiplier
      const otherMult = tickMult

      resources.food += (terrainProd.food ?? 0) * foodMult
      resources.gold += (terrainProd.gold ?? 0) * otherMult
      resources.wood += (terrainProd.wood ?? 0) * otherMult
      resources.stone += (terrainProd.stone ?? 0) * otherMult
      resources.iron += (terrainProd.iron ?? 0) * otherMult
      resources.tradeGoods += (terrainProd.tradeGoods ?? 0) * otherMult

      // Building bonuses
      for (const building of territory.buildings) {
        const bonus = buildingTickProduction(building.type, building.level, tickMult)
        resources.food += bonus.food
        resources.gold += bonus.gold
        resources.wood += bonus.wood
        resources.stone += bonus.stone
        resources.iron += bonus.iron
        resources.tradeGoods += bonus.tradeGoods
      }
    }

    // Clamp and round
    for (const k of Object.keys(resources) as (keyof Resources)[]) {
      resources[k] = Math.max(0, Math.round(resources[k] * 100) / 100)
    }

    updatedFactions.set(factionId, { ...faction, resources })
  }

  return { ...state, factions: updatedFactions }
}

// ─── Toll income ──────────────────────────────────────────────────────────────

function processTollIncome(state: GameState): GameState {
  const updatedFactions = new Map(state.factions)

  for (const [factionId, faction] of updatedFactions) {
    if (faction.isDefeated) continue

    let tollIncome = 0
    for (const territoryId of faction.territories) {
      const territory = state.territories.get(territoryId)
      if (!territory) continue
      if (territory.isIntersection && territory.tollRate > 0) {
        // Toll income per resource tick (¼ day worth)
        tollIncome += territory.tollRate * 0.25
      }
    }

    if (tollIncome > 0) {
      const resources = { ...faction.resources }
      resources.gold = Math.max(0, resources.gold + tollIncome)
      updatedFactions.set(factionId, { ...faction, resources })
    }
  }

  return { ...state, factions: updatedFactions }
}

// ─── Army upkeep ─────────────────────────────────────────────────────────────

function processArmyUpkeep(state: GameState): GameState {
  const updatedFactions = new Map(state.factions)

  for (const [, army] of state.armies) {
    const faction = updatedFactions.get(army.ownerId)
    if (!faction || faction.isDefeated) continue

    let goldCost = 0
    let foodCost = 0

    for (const unit of army.units) {
      const stats = UNIT_STATS[unit.type] ?? { upkeepGold: 1, upkeepFood: 1 }
      // Upkeep per resource tick = daily / 4
      goldCost += (stats.upkeepGold * unit.count) / 4
      foodCost += (stats.upkeepFood * unit.count) / 4
    }

    const resources = { ...faction.resources }
    resources.gold = Math.max(0, resources.gold - goldCost)
    resources.food = Math.max(0, resources.food - foodCost)
    updatedFactions.set(army.ownerId, { ...faction, resources })
  }

  return { ...state, factions: updatedFactions }
}

// ─── Livestock attrition (weather-driven) ────────────────────────────────────

function processLivestockAttrition(state: GameState): GameState {
  const attritionRate = state.weather.livestockAttritionBonus
  if (attritionRate === 0) return state

  const updatedTerritories = new Map(state.territories)

  for (const [id, territory] of updatedTerritories) {
    if (!territory.ownerId) continue
    const lv = { ...territory.livestock }
    // Apply per-tick attrition (rate is daily, we run quarterly)
    const r = attritionRate * 0.25
    lv.cattle   = Math.max(0, Math.floor(lv.cattle   * (1 - r)))
    lv.sheep    = Math.max(0, Math.floor(lv.sheep    * (1 - r)))
    lv.horses   = Math.max(0, Math.floor(lv.horses   * (1 - r)))
    lv.pigs     = Math.max(0, Math.floor(lv.pigs     * (1 - r)))
    lv.chickens = Math.max(0, Math.floor(lv.chickens * (1 - r)))
    updatedTerritories.set(id, { ...territory, livestock: lv })
  }

  return { ...state, territories: updatedTerritories }
}

// ─── Population growth ───────────────────────────────────────────────────────

function processPopulationGrowth(state: GameState): GameState {
  const updatedTerritories = new Map(state.territories)

  for (const [id, territory] of updatedTerritories) {
    if (!territory.ownerId) continue
    const faction = state.factions.get(territory.ownerId)
    if (!faction) continue

    const hasFood = faction.resources.food > 0
    if (!hasFood || territory.morale < 30) continue

    const pop = { ...territory.population }
    const rate = 0.001 * (territory.morale / 100)
    pop.peasants = Math.floor(pop.peasants * (1 + rate))
    updatedTerritories.set(id, { ...territory, population: pop })
  }

  return { ...state, territories: updatedTerritories }
}

// ─── Livestock growth ────────────────────────────────────────────────────────

function processLivestockGrowth(state: GameState): GameState {
  const updatedTerritories = new Map(state.territories)
  const seasonBonus = state.time.season === 'spring' || state.time.season === 'summer' ? 1.5 : 0.5

  for (const [id, territory] of updatedTerritories) {
    if (!territory.ownerId) continue
    const lv = { ...territory.livestock }
    const r = 0.01 * seasonBonus
    lv.cattle   = Math.floor(lv.cattle   * (1 + r))
    lv.sheep    = Math.floor(lv.sheep    * (1 + r))
    lv.horses   = Math.floor(lv.horses   * (1 + r * 0.5))
    lv.pigs     = Math.floor(lv.pigs     * (1 + r * 1.5))
    lv.chickens = Math.floor(lv.chickens * (1 + r * 2))
    updatedTerritories.set(id, { ...territory, livestock: lv })
  }

  return { ...state, territories: updatedTerritories }
}

// ─── Commander aging ─────────────────────────────────────────────────────────

function processCommanderAging(state: GameState): GameState {
  const updatedCommanders = new Map(state.commanders)
  const newEvents = [...state.events]

  for (const [id, commander] of updatedCommanders) {
    if (!commander.isAlive) continue
    const newAge = commander.age + 1
    let alive = true

    if (newAge > 50 && Math.random() < (newAge - 50) * 0.02) {
      alive = false
      newEvents.push({
        id: crypto.randomUUID(),
        type: 'commander_death',
        title: 'Commander Died',
        description: `${commander.name} has died of old age at ${newAge}.`,
        day: state.time.totalDays,
        factionId: commander.factionId,
        importance: 'medium',
      })
    }

    updatedCommanders.set(id, { ...commander, age: newAge, isAlive: alive })
  }

  return { ...state, commanders: updatedCommanders, events: newEvents }
}

// ─── Victory conditions ──────────────────────────────────────────────────────

function checkVictoryConditions(state: GameState): GameState {
  const playerFaction = Array.from(state.factions.values()).find(f => f.isPlayer)
  if (!playerFaction) return state

  const total = state.territories.size
  const owned = playerFaction.territories.length
  const pct = total > 0 ? owned / total : 0

  if (pct >= 0.8) {
    return { ...state, isVictory: true, victoryCondition: 'domination' }
  }
  if (owned === 0 && total > 0) {
    return { ...state, isDefeated: true }
  }

  return state
}

// ─── Siege tick ──────────────────────────────────────────────────────────────

export function processSiegeTick(state: GameState): GameState {
  const updatedTerritories = new Map(state.territories)
  const updatedFactions = new Map(state.factions)
  const newEvents = [...state.events]

  for (const [id, territory] of updatedTerritories) {
    if (!territory.siegeState) continue

    const siege = { ...territory.siegeState }
    siege.daysElapsed += 1

    // Simple siege resolution: attacker wins after enough days relative to fortification
    const daysToConquer = 5 + territory.fortificationLevel * 3
    if (siege.daysElapsed >= daysToConquer) {
      // Attacker wins
      const prevOwner = territory.ownerId
      const attackerFaction = updatedFactions.get(siege.attackerId)
      if (attackerFaction) {
        // Transfer territory
        const territories = [...attackerFaction.territories, id]
        updatedFactions.set(siege.attackerId, { ...attackerFaction, territories })
      }
      if (prevOwner) {
        const prevFaction = updatedFactions.get(prevOwner)
        if (prevFaction) {
          const territories = prevFaction.territories.filter(t => t !== id)
          updatedFactions.set(prevOwner, { ...prevFaction, territories })
        }
      }
      updatedTerritories.set(id, { ...territory, ownerId: siege.attackerId, siegeState: null })
      newEvents.push({
        id: crypto.randomUUID(),
        type: 'siege_resolved',
        title: 'Siege Resolved',
        description: `${territory.name} has been captured after a siege.`,
        day: state.time.totalDays,
        territoryId: id,
        importance: 'high',
      })
    } else {
      updatedTerritories.set(id, { ...territory, siegeState: siege })
    }
  }

  return { ...state, territories: updatedTerritories, factions: updatedFactions, events: newEvents }
}

// ─── Building production helper ───────────────────────────────────────────────

function buildingTickProduction(
  type: string,
  level: number,
  tickMult: number
): Resources {
  const base: Resources = { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 }
  switch (type) {
    case 'farm':         return { ...base, food: 10 * level * tickMult }
    case 'mine':         return { ...base, iron: 5 * level * tickMult, stone: 5 * level * tickMult }
    case 'lumber_camp':  return { ...base, wood: 10 * level * tickMult }
    case 'market':       return { ...base, gold: 5 * level * tickMult, tradeGoods: 2 * level * tickMult }
    case 'outpost':      return { ...base, gold: 2 * level * tickMult }
    default:             return base
  }
}
