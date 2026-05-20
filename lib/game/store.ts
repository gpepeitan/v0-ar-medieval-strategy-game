// Zustand Game Store - Central State Management

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import {
  GameState,
  GameSettings,
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
} from './types'
import {
  INITIAL_RESOURCES,
  FACTION_DEFINITIONS,
  DIFFICULTY_MODIFIERS,
} from './constants'
import { generateTerritories } from './map/territories'
import { initializeFactions } from './factions/factionSetup'
import { processAITurns } from './ai/aiController'
import { processEndTurn } from './systems/turnProcessor'

interface GameStore {
  // State
  game: GameState | null
  ui: UIState
  isLoading: boolean
  
  // Game Actions
  startNewGame: (settings: GameSettings, playerFactionId: string) => void
  loadGame: (savedGame: GameState) => void
  saveGame: () => void
  endTurn: () => void
  
  // Territory Actions
  selectTerritory: (territoryId: string | null) => void
  claimTerritory: (territoryId: string) => void
  buildInTerritory: (territoryId: string, buildingType: string) => void
  
  // Army Actions
  selectArmy: (armyId: string | null) => void
  createArmy: (territoryId: string, name: string) => void
  moveArmy: (armyId: string, targetTerritoryId: string) => void
  mergeArmies: (armyId1: string, armyId2: string) => void
  recruitUnits: (armyId: string, unitType: string, count: number) => void
  assignCommander: (armyId: string, commanderId: string) => void
  startSiege: (armyId: string, territoryId: string) => void
  
  // Diplomacy Actions
  declareWar: (targetFactionId: string) => void
  offerPeace: (targetFactionId: string) => void
  proposeTrade: (targetFactionId: string, offer: Partial<Resources>, demand: Partial<Resources>) => void
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
}

