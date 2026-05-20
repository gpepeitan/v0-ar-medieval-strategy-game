// Real-Time Game Loop Engine
// Uses requestAnimationFrame for smooth updates with configurable game speeds

import { GameState, GameSpeed, GAME_SPEED_MULTIPLIERS, TimeState, Battle } from '../types'

// Constants
const MS_PER_DAY = 1000  // At 1x speed, 1 second = 1 in-game day
const TICK_RATE = 100    // Process game logic every 100ms
const AI_DECISION_INTERVAL_DAYS = 2  // AI evaluates every 2 in-game days

export interface GameLoopCallbacks {
  onDayTick: (state: GameState, day: number) => GameState
  onWeekTick: (state: GameState) => GameState
  onSeasonTick: (state: GameState) => GameState
  onArmyMove: (state: GameState, deltaMs: number) => GameState
  onBattleCheck: (state: GameState) => GameState
  onSiegeTick: (state: GameState) => GameState
  onAIDecision: (state: GameState) => GameState
  onBattleTimerTick: (state: GameState, deltaMs: number) => GameState
}

export interface GameLoopState {
  isRunning: boolean
  lastFrameTime: number
  accumulatedTime: number
  lastAIDecisionDay: number
  animationFrameId: number | null
}

let loopState: GameLoopState = {
  isRunning: false,
  lastFrameTime: 0,
  accumulatedTime: 0,
  lastAIDecisionDay: 0,
  animationFrameId: null,
}

let gameStateRef: GameState | null = null
let callbacksRef: GameLoopCallbacks | null = null
let onStateUpdateRef: ((state: GameState) => void) | null = null

/**
 * Initialize the game loop with callbacks and state updater
 */
export function initializeGameLoop(
  callbacks: GameLoopCallbacks,
  onStateUpdate: (state: GameState) => void
) {
  callbacksRef = callbacks
  onStateUpdateRef = onStateUpdate
}

/**
 * Start the game loop
 */
export function startGameLoop(initialState: GameState) {
  if (loopState.isRunning) return
  
  gameStateRef = initialState
  loopState = {
    isRunning: true,
    lastFrameTime: performance.now(),
    accumulatedTime: initialState.time.accumulatedTime,
    lastAIDecisionDay: initialState.time.totalDays,
    animationFrameId: null,
  }
  
  loopState.animationFrameId = requestAnimationFrame(gameLoopFrame)
}

/**
 * Stop the game loop
 */
export function stopGameLoop() {
  loopState.isRunning = false
  if (loopState.animationFrameId !== null) {
    cancelAnimationFrame(loopState.animationFrameId)
    loopState.animationFrameId = null
  }
}

/**
 * Update game state from external source (e.g., player actions)
 */
export function updateGameState(newState: GameState) {
  gameStateRef = newState
}

/**
 * Set game speed
 */
export function setGameSpeed(state: GameState, speed: GameSpeed): GameState {
  return {
    ...state,
    speed,
    isRunning: speed > 0,
  }
}

/**
 * Main game loop frame
 */
function gameLoopFrame(currentTime: number) {
  if (!loopState.isRunning || !gameStateRef || !callbacksRef || !onStateUpdateRef) {
    return
  }
  
  const deltaTime = currentTime - loopState.lastFrameTime
  loopState.lastFrameTime = currentTime
  
  // Get speed multiplier (0 = paused)
  const speedMultiplier = GAME_SPEED_MULTIPLIERS[gameStateRef.speed]
  
  if (speedMultiplier > 0) {
    let state = gameStateRef
    
    // Calculate scaled time
    const scaledDelta = deltaTime * speedMultiplier
    loopState.accumulatedTime += scaledDelta
    
    // Process army movement every frame for smooth animation
    state = callbacksRef.onArmyMove(state, scaledDelta)
    
    // Process battle timers (countdown)
    state = callbacksRef.onBattleTimerTick(state, deltaTime) // Real-time, not scaled
    
    // Check for army encounters that trigger battles
    state = callbacksRef.onBattleCheck(state)
    
    // Process day ticks
    while (loopState.accumulatedTime >= MS_PER_DAY) {
      loopState.accumulatedTime -= MS_PER_DAY
      
      // Advance day
      const newTime = advanceDay(state.time)
      state = { ...state, time: newTime }
      
      // Day tick (resources, production, etc.)
      state = callbacksRef.onDayTick(state, newTime.day)
      
      // Siege progression (daily)
      state = callbacksRef.onSiegeTick(state)
      
      // Week tick (every 7 days)
      if (newTime.day % 7 === 0) {
        state = callbacksRef.onWeekTick(state)
      }
      
      // Season tick (every 90 days)
      if (newTime.day === 1 || newTime.day === 91 || newTime.day === 181 || newTime.day === 271) {
        state = callbacksRef.onSeasonTick(state)
      }
      
      // AI decision cycle (every N days, scaled with speed)
      if (newTime.totalDays - loopState.lastAIDecisionDay >= AI_DECISION_INTERVAL_DAYS) {
        state = callbacksRef.onAIDecision(state)
        loopState.lastAIDecisionDay = newTime.totalDays
      }
    }
    
    // Update accumulated time in state
    state = {
      ...state,
      time: { ...state.time, accumulatedTime: loopState.accumulatedTime }
    }
    
    gameStateRef = state
    onStateUpdateRef(state)
  }
  
  // Schedule next frame
  loopState.animationFrameId = requestAnimationFrame(gameLoopFrame)
}

/**
 * Advance the game time by one day
 */
function advanceDay(time: TimeState): TimeState {
  let newDay = time.day + 1
  let newSeason = time.season
  let newYear = time.year
  
  // Day overflow
  if (newDay > 365) {
    newDay = 1
    newYear++
  }
  
  // Determine season
  if (newDay >= 1 && newDay < 91) {
    newSeason = 'spring'
  } else if (newDay >= 91 && newDay < 181) {
    newSeason = 'summer'
  } else if (newDay >= 181 && newDay < 271) {
    newSeason = 'autumn'
  } else {
    newSeason = 'winter'
  }
  
  return {
    day: newDay,
    season: newSeason,
    year: newYear,
    totalDays: time.totalDays + 1,
    lastTickTime: performance.now(),
    accumulatedTime: 0,
  }
}

/**
 * Get formatted date string
 */
export function formatGameDate(time: TimeState): string {
  const seasonNames = {
    spring: 'Spring',
    summer: 'Summer', 
    autumn: 'Autumn',
    winter: 'Winter',
  }
  return `Day ${time.day}, ${seasonNames[time.season]} ${time.year} AD`
}

/**
 * Get the day number within the current season (1-90)
 */
export function getSeasonDay(time: TimeState): number {
  const seasonStartDays = { spring: 1, summer: 91, autumn: 181, winter: 271 }
  return time.day - seasonStartDays[time.season] + 1
}

/**
 * Create initial time state
 */
export function createInitialTimeState(startYear: number = 800): TimeState {
  return {
    day: 1,
    season: 'spring',
    year: startYear,
    totalDays: 1,
    lastTickTime: performance.now(),
    accumulatedTime: 0,
  }
}
