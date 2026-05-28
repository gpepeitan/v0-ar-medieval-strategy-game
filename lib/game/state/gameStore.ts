'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const REAL_MS_PER_GAME_DAY = 60 * 60 * 1000
export const LOOP_TICK_MS = 15 * 60 * 1000
export const GAME_HOURS_PER_TICK = 6

export type ResourceTag = 'Forest' | 'Quarry' | 'Settlement' | 'Intersection'
export type SeasonPhase = 'winter' | 'spring' | 'summer' | 'autumn' | 'wet' | 'dry'
export type DaylightPhase = 'day' | 'night' | 'dawn' | 'dusk'
export type BuildingType = 'lumber_camp' | 'nature_reserve' | 'stone_works' | 'guild_hall' | 'market_post'

export interface Building {
  type: BuildingType
  startedAt: string
  completedAt: string | null
}

export interface Coordinate { lat: number; lon: number }

export interface AiPolity {
  id: string
  name: string
  color: string
}

export interface EngineClock {
  startedAt: string; lastTickAt: string; nextTickAt: string
  tickIndex: number; ticksApplied: number
  inGameDay: number; inGameHour: number
  isRunning: boolean; lastCatchUpCount: number
}

export interface EngineEvent {
  id: string; tickIndex: number
  type: 'engine_started'|'tick_applied'|'catch_up'|'engine_paused'|'engine_resumed'|'engine_reset'
  message: string; createdAt: string
}

export interface TickSnapshot {
  tickIndex: number; realWorldAt: string
  inGameDay: number; inGameHour: number
  weatherMovementMultiplier: number
  activeClaimCount: number; activeBannerCount: number
}

export interface EnvironmentModifiers {
  movementMultiplier: number; agricultureMultiplier: number
  laborMultiplier: number; visibilityMultiplier: number; ambushMultiplier: number
}

export interface WeatherSnapshot extends EnvironmentModifiers {
  coordinate: Coordinate | null; observedAt: string | null
  temperatureC: number | null
  precipitationMm: number; rainMm: number; snowfallCm: number
  windKph: number | null; cloudCoverPercent: number | null
  isDaylight: boolean; sunrise: string | null; sunset: string | null
  season: SeasonPhase; daylightPhase: DaylightPhase
  source: 'open-meteo' | 'fallback'; status: 'idle'|'loading'|'ready'|'error'
  error: string | null; penaltyReasons: string[]
  movementPenaltyPercent: number; productionDeltaPercent: number
}

export interface OsmClaimFeature {
  id: string; osmType: 'node'|'way'|'relation'|'synthetic'; osmId: number | null
  name: string; coordinate: Coordinate; resourceTag: ResourceTag
  isHarvestable: boolean
  resourceYield: Partial<Record<'wood'|'livestockForage'|'stone'|'iron'|'labor'|'population'|'gold', number>>
  sourceTags: Record<string, string>
  claimedBy: string | null; influence: number; confidence: number
  building: Building | null
}

export interface BannerMovement {
  id: string; name: string
  origin: Coordinate; destination: Coordinate; current: Coordinate
  distanceMeters: number; startedAt: string; etaAt: string
  baseSpeedKph: number; activeSpeedKph: number; progress: number
}

// ─── AI Polity seed data ──────────────────────────────────────────────────────
const AI_POLITY_SEEDS: AiPolity[] = [
  { id: 'ai-0', name: 'Northern Enclave', color: '#ef4444' },
  { id: 'ai-1', name: 'Western Compact',  color: '#a855f7' },
]

interface PhaseOneGameStore {
  clock: EngineClock
  tickHistory: TickSnapshot[]
  eventLog: EngineEvent[]
  playerCoordinate: Coordinate | null
  weather: WeatherSnapshot
  claimFeatures: OsmClaimFeature[]
  movingBanners: BannerMovement[]
  selectedFeatureId: string | null
  selectedBannerId: string | null
  aiPolities: AiPolity[]