const initialUIState: UIState = {
  activePanel: 'map',
  showNewGameDialog: true,
  showSiegeDialog: false,
  showTradeDialog: false,
  showDiplomacyDialog: false,
  showNegotiationChat: false,
  selectedFactionForDiplomacy: null,
  mapCenter: [50, 10],
  mapZoom: 5,
  notifications: [],
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,
      ui: initialUIState,
      isLoading: false,
      
      // ==================== GAME ACTIONS ====================
      
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
            turn: 1,
            season: 'spring',
            year: 800,
            isPaused: false,
            isPlayerTurn: true,
            selectedTerritoryId: null,
            selectedArmyId: null,
            factions: new Map(factions.map(f => [f.id, f])),
            territories: new Map(territories.map(t => [t.id, t])),
            armies: new Map(armies.map(a => [a.id, a])),
            commanders: new Map(commanders.map(c => [c.id, c])),
            activeNegotiation: null,
            eventLog: [],
            victoryCondition: { type: 'domination', threshold: 0.75 },
          }
          
          set({ 
            game, 
            isLoading: false,
            ui: { ...initialUIState, showNewGameDialog: false }
          })
        } catch (error) {
          console.error('Failed to start new game:', error)
          set({ isLoading: false })
        }
      },
      
      loadGame: (savedGame) => {
        // Convert plain objects back to Maps
        const game: GameState = {
          ...savedGame,
          factions: new Map(Object.entries(savedGame.factions || {})),
          territories: new Map(Object.entries(savedGame.territories || {})),
          armies: new Map(Object.entries(savedGame.armies || {})),
          commanders: new Map(Object.entries(savedGame.commanders || {})),
        }
        set({ game, ui: { ...initialUIState, showNewGameDialog: false } })
      },
      
      saveGame: () => {
        const { game } = get()
        if (!game) return
        
        // Convert Maps to objects for serialization
        const savedGame = {
          ...game,
          factions: Object.fromEntries(game.factions),
          territories: Object.fromEntries(game.territories),
          armies: Object.fromEntries(game.armies),
          commanders: Object.fromEntries(game.commanders),
        }
        
        localStorage.setItem('medievalStrategyGame', JSON.stringify(savedGame))
        get().addNotification({
          type: 'success',
          title: 'Game Saved',
          message: 'Your progress has been saved.',
          duration: 3000,
        })
      },
      
      endTurn: () => {
        const { game } = get()
        if (!game || !game.isPlayerTurn) return
        
        set(state => ({
          game: state.game ? { ...state.game, isPlayerTurn: false } : null
        }))
        
        // Process end of player turn
        let updatedGame = processEndTurn(game)
        
        // Process AI turns
        updatedGame = processAITurns(updatedGame)
        
        // Advance turn counter
        const newTurn = updatedGame.turn + 1
        const seasons: GameState['season'][] = ['spring', 'summer', 'autumn', 'winter']
        const seasonIndex = (newTurn - 1) % 4
        const newYear = updatedGame.year + (seasonIndex === 0 && newTurn > 1 ? 1 : 0)
        
        set({
          game: {
            ...updatedGame,
            turn: newTurn,
            season: seasons[seasonIndex],
            year: newYear,
            isPlayerTurn: true,
          }
        })
      },
      
      // ==================== TERRITORY ACTIONS ====================
      
      selectTerritory: (territoryId) => {
        set(state => ({
          game: state.game ? { ...state.game, selectedTerritoryId: territoryId } : null
        }))
      },
      
      claimTerritory: (territoryId) => {
        const { game } = get()
        if (!game) return
        
        const playerFaction = get().getPlayerFaction()
        if (!playerFaction) return
        
        const territory = game.territories.get(territoryId)
        if (!territory || territory.ownerId) return
        
        // Update territory
        const updatedTerritory = { ...territory, ownerId: playerFaction.id }
        const updatedTerritories = new Map(game.territories)
        updatedTerritories.set(territoryId, updatedTerritory)
        
        // Update faction
        const updatedFaction = {
          ...playerFaction,
          territories: [...playerFaction.territories, territoryId],
        }
        const updatedFactions = new Map(game.factions)
        updatedFactions.set(playerFaction.id, updatedFaction)
        
        set({
          game: {
            ...game,
            territories: updatedTerritories,
            factions: updatedFactions,
          }
        })
      },
      
      buildInTerritory: (territoryId, buildingType) => {
        // Implementation for building construction
        const { game } = get()
        if (!game) return
        
        const territory = game.territories.get(territoryId)
        const playerFaction = get().getPlayerFaction()
        if (!territory || !playerFaction || territory.ownerId !== playerFaction.id) return
        
        // Check if can afford and build
        // This will be expanded in the territory system
      },
      
      // ==================== ARMY ACTIONS ====================
      
      selectArmy: (armyId) => {
        set(state => ({
          game: state.game ? { ...state.game, selectedArmyId: armyId } : null
        }))
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
          position: territoryId,
          destination: null,
          movementProgress: 0,
          supplies: 100,
          maxSupplies: 100,
          morale: 100,
          isRaiding: false,
          isSieging: false,
        }
        
        const updatedArmies = new Map(game.armies)
        updatedArmies.set(army.id, army)
        
        const updatedFaction = {
          ...playerFaction,
          armies: [...playerFaction.armies, army.id],
        }
        const updatedFactions = new Map(game.factions)
        updatedFactions.set(playerFaction.id, updatedFaction)
        
        set({
          game: {
            ...game,
            armies: updatedArmies,
            factions: updatedFactions,
          }
        })
      },
      
      moveArmy: (armyId, targetTerritoryId) => {
        const { game } = get()
        if (!game) return
        
        const army = game.armies.get(armyId)
        if (!army) return
        
        const updatedArmy = {
          ...army,
          destination: targetTerritoryId,
          movementProgress: 0,
        }
        
        const updatedArmies = new Map(game.armies)
        updatedArmies.set(armyId, updatedArmy)
        
        set({ game: { ...game, armies: updatedArmies } })
      },
      
      mergeArmies: (armyId1, armyId2) => {
        // Merge army2 into army1
        const { game } = get()
        if (!game) return
        
        const army1 = game.armies.get(armyId1)
        const army2 = game.armies.get(armyId2)
        if (!army1 || !army2 || army1.position !== army2.position) return
        
        // Merge units
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
        
        set({ game: { ...game, armies: updatedArmies } })
      },
      
      recruitUnits: (armyId, unitType, count) => {
        // Implementation for unit recruitment
        const { game } = get()
        if (!game) return
        
        const army = game.armies.get(armyId)
        const playerFaction = get().getPlayerFaction()
        if (!army || !playerFaction || army.ownerId !== playerFaction.id) return
        
        // This will check costs and add units
      },
      
      assignCommander: (armyId, commanderId) => {
        const { game } = get()
        if (!game) return
        
        const army = game.armies.get(armyId)
        const commander = game.commanders.get(commanderId)
        if (!army || !commander) return
        
        // Unassign from previous army if any
        const updatedCommanders = new Map(game.commanders)
        if (commander.assignedArmyId) {
          const oldArmy = game.armies.get(commander.assignedArmyId)
          if (oldArmy) {
            const updatedArmies = new Map(game.armies)
            updatedArmies.set(oldArmy.id, { ...oldArmy, commanderId: null })
          }
        }
        
        // Assign to new army
        updatedCommanders.set(commanderId, { ...commander, assignedArmyId: armyId })
        const updatedArmies = new Map(game.armies)
        updatedArmies.set(armyId, { ...army, commanderId })
        
        set({
          game: { ...game, armies: updatedArmies, commanders: updatedCommanders }
        })
      },
      
      startSiege: (armyId, territoryId) => {
        const { game } = get()
        if (!game) return
        
        const army = game.armies.get(armyId)
        const territory = game.territories.get(territoryId)
        if (!army || !territory || !territory.ownerId) return
        if (army.position !== territoryId) return
        
        const updatedArmy = { ...army, isSieging: true }
        const updatedArmies = new Map(game.armies)
        updatedArmies.set(armyId, updatedArmy)
        
        const siegeState = {
          attackerId: army.ownerId,
          attackingArmyId: armyId,
          defenderId: territory.ownerId,
          territoryId,
          phase: 'approach' as const,
          turnsElapsed: 0,
          wallIntegrity: 100,
          defenderSupplies: territory.supplies,
          defenderMorale: territory.morale,
          attackerCasualties: 0,
          defenderCasualties: 0,
          breachPoints: 0,
          reliefForceExpected: false,
        }
        
        const updatedTerritory = { ...territory, siegeState }
        const updatedTerritories = new Map(game.territories)
        updatedTerritories.set(territoryId, updatedTerritory)
        
        set({
          game: {
            ...game,
            armies: updatedArmies,
            territories: updatedTerritories,
          }
        })
      },
      
      // ==================== DIPLOMACY ACTIONS ====================
      
      declareWar: (targetFactionId) => {
        const { game } = get()
        if (!game) return
        
        const playerFaction = get().getPlayerFaction()
        const targetFaction = game.factions.get(targetFactionId)
        if (!playerFaction || !targetFaction) return
        
        // Update relations
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
        
        // Add event
        const event: GameEvent = {
          id: uuid(),
          turn: game.turn,
          type: 'war_declared',
          title: 'War Declared!',
          description: `${playerFaction.name} has declared war on ${targetFaction.name}!`,
          factionIds: [playerFaction.id, targetFactionId],
          isRead: false,
        }
        
        set({
          game: {
            ...game,
            factions: updatedFactions,
            eventLog: [...game.eventLog, event],
          }
        })
      },
      
      offerPeace: (targetFactionId) => {
        // Will be handled through negotiation system
        get().openNegotiation(targetFactionId)
      },
      
      proposeTrade: (targetFactionId, offer, demand) => {
        // Will be handled through negotiation system
        get().openNegotiation(targetFactionId)
      },
      
      formAlliance: (targetFactionId) => {
        const { game } = get()
        if (!game) return
        
        const playerFaction = get().getPlayerFaction()
        const targetFaction = game.factions.get(targetFactionId)
        if (!playerFaction || !targetFaction) return
        
        // Check if relations are good enough
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
        
        // Update relations
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
        
        set({ game: { ...game, factions: updatedFactions } })
      },
      
      breakAlliance: (targetFactionId) => {
        const { game } = get()
        if (!game) return
        
        const playerFaction = get().getPlayerFaction()
        const targetFaction = game.factions.get(targetFactionId)
        if (!playerFaction || !targetFaction) return
        
        const updatedFactions = new Map(game.factions)
        
        // Breaking alliance hurts relations significantly
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
                    turn: game.turn,
                    type: 'betrayal',
                    description: 'Alliance broken',
                    impact: -30,
                  },
                ],
              }
            : r
        )
        updatedFactions.set(targetFactionId, { ...targetFaction, relations: targetRelations })
        
        set({ game: { ...game, factions: updatedFactions } })
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
        
        // Determine AI mood based on relation
        let mood: AIMood = 'neutral'
        if (relationValue <= -50) mood = 'hostile'
        else if (relationValue <= -20) mood = 'suspicious'
        else if (relationValue >= 50) mood = 'friendly'
        else if (relationValue >= 80) mood = 'eager'
        
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
        
        set(state => ({
          game: state.game ? { ...state.game, activeNegotiation: negotiation } : null,
          ui: { ...state.ui, showNegotiationChat: true },
        }))
        
        // Generate AI greeting
        setTimeout(() => {
          const { game } = get()
          if (!game?.activeNegotiation) return
          
          const greetings = getAIGreeting(targetFaction, mood)
          const greeting = greetings[Math.floor(Math.random() * greetings.length)]
          
          const message: ChatMessage = {
            id: uuid(),
            sender: 'ai',
            content: greeting,
            timestamp: Date.now(),
          }
          
          set(state => ({
            game: state.game?.activeNegotiation
              ? {
                  ...state.game,
                  activeNegotiation: {
                    ...state.game.activeNegotiation,
                    messages: [...state.game.activeNegotiation.messages, message],
                  },
                }
              : state.game,
          }))
        }, 500)
      },
      
      closeNegotiation: () => {
        set(state => ({
          game: state.game ? { ...state.game, activeNegotiation: null } : null,
          ui: { ...state.ui, showNegotiationChat: false },
        }))
      },
      
      sendMessage: (content, proposal) => {
        const { game } = get()
        if (!game?.activeNegotiation) return
        
        const playerMessage: ChatMessage = {
          id: uuid(),
          sender: 'player',
          content,
          timestamp: Date.now(),
          proposal,
        }
        
        set(state => ({
          game: state.game?.activeNegotiation
            ? {
                ...state.game,
                activeNegotiation: {
                  ...state.game.activeNegotiation,
                  messages: [...state.game.activeNegotiation.messages, playerMessage],
                  currentOffer: proposal || state.game.activeNegotiation.currentOffer,
                },
              }
            : state.game,
        }))
        
        // Generate AI response after a delay
        setTimeout(() => {
          generateAIResponse(get, set, content, proposal)
        }, 1000 + Math.random() * 1000)
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
        
        if (notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id)
          }, notification.duration)
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
        set(state => ({
          ui: { ...state.ui, mapCenter: center, mapZoom: zoom },
        }))
      },
      
      // ==================== UTILITY ====================
      
      getPlayerFaction: () => {
        const { game } = get()
        if (!game) return null
        
        for (const faction of game.factions.values()) {
          if (faction.isPlayer) return faction
        }
        return null
      },
      
      getFaction: (id) => {
        return get().game?.factions.get(id) ?? null
      },
      
      getTerritory: (id) => {
        return get().game?.territories.get(id) ?? null
      },
      
      getArmy: (id) => {
        return get().game?.armies.get(id) ?? null
      },
      
      getCommander: (id) => {
        return get().game?.commanders.get(id) ?? null
      },
      
      getRelation: (factionId, targetId) => {
        const faction = get().game?.factions.get(factionId)
        return faction?.relations.find(r => r.targetId === targetId) ?? null
      },
    }),
    {
      name: 'medieval-strategy-storage',
      partialize: (state) => ({}), // Don't persist by default, use manual save
    }
  )
)

