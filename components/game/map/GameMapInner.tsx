'use client'


import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGameStore } from '@/lib/game/store'
import { Territory } from '@/lib/game/types'
import { MAP_REGIONS } from '@/lib/game/constants'
import { Coordinate, LOOP_TICK_MS, usePhaseOneGameStore } from '@/lib/game/state/gameStore'
import { useOsmClaimFeatures } from '@/lib/game/map/useOsmClaimFeatures'
import { useOpenMeteoWeather } from '@/lib/game/weather/useOpenMeteoWeather'

// Fix leaflet default markers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Map event handler component
function MapEventHandler() {
  const setMapView = useGameStore(state => state.setMapView)
  
  useMapEvents({
    moveend: (e) => {
      const map = e.target
      const center = map.getCenter()
      setMapView([center.lat, center.lng], map.getZoom())
    },
  })
  
  return null
}

function MapRecenter({ coordinate }: { coordinate: Coordinate | null }) {
  const map = useMap()

  useEffect(() => {
    if (coordinate) {
      map.flyTo([coordinate.lat, coordinate.lon], Math.max(map.getZoom(), 15), {
        duration: 1.2,
      })
    }
  }, [coordinate, map])

  return null
}

// Territory polygon component
function TerritoryPolygon({ territory }: { territory: Territory }) {
  const game = useGameStore(state => state.game)
  const selectTerritory = useGameStore(state => state.selectTerritory)
  const selectedTerritoryId = game?.selectedTerritoryId
  
  const owner = territory.ownerId ? game?.factions.get(territory.ownerId) : null
  const isSelected = selectedTerritoryId === territory.id
  const isUnderSiege = territory.siegeState !== null
  
  // Determine color
  let fillColor = '#374151' // Unclaimed gray
  let fillOpacity = 0.4
  
  if (owner) {
    fillColor = owner.color
    fillOpacity = 0.6
  }
  
  if (isSelected) {
    fillOpacity = 0.8
  }
  
  if (isUnderSiege) {
    fillColor = '#ef4444' // Red for siege
  }
  
  const pathOptions = {
    color: isSelected ? '#fbbf24' : '#1e293b',
    weight: isSelected ? 3 : 1,
    fillColor,
    fillOpacity,
  }
  
  return (
    <Polygon
      positions={territory.bounds as [number, number][]}
      pathOptions={pathOptions}
      eventHandlers={{
        click: () => selectTerritory(territory.id),
      }}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -10]} 
        opacity={0.95}
        className="territory-tooltip"
      >
        <div className="p-2 min-w-[160px]">
          <div className="font-bold text-sm text-slate-100">{territory.name}</div>
          {owner && (
            <div className="text-xs text-slate-300 flex items-center gap-1 mt-1">
              <span 
                className="inline-block w-2 h-2 rounded-full" 
                style={{ backgroundColor: owner.color }}
              />
              {owner.name}
            </div>
          )}
          <div className="text-xs text-slate-400 mt-1 capitalize">
            {territory.terrain.replace('_', ' ')}
          </div>
          {territory.isCapital && (
            <div className="text-xs text-amber-400 mt-1">Capital</div>
          )}
          {isUnderSiege && (
            <div className="text-xs text-red-400 mt-1">Under Siege!</div>
          )}
          <div className="text-xs text-slate-500 mt-1">
            Fort Level: {territory.fortificationLevel}
          </div>
        </div>
      </Tooltip>
    </Polygon>
  )
}

// Army marker component
function ArmyMarkers() {
  const game = useGameStore(state => state.game)
  const selectArmy = useGameStore(state => state.selectArmy)
  
  if (!game) return null
  
  const armies = Array.from(game.armies.values())
  
  return (
    <>
      {armies.map(army => {
        const territory = game.territories.get(army.position)
        const owner = game.factions.get(army.ownerId)
        
        if (!territory || !owner) return null
        
        const unitCount = army.units.reduce((sum, u) => sum + u.count, 0)
        const isSelected = game.selectedArmyId === army.id
        
        return (
          <Polygon
            key={army.id}
            positions={[
              [territory.center[0] + 0.3, territory.center[1] - 0.3],
              [territory.center[0] + 0.3, territory.center[1] + 0.3],
              [territory.center[0] - 0.3, territory.center[1] + 0.3],
              [territory.center[0] - 0.3, territory.center[1] - 0.3],
            ]}
            pathOptions={{
              color: isSelected ? '#fbbf24' : owner.color,
              weight: isSelected ? 3 : 2,
              fillColor: owner.color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation()
                selectArmy(army.id)
              },
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -10]} 
              opacity={0.95}
              permanent={false}
            >
              <div className="p-2 min-w-[140px]">
                <div className="font-bold text-sm text-slate-100">{army.name}</div>
                <div className="text-xs text-slate-300">{owner.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {unitCount.toLocaleString()} troops
                </div>
                {army.isSieging && (
                  <div className="text-xs text-red-400 mt-1">Besieging</div>
                )}
                {army.destination && (
                  <div className="text-xs text-blue-400 mt-1">
                    Moving ({army.movementProgress}%)
                  </div>
                )}
              </div>
            </Tooltip>
          </Polygon>
        )
      })}
    </>
  )
}

