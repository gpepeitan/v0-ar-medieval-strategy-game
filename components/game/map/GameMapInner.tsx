'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
  Marker,
  Popup,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGameStore } from '@/lib/game/store'
import { Territory, Army, TerrainType, OSM_LANDUSE_TO_TERRAIN } from '@/lib/game/types'
import { FACTION_CONFIG } from '@/lib/game/constants'

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// ─── Terrain colour palette ───────────────────────────────────────────────────

const TERRAIN_COLORS: Record<TerrainType, string> = {
  settlement: '#b5a785',
  forest:     '#4a7c59',
  quarry:     '#7a6e5a',
  farmland:   '#c8b560',
  water:      '#4a90b8',
  road:       '#8c7355',
  plains:     '#a8956e',
  hills:      '#7a8c6e',
  mountains:  '#6b7280',
  marsh:      '#5a7a65',
  coastal:    '#5b8fa8',
}

const RESOURCE_ICONS: Record<TerrainType, string> = {
  forest:     '🌲',
  quarry:     '⛏',
  farmland:   '🌾',
  settlement: '🏘',
  water:      '🐟',
  road:       '🪙',
  plains:     '•',
  hills:      '•',
  mountains:  '•',
  marsh:      '•',
  coastal:    '•',
}

// ─── Overpass API helper ──────────────────────────────────────────────────────

interface OverpassElement {
  type: string
  id: number
  tags?: Record<string, string>
  lat?: number
  lon?: number
  nodes?: number[]
  geometry?: { lat: number; lon: number }[]
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number }
}

async function fetchOverpassData(
  lat: number,
  lng: number,
  radiusMetres = 1500
): Promise<{ territories: Territory[]; intersections: { id: string; lat: number; lng: number; name: string }[] }> {
  const r = radiusMetres
  const query = `
    [out:json][timeout:25];
    (
      way["landuse"](around:${r},${lat},${lng});
      way["leisure"](around:${r},${lat},${lng});
      way["natural"](around:${r},${lat},${lng});
      node["highway"="traffic_signals"](around:${r},${lat},${lng});
      node["highway"="crossing"](around:${r},${lat},${lng});
    );
    out geom;
  `
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
    const json = await res.json()
    return parseOverpassResponse(json.elements ?? [], lat, lng)
  } catch {
    // On failure (no internet, timeout) return empty
    return { territories: [], intersections: [] }
  }
}

function osmTagsToTerrain(tags: Record<string, string>): TerrainType {
  const landuse = tags.landuse ?? tags.leisure ?? tags.natural ?? ''
  return OSM_LANDUSE_TO_TERRAIN[landuse] ?? 'plains'
}

function parseOverpassResponse(
  elements: OverpassElement[],
  refLat: number,
  refLng: number
): { territories: Territory[]; intersections: { id: string; lat: number; lng: number; name: string }[] } {
  const territories: Territory[] = []
  const intersections: { id: string; lat: number; lng: number; name: string }[] = []

  for (const el of elements) {
    if (el.type === 'way' && el.geometry && el.geometry.length >= 3) {
      const tags = el.tags ?? {}
      const terrain = osmTagsToTerrain(tags)
      const coords = el.geometry.map(p => [p.lat, p.lon] as [number, number])

      // Compute centroid
      const sumLat = coords.reduce((s, c) => s + c[0], 0)
      const sumLng = coords.reduce((s, c) => s + c[1], 0)
      const center: [number, number] = [sumLat / coords.length, sumLng / coords.length]

      const name = tags.name ?? tags.landuse ?? tags.leisure ?? tags.natural ?? `Block ${el.id}`

      territories.push({
        id: `osm-${el.id}`,
        name,
        ownerId: null,
        terrain,
        bounds: coords,
        center,
        osmId: String(el.id),
        osmTags: tags,
        resources: { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 },
        resourceProduction: { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 },
        livestock: { cattle: 0, sheep: 0, horses: 0, pigs: 0, chickens: 0 },
        population: { peasants: 0, craftsmen: 0, merchants: 0, soldiers: 0, nobles: 0 },
        buildings: [],
        fortificationLevel: 0,
        supplies: 100,
        maxSupplies: 100,
        morale: 50,
        isCapital: false,
        isIntersection: false,
        tollRate: 0,
        connectedTerritories: [],
        siegeState: null,
      })
    }

    if (el.type === 'node' && el.lat != null && el.lon != null) {
      const tags = el.tags ?? {}
      const hwy = tags.highway ?? ''
      if (hwy === 'traffic_signals' || hwy === 'crossing') {
        intersections.push({
          id: `int-${el.id}`,
          lat: el.lat,
          lng: el.lon,
          name: tags.name ?? `Intersection ${el.id}`,
        })
      }
    }
  }

  return { territories, intersections }
}

// ─── Map event handler ────────────────────────────────────────────────────────

function MapEventHandler() {
  const setMapView = useGameStore(s => s.setMapView)
  useMapEvents({
    moveend: e => {
      const c = e.target.getCenter()
      setMapView([c.lat, c.lng], e.target.getZoom())
    },
  })
  return null
}

// ─── Re-center map to player spawn ───────────────────────────────────────────