// Helper functions for AI dialogue
function getAIGreeting(faction: Faction, mood: AIMood): string[] {
  const personalityGreetings: Record<string, Record<AIMood, string[]>> = {
    raider: {
      hostile: ['You dare approach us? Speak quickly, or feel our wrath.'],
      suspicious: ['Words are wind. What do you truly want?'],
      neutral: ['State your business. We have raids to plan.'],
      friendly: ['Ah, a fellow warrior. What brings you?'],
      eager: ['Our ally! What glory shall we seek together?'],
    },
    diplomat: {
      hostile: ['Your presence tests our patience. Be brief.'],
      suspicious: ['We listen, but trust must be rebuilt.'],
      neutral: ['Welcome to our court. How may we assist?'],
      friendly: ['A pleasure as always. What brings you?'],
      eager: ['Our dear friend! Your visit honors us greatly.'],
    },
    merchant: {
      hostile: ['Business is business, but you test our limits.'],
      suspicious: ['What transaction do you propose?'],
      neutral: ['All things have a price. Name yours.'],
      friendly: ['A valued trading partner. What can we arrange?'],
      eager: ['Our prosperity grows together! What shall we trade?'],
    },
    militarist: {
      hostile: ['Face us in battle if you dare. Words are meaningless.'],
      suspicious: ['Speak, but know that strength alone impresses us.'],
      neutral: ['What military matter brings you here?'],
      friendly: ['A worthy adversary. Let us discuss strategy.'],
      eager: ['Brother in arms! What campaigns shall we plan?'],
    },
    default: {
      hostile: ['You approach despite our enmity. Be quick.'],
      suspicious: ['We are listening. Proceed carefully.'],
      neutral: ['Greetings. State your proposal.'],
      friendly: ['Welcome! How may we assist?'],
      eager: ['Our trusted partner! What brings you?'],
    },
  }
  
  const key = faction.personality as keyof typeof personalityGreetings
  return personalityGreetings[key]?.[mood] || personalityGreetings.default[mood]
}

