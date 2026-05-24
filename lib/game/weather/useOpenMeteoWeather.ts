'use client'

import { useEffect } from 'react'
import {
  Coordinate,
  DaylightPhase,
  SeasonPhase,
  WeatherSnapshot,
  usePhaseOneGameStore,
} from '@/lib/game/state/gameStore'

interface OpenMeteoResponse {
  timezone?: string
  current?: {
    time?: string
    temperature_2m?: number
    precipitation?: number
    rain?: number
    snowfall?: number
    wind_speed_10m?: number
    cloud_cover?: number
    is_day?: number
  }
  daily?: {
    sunrise?: string[]
    sunset?: string[]
  }
}

function getSeason(coordinate: Coordinate, date = new Date()): SeasonPhase {
  const month = date.getUTCMonth()
  const isNorthern = coordinate.lat >= 0
  const temperateSeason = month <= 1 || month === 11
    ? 'winter'
    : month <= 4
      ? 'spring'
      : month <= 7
        ? 'summer'
        : 'autumn'

  if (Math.abs(coordinate.lat) < 23.5) {
    return month >= 4 && month <= 9 ? 'wet' : 'dry'
  }

  if (isNorthern) return temperateSeason

  const southernMap: Record<'winter' | 'spring' | 'summer' | 'autumn', SeasonPhase> = {
    winter: 'summer',
    spring: 'autumn',
    summer: 'winter',
    autumn: 'spring',
  }
  return southernMap[temperateSeason]
}

function getDaylightPhase(isDaylight: boolean, sunrise?: string, sunset?: string, date = new Date()): DaylightPhase {
  if (!sunrise || !sunset) return isDaylight ? 'day' : 'night'

  const nowMs = date.getTime()
  const sunriseMs = new Date(sunrise).getTime()
  const sunsetMs = new Date(sunset).getTime()
  const oneHourMs = 60 * 60 * 1000

  if (Math.abs(nowMs - sunriseMs) <= oneHourMs) return 'dawn'
  if (Math.abs(nowMs - sunsetMs) <= oneHourMs) return 'dusk'
  return isDaylight ? 'day' : 'night'
}

function calculateModifiers(options: {
  rainMm: number
  snowfallCm: number
  temperatureC: number | null
  season: SeasonPhase
  daylightPhase: DaylightPhase
}) {
  const rainPenalty = options.rainMm > 0 ? Math.min(0.3, options.rainMm * 0.08) : 0
  const snowPenalty = options.snowfallCm > 0 ? Math.min(0.45, options.snowfallCm * 0.12 + 0.12) : 0
  const nightPenalty = options.daylightPhase === 'night' ? 0.18 : options.daylightPhase === 'dawn' || options.daylightPhase === 'dusk' ? 0.08 : 0
  const winterPenalty = options.season === 'winter' ? 0.15 : 0
  const springBonus = options.season === 'spring' ? 0.12 : 0
  const freezingPenalty = options.temperatureC !== null && options.temperatureC <= 0 ? 0.18 : 0

  const movementMultiplier = Math.max(0.25, 1 - rainPenalty - snowPenalty - nightPenalty)
  const agricultureMultiplier = Math.max(0.35, 1 - winterPenalty - freezingPenalty + springBonus)
  const reasons: string[] = []

  if (rainPenalty > 0) reasons.push(`Rain drag ${Math.round(rainPenalty * 100)}%`)
  if (snowPenalty > 0) reasons.push(`Snow drag ${Math.round(snowPenalty * 100)}%`)
  if (nightPenalty > 0) reasons.push(`Low-light operations ${Math.round(nightPenalty * 100)}%`)
  if (freezingPenalty > 0) reasons.push(`Freezing production drag ${Math.round(freezingPenalty * 100)}%`)
  if (springBonus > 0) reasons.push(`Spring production lift ${Math.round(springBonus * 100)}%`)
  if (options.season === 'winter') reasons.push('Winter yield compression active')

  return {
    movementMultiplier,
    agricultureMultiplier,
    laborMultiplier: Math.max(0.45, 1 - nightPenalty - freezingPenalty * 0.5),
    visibilityMultiplier: Math.max(0.25, 1 - nightPenalty * 2 - rainPenalty * 0.5 - snowPenalty * 0.4),
    ambushMultiplier: 1 + (options.daylightPhase === 'night' ? 0.35 : 0) + (options.snowfallCm > 0 ? 0.12 : 0),
    penaltyReasons: reasons.length > 0 ? reasons : ['No active weather penalties'],
    movementPenaltyPercent: Math.round((1 - movementMultiplier) * 100),
    productionDeltaPercent: Math.round((agricultureMultiplier - 1) * 100),
  }
}

