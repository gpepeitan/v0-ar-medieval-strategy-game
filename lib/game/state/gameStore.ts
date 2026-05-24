'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const REAL_MS_PER_GAME_DAY = 60 * 60 * 1000
export const LOOP_TICK_MS = 15 * 60 * 1000
export const GAME_HOURS_PER_TICK = 6

export type ResourceTag = 'Forest' | 'Quarry' | 'Settlement' | 'Intersection'
export type SeasonPhase = 'winter' | 'spring' | 'summer' | 'autumn' | 'wet' | 'dry'
export type DaylightPhase = 'day' | 'night' | 'dawn' | 'dusk'

export interface Coordinate {
  lat: number
  lon: number
}

export interface EngineClock {
  startedAt: string
  lastTickAt: string
  nextTickAt: string
  tickIndex: number
  ticksApplied: number
  inGameDay: number
  inGameHour: number
  isRunning: boolean
  lastCatchUpCount: number
}

export interface EngineEvent {
  id: string
  tickIndex: number
  type: 'engine_started' | 'tick_applied' | 'catch_up' | 'engine_paused' | 'engine_resumed' | 'engine_reset'
  message: string
  createdAt: string
}

export interface TickSnapshot {
  tickIndex: number
  realWorldAt: string
  inGameDay: number
  inGameHour: number
  weatherMovementMultiplier: number
  activeClaimCount: number
  activeBannerCount: number
}

export interface EnvironmentModifiers {
  movementMultiplier: number
  agricultureMultiplier: number
  laborMultiplier: number
  visibilityMultiplier: number
  ambushMultiplier: number
}

export interface WeatherSnapshot extends EnvironmentModifiers {
  coordinate: Coordinate | null
  observedAt: string | null
  temperatureC: number | null
  precipitationMm: number
  rainMm: number
  snowfallCm: number
  windKph: number | null
  cloudCoverPercent: number | null
  isDaylight: boolean
  sunrise: string | null
  sunset: string | null
  season: SeasonPhase
  daylightPhase: DaylightPhase
  source: 'open-meteo' | 'fallback'
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}

export interface OsmClaimFeature {
  id: string
  osmType: 'node' | 'way' | 'relation' | 'synthetic'
  osmId: number | null
  name: string
  coordinate: Coordinate
  resourceTag: ResourceTag
  resourceYield: Partial<Record<'wood' | 'livestockForage' | 'stone' | 'iron' | 'labor' | 'population', number>>
  sourceTags: Record<string, string>
  claimedBy: string | null
  influence: number
  confidence: number
}

export interface BannerMovement {
  id: string
  name: string
  origin: Coordinate
  destination: Coordinate
  current: Coordinate
  distanceMeters: number
  startedAt: string
  etaAt: string
  baseSpeedKph: number
  activeSpeedKph: number
  progress: number
}

interface PhaseOneGameStore {
  clock: EngineClock
  tickHistory: TickSnapshot[]
  eventLog: EngineEvent[]
  playerCoordinate: Coordinate | null
  weather: WeatherSnapshot
  claimFeatures: OsmClaimFeature[]
  movingBanners: BannerMovement[]
  setPlayerCoordinate: (coordinate: Coordinate) => void
  processEngineTick: (now?: Date) => void
  pauseEngine: () => void
  resumeEngine: () => void
  resetEngine: () => void
  setWeatherSnapshot: (weather: WeatherSnapshot) => void
  setClaimFeatures: (features: OsmClaimFeature[]) => void
  seedBannerMovement: () => void
}

function createEngineEvent(type: EngineEvent['type'], tickIndex: number, message: string): EngineEvent {
  return {
    id: `${type}-${tickIndex}-${Date.now()}`,
    tickIndex,
    type,
    message,
    createdAt: new Date().toISOString(),
  }
}

function createInitialClock(now = new Date()): EngineClock {
  const startedAt = now.toISOString()
  return {
    startedAt,
    lastTickAt: startedAt,
    nextTickAt: new Date(now.getTime() + LOOP_TICK_MS).toISOString(),
    tickIndex: 0,
    ticksApplied: 0,
    inGameDay: 1,
    inGameHour: 0,
    isRunning: true,
    lastCatchUpCount: 0,
  }
}

