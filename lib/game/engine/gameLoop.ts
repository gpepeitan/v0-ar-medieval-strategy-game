// Real-Time Game Loop — Hyper-Local Pacing
// 1 real-world hour = 1 in-game day (at 1x speed)
// Resource ticks: every 15 real-world minutes
// Army movement: based on real-world distance at ~80 m/min walking pace

import {
  GameState,
  GameSpeed,
  GAME_SPEED_MULTIPLIERS,
  TimeState,
  Battle,
} from '../types'

// ─── Timing constants ────────────────────────────────────────────────────────
// At 1x speed:
//   1 real second   = 1/3600 of an in-game day
//   1 in-game day   = 3_600_000 ms (1 real hour)
//   resource tick   = 900_000 ms (15 real minutes)
// Higher speed multipliers compress time for testing/dev.

export const MS_PER_DAY_1X = 3_600_000   // 1 real hour per in-game day
export const MS_PER_RESOURCE_TICK = 900_000  // 15 real minutes

// How often we fire the JS loop frame (ms) — smooth but CPU-friendly
const FRAME_INTERVAL_MS = 500

// Army march speed: 80 metres per real-world minute at 1x
// = 80 m/min × 60 min/hour = 4800 m per in-game day at 1x
export const MARCH_SPEED_METRES_PER_DAY = 4800

// Night hours (local time 21:00 – 05:00)
export const NIGHT_START_HOUR = 21
export const NIGHT_END_HOUR = 5

// ─── Callbacks ───────────────────────────────────────────────────────────────

export interface GameLoopCallbacks {
  onDayTick: (state: GameState, day: number) => GameState
  onResourceTick: (state: GameState) => GameState     // every 15 real min
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
  // Accumulated real-ms toward next in-game day
  accumulatedDayMs: number
  // Accumulated real-ms toward next resource tick
  accumulatedResourceMs: number
  lastAIDecisionDay: number
  intervalId: ReturnType<typeof setInterval> | null
}

let loopState: GameLoopState = {
  isRunning: false,
  lastFrameTime: 0,
  accumulatedDayMs: 0,
  accumulatedResourceMs: 0,
  lastAIDecisionDay: 0,
  intervalId: null,
}

let gameStateRef: GameState | null = null
let callbacksRef: GameLoopCallbacks | null = null
let onStateUpdateRef: ((state: GameState) => void) | null = null

// ─── Public API ──────────────────────────────────────────────────────────────

export function initializeGameLoop(
  callbacks: GameLoopCallbacks,
  onStateUpdate: (state: GameState) => void
) {
  callbacksRef = callbacks
  onStateUpdateRef = onStateUpdate
}

export function startGameLoop(initialState: GameState) {
  if (loopState.isRunning) return

  gameStateRef = initialState
  loopState = {
    isRunning: true,
    lastFrameTime: performance.now(),
    accumulatedDayMs: initialState.time.accumulatedTime,
    accumulatedResourceMs: 0,
    lastAIDecisionDay: initialState.time.totalDays,
    intervalId: null,
  }

  // Use setInterval instead of rAF so the loop keeps running
  // even when the tab is backgrounded
  loopState.intervalId = setInterval(gameLoopFrame, FRAME_INTERVAL_MS)
}

export function stopGameLoop() {
  loopState.isRunning = false
  if (loopState.intervalId !== null) {
    clearInterval(loopState.intervalId)
    loopState.intervalId = null
  }
}

export function updateGameState(newState: GameState) {
  gameStateRef = newState
}

export function setGameSpeed(state: GameState, speed: GameSpeed): GameState {
  return { ...state, speed, isRunning: speed > 0 }
}

// ─── Main loop frame ─────────────────────────────────────────────────────────