const resourceColors: Record<string, string> = {
  Forest: '#22c55e',
  Quarry: '#f59e0b',
  Settlement: '#38bdf8',
  Intersection: '#f43f5e',
}

function formatCountdown(nextTickAt: string) {
  const ms = Math.max(0, new Date(nextTickAt).getTime() - Date.now())
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function PhaseOneTelemetryOverlay() {
  const clock = usePhaseOneGameStore(state => state.clock)
  const weather = usePhaseOneGameStore(state => state.weather)
  const claimFeatures = usePhaseOneGameStore(state => state.claimFeatures)
  const movingBanners = usePhaseOneGameStore(state => state.movingBanners)
  const processEngineTick = usePhaseOneGameStore(state => state.processEngineTick)

  useEffect(() => {
    processEngineTick()
    const timer = window.setInterval(() => processEngineTick(), 1000)
    return () => window.clearInterval(timer)
  }, [processEngineTick])

  const forestCount = claimFeatures.filter(feature => feature.resourceTag === 'Forest').length
  const quarryCount = claimFeatures.filter(feature => feature.resourceTag === 'Quarry').length
  const settlementCount = claimFeatures.filter(feature => feature.resourceTag === 'Settlement').length
  const intersectionCount = claimFeatures.filter(feature => feature.resourceTag === 'Intersection').length

  return (
    <div className="absolute right-4 top-4 z-[1000] w-[320px] border border-slate-700 bg-slate-950/90 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wide text-amber-300">Phase 1 engine</span>
        <span className="text-emerald-300">Operational</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-slate-800 bg-slate-900/80 p-2">
          <div className="text-slate-500">Next 15m tick</div>
          <div className="text-lg font-semibold tabular-nums text-white">{formatCountdown(clock.nextTickAt)}</div>
        </div>
        <div className="border border-slate-800 bg-slate-900/80 p-2">
          <div className="text-slate-500">Game day/hour</div>
          <div className="text-lg font-semibold tabular-nums text-white">D{clock.inGameDay} H{clock.inGameHour}</div>
        </div>
        <div className="border border-slate-800 bg-slate-900/80 p-2">
          <div className="text-slate-500">Clock ratio</div>
          <div className="font-semibold text-white">1h = 1 day</div>
        </div>
        <div className="border border-slate-800 bg-slate-900/80 p-2">
          <div className="text-slate-500">Loop tick</div>
          <div className="font-semibold text-white">{LOOP_TICK_MS / 60000} minutes</div>
        </div>
      </div>

      <div className="mt-3 border border-slate-800 bg-slate-900/80 p-2">
        <div className="mb-1 font-semibold text-sky-300">Environment sync</div>
        <div className="flex justify-between"><span>Open-Meteo</span><span className="capitalize">{weather.status}</span></div>
        <div className="flex justify-between"><span>Movement</span><span>{Math.round(weather.movementMultiplier * 100)}%</span></div>
        <div className="flex justify-between"><span>Penalty</span><span>{weather.movementPenaltyPercent}%</span></div>
        <div className="flex justify-between"><span>Production</span><span>{weather.productionDeltaPercent > 0 ? '+' : ''}{weather.productionDeltaPercent}%</span></div>
        <div className="flex justify-between"><span>Season</span><span className="capitalize">{weather.season}</span></div>
        <div className="flex justify-between"><span>Visibility</span><span>{Math.round(weather.visibilityMultiplier * 100)}%</span></div>
        <div className="mt-2 border-t border-slate-800 pt-2 text-slate-400">
          {weather.penaltyReasons.slice(0, 3).map(reason => (
            <div key={reason}>{reason}</div>
          ))}
        </div>
      </div>

      <div className="mt-3 border border-slate-800 bg-slate-900/80 p-2">
        <div className="mb-1 font-semibold text-emerald-300">OSM claim layer</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span>Forest parks</span><span className="text-right">{forestCount}</span>
          <span>Quarries</span><span className="text-right">{quarryCount}</span>
          <span>Settlements</span><span className="text-right">{settlementCount}</span>
          <span>Intersections</span><span className="text-right">{intersectionCount}</span>
        </div>
      </div>

      <div className="mt-3 border border-slate-800 bg-slate-900/80 p-2">
        <div className="mb-1 font-semibold text-rose-300">Moving banners</div>
        {movingBanners.length === 0 ? (
          <div className="text-slate-500">Waiting for geolocation...</div>
        ) : (
          movingBanners.map(banner => (
            <div key={banner.id} className="flex justify-between">
              <span>{banner.name}</span>
              <span>{Math.round(banner.progress * 100)}% @ {banner.activeSpeedKph.toFixed(1)} kph</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function OsmClaimLayer() {
  const claimFeatures = usePhaseOneGameStore(state => state.claimFeatures)

  return (
    <>
      {claimFeatures.map(feature => (
        <CircleMarker
          key={feature.id}
          center={[feature.coordinate.lat, feature.coordinate.lon]}
          radius={feature.resourceTag === 'Intersection' ? 5 : 8}
          pathOptions={{
            color: resourceColors[feature.resourceTag],
            fillColor: resourceColors[feature.resourceTag],
            fillOpacity: 0.78,
            weight: feature.claimedBy ? 3 : 1,
          }}
        >
          <Tooltip direction="top" opacity={0.95}>
            <div className="min-w-[160px] p-2">
              <div className="font-bold text-sm text-slate-100">{feature.name}</div>
              <div className="text-xs text-amber-300">{feature.resourceTag}</div>
              <div className="text-xs text-slate-400">Influence {Math.round(feature.influence * 100)}%</div>
              {Object.entries(feature.resourceYield).length > 0 && (
                <div className="mt-1 text-xs text-slate-400">
                  {Object.entries(feature.resourceYield)
                    .map(([resource, value]) => `${resource}: ${value}`)
                    .join(' / ')}
                </div>
              )}
              {feature.claimedBy && <div className="text-xs text-emerald-300">Claimed by engine</div>}
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}

function BannerMovementLayer() {
  const movingBanners = usePhaseOneGameStore(state => state.movingBanners)

  return (
    <>
      {movingBanners.map(banner => (
        <div key={banner.id}>
          <Polyline
            positions={[
              [banner.origin.lat, banner.origin.lon],
              [banner.destination.lat, banner.destination.lon],
            ]}
            pathOptions={{ color: '#fbbf24', weight: 3, dashArray: '6 6' }}
          />
          <Marker position={[banner.current.lat, banner.current.lon]}>
            <Tooltip direction="top" opacity={0.95} permanent>
              <div className="text-xs">
                <div className="font-semibold">{banner.name}</div>
                <div>{Math.round(banner.progress * 100)}% complete</div>
              </div>
            </Tooltip>
          </Marker>
        </div>
      ))}
    </>
  )
}

export function GameMapInner() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  const playerCoordinate = usePhaseOneGameStore(state => state.playerCoordinate)
  const setPlayerCoordinate = usePhaseOneGameStore(state => state.setPlayerCoordinate)
  const fallbackCoordinate = useMemo<Coordinate>(() => ({ lat: ui.mapCenter[0], lon: ui.mapCenter[1] }), [ui.mapCenter])
  const activeCoordinate = playerCoordinate ?? fallbackCoordinate

  useOpenMeteoWeather(activeCoordinate)
  useOsmClaimFeatures(activeCoordinate)

  useEffect(() => {
    if (!navigator.geolocation) {
      setPlayerCoordinate(fallbackCoordinate)
      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setPlayerCoordinate({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
      },
      () => setPlayerCoordinate(fallbackCoordinate),
      {
        enableHighAccuracy: true,
        maximumAge: 10 * 60 * 1000,
        timeout: 8000,
      }
    )
  }, [fallbackCoordinate, setPlayerCoordinate])
  
  if (!game) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#1a1f2e]">
        <span className="text-slate-400">No game loaded</span>
      </div>
    )
  }
  
  const mapRegion = MAP_REGIONS[game.settings.mapRegion]
  const territories = Array.from(game.territories.values())
  
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={mapRegion.center}
        zoom={mapRegion.zoom}
        className="h-full w-full"
        style={{ background: '#1a1f2e' }}
        minZoom={3}
        maxZoom={10}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapEventHandler />
        <MapRecenter coordinate={playerCoordinate} />
        
        {territories.map(territory => (
          <TerritoryPolygon key={territory.id} territory={territory} />
        ))}
        
        <ArmyMarkers />
        <OsmClaimLayer />
        <BannerMovementLayer />
      </MapContainer>
      <PhaseOneTelemetryOverlay />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 z-[1000]">
        <div className="text-xs font-semibold text-slate-300 mb-2">Factions</div>
        <div className="space-y-1">
          {Array.from(game.factions.values())
            .filter(f => !f.isDefeated)
            .slice(0, 8)
            .map(faction => (
              <div key={faction.id} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: faction.color }}
                />
                <span className={`text-slate-400 ${faction.isPlayer ? 'font-semibold text-amber-400' : ''}`}>
                  {faction.name}
                  {faction.isPlayer && ' (You)'}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
