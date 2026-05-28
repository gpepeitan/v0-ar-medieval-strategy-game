// Zustand Game Store - Real-Time Central State Management

import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import {
  GameState,
  GameSettings,
  GameSpeed,
  Faction,
  Territory,
  Army,
  Commander,
  Resources,
  NegotiationState,
  ChatMessage,
  Proposal,
  GameEvent,
  DiplomaticRelation,
  DiplomaticStatus,
  UIState,
  Notification,
  AIMood,
  TimeState,
  Battle,
  BattleFormation,
  BattleFocus,
  BattleOrder,
  GAME_SPEED_MULTIPLIERS,
} from './types'
import {
  INITIAL_RESOURCES,
  FACTION_DEFINITIONS,
} from './constants'
import { generateTerritories } from './map/territories'
import { initializeFactions } from './factions/factionSetup'
import {
  initializeGameLoop,
  startGameLoop,
  stopGameLoop,
  updateGameState,
  createInitialTimeState,
} from './engine/gameLoop'
import { processDayTick, processWeekTick, processSeasonTick } from './engine/tickProcessor'
import { processArmyMovement, orderArmyMove, cancelArmyMove } from './engine/armyMovement'
import { checkForBattles, updateBattleTimers, setPlayerBattleCommands, resolveBattles, getPlayerBattles } from './engine/battleManager'
import { processAIDecisions } from './ai/aiController'

interface GameStore {
  // State
  game: GameState | null
  ui: UIState
  isLoading: boolean
  
  // Game Lifecycle
  startNewGame: (settings: GameSettings, playerFactionId: string) => void
  loadGame: (savedGame: GameState) => void
  saveGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  setSpeed: (speed: GameSpeed) => void
  togglePause: () => void
  
  // Real-time state sync
  syncGameState: (state: GameState) => void
  
  // Territory Actions
  selectTerritory: (territoryId: string | null) => void
  claimTerritory: (territoryId: string) => void
  buildInTerritory: (territoryId: string, buildingType: string) => void
  
  // Army Actions
  selectArmy: (armyId: string | null) => void
  createArmy: (territoryId: string, name: string) => void
  moveArmy: (armyId: string, targetTerritoryId: string) => void
  cancelArmyMovement: (armyId: string) => void
  mergeArmies: (armyId1: string, armyId2: string) => void
  recruitUnits: (armyId: string, unitType: string, count: number) => void
  assignCommander: (armyId: string, commanderId: string) => void
  startSiege: (armyId: string, territoryId: string) => void
  
  // Battle Actions
  openBattleCommand: (battleId: string) => void
  closeBattleCommand: () => void
  submitBattleOrders: (battleId: string, formation: BattleFormation, focus: BattleFocus, order: BattleOrder) => void
  
  // Diplomacy Actions
  declareWar: (targetFactionId: string) => void
  offerPeace: (targetFactionId: string) => void
  formAlliance: (targetFactionId: string) => void
  breakAlliance: (targetFactionId: string) => void
  
  // Negotiation Actions
  openNegotiation: (factionId: string) => void
  closeNegotiation: () => void
  sendMessage: (content: string, proposal?: Proposal) => void
  
  // UI Actions
  setActivePanel: (panel: UIState['activePanel']) => void
  toggleDialog: (dialog: keyof UIState, value: boolean) => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  setMapView: (center: [number, number], zoom: number) => void
  
  // Utility
  getPlayerFaction: () => Faction | null
  getFaction: (id: string) => Faction | null
  getTerritory: (id: string) => Territory | null
  getArmy: (id: string) => Army | null
  getCommander: (id: string) => Commander | null
  getRelation: (factionId: string, targetId: string) => DiplomaticRelation | null
  getPlayerBattles: () => Battle[]
}

const initialUIState: UIState = {
  activePanel: 'territory',
  showNewGameDialog: true,
  showSiegeDialog: false,
  showTradeDialog: false,
  showDiplomacyDialog: false,
  showNegotiationChat: false,
  showBattleCommand: null,
  commandingBattleId: null,
  selectedFactionForDiplomacy: null,
  mapCenter: [50, 10],
  mapZoom: 5,
  notifications: [],
  battleNotifications: [],
}