function generateAIResponse(
  get: () => GameStore,
  set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void,
  playerMessage: string,
  proposal?: Proposal
) {
  const { game } = get()
  if (!game?.activeNegotiation) return
  
  const targetFaction = game.factions.get(game.activeNegotiation.factionId)
  const playerFaction = get().getPlayerFaction()
  if (!targetFaction || !playerFaction) return
  
  const negotiation = game.activeNegotiation
  let response = ''
  let newMood = negotiation.aiMood
  
  // Analyze player message and generate response
  const lowerMessage = playerMessage.toLowerCase()
  
  if (proposal) {
    // Evaluate proposal value
    const value = evaluateProposal(proposal, targetFaction, playerFaction, game)
    
    if (value.total >= 50) {
      response = 'Your terms are generous. We accept this arrangement.'
      // Apply the deal
      applyDeal(proposal, targetFaction, playerFaction, get, set)
    } else if (value.total >= 20) {
      response = 'This could work. We agree to your proposal.'
      applyDeal(proposal, targetFaction, playerFaction, get, set)
    } else if (value.total >= -10) {
      response = 'Close, but not quite. Perhaps you could improve your offer?'
    } else if (value.total >= -30) {
      response = 'Your terms are insufficient. We require significantly more.'
      newMood = negotiation.aiMood === 'friendly' ? 'neutral' : 'suspicious'
    } else {
      response = 'This is insulting. We have nothing more to discuss.'
      newMood = 'hostile'
    }
  } else {
    // Handle conversational messages
    if (lowerMessage.includes('peace')) {
      if (negotiation.aiMood === 'hostile') {
        response = 'Peace? After what you have done? It will cost you dearly.'
      } else {
        response = 'Peace is possible. What terms do you propose?'
      }
    } else if (lowerMessage.includes('alliance') || lowerMessage.includes('ally')) {
      if (negotiation.aiMood === 'hostile' || negotiation.aiMood === 'suspicious') {
        response = 'Alliance? You must prove your worth first.'
      } else {
        response = 'An alliance could benefit us both. Continue...'
      }
    } else if (lowerMessage.includes('trade')) {
      response = 'We are always interested in profitable arrangements. What do you offer?'
    } else if (lowerMessage.includes('war') || lowerMessage.includes('attack') || lowerMessage.includes('destroy')) {
      // Check if proposing joint war against a common enemy
      const mentionedFactions = Array.from(game.factions.values())
        .filter(f => f.id !== playerFaction.id && f.id !== targetFaction.id)
        .filter(f => lowerMessage.includes(f.name.toLowerCase()))
      
      if (mentionedFactions.length > 0) {
        const targetEnemy = mentionedFactions[0]
        const theirRelation = targetFaction.relations.find(r => r.targetId === targetEnemy.id)
        
        if (theirRelation && theirRelation.value < -30) {
          response = `Ah, ${targetEnemy.name}... Yes, they are a thorn in our side. We would be very interested in such an arrangement.`
          newMood = negotiation.aiMood === 'hostile' ? 'suspicious' : 'friendly'
        } else {
          response = `We have no quarrel with ${targetEnemy.name}. This does not interest us.`
        }
      } else {
        response = 'War against whom? Be specific in your proposals.'
      }
    } else if (lowerMessage.includes('sorry') || lowerMessage.includes('apologize')) {
      response = 'Words are easily spoken. Actions speak louder. What will you do?'
    } else if (lowerMessage.includes('gift') || lowerMessage.includes('tribute')) {
      response = 'Gold speaks louder than words. How much do you offer?'
    } else {
      // Generic responses based on mood
      const genericResponses: Record<AIMood, string[]> = {
        hostile: ['Get to the point.', 'We grow impatient.', 'Your words mean little.'],
        suspicious: ['Continue...', 'We are listening.', 'And?'],
        neutral: ['Interesting. Tell us more.', 'We understand. What do you propose?', 'Go on.'],
        friendly: ['We appreciate your candor.', 'A fair point.', 'We see your perspective.'],
        eager: ['Of course!', 'We agree wholeheartedly!', 'Excellent point!'],
      }
      
      const options = genericResponses[negotiation.aiMood]
      response = options[Math.floor(Math.random() * options.length)]
    }
  }
  
  const aiMessage: ChatMessage = {
    id: uuid(),
    sender: 'ai',
    content: response,
    timestamp: Date.now(),
  }
  
  set(state => ({
    game: state.game?.activeNegotiation
      ? {
          ...state.game,
          activeNegotiation: {
            ...state.game.activeNegotiation,
            messages: [...state.game.activeNegotiation.messages, aiMessage],
            aiMood: newMood,
            deadlockCount: proposal ? 0 : state.game.activeNegotiation.deadlockCount + 1,
          },
        }
      : state.game,
  }))
}

