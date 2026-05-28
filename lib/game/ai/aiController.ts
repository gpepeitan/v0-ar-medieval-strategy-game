// AI Controller — calmer build-first strategy per ARCHITECTURE_GUIDE.md

import { v4 as uuid } from 'uuid'
import {
  GameState, Faction, Territory, Army,
  DiplomaticStatus, GameEvent, SiegeState,
} from '../types'
import {
  DIFFICULTY_MODIFIERS,
  AI_PERSONALITY_WEIGHTS,
  TERRAIN_DEFENSE_BONUS,
  UNIT_STATS,
} from '../constants'

export function processAITurns(game: GameState): GameState {
  let updated = { ...game }
  for (const [, faction] of game.factions) {
    if (faction.isPlayer || faction.isDefeated) continue
    updated = processAIFaction(updated, faction)
  }
  return updated
}

function processAIFaction(game: GameState, faction: Faction): GameState {
  let updated = { ...game }
  if (!faction.aiState) return game

  const threats  = assessThreats(game, faction)
  const strategy = decideStrategy(game, faction, threats)

  switch (strategy) {
    case 'expand':      updated = executeExpansion(updated, faction); break
    case 'defend':      updated = executeDefense(updated, faction); break
    case 'attack':      updated = executeAttack(updated, faction, threats); break
    case 'raid':        updated = executeRaid(updated, faction); break
    case 'consolidate': break // just economy + recruit below
    case 'diplomacy':   updated = executeDiplomacy(updated, faction); break
  }

  updated = processAIResources(updated, faction)
  updated = processAIRecruitment(updated, updated.factions.get(faction.id) ?? faction)
  return updated
}

function assessThreats(game: GameState, faction: Faction): Map<string, number> {
  const threats = new Map<string, number>()
  for (const [otherId, other] of game.factions) {
    if (otherId === faction.id || other.isDefeated) continue
    let threat = 0
    const rel = faction.relations.find(r => r.targetId === otherId)
    if (rel?.status === 'war')         threat += 50
    else if (rel && rel.value < -30)   threat += 20

    const ourStr   = calcStrength(game, faction.id)
    const theirStr = calcStrength(game, otherId)
    if (theirStr > ourStr * 1.5)       threat += 30
    else if (theirStr > ourStr)        threat += 15

    const borders = faction.territories.some(tid =>
      game.territories.get(tid)?.connectedTerritories.some(cid =>
        other.territories.includes(cid)
      )
    )
    if (borders) threat += 10

    if (faction.aiState?.memory.betrayals.some(b => b.factionId === otherId)) threat += 25
    threats.set(otherId, threat)
  }
  return threats
}

function calcStrength(game: GameState, factionId: string): number {
  let s = 0
  for (const [, army] of game.armies) {
    if (army.ownerId !== factionId) continue
    for (const u of army.units) {
      const stats = UNIT_STATS[u.type]
      s += u.count * (stats.attack + stats.defense) * (1 + u.experience / 100)
    }
  }
  return s
}

function decideStrategy(
  game: GameState,
  faction: Faction,
  threats: Map<string, number>,
): string {
  const ai = faction.aiState
  if (!ai) return 'consolidate'

  const maxThreat = Math.max(0, ...Array.from(threats.values()))

  // ── Calmer: raise defence trigger from 70 → 85 ───────────────────────────
  if (maxThreat > 85) return 'defend'

  const w = ai.priorities
  const scores: Record<string, number> = {
    expand:      w.expansion,
    defend:      w.defense,
    attack:      w.military,
    consolidate: w.economy + 20,   // boost baseline consolidation
    diplomacy:   w.diplomacy,
    raid:        ai.personality === 'raider' ? 25 : 5,
  }

  const control = faction.territories.length / Math.max(1, game.territories.size)

  // ── Strongly prefer building when small ──────────────────────────────────
  if (control < 0.15) {
    scores.consolidate += 35
    scores.defend      += 20
    scores.attack      -= 20
  } else if (control > 0.3) {
    scores.attack  += 10
    scores.expand  += 8
  }

  // ── Low resources → consolidate, not raid ────────────────────────────────
  if (faction.resources.gold < 300 || faction.resources.food < 150) {
    scores.consolidate += 30
    scores.attack      -= 15
    scores.raid        -= 10
  }

  // ── At war → military priority, but still keep consolidation healthy ─────
  if (faction.relations.some(r => r.status === 'war')) {
    scores.attack  += 25
    scores.defend  += 15
    scores.consolidate += 10  // keep building even at war
  }

  let best = 'consolidate'; let bestScore = 0
  for (const [s, score] of Object.entries(scores)) {
    const final = score + Math.random() * 12  // less random noise (was 20)
    if (final > bestScore) { bestScore = final; best = s }
  }
  return best
}