  setPlayerCoordinate: (coordinate: Coordinate) => void
  processEngineTick: (now?: Date) => void
  pauseEngine: () => void
  resumeEngine: () => void
  resetEngine: () => void
  setWeatherSnapshot: (weather: WeatherSnapshot) => void
  setClaimFeatures: (features: OsmClaimFeature[]) => void
  seedBannerMovement: () => void
  selectFeature: (id: string | null) => void
  selectBanner: (id: string | null) => void
  claimFeature: (featureId: string) => void
  moveBannerTo: (bannerId: string, destination: Coordinate) => void
  buildOnFeature: (featureId: string, buildingType: BuildingType) => void
}

function createEngineEvent(type: EngineEvent['type'], tickIndex: number, message: string): EngineEvent {
  return { id: `${type}-${tickIndex}-${Date.now()}`, tickIndex, type, message, createdAt: new Date().toISOString() }
}

function createInitialClock(now = new Date()): EngineClock {
  const startedAt = now.toISOString()
  return {
    startedAt, lastTickAt: startedAt,
    nextTickAt: new Date(now.getTime() + LOOP_TICK_MS).toISOString(),
    tickIndex: 0, ticksApplied: 0, inGameDay: 1, inGameHour: 0,
    isRunning: true, lastCatchUpCount: 0,
  }
}

const fallbackWeather: WeatherSnapshot = {
  coordinate: null, observedAt: null, temperatureC: null,
  precipitationMm: 0, rainMm: 0, snowfallCm: 0, windKph: null, cloudCoverPercent: null,
  isDaylight: true, sunrise: null, sunset: null, season: 'spring', daylightPhase: 'day',
  source: 'fallback', status: 'idle', error: null,
  penaltyReasons: ['No active weather penalties'],
  movementPenaltyPercent: 0, productionDeltaPercent: 0,
  movementMultiplier: 1, agricultureMultiplier: 1, laborMultiplier: 1,
  visibilityMultiplier: 1, ambushMultiplier: 1,
}

function advanceClock(clock: EngineClock, now: Date): EngineClock {
  if (!clock.isRunning) return clock
  const lastTickMs = new Date(clock.lastTickAt).getTime()
  const elapsedTicks = Math.max(0, Math.floor((now.getTime() - lastTickMs) / LOOP_TICK_MS))
  if (elapsedTicks === 0) return clock
  const tickIndex = clock.tickIndex + elapsedTicks
  const totalGameHours = tickIndex * GAME_HOURS_PER_TICK
  const lastTickAt = new Date(lastTickMs + elapsedTicks * LOOP_TICK_MS)
  return {
    ...clock, tickIndex, ticksApplied: clock.ticksApplied + elapsedTicks,
    inGameDay: 1 + Math.floor(totalGameHours / 24), inGameHour: totalGameHours % 24,
    lastTickAt: lastTickAt.toISOString(),
    nextTickAt: new Date(lastTickAt.getTime() + LOOP_TICK_MS).toISOString(),
    lastCatchUpCount: elapsedTicks,
  }
}

function createTickSnapshots(
  priorClock: EngineClock, nextClock: EngineClock,
  weather: WeatherSnapshot, claimFeatures: OsmClaimFeature[], movingBanners: BannerMovement[]
): TickSnapshot[] {
  if (nextClock.tickIndex === priorClock.tickIndex) return []
  return Array.from({ length: nextClock.tickIndex - priorClock.tickIndex }, (_, i) => {
    const tick = priorClock.tickIndex + 1 + i
    const totalGameHours = tick * GAME_HOURS_PER_TICK
    return {
      tickIndex: tick,
      realWorldAt: new Date(new Date(priorClock.lastTickAt).getTime() + (i + 1) * LOOP_TICK_MS).toISOString(),
      inGameDay: 1 + Math.floor(totalGameHours / 24), inGameHour: totalGameHours % 24,
      weatherMovementMultiplier: weather.movementMultiplier,
      activeClaimCount: claimFeatures.filter(f => f.claimedBy !== null).length,
      activeBannerCount: movingBanners.length,
    }
  })
}

function haversineMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000
  const lat1 = (a.lat * Math.PI) / 180; const lat2 = (b.lat * Math.PI) / 180
  const dLat = ((b.lat - a.lat) * Math.PI) / 180; const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s = Math.sin(dLat / 2); const s2 = Math.sin(dLon / 2)
  const h = s * s + Math.cos(lat1) * Math.cos(lat2) * s2 * s2
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function progressBanners(banners: BannerMovement[], weather: WeatherSnapshot, now: Date): BannerMovement[] {
  return banners.map(banner => {
    const startedAtMs = new Date(banner.startedAt).getTime()
    const activeSpeedKph = Math.max(0.4, banner.baseSpeedKph * weather.movementMultiplier)
    const metersPerMs = (activeSpeedKph * 1000) / (3600 * 1000)
    const progress = Math.min(1, ((now.getTime() - startedAtMs) * metersPerMs) / banner.distanceMeters)
    return {
      ...banner, activeSpeedKph, progress,
      current: { lat: lerp(banner.origin.lat, banner.destination.lat, progress), lon: lerp(banner.origin.lon, banner.destination.lon, progress) },
      etaAt: new Date(startedAtMs + banner.distanceMeters / metersPerMs).toISOString(),
    }
  })
}

/** Complete any buildings whose construction started at least one tick ago */
function completedBuildings(features: OsmClaimFeature[], now: Date): OsmClaimFeature[] {
  const nowMs = now.getTime()
  return features.map(f => {
    if (!f.building || f.building.completedAt !== null) return f
    if (nowMs - new Date(f.building.startedAt).getTime() >= LOOP_TICK_MS) {
      return { ...f, building: { ...f.building, completedAt: now.toISOString() } }
    }
    return f
  })
}