function evaluateProposal(
  proposal: Proposal,
  targetFaction: Faction,
  playerFaction: Faction,
  game: GameState
): { total: number } {
  let total = 0
  
  // Evaluate offered resources
  if (proposal.offeredResources) {
    total += (proposal.offeredResources.gold || 0) * 0.1
    total += (proposal.offeredResources.food || 0) * 0.05
    total += (proposal.offeredResources.iron || 0) * 0.2
    total += (proposal.offeredResources.tradeGoods || 0) * 0.15
  }
  
  // Evaluate demanded resources (negative)
  if (proposal.demandedResources) {
    total -= (proposal.demandedResources.gold || 0) * 0.15
    total -= (proposal.demandedResources.food || 0) * 0.08
    total -= (proposal.demandedResources.iron || 0) * 0.25
    total -= (proposal.demandedResources.tradeGoods || 0) * 0.2
  }
  
  // Joint war against enemy
  if (proposal.type === 'joint_war' && proposal.targetFaction) {
    const relation = targetFaction.relations.find(r => r.targetId === proposal.targetFaction)
    if (relation) {
      if (relation.value < -50) total += 40  // Their biggest enemy
      else if (relation.value < -20) total += 20
      else if (relation.value > 20) total -= 30  // Attacking their friend
    }
  }
  
  // Peace treaty value
  if (proposal.type === 'peace') {
    const playerRelation = targetFaction.relations.find(r => r.targetId === playerFaction.id)
    if (playerRelation?.status === 'war') {
      // Check who's winning
      const theirTerritories = targetFaction.territories.length
      const playerTerritories = playerFaction.territories.length
      
      if (theirTerritories < playerTerritories) {
        total += 20  // They're losing, peace is good
      } else {
        total -= 10  // They're winning, why stop?
      }
    }
  }
  
  // Alliance value
  if (proposal.type === 'alliance') {
    const relation = targetFaction.relations.find(r => r.targetId === playerFaction.id)
    if (relation) {
      if (relation.value < 0) total -= 30  // Don't ally with enemies
      else if (relation.value > 30) total += 15
    }
  }
  
  return { total }
}