function SpawnCenterer({ coords }: { coords: [number, number] | null }) {
  const map = useMap()
  const centered = useRef(false)
  useEffect(() => {
    if (coords && !centered.current) {
      map.setView(coords, 16)
      centered.current = true
    }
  }, [coords, map])
  return null
}

// ─── Territory polygon ────────────────────────────────────────────────────────

function TerritoryPolygon({ territory }: { territory: Territory }) {
  const game       = useGameStore(s => s.game)
  const selectTerritory = useGameStore(s => s.selectTerritory)
  const moveArmy   = useGameStore(s => s.moveArmy)

  const selectedTerritoryId = game?.selectedTerritoryId
  const selectedArmyId      = game?.selectedArmyId
  const isSelected          = selectedTerritoryId === territory.id
  const owner               = territory.ownerId ? game?.factions.get(territory.ownerId) : null
  const isUnderSiege        = territory.siegeState !== null

  const selectedArmy      = selectedArmyId ? game?.armies.get(selectedArmyId) : null
  const playerFaction     = game ? Array.from(game.factions.values()).find(f => f.isPlayer) : null
  const isPlayerArmy      = !!(selectedArmy && playerFaction && selectedArmy.ownerId === playerFaction.id)
  const isMoveTarget      = isPlayerArmy && territory.id !== selectedArmy?.currentTerritoryId

  const handleClick = () => {
    if (isPlayerArmy && selectedArmyId && territory.id !== selectedArmy?.currentTerritoryId) {
      moveArmy(selectedArmyId, territory.id)
    } else {
      selectTerritory(territory.id)
    }
  }

  let fillColor   = TERRAIN_COLORS[territory.terrain]
  let fillOpacity = 0.35
  let strokeColor = '#1e293b'
  let strokeWidth = 1

  if (owner) {
    fillColor   = owner.color
    fillOpacity = 0.55
  }
  if (isSelected)    { fillOpacity = 0.8; strokeColor = '#fbbf24'; strokeWidth = 3 }
  if (isMoveTarget)  { strokeColor = '#60a5fa'; strokeWidth = 2 }
  if (isUnderSiege)  { fillColor = '#ef4444' }

  return (
    <Polygon
      positions={territory.bounds}
      pathOptions={{
        color: strokeColor,
        weight: strokeWidth,
        fillColor,
        fillOpacity,
      }}
      eventHandlers={{ click: handleClick }}
    >
      <Tooltip sticky>
        <div className="text-xs font-medium">{territory.name}</div>
        <div className="text-xs text-slate-400 capitalize">{territory.terrain}</div>
        {owner && <div className="text-xs mt-0.5" style={{ color: owner.color }}>{owner.name}</div>}
        {territory.tollRate > 0 && (
          <div className="text-xs text-amber-400">Toll: {territory.tollRate} gold/day</div>
        )}
        {isUnderSiege && <div className="text-xs text-red-400">Under siege!</div>}
        {isMoveTarget && <div className="text-xs text-blue-400 font-semibold">Click to move army here</div>}
      </Tooltip>
    </Polygon>
  )
}

// ─── Intersection claim point ─────────────────────────────────────────────────

function IntersectionMarker({
  intersection,
}: {
  intersection: { id: string; lat: number; lng: number; name: string }
}) {
  const game = useGameStore(s => s.game)
  const territory = game?.territories.get(intersection.id)
  const owner = territory?.ownerId ? game?.factions.get(territory.ownerId) : null

  return (
    <CircleMarker
      center={[intersection.lat, intersection.lng]}
      radius={5}
      pathOptions={{
        color: owner ? owner.color : '#94a3b8',
        fillColor: owner ? owner.color : '#1e293b',
        fillOpacity: 0.9,
        weight: 2,
      }}
    >
      <Tooltip>
        <div className="text-xs font-medium">{intersection.name}</div>
        {owner ? (
          <div className="text-xs" style={{ color: owner.color }}>{owner.name} — Outpost</div>
        ) : (
          <div className="text-xs text-slate-400">Unclaimed intersection</div>
        )}
      </Tooltip>
    </CircleMarker>
  )
}

// ─── Army marker ──────────────────────────────────────────────────────────────