function executeExpansion(game: GameState, faction: Faction): GameState {
  const territories = new Map(game.territories)
  const factions    = new Map(game.factions)

  const candidates: Territory[] = []
  for (const tid of faction.territories) {
    for (const adjId of (game.territories.get(tid)?.connectedTerritories ?? [])) {
      const adj = game.territories.get(adjId)
      if (adj && !adj.ownerId) candidates.push(adj)
    }
  }
  if (candidates.length === 0) return game

  candidates.sort((a, b) => b.tradeRouteValue - a.tradeRouteValue)
  const target = candidates[0]
  territories.set(target.id, { ...target, ownerId: faction.id })
  factions.set(faction.id, { ...faction, territories: [...faction.territories, target.id] })
  return { ...game, territories, factions }
}

function executeDefense(game: GameState, faction: Faction): GameState {
  const armies = new Map(game.armies)
  const borders = faction.territories.filter(tid =>
    game.territories.get(tid)?.connectedTerritories.some(cid => {
      const adj = game.territories.get(cid)
      return adj?.ownerId && adj.ownerId !== faction.id
    })
  )
  for (const armyId of faction.armies) {
    const army = game.armies.get(armyId)
    if (!army || army.destination || army.isSieging) continue
    if (!borders.includes(army.position) && borders.length > 0) {
      armies.set(armyId, { ...army, destination: borders[Math.floor(Math.random() * borders.length)], movementProgress: 0 })
    }
  }
  return { ...game, armies }
}

function executeAttack(game: GameState, faction: Faction, threats: Map<string, number>): GameState {
  const armies      = new Map(game.armies)
  const territories = new Map(game.territories)
  const factions    = new Map(game.factions)

  let targetFactionId: string | null = null

  // ── Only attack those already at war ─────────────────────────────────────
  for (const rel of faction.relations) {
    if (rel.status !== 'war') continue
    const tf = game.factions.get(rel.targetId)
    if (tf && !tf.isDefeated) { targetFactionId = rel.targetId; break }
  }

  // ── Opportunistic only if 1.5× stronger (was 1.2×) ───────────────────────
  if (!targetFactionId) {
    let best = -Infinity
    for (const rel of faction.relations) {
      if (rel.value >= -40) continue
      const tf = game.factions.get(rel.targetId)
      if (!tf || tf.isDefeated) continue
      const our   = calcStrength(game, faction.id)
      const their = calcStrength(game, rel.targetId)
      if (our > their * 1.5) {
        const score = our / their - rel.value / 100
        if (score > best) { best = score; targetFactionId = rel.targetId }
      }
    }
  }

  if (!targetFactionId) return game

  // Declare war if needed
  const rel = faction.relations.find(r => r.targetId === targetFactionId)
  if (rel && rel.status !== 'war') {
    const tf = game.factions.get(targetFactionId)
    const updRel = (rels: typeof faction.relations, tid: string) =>
      rels.map(r => r.targetId === tid ? { ...r, status: 'war' as DiplomaticStatus, value: Math.max(-100, r.value - 40) } : r)

    factions.set(faction.id, { ...faction, relations: updRel(faction.relations, targetFactionId) })
    if (tf) factions.set(targetFactionId, { ...tf, relations: updRel(tf.relations, faction.id) })

    const event: GameEvent = {
      id: uuid(), turn: game.turn, type: 'war_declared',
      title: 'War Declared!',
      description: `${faction.name} has declared war on ${tf?.name}!`,
      factionIds: [faction.id, targetFactionId], isRead: false,
    }
    return executeAttackArmies(
      { ...game, factions, eventLog: [...game.eventLog, event] },
      factions.get(faction.id) ?? faction, targetFactionId, armies, territories
    )
  }

  return executeAttackArmies(game, faction, targetFactionId, armies, territories)
}

function executeAttackArmies(
  game: GameState, faction: Faction, targetId: string,
  armies: Map<string, Army>, territories: Map<string, Territory>,
): GameState {
  const tf = game.factions.get(targetId)
  if (!tf) return game

  const attackable: Territory[] = []
  for (const tid of faction.territories) {
    for (const adjId of (game.territories.get(tid)?.connectedTerritories ?? [])) {
      const adj = game.territories.get(adjId)
      if (adj?.ownerId === targetId) attackable.push(adj)
    }
  }
  if (attackable.length === 0) return { ...game, armies, territories }

  attackable.sort((a, b) => a.fortificationLevel - b.fortificationLevel)
  const target = attackable[0]

  for (const armyId of faction.armies) {
    const army = armies.get(armyId) ?? game.armies.get(armyId)
    if (!army || army.isSieging) continue
    const armyTerr = game.territories.get(army.position)
    if (armyTerr?.connectedTerritories.includes(target.id) && !target.siegeState) {
      const siege: SiegeState = {
        attackerId: faction.id, attackingArmyId: armyId,
        defenderId: target.ownerId!, territoryId: target.id,
        phase: 'approach', turnsElapsed: 0, wallIntegrity: 100,
        defenderSupplies: target.supplies, defenderMorale: target.morale,
        attackerCasualties: 0, defenderCasualties: 0,
        breachPoints: 0, reliefForceExpected: false,
      }
      armies.set(armyId, { ...army, isSieging: true, destination: null })
      territories.set(target.id, { ...target, siegeState: siege })
      break
    } else if (!army.destination) {
      const staging = faction.territories.find(tid =>
        game.territories.get(tid)?.connectedTerritories.includes(target.id)
      )
      if (staging) armies.set(armyId, { ...army, destination: staging, movementProgress: 0 })
    }
  }
  return { ...game, armies, territories }
}