/** On each tick, each AI polity claims one more unclaimed non-Intersection feature near it */
function tickAiClaims(features: OsmClaimFeature[]): OsmClaimFeature[] {
  const updated = [...features]
  for (const polity of AI_POLITY_SEEDS) {
    const alreadyOwned = updated.filter(f => f.claimedBy === polity.id)
    if (alreadyOwned.length >= 6) continue
    const unclaimed = updated.filter(f => !f.claimedBy && f.resourceTag !== 'Intersection')
    if (unclaimed.length === 0) continue
    // Claim the one closest to existing territory or a random one
    const pivot = alreadyOwned[0]
    const target = pivot
      ? unclaimed.reduce((best, f) => {
          const dBest = Math.abs(best.coordinate.lat - pivot.coordinate.lat) + Math.abs(best.coordinate.lon - pivot.coordinate.lon)
          const dF    = Math.abs(f.coordinate.lat   - pivot.coordinate.lat) + Math.abs(f.coordinate.lon   - pivot.coordinate.lon)
          return dF < dBest ? f : best
        })
      : unclaimed[Math.floor(Math.random() * unclaimed.length)]
    const idx = updated.findIndex(f => f.id === target.id)
    if (idx !== -1) updated[idx] = { ...updated[idx], claimedBy: polity.id, influence: 0.7 }
  }
  return updated
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
      selectedFeatureId: null,
      selectedBannerId: null,
      aiPolities: AI_POLITY_SEEDS,

      setPlayerCoordinate: coordinate => {
        set({ playerCoordinate: coordinate })
        get().seedBannerMovement()
      },

      processEngineTick: (now = new Date()) => {
        set(state => {
          const nextClock = advanceClock(state.clock, now)
          const movingBanners = progressBanners(state.movingBanners, state.weather, now)
          const tickSnapshots = createTickSnapshots(state.clock, nextClock, state.weather, state.claimFeatures, movingBanners)
          // Advance AI claims and complete buildings on ticks
          const afterAi = tickSnapshots.length > 0 ? tickAiClaims(state.claimFeatures) : state.claimFeatures
          const claimFeatures = completedBuildings(afterAi, now)
          const tickEvents = tickSnapshots.map(s =>
            createEngineEvent(
              s.tickIndex - state.clock.tickIndex > 1 ? 'catch_up' : 'tick_applied',
              s.tickIndex, `Processed game day ${s.inGameDay}, hour ${s.inGameHour}.`
            )
          )
          return {
            clock: nextClock, movingBanners, claimFeatures,
            tickHistory: [...state.tickHistory, ...tickSnapshots].slice(-96),
            eventLog: [...state.eventLog, ...tickEvents].slice(-120),
          }
        })
      },

      pauseEngine: () => set(state => ({
        clock: { ...state.clock, isRunning: false },
        eventLog: [...state.eventLog, createEngineEvent('engine_paused', state.clock.tickIndex, 'Engine paused.')].slice(-120),
      })),

      resumeEngine: () => set(state => {
        const now = new Date()
        return {
          clock: { ...state.clock, isRunning: true, lastTickAt: now.toISOString(), nextTickAt: new Date(now.getTime() + LOOP_TICK_MS).toISOString(), lastCatchUpCount: 0 },
          eventLog: [...state.eventLog, createEngineEvent('engine_resumed', state.clock.tickIndex, 'Engine resumed.')].slice(-120),
        }
      }),

      resetEngine: () => {
        const clock = createInitialClock()
        set({ clock, tickHistory: [], eventLog: [createEngineEvent('engine_reset', 0, 'Engine reset.')], movingBanners: [] })
      },

      setWeatherSnapshot: weather => set(state => ({
        weather, movingBanners: progressBanners(state.movingBanners, weather, new Date()),
      })),

      setClaimFeatures: claimFeatures => {
        // Seed initial AI polity claims on first load
        const withAiSeeds = claimFeatures.map((f, i) => {
          if (f.claimedBy) return f
          // AI-0 gets features 3-4, AI-1 gets features 5-6 (skip player at index 0)
          if (i === 3 || i === 4) return { ...f, claimedBy: 'ai-0', influence: 0.65 }
          if (i === 5 || i === 6) return { ...f, claimedBy: 'ai-1', influence: 0.65 }
          return f
        })
        set({ claimFeatures: withAiSeeds })
      },

      selectFeature: id => set({ selectedFeatureId: id }),
      selectBanner: id => set({ selectedBannerId: id }),

      claimFeature: featureId => set(state => ({
        claimFeatures: state.claimFeatures.map(f =>
          f.id === featureId ? { ...f, claimedBy: 'player', influence: 1 } : f
        ),
        selectedFeatureId: featureId,
      })),

      buildOnFeature: (featureId, buildingType) => set(state => ({
        claimFeatures: state.claimFeatures.map(f =>
          f.id !== featureId || f.claimedBy !== 'player' || f.building
            ? f
            : { ...f, building: { type: buildingType, startedAt: new Date().toISOString(), completedAt: null } }
        ),
      })),

      moveBannerTo: (bannerId, destination) => set(state => {
        const banner = state.movingBanners.find(b => b.id === bannerId)
        if (!banner) return {}
        const origin = banner.current
        const distanceMeters = Math.max(100, haversineMeters(origin, destination))
        const now = new Date()
        const metersPerMs = (banner.baseSpeedKph * 1000) / (3600 * 1000)
        return {
          selectedBannerId: null,
          movingBanners: state.movingBanners.map(b =>
            b.id !== bannerId ? b : {
              ...b, origin, destination, current: origin, distanceMeters, progress: 0,
              startedAt: now.toISOString(),
              etaAt: new Date(now.getTime() + distanceMeters / metersPerMs).toISOString(),
            }
          ),
        }
      }),

      seedBannerMovement: () => {
        const coordinate = get().playerCoordinate
        if (!coordinate || get().movingBanners.length > 0) return
        const destination = { lat: coordinate.lat + 0.012, lon: coordinate.lon + 0.018 }
        const distanceMeters = Math.max(500, haversineMeters(coordinate, destination))
        const baseSpeedKph = 4.5
        const now = new Date()
        set({
          movingBanners: [{
            id: 'banner-local-scouts', name: 'Local scouts',
            origin: coordinate, destination, current: coordinate,
            distanceMeters, startedAt: now.toISOString(),
            etaAt: new Date(now.getTime() + distanceMeters / ((baseSpeedKph * 1000) / 3600000)).toISOString(),
            baseSpeedKph, activeSpeedKph: baseSpeedKph, progress: 0,
          }],
        })
      },
    }),
    {
      name: 'neighborhood-phase-one-engine',
      partialize: state => ({
        clock: state.clock, tickHistory: state.tickHistory, eventLog: state.eventLog,
        playerCoordinate: state.playerCoordinate, weather: state.weather,
        claimFeatures: state.claimFeatures, movingBanners: state.movingBanners,
      }),
    }
  )
)