const fallbackWeather: WeatherSnapshot = {
  coordinate: null,
  observedAt: null,
  temperatureC: null,
  precipitationMm: 0,
  rainMm: 0,
  snowfallCm: 0,
  windKph: null,
  cloudCoverPercent: null,
  isDaylight: true,
  sunrise: null,
  sunset: null,
  season: 'spring',
  daylightPhase: 'day',
  source: 'fallback',
  status: 'idle',
  error: null,
  movementMultiplier: 1,
  agricultureMultiplier: 1,
  laborMultiplier: 1,
  visibilityMultiplier: 1,
  ambushMultiplier: 1,
}

function advanceClock(clock: EngineClock, now: Date): EngineClock {
  if (!clock.isRunning) return clock

  const lastTickMs = new Date(clock.lastTickAt).getTime()
  const elapsedTicks = Math.max(0, Math.floor((now.getTime() - lastTickMs) / LOOP_TICK_MS))
  if (elapsedTicks === 0) return clock

  const tickIndex = clock.tickIndex + elapsedTicks
  const totalGameHours = tickIndex * GAME_HOURS_PER_TICK
  const inGameDay = 1 + Math.floor(totalGameHours / 24)
  const inGameHour = totalGameHours % 24
  const lastTickAt = new Date(lastTickMs + elapsedTicks * LOOP_TICK_MS)

  return {
    ...clock,
    tickIndex,
    ticksApplied: clock.ticksApplied + elapsedTicks,
    inGameDay,
    inGameHour,
    lastTickAt: lastTickAt.toISOString(),
    nextTickAt: new Date(lastTickAt.getTime() + LOOP_TICK_MS).toISOString(),
    lastCatchUpCount: elapsedTicks,
  }
}

function createTickSnapshots(
  priorClock: EngineClock,
  nextClock: EngineClock,
  weather: WeatherSnapshot,
  claimFeatures: OsmClaimFeature[],
  movingBanners: BannerMovement[]
): TickSnapshot[] {
  if (nextClock.tickIndex === priorClock.tickIndex) return []

  const snapshots: TickSnapshot[] = []
  for (let tick = priorClock.tickIndex + 1; tick <= nextClock.tickIndex; tick += 1) {
    const totalGameHours = tick * GAME_HOURS_PER_TICK
    snapshots.push({
      tickIndex: tick,
      realWorldAt: new Date(new Date(priorClock.lastTickAt).getTime() + (tick - priorClock.tickIndex) * LOOP_TICK_MS).toISOString(),
      inGameDay: 1 + Math.floor(totalGameHours / 24),
      inGameHour: totalGameHours % 24,
      weatherMovementMultiplier: weather.movementMultiplier,
      activeClaimCount: claimFeatures.filter(feature => feature.claimedBy !== null).length,
      activeBannerCount: movingBanners.length,
    })
  }

  return snapshots
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress
}

function progressBanners(
  banners: BannerMovement[],
  weather: WeatherSnapshot,
  now: Date
): BannerMovement[] {
  return banners.map(banner => {
    const startedAtMs = new Date(banner.startedAt).getTime()
    const activeSpeedKph = Math.max(0.4, banner.baseSpeedKph * weather.movementMultiplier)
    const metersPerMs = (activeSpeedKph * 1000) / (60 * 60 * 1000)
    const progress = Math.min(1, ((now.getTime() - startedAtMs) * metersPerMs) / banner.distanceMeters)

    return {
      ...banner,
      activeSpeedKph,
      progress,
      current: {
        lat: lerp(banner.origin.lat, banner.destination.lat, progress),
        lon: lerp(banner.origin.lon, banner.destination.lon, progress),
      },
      etaAt: new Date(startedAtMs + banner.distanceMeters / metersPerMs).toISOString(),
    }
  })
}

