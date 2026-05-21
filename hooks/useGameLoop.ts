'use client'

// useGameLoop — wires the real-time game loop callbacks and keeps the loop's
// internal gameStateRef in sync with the Zustand store.

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/game/store'
import {
  initializeGameLoop,
  startGameLoop,
  stopGameLoop,
  updateGameState,
} from '@/lib/game/engine/gameLoop'
import { processDayTick, processWeekTick, processSeasonTick } from '@/lib/game/engine/tickProcessor'
import { processArmyMovement } from '@/lib/game/engine/armyMovement'
import { checkForBattles, updateBattleTimers } from '@/lib/game/engine/battleManager'
import { processSiegeTick } from '@/lib/game/systems/siegeSystem'
import { processAIDecisions } from '@/lib/game/ai/aiController'
import { GameState } from '@/lib/game/types'

export function useGameLoop() {
  const setGameState = useGameStore(state => state.syncGameState)
  const game = useGameStore(state => state.game)
  const initializedRef = useRef(false)

  // Initialize callbacks once on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    initializeGameLoop(
      {
        onDayTick: (state, day) => processDayTick(state, day),
        onWeekTick: (state) => processWeekTick(state),
        onSeasonTick: (state) => processSeasonTick(state),
        onArmyMove: (state, deltaMs) => processArmyMovement(state, deltaMs),
        onBattleCheck: (state) => checkForBattles(state),
        onSiegeTick: (state) => processSiegeTick(state),
        onAIDecision: (state) => processAIDecisions(state),
        onBattleTimerTick: (state, deltaMs) => updateBattleTimers(state, deltaMs),
      },
      (newState: GameState) => {
        setGameState(newState)
      }
    )
  }, [setGameState])

  // Keep the loop's internal ref in sync whenever player actions update the store
  useEffect(() => {
    if (game) {
      updateGameState(game)
    }
  }, [game])

  // Stop loop on unmount
  useEffect(() => {
    return () => {
      stopGameLoop()
    }
  }, [])
}