function gameLoopFrame() {
  if (!loopState.isRunning || !gameStateRef || !callbacksRef || !onStateUpdateRef) {
    return
  }

  const now = performance.now()
  const realDeltaMs = now - loopState.lastFrameTime
  loopState.lastFrameTime = now

  const speedMultiplier = GAME_SPEED_MULTIPLIERS[gameStateRef.speed]

  if (speedMultiplier === 0) {
    // Paused — only tick battle timers (real-time countdown)
    let state = callbacksRef.onBattleTimerTick(gameStateRef, realDeltaMs)
    gameStateRef = state
    onStateUpdateRef(state)
    return
  }

  let state = gameStateRef

  // Scale delta by speed multiplier
  const scaledDeltaMs = realDeltaMs * speedMultiplier

  // ── Army movement (every frame, smooth) ──
  state = callbacksRef.onArmyMove(state, scaledDeltaMs)

  // ── Battle timer (real-time, not scaled) ──
  state = callbacksRef.onBattleTimerTick(state, realDeltaMs)

  // ── Battle encounter check ──
  state = callbacksRef.onBattleCheck(state)

  // ── Accumulate day time ──
  const msDayAt1x = MS_PER_DAY_1X
  loopState.accumulatedDayMs += scaledDeltaMs
  loopState.accumulatedResourceMs += scaledDeltaMs

  // ── Resource tick (every 15 real-min equiv) ──
  const msResourceAt1x = MS_PER_RESOURCE_TICK
  while (loopState.accumulatedResourceMs >= msResourceAt1x) {
    loopState.accumulatedResourceMs -= msResourceAt1x
    state = callbacksRef.onResourceTick(state)
  }

  // ── Day tick ──
  while (loopState.accumulatedDayMs >= msDayAt1x) {
    loopState.accumulatedDayMs -= msDayAt1x

    const newTime = advanceDay(state.time)
    state = { ...state, time: newTime }

    state = callbacksRef.onDayTick(state, newTime.day)
    state = callbacksRef.onSiegeTick(state)

    if (newTime.totalDays % 7 === 0) {
      state = callbacksRef.onWeekTick(state)
    }

    // Season boundaries
    const d = newTime.day
    if (d === 1 || d === 91 || d === 181 || d === 271) {
      state = callbacksRef.onSeasonTick(state)
    }

    // AI decisions every 2 in-game days
    if (newTime.totalDays - loopState.lastAIDecisionDay >= 2) {
      state = callbacksRef.onAIDecision(state)
      loopState.lastAIDecisionDay = newTime.totalDays
    }
  }

  // Persist accumulated times back into state
  state = {
    ...state,
    time: {
      ...state.time,
      accumulatedTime: loopState.accumulatedDayMs,
      localHour: new Date().getHours(),
      isDaytime: isDaytime(new Date().getHours()),
    },
  }

  gameStateRef = state
  onStateUpdateRef(state)
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

function isDaytime(hour: number): boolean {
  return hour >= NIGHT_END_HOUR && hour < NIGHT_START_HOUR
}

function advanceDay(time: TimeState): TimeState {
  let newDay = time.day + 1
  let newYear = time.year

  if (newDay > 365) {
    newDay = 1
    newYear++
  }

  let season: TimeState['season']
  if (newDay < 91) season = 'spring'
  else if (newDay < 181) season = 'summer'
  else if (newDay < 271) season = 'autumn'
  else season = 'winter'

  return {
    ...time,
    day: newDay,
    season,
    year: newYear,
    totalDays: time.totalDays + 1,
    lastTickTime: performance.now(),
    accumulatedTime: 0,
    localHour: new Date().getHours(),
    isDaytime: isDaytime(new Date().getHours()),
  }
}

export function formatGameDate(time: TimeState): string {
  const names = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }
  return `Day ${time.day}, ${names[time.season]} ${time.year} AD`
}

export function getSeasonDay(time: TimeState): number {
  const starts = { spring: 1, summer: 91, autumn: 181, winter: 271 }
  return time.day - starts[time.season] + 1
}

export function createInitialTimeState(startYear = 800): TimeState {
  const now = new Date()
  return {
    day: 1,
    season: 'spring',
    year: startYear,
    totalDays: 1,
    realWorldStartMs: Date.now(),
    lastTickTime: performance.now(),
    accumulatedTime: 0,
    localHour: now.getHours(),
    isDaytime: isDaytime(now.getHours()),
  }
}

// ─── Army distance helper ─────────────────────────────────────────────────────

/**
 * Haversine distance in metres between two lat/lng points
 */
export function haversineMetres(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const R = 6_371_000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Compute estimated arrival given real-world distance and current speed multiplier
 * Returns epoch ms
 */
export function computeArrivalTime(
  distanceMetres: number,
  speedMultiplier: number,
  weatherMovementMultiplier: number,
  isNight: boolean
): number {
  const nightMult = isNight ? 0.5 : 1.0
  // metres per ms at 1x = 4800 m/day ÷ 3_600_000 ms/day = 0.001333 m/ms
  const metresPerMs1x = MARCH_SPEED_METRES_PER_DAY / MS_PER_DAY_1X
  const effectiveMetresPerMs =
    metresPerMs1x * speedMultiplier * weatherMovementMultiplier * nightMult
  if (effectiveMetresPerMs <= 0) return Infinity
  return Date.now() + distanceMetres / effectiveMetresPerMs
}