function haversineMeters(a: Coordinate, b: Coordinate) {
  const radiusMeters = 6371000
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const deltaLat = ((b.lat - a.lat) * Math.PI) / 180
  const deltaLon = ((b.lon - a.lon) * Math.PI) / 180
  const sinLat = Math.sin(deltaLat / 2)
  const sinLon = Math.sin(deltaLon / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  return 2 * radiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export const usePhaseOneGameStore = create<PhaseOneGameStore>()(
  persist(
    (set, get) => ({
      clock: createInitialClock(),
      tickHistory: [],
      eventLog: [createEngineEvent('engine_started', 0, 'Phase 1 persistent engine initialized.')],
      playerCoordinate: null,
      weather: fallbackWeather,
      claimFeatures: [],
      movingBanners: [],

      setPlayerCoordinate: coordinate => {
        set({ playerCoordinate: coordinate })
        get().seedBannerMovement()
      },

      processEngineTick: (now = new Date()) => {
        set(state => {
          const nextClock = advanceClock(state.clock, now)
          const movingBanners = progressBanners(state.movingBanners, state.weather, now)
          const tickSnapshots = createTickSnapshots(
            state.clock,
            nextClock,
            state.weather,
            state.claimFeatures,
            movingBanners
          )
          const tickEvents = tickSnapshots.map(snapshot =>
            createEngineEvent(
              snapshot.tickIndex - state.clock.tickIndex > 1 ? 'catch_up' : 'tick_applied',
              snapshot.tickIndex,
              `Processed game day ${snapshot.inGameDay}, hour ${snapshot.inGameHour}.`
            )
          )

          return {
            clock: nextClock,
            movingBanners,
            tickHistory: [...state.tickHistory, ...tickSnapshots].slice(-96),
            eventLog: [...state.eventLog, ...tickEvents].slice(-120),
          }
        })
      },

      pauseEngine: () => {
        set(state => ({
          clock: { ...state.clock, isRunning: false },
          eventLog: [
            ...state.eventLog,
            createEngineEvent('engine_paused', state.clock.tickIndex, 'Engine loop paused.'),
          ].slice(-120),
        }))
      },

      resumeEngine: () => {
        set(state => {
          const now = new Date()
          return {
            clock: {
              ...state.clock,
              isRunning: true,
              lastTickAt: now.toISOString(),
              nextTickAt: new Date(now.getTime() + LOOP_TICK_MS).toISOString(),
              lastCatchUpCount: 0,
            },
            eventLog: [
              ...state.eventLog,
              createEngineEvent('engine_resumed', state.clock.tickIndex, 'Engine loop resumed.'),
            ].slice(-120),
          }
        })
      },

      resetEngine: () => {
        const clock = createInitialClock()
        set({
          clock,
          tickHistory: [],
          eventLog: [createEngineEvent('engine_reset', 0, 'Engine loop reset to day 1, hour 0.')],
          movingBanners: [],
        })
      },

      setWeatherSnapshot: weather => {
        set(state => ({
          weather,
          movingBanners: progressBanners(state.movingBanners, weather, new Date()),
        }))
      },

      setClaimFeatures: claimFeatures => set({ claimFeatures }),

      seedBannerMovement: () => {
        const coordinate = get().playerCoordinate
        if (!coordinate || get().movingBanners.length > 0) return

        const destination = {
          lat: coordinate.lat + 0.012,
          lon: coordinate.lon + 0.018,
        }
        const distanceMeters = Math.max(500, haversineMeters(coordinate, destination))
        const baseSpeedKph = 4.5
        const startedAt = new Date()
        const etaAt = new Date(startedAt.getTime() + distanceMeters / ((baseSpeedKph * 1000) / (60 * 60 * 1000)))

        set({
          movingBanners: [
            {
              id: 'banner-local-scouts',
              name: 'Local scout banner',
              origin: coordinate,
              destination,
              current: coordinate,
              distanceMeters,
              startedAt: startedAt.toISOString(),
              etaAt: etaAt.toISOString(),
              baseSpeedKph,
              activeSpeedKph: baseSpeedKph,
              progress: 0,
            },
          ],
        })
      },
    }),
    {
      name: 'neighborhood-phase-one-engine',
      partialize: state => ({
        clock: state.clock,
        tickHistory: state.tickHistory,
        eventLog: state.eventLog,
        playerCoordinate: state.playerCoordinate,
        weather: state.weather,
        claimFeatures: state.claimFeatures,
        movingBanners: state.movingBanners,
      }),
    }
  )
)