function toWeatherSnapshot(coordinate: Coordinate, data: OpenMeteoResponse): WeatherSnapshot {
  const current = data.current ?? {}
  const sunrise = data.daily?.sunrise?.[0] ?? null
  const sunset = data.daily?.sunset?.[0] ?? null
  const isDaylight = current.is_day !== 0
  const season = getSeason(coordinate)
  const daylightPhase = getDaylightPhase(isDaylight, sunrise ?? undefined, sunset ?? undefined)
  const rainMm = current.rain ?? 0
  const snowfallCm = current.snowfall ?? 0
  const precipitationMm = current.precipitation ?? rainMm
  const temperatureC = current.temperature_2m ?? null
  const modifiers = calculateModifiers({ rainMm, snowfallCm, temperatureC, season, daylightPhase })

  return {
    coordinate,
    observedAt: current.time ?? new Date().toISOString(),
    temperatureC,
    precipitationMm,
    rainMm,
    snowfallCm,
    windKph: current.wind_speed_10m ?? null,
    cloudCoverPercent: current.cloud_cover ?? null,
    isDaylight,
    sunrise,
    sunset,
    season,
    daylightPhase,
    source: 'open-meteo',
    status: 'ready',
    error: null,
    ...modifiers,
  }
}

export function useOpenMeteoWeather(coordinate: Coordinate | null) {
  const setWeatherSnapshot = usePhaseOneGameStore(state => state.setWeatherSnapshot)

  useEffect(() => {
    if (!coordinate) return

    const activeCoordinate = coordinate
    const controller = new AbortController()

    async function loadWeather() {
      setWeatherSnapshot({
        coordinate: activeCoordinate,
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
        season: getSeason(activeCoordinate),
        daylightPhase: 'day',
        source: 'open-meteo',
        status: 'loading',
        error: null,
        penaltyReasons: ['Loading Open-Meteo feed'],
        movementPenaltyPercent: 0,
        productionDeltaPercent: 0,
        movementMultiplier: 1,
        agricultureMultiplier: 1,
        laborMultiplier: 1,
        visibilityMultiplier: 1,
        ambushMultiplier: 1,
      })

      try {
        const params = new URLSearchParams({
          latitude: String(activeCoordinate.lat),
          longitude: String(activeCoordinate.lon),
          current: 'temperature_2m,precipitation,rain,snowfall,wind_speed_10m,cloud_cover,is_day',
          daily: 'sunrise,sunset',
          timezone: 'auto',
        })
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Open-Meteo ${response.status}`)
        const data = (await response.json()) as OpenMeteoResponse
        setWeatherSnapshot(toWeatherSnapshot(activeCoordinate, data))
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Unknown Open-Meteo error'
        setWeatherSnapshot({
          coordinate: activeCoordinate,
          observedAt: new Date().toISOString(),
          temperatureC: null,
          precipitationMm: 0,
          rainMm: 0,
          snowfallCm: 0,
          windKph: null,
          cloudCoverPercent: null,
          isDaylight: true,
          sunrise: null,
          sunset: null,
          season: getSeason(activeCoordinate),
          daylightPhase: 'day',
          source: 'open-meteo',
          status: 'error',
          error: message,
          penaltyReasons: ['Weather feed unavailable; fallback modifiers active'],
          movementPenaltyPercent: 0,
          productionDeltaPercent: 0,
          movementMultiplier: 1,
          agricultureMultiplier: 1,
          laborMultiplier: 1,
          visibilityMultiplier: 1,
          ambushMultiplier: 1,
        })
      }
    }

    void loadWeather()
    const interval = window.setInterval(loadWeather, 15 * 60 * 1000)
    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [coordinate, setWeatherSnapshot])
}