function executeRaid(game: GameState, faction: Faction): GameState {
  const armies  = new Map(game.armies)
  const factions = new Map(game.factions)

  const targets: Territory[] = []
  for (const [tid, t] of game.territories) {
    if (!t.ownerId || t.ownerId === faction.id) continue
    const adj = faction.territories.some(ours =>
      game.territories.get(ours)?.connectedTerritories.includes(tid)
    )
    if (adj) targets.push(t)
  }
  if (targets.length === 0) return game

  targets.sort((a, b) => a.fortificationLevel - b.fortificationLevel)
  const target = targets[0]

  for (const armyId of faction.armies) {
    const army = game.armies.get(armyId)
    if (!army || army.isSieging || army.isRaiding) continue
    const hasRaiders = army.units.some(u => u.type === 'light_cavalry' && u.count > 20)
    if (!hasRaiders) continue

    armies.set(armyId, { ...army, isRaiding: true, destination: target.id })
    const tf = game.factions.get(target.ownerId!)
    if (tf) {
      factions.set(tf.id, { ...tf, relations: tf.relations.map(r =>
        r.targetId === faction.id ? { ...r, value: Math.max(-100, r.value - 15) } : r
      )})
    }
    factions.set(faction.id, { ...faction, resources: {
      ...faction.resources,
      gold: faction.resources.gold + Math.floor(15 + Math.random() * 35),
      food: faction.resources.food + Math.floor(20 + Math.random() * 50),
    }})
    break
  }
  return { ...game, armies, factions }
}

function executeDiplomacy(game: GameState, faction: Faction): GameState {
  const factions = new Map(game.factions)
  for (const rel of faction.relations) {
    if (rel.status === 'war') continue
    const other = game.factions.get(rel.targetId)
    if (!other || other.isDefeated || other.isPlayer) continue
    const ourEnemies   = faction.relations.filter(r => r.value < -30).map(r => r.targetId)
    const theirEnemies = other.relations.filter(r => r.value < -30).map(r => r.targetId)
    if (ourEnemies.some(e => theirEnemies.includes(e)) && rel.value > -20) {
      factions.set(faction.id,  { ...faction, relations: faction.relations.map(r => r.targetId === rel.targetId ? { ...r, value: Math.min(100, r.value + 5) } : r) })
      factions.set(other.id,    { ...other,   relations: other.relations.map(r => r.targetId === faction.id      ? { ...r, value: Math.min(100, r.value + 5) } : r) })
    }
  }
  return { ...game, factions }
}

function processAIResources(game: GameState, faction: Faction): GameState {
  const factions = new Map(game.factions)
  let gold = 0, food = 0, wood = 0, stone = 0, iron = 0, tradeGoods = 0

  for (const tid of faction.territories) {
    const t = game.territories.get(tid)
    if (!t) continue
    gold       += t.resourceProduction.gold
    food       += t.resourceProduction.food
    wood       += t.resourceProduction.wood
    stone      += t.resourceProduction.stone
    iron       += t.resourceProduction.iron
    tradeGoods += t.resourceProduction.tradeGoods
    gold       += Math.floor(t.tradeRouteValue / 5)
  }

  const diff = DIFFICULTY_MODIFIERS[game.settings.difficulty]
  factions.set(faction.id, {
    ...faction,
    resources: {
      gold:       faction.resources.gold       + Math.floor(gold       * diff.aiResourceBonus),
      food:       faction.resources.food       + Math.floor(food       * diff.aiResourceBonus),
      wood:       faction.resources.wood       + wood,
      stone:      faction.resources.stone      + stone,
      iron:       faction.resources.iron       + iron,
      tradeGoods: faction.resources.tradeGoods + tradeGoods,
    },
  })
  return { ...game, factions }
}

function processAIRecruitment(game: GameState, faction: Faction): GameState {
  const armies  = new Map(game.armies)
  const factions = new Map(game.factions)
  let { gold, iron, food } = faction.resources

  for (const armyId of faction.armies) {
    const army = game.armies.get(armyId)
    if (!army) continue
    const size = army.units.reduce((s, u) => s + u.count, 0)

    // ── Recruit more aggressively: trigger at 400 troops (was capped at 300) ──
    // ── Lower gold threshold: 100 (was 200) ──────────────────────────────────
    if (size < 400 && gold > 100 && food > 80) {
      const toRecruit = Math.min(60, Math.floor(gold / 20))
      const existing  = army.units.find(u => u.type === 'infantry')
      if (existing) existing.count += toRecruit
      else army.units.push({ type: 'infantry', count: toRecruit, morale: 70, experience: 0 })

      gold -= toRecruit * 20
      iron  = Math.max(0, iron - toRecruit * 3)

      armies.set(armyId, { ...army })
      factions.set(faction.id, { ...faction, resources: { ...faction.resources, gold, iron, food } })
    }
  }
  return { ...game, armies, factions }
}