function applyDeal(
  proposal: Proposal,
  targetFaction: Faction,
  playerFaction: Faction,
  get: () => GameStore,
  set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void
) {
  const { game } = get()
  if (!game) return
  
  const updatedFactions = new Map(game.factions)
  
  // Transfer resources
  if (proposal.offeredResources) {
    const updatedPlayer = {
      ...playerFaction,
      resources: {
        ...playerFaction.resources,
        gold: playerFaction.resources.gold - (proposal.offeredResources.gold || 0),
        food: playerFaction.resources.food - (proposal.offeredResources.food || 0),
        wood: playerFaction.resources.wood - (proposal.offeredResources.wood || 0),
        stone: playerFaction.resources.stone - (proposal.offeredResources.stone || 0),
        iron: playerFaction.resources.iron - (proposal.offeredResources.iron || 0),
        tradeGoods: playerFaction.resources.tradeGoods - (proposal.offeredResources.tradeGoods || 0),
      },
    }
    
    const updatedTarget = {
      ...targetFaction,
      resources: {
        ...targetFaction.resources,
        gold: targetFaction.resources.gold + (proposal.offeredResources.gold || 0),
        food: targetFaction.resources.food + (proposal.offeredResources.food || 0),
        wood: targetFaction.resources.wood + (proposal.offeredResources.wood || 0),
        stone: targetFaction.resources.stone + (proposal.offeredResources.stone || 0),
        iron: targetFaction.resources.iron + (proposal.offeredResources.iron || 0),
        tradeGoods: targetFaction.resources.tradeGoods + (proposal.offeredResources.tradeGoods || 0),
      },
    }
    
    updatedFactions.set(playerFaction.id, updatedPlayer)
    updatedFactions.set(targetFaction.id, updatedTarget)
  }
  
  // Update diplomatic status
  if (proposal.type === 'peace' || proposal.type === 'alliance' || proposal.type === 'non_aggression') {
    const newStatus: DiplomaticStatus = 
      proposal.type === 'alliance' ? 'alliance' :
      proposal.type === 'non_aggression' ? 'non_aggression' :
      'neutral'
    
    const player = updatedFactions.get(playerFaction.id) || playerFaction
    const target = updatedFactions.get(targetFaction.id) || targetFaction
    
    const playerRelations = player.relations.map(r =>
      r.targetId === targetFaction.id
        ? { ...r, status: newStatus, value: Math.min(100, r.value + 20) }
        : r
    )
    
    const targetRelations = target.relations.map(r =>
      r.targetId === playerFaction.id
        ? { ...r, status: newStatus, value: Math.min(100, r.value + 20) }
        : r
    )
    
    updatedFactions.set(playerFaction.id, { ...player, relations: playerRelations })
    updatedFactions.set(targetFaction.id, { ...target, relations: targetRelations })
  }
  
  set(state => ({
    game: state.game
      ? { ...state.game, factions: updatedFactions }
      : state.game,
  }))
  
  get().addNotification({
    type: 'success',
    title: 'Deal Accepted',
    message: `${targetFaction.name} has accepted your proposal.`,
    duration: 4000,
  })
}