function ArmyMarker({ army }: { army: Army }) {
  const game         = useGameStore(s => s.game)
  const selectArmy   = useGameStore(s => s.selectArmy)
  const selectedArmyId = game?.selectedArmyId

  const faction    = game?.factions.get(army.ownerId)
  const isSelected = selectedArmyId === army.id
  const isMoving   = army.targetTerritoryId !== null
  const isNight    = game?.time.isDaytime === false
  const totalUnits = army.units.reduce((s, u) => s + u.count, 0)

  // Create a custom icon with faction color
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      background:${faction?.color ?? '#64748b'};
      border:2px solid ${isSelected ? '#fbbf24' : '#1e293b'};
      border-radius:50%;
      width:${isSelected ? 18 : 14}px;
      height:${isSelected ? 18 : 14}px;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;color:#fff;font-weight:700;
      box-shadow:0 1px 4px rgba(0,0,0,.5);
      opacity:${isNight && !army.nightPenalty ? 0.6 : 1};
    ">${faction?.name?.slice(0, 1) ?? '?'}</div>`,
    iconSize: [isSelected ? 18 : 14, isSelected ? 18 : 14],
    iconAnchor: [isSelected ? 9 : 7, isSelected ? 9 : 7],
  })

  return (
    <Marker
      position={army.position}
      icon={icon}
      eventHandlers={{ click: () => selectArmy(army.id) }}
    >
      <Tooltip>
        <div className="text-xs font-semibold">{army.name}</div>
        <div className="text-xs text-slate-400">{faction?.name}</div>
        <div className="text-xs">{totalUnits} troops</div>
        {isMoving && (
          <div className="text-xs text-blue-400">
            Marching ({Math.round(army.movementProgress * 100)}%)
          </div>
        )}
        {army.estimatedArrival && (
          <div className="text-xs text-slate-400">
            ETA: {new Date(army.estimatedArrival).toLocaleTimeString()}
          </div>
        )}
        {isNight && <div className="text-xs text-indigo-400">Night march (half speed)</div>}
      </Tooltip>
    </Marker>
  )
}

// ─── Weather overlay ─────────────────────────────────────────────────────────

function WeatherOverlay() {
  const weather = useGameStore(s => s.game?.weather)
  if (!weather) return null

  const icons: Record<string, string> = {
    clear: '☀', cloudy: '☁', rain: '🌧', heavy_rain: '⛈',
    snow: '❄', blizzard: '🌨', fog: '🌫', storm: '⛈',
  }

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-slate-900/80 backdrop-blur rounded-full px-3 py-1 text-xs text-slate-200 pointer-events-none">
      <span>{icons[weather.condition] ?? '☀'}</span>
      <span className="capitalize">{weather.condition.replace('_', ' ')}</span>
      <span className="text-slate-400">{Math.round(weather.temperatureCelsius)}°C</span>
      {weather.movementSpeedMultiplier < 1 && (
        <span className="text-amber-400">
          Mvt -{Math.round((1 - weather.movementSpeedMultiplier) * 100)}%
        </span>
      )}
    </div>
  )
}

// ─── Loading / geolocation state ─────────────────────────────────────────────

interface MapLoadingState {
  status: 'requesting_location' | 'fetching_osm' | 'ready' | 'error'
  message: string
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function GameMapInner() {
  const game              = useGameStore(s => s.game)
  const setMapView        = useGameStore(s => s.setMapView)
  const setOsmData        = useGameStore(s => s.setOsmData)

  const [loadState, setLoadState] = useState<MapLoadingState>({
    status: 'requesting_location',
    message: 'Requesting your location…',
  })

  const spawnCoords   = game?.playerSpawnCoords ?? null
  const territories   = game ? Array.from(game.territories.values()) : []
  const armies        = game ? Array.from(game.armies.values()) : []
  const intersections = game?.localMapData.intersections ?? []

  // Initial map center: spawn coords or London fallback
  const mapCenter: [number, number] = spawnCoords ?? [51.505, -0.09]

  // Fetch OSM data once spawn is known
  useEffect(() => {
    if (!spawnCoords) return
    if (game?.localMapData.lastFetchedAt > 0) {
      setLoadState({ status: 'ready', message: '' })
      return
    }

    setLoadState({ status: 'fetching_osm', message: 'Fetching local map data…' })

    fetchOverpassData(spawnCoords[0], spawnCoords[1], 1500).then(({ territories, intersections }) => {
      setOsmData({ territories, intersections })
      setLoadState({ status: 'ready', message: '' })
    }).catch(() => {
      setLoadState({ status: 'error', message: 'Could not load local map data. Playing with fallback territories.' })
    })
  }, [spawnCoords])

  if (!game) return null

  return (
    <div className="relative h-full w-full">
      {/* Status overlay */}
      {loadState.status !== 'ready' && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/70 pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-slate-200">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-sm">{loadState.message}</span>
          </div>
        </div>
      )}

      {/* Weather indicator */}
      <WeatherOverlay />

      {/* Day/night tint */}
      {!game.time.isDaytime && (
        <div className="absolute inset-0 z-[999] bg-indigo-950/25 pointer-events-none" />
      )}

      <MapContainer
        center={mapCenter}
        zoom={16}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={true}
      >
        {/* OpenStreetMap tiles — full global coverage */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        <MapEventHandler />
        <SpawnCenterer coords={spawnCoords} />

        {/* Land-use territory polygons */}
        {territories.map(t => (
          <TerritoryPolygon key={t.id} territory={t} />
        ))}

        {/* Road intersection claim points */}
        {intersections.map(i => (
          <IntersectionMarker key={i.id} intersection={i} />
        ))}

        {/* Player spawn marker */}
        {spawnCoords && (
          <CircleMarker
            center={spawnCoords}
            radius={8}
            pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.7, weight: 2 }}
          >
            <Tooltip permanent>
              <span className="text-xs font-semibold">Your Stronghold</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Army banners */}
        {armies.map(a => (
          <ArmyMarker key={a.id} army={a} />
        ))}
      </MapContainer>
    </div>
  )
}
