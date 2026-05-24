'use client'

import { create } from 'zustand'

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
  inGameDay: number
  inGameHour: number
  isRunning: boolean
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
  playerCoordinate: Coordinate | null
  weather: WeatherSnapshot
  claimFeatures: OsmClaimFeature[]
  movingBanners: BannerMovement[]
  setPlayerCoordinate: (coordinate: Coordinate) => void
  processEngineTick: (now?: Date) => void
  setWeatherSnapshot: (weather: WeatherSnapshot) => void
  setClaimFeatures: (features: OsmClaimFeature[]) => void
  seedBannerMovement: () => void
}

function createInitialClock(now = new Date()): EngineClock {
  const startedAt = now.toISOString()
  return {
    startedAt,
    lastTickAt: startedAt,
    nextTickAt: new Date(now.getTime() + LOOP_TICK_MS).toISOString(),
    tickIndex: 0,
    inGameDay: 1,
    inGameHour: 0,
    isRunning: true,
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
    inGameDay,
    inGameHour,
    lastTickAt: lastTickAt.toISOString(),
    nextTickAt: new Date(lastTickAt.getTime() + LOOP_TICK_MS).toISOString(),
  }
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

export const usePhaseOneGameStore = create<PhaseOneGameStore>((set, get) => ({
  clock: createInitialClock(),
  playerCoordinate: null,
  weather: fallbackWeather,
  claimFeatures: [],
  movingBanners: [],

  setPlayerCoordinate: coordinate => {
    set({ playerCoordinate: coordinate })
    get().seedBannerMovement()
  },

  processEngineTick: (now = new Date()) => {
    set(state => ({
      clock: advanceClock(state.clock, now),
      movingBanners: progressBanners(state.movingBanners, state.weather, now),
    }))
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
}))