export const useGameStore = create<GameStore>()((set, get) => {
  // Initialize game loop callbacks
  initializeGameLoop(
    {
      onDayTick: processDayTick,
      onWeekTick: processWeekTick,
      onSeasonTick: processSeasonTick,
      onArmyMove: processArmyMovement,
      onBattleCheck: (state) => {
        let newState = checkForBattles(state)
        newState = resolveBattles(newState)
        return newState
      },
      onSiegeTick: (state) => state, // Will implement siege tick
      onAIDecision: processAIDecisions,
      onBattleTimerTick: updateBattleTimers,
    },
    (newState) => {
      // Sync state from game loop to store
      set({ game: newState })
      
      // Check for battle notifications
      const battles = getPlayerBattles(newState)
      if (battles.length > 0) {
        const notifications = battles.map(b => ({
          battleId: b.id,
          title: 'Battle!',
          location: newState.territories.get(b.territoryId)?.name || 'Unknown',
          timeRemaining: b.timeRemaining,
          isUrgent: b.timeRemaining < 15,
        }))
        set(state => ({
          ui: { ...state.ui, battleNotifications: notifications }
        }))
      }
    }
  )
  
  return {
    game: null,
    ui: initialUIState,
    isLoading: false,
    
    // ==================== GAME LIFECYCLE ====================
    
    startNewGame: (settings, playerFactionId) => {
      set({ isLoading: true })
      
      try {
        const territories = generateTerritories(settings.mapRegion)
        const { factions, commanders, armies } = initializeFactions(
          settings,
          playerFactionId,
          territories
        )
        
        const game: GameState = {
          settings,
          time: createInitialTimeState(800),
          speed: 1, // Start at 1x speed
          isRunning: true,
          selectedTerritoryId: null,
          selectedArmyId: null,
          factions: new Map(factions.map(f => [f.id, f])),
          territories: new Map(territories.map(t => [t.id, t])),
          armies: new Map(armies.map(a => [a.id, a])),
          commanders: new Map(commanders.map(c => [c.id, c])),
          activeBattles: new Map(),
          activeNegotiation: null,
          eventLog: [],
          victoryCondition: { type: 'domination', threshold: 0.75 },
        }
        
        set({ 
          game, 
          isLoading: false,
          ui: { ...initialUIState, showNewGameDialog: false }
        })
        
        // Start the game loop
        startGameLoop(game)
      } catch (error) {
        console.error('Failed to start new game:', error)
        set({ isLoading: false })
      }
    },
    
    loadGame: (savedGame) => {
      const game: GameState = {
        ...savedGame,
        factions: new Map(Object.entries(savedGame.factions || {})),
        territories: new Map(Object.entries(savedGame.territories || {})),
        armies: new Map(Object.entries(savedGame.armies || {})),
        commanders: new Map(Object.entries(savedGame.commanders || {})),
        activeBattles: new Map(Object.entries(savedGame.activeBattles || {})),
      }
      set({ game, ui: { ...initialUIState, showNewGameDialog: false } })
      startGameLoop(game)
    },
    
    saveGame: () => {
      const { game } = get()
      if (!game) return
      
      const savedGame = {
        ...game,
        factions: Object.fromEntries(game.factions),
        territories: Object.fromEntries(game.territories),
        armies: Object.fromEntries(game.armies),
        commanders: Object.fromEntries(game.commanders),
        activeBattles: Object.fromEntries(game.activeBattles),
      }
      
      localStorage.setItem('medievalStrategyGame', JSON.stringify(savedGame))
      get().addNotification({
        type: 'success',
        title: 'Game Saved',
        message: 'Your progress has been saved.',
        duration: 3000,
      })
    },
    
    pauseGame: () => {
      const { game } = get()
      if (!game) return
      
      const newGame = { ...game, speed: 0 as GameSpeed, isRunning: false }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    resumeGame: () => {
      const { game } = get()
      if (!game) return
      
      const newGame = { ...game, speed: 1 as GameSpeed, isRunning: true }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    setSpeed: (speed) => {
      const { game } = get()
      if (!game) return
      
      const newGame = { ...game, speed, isRunning: speed > 0 }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    togglePause: () => {
      const { game } = get()
      if (!game) return
      
      const newSpeed = game.speed === 0 ? 1 : 0
      const newGame = { ...game, speed: newSpeed as GameSpeed, isRunning: newSpeed > 0 }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    syncGameState: (state) => {
      set({ game: state })
    },
    
    // ==================== TERRITORY ACTIONS ====================
    
    selectTerritory: (territoryId) => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, selectedTerritoryId: territoryId } })
    },
    
    claimTerritory: (territoryId) => {
      const { game } = get()
      if (!game) return
      
      const playerFaction = get().getPlayerFaction()
      if (!playerFaction) return
      
      const territory = game.territories.get(territoryId)
      if (!territory || territory.ownerId) return
      
      const updatedTerritory = { ...territory, ownerId: playerFaction.id }
      const updatedTerritories = new Map(game.territories)
      updatedTerritories.set(territoryId, updatedTerritory)
      
      const updatedFaction = {
        ...playerFaction,
        territories: [...playerFaction.territories, territoryId],
      }
      const updatedFactions = new Map(game.factions)
      updatedFactions.set(playerFaction.id, updatedFaction)
      
      const newGame = {
        ...game,
        territories: updatedTerritories,
        factions: updatedFactions,
      }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    buildInTerritory: (territoryId, buildingType) => {
      // Implementation for building construction
    },
    
    // ==================== ARMY ACTIONS ====================
    
    selectArmy: (armyId) => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, selectedArmyId: armyId } })
    },
    
    createArmy: (territoryId, name) => {
      const { game } = get()
      if (!game) return
      
      const playerFaction = get().getPlayerFaction()
      if (!playerFaction) return
      
      const territory = game.territories.get(territoryId)
      if (!territory || territory.ownerId !== playerFaction.id) return
      
      const army: Army = {
        id: uuid(),
        name,
        ownerId: playerFaction.id,
        commanderId: null,
        units: [],
        position: territory.center,
        currentTerritoryId: territoryId,
        targetTerritoryId: null,
        targetPosition: null,
        movementProgress: 0,
        movementSpeed: 1,
        supplies: 100,
        maxSupplies: 100,
        morale: 100,
        isRaiding: false,
        isSieging: false,
        inBattle: null,
      }
      
      const updatedArmies = new Map(game.armies)
      updatedArmies.set(army.id, army)
      
      const updatedFaction = {
        ...playerFaction,
        armies: [...playerFaction.armies, army.id],
      }
      const updatedFactions = new Map(game.factions)
      updatedFactions.set(playerFaction.id, updatedFaction)
      
      const newGame = {
        ...game,
        armies: updatedArmies,
        factions: updatedFactions,
      }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    moveArmy: (armyId, targetTerritoryId) => {
      const { game } = get()
      if (!game) return
      
      const newGame = orderArmyMove(game, armyId, targetTerritoryId)
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    cancelArmyMovement: (armyId) => {
      const { game } = get()
      if (!game) return
      
      const newGame = cancelArmyMove(game, armyId)
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    mergeArmies: (armyId1, armyId2) => {
      const { game } = get()
      if (!game) return
      
      const army1 = game.armies.get(armyId1)
      const army2 = game.armies.get(armyId2)
      if (!army1 || !army2 || army1.currentTerritoryId !== army2.currentTerritoryId) return
      
      const mergedUnits = [...army1.units]
      for (const unit of army2.units) {
        const existing = mergedUnits.find(u => u.type === unit.type)
        if (existing) {
          existing.count += unit.count
        } else {
          mergedUnits.push({ ...unit })
        }
      }
      
      const updatedArmy = { ...army1, units: mergedUnits }
      const updatedArmies = new Map(game.armies)
      updatedArmies.set(armyId1, updatedArmy)
      updatedArmies.delete(armyId2)
      
      const newGame = { ...game, armies: updatedArmies }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    recruitUnits: (armyId, unitType, count) => {
      // Implementation for unit recruitment
    },
    
    assignCommander: (armyId, commanderId) => {
      const { game } = get()
      if (!game) return
      
      const army = game.armies.get(armyId)
      const commander = game.commanders.get(commanderId)
      if (!army || !commander) return
      
      const updatedCommanders = new Map(game.commanders)
      if (commander.assignedArmyId) {
        const oldArmy = game.armies.get(commander.assignedArmyId)
        if (oldArmy) {
          const updatedArmies = new Map(game.armies)
          updatedArmies.set(oldArmy.id, { ...oldArmy, commanderId: null })
        }
      }
      
      updatedCommanders.set(commanderId, { ...commander, assignedArmyId: armyId })
      const updatedArmies = new Map(game.armies)
      updatedArmies.set(armyId, { ...army, commanderId })
      
      const newGame = { ...game, armies: updatedArmies, commanders: updatedCommanders }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    startSiege: (armyId, territoryId) => {
      const { game } = get()
      if (!game) return
      
      const army = game.armies.get(armyId)
      const territory = game.territories.get(territoryId)
      if (!army || !territory || !territory.ownerId) return
      if (army.currentTerritoryId !== territoryId) return
      
      const updatedArmy = { ...army, isSieging: true }
      const updatedArmies = new Map(game.armies)
      updatedArmies.set(armyId, updatedArmy)
      
      const siegeState = {
        attackerId: army.ownerId,
        attackingArmyId: armyId,
        defenderId: territory.ownerId,
        territoryId,
        phase: 'approach' as const,
        startDay: game.time.totalDays,
        daysElapsed: 0,
        wallIntegrity: 100,
        defenderSupplies: territory.supplies,
        defenderMorale: territory.morale,
        attackerCasualties: 0,
        defenderCasualties: 0,
        breachPoints: 0,
        reliefForceExpected: false,
        lastTickDay: game.time.totalDays,
      }
      
      const updatedTerritory = { ...territory, siegeState }
      const updatedTerritories = new Map(game.territories)
      updatedTerritories.set(territoryId, updatedTerritory)
      
      const newGame = {
        ...game,
        armies: updatedArmies,
        territories: updatedTerritories,
      }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    // ==================== BATTLE ACTIONS ====================
    
    openBattleCommand: (battleId) => {
      set(state => ({
        ui: { ...state.ui, showBattleCommand: true, commandingBattleId: battleId }
      }))
      get().pauseGame() // Pause when opening battle command
    },
    
    closeBattleCommand: () => {
      set(state => ({
        ui: { ...state.ui, showBattleCommand: null, commandingBattleId: null }
      }))
    },
    
    submitBattleOrders: (battleId, formation, focus, order) => {
      const { game } = get()
      if (!game) return
      
      const newGame = setPlayerBattleCommands(game, battleId, formation, focus, order)
      set({ game: newGame })
      updateGameState(newGame)
      
      get().closeBattleCommand()
      get().resumeGame()
    },
    
    // ==================== DIPLOMACY ACTIONS ====================
    
    declareWar: (targetFactionId) => {
      const { game } = get()
      if (!game) return
      
      const playerFaction = get().getPlayerFaction()
      const targetFaction = game.factions.get(targetFactionId)
      if (!playerFaction || !targetFaction) return
      
      const updatedFactions = new Map(game.factions)
      
      const playerRelations = playerFaction.relations.map(r =>
        r.targetId === targetFactionId
          ? { ...r, status: 'war' as DiplomaticStatus, value: Math.max(-100, r.value - 40) }
          : r
      )
      updatedFactions.set(playerFaction.id, { ...playerFaction, relations: playerRelations })
      
      const targetRelations = targetFaction.relations.map(r =>
        r.targetId === playerFaction.id
          ? { ...r, status: 'war' as DiplomaticStatus, value: Math.max(-100, r.value - 40) }
          : r
      )
      updatedFactions.set(targetFactionId, { ...targetFaction, relations: targetRelations })
      
      const event: GameEvent = {
        id: uuid(),
        day: game.time.totalDays,
        type: 'war_declared',
        title: 'War Declared!',
        description: `${playerFaction.name} has declared war on ${targetFaction.name}!`,
        factionIds: [playerFaction.id, targetFactionId],
        isRead: false,
      }
      
      const newGame = {
        ...game,
        factions: updatedFactions,
        eventLog: [...game.eventLog, event],
      }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    offerPeace: (targetFactionId) => {
      get().openNegotiation(targetFactionId)
    },
    
    formAlliance: (targetFactionId) => {
      const { game } = get()
      if (!game) return
      
      const playerFaction = get().getPlayerFaction()
      const targetFaction = game.factions.get(targetFactionId)
      if (!playerFaction || !targetFaction) return
      
      const relation = playerFaction.relations.find(r => r.targetId === targetFactionId)
      if (!relation || relation.value < 50) {
        get().addNotification({
          type: 'warning',
          title: 'Alliance Rejected',
          message: 'Relations must be at least 50 to form an alliance.',
          duration: 4000,
        })
        return
      }
      
      const updatedFactions = new Map(game.factions)
      
      const playerRelations = playerFaction.relations.map(r =>
        r.targetId === targetFactionId
          ? { ...r, status: 'alliance' as DiplomaticStatus }
          : r
      )
      updatedFactions.set(playerFaction.id, { ...playerFaction, relations: playerRelations })
      
      const targetRelations = targetFaction.relations.map(r =>
        r.targetId === playerFaction.id
          ? { ...r, status: 'alliance' as DiplomaticStatus }
          : r
      )
      updatedFactions.set(targetFactionId, { ...targetFaction, relations: targetRelations })
      
      const newGame = { ...game, factions: updatedFactions }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    breakAlliance: (targetFactionId) => {
      const { game } = get()
      if (!game) return
      
      const playerFaction = get().getPlayerFaction()
      const targetFaction = game.factions.get(targetFactionId)
      if (!playerFaction || !targetFaction) return
      
      const updatedFactions = new Map(game.factions)
      
      const playerRelations = playerFaction.relations.map(r =>
        r.targetId === targetFactionId
          ? { ...r, status: 'hostile' as DiplomaticStatus, value: Math.max(-100, r.value - 30) }
          : r
      )
      updatedFactions.set(playerFaction.id, { ...playerFaction, relations: playerRelations })
      
      const targetRelations = targetFaction.relations.map(r =>
        r.targetId === playerFaction.id
          ? { 
              ...r, 
              status: 'hostile' as DiplomaticStatus, 
              value: Math.max(-100, r.value - 30),
              history: [
                ...r.history,
                {
                  day: game.time.totalDays,
                  type: 'betrayal',
                  description: 'Alliance broken',
                  impact: -30,
                },
              ],
            }
          : r
      )
      updatedFactions.set(targetFactionId, { ...targetFaction, relations: targetRelations })
      
      const newGame = { ...game, factions: updatedFactions }
      set({ game: newGame })
      updateGameState(newGame)
    },
    
    // ==================== NEGOTIATION ACTIONS ====================
    
    openNegotiation: (factionId) => {
      const { game } = get()
      if (!game) return
      
      const targetFaction = game.factions.get(factionId)
      const playerFaction = get().getPlayerFaction()
      if (!targetFaction || !playerFaction) return
      
      const relation = playerFaction.relations.find(r => r.targetId === factionId)
      const relationValue = relation?.value ?? 0
      
      let mood: AIMood = 'neutral'
      if (relationValue <= -50) mood = 'hostile'
      else if (relationValue <= -20) mood = 'suspicious'
      else if (relationValue <= 20) mood = 'neutral'
      else if (relationValue <= 50) mood = 'friendly'
      else mood = 'eager'
      
      const negotiation: NegotiationState = {
        factionId,
        messages: [],
        currentOffer: null,
        aiMood: mood,
        concessionsMade: 0,
        playerConcessions: 0,
        deadlockCount: 0,
        isOpen: true,
      }
      
      const newGame = { ...game, activeNegotiation: negotiation }
      set({ 
        game: newGame,
        ui: { ...get().ui, showNegotiationChat: true, selectedFactionForDiplomacy: factionId }
      })
    },
    
    closeNegotiation: () => {
      const { game } = get()
      if (!game) return
      
      const newGame = { ...game, activeNegotiation: null }
      set({ 
        game: newGame,
        ui: { ...get().ui, showNegotiationChat: false, selectedFactionForDiplomacy: null }
      })
    },
    
    sendMessage: (content, proposal) => {
      const { game } = get()
      if (!game || !game.activeNegotiation) return
      
      const message: ChatMessage = {
        id: uuid(),
        sender: 'player',
        content,
        timestamp: Date.now(),
        proposal,
      }
      
      const updatedNegotiation = {
        ...game.activeNegotiation,
        messages: [...game.activeNegotiation.messages, message],
      }
      
      const newGame = { ...game, activeNegotiation: updatedNegotiation }
      set({ game: newGame })
      
      // AI response will be handled by the negotiation system
    },
    
    // ==================== UI ACTIONS ====================
    
    setActivePanel: (panel) => {
      set(state => ({ ui: { ...state.ui, activePanel: panel } }))
    },
    
    toggleDialog: (dialog, value) => {
      set(state => ({ ui: { ...state.ui, [dialog]: value } }))
    },
    
    addNotification: (notification) => {
      const id = uuid()
      set(state => ({
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, { ...notification, id }],
        },
      }))
      
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => get().removeNotification(id), notification.duration)
      }
    },
    
    removeNotification: (id) => {
      set(state => ({
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== id),
        },
      }))
    },
    
    setMapView: (center, zoom) => {
      set(state => ({ ui: { ...state.ui, mapCenter: center, mapZoom: zoom } }))
    },
    
    // ==================== UTILITY ====================
    
    getPlayerFaction: () => {
      const { game } = get()
      if (!game) return null
      return Array.from(game.factions.values()).find(f => f.isPlayer) || null
    },
    
    getFaction: (id) => {
      const { game } = get()
      return game?.factions.get(id) || null
    },
    
    getTerritory: (id) => {
      const { game } = get()
      return game?.territories.get(id) || null
    },
    
    getArmy: (id) => {
      const { game } = get()
      return game?.armies.get(id) || null
    },
    
    getCommander: (id) => {
      const { game } = get()
      return game?.commanders.get(id) || null
    },
    
    getRelation: (factionId, targetId) => {
      const faction = get().getFaction(factionId)
      return faction?.relations.find(r => r.targetId === targetId) || null
    },
    
    getPlayerBattles: () => {
      const { game } = get()
      if (!game) return []
      return getPlayerBattles(game)
    },
  }
})
