'use client'

import { useCallback, useEffect } from 'react'
import {
  CircleMarker, MapContainer, Polygon, Polyline,
  TileLayer, Tooltip, useMap, useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Coordinate, OsmClaimFeature, LOOP_TICK_MS,
  usePhaseOneGameStore,
} from '@/lib/game/state/gameStore'
import { useOsmClaimFeatures } from '@/lib/game/map/useOsmClaimFeatures'
import { useOpenMeteoWeather } from '@/lib/game/weather/useOpenMeteoWeather'

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const FALLBACK: Coordinate = { lat: 40.7128, lon: -74.006 }

const RESOURCE_COLORS: Record<string, string> = {
  Forest:       '#22c55e',
  Quarry:       '#f59e0b',
  Settlement:   '#38bdf8',
  Intersection: '#f43f5e',
}

const POLITY_COLORS: Record<string, string> = {
  player: '#fbbf24',
  'ai-0': '#ef4444',
  'ai-1': '#a855f7',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a polygon cell around a coordinate (hex with optional jitter for organic look) */
function makeCell(
  c: Coordinate,
  radiusDeg: number,
  sides = 6,
  jitter = 0,
): [number, number][] {
  const aspect = Math.cos((c.lat * Math.PI) / 180)
  return Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * 2 * Math.PI
    const r = radiusDeg * (1 + (Math.random() - 0.5) * jitter)
    return [c.lat + r * Math.cos(angle), c.lon + (r * Math.sin(angle)) / aspect] as [number, number]
  })
}

function cellRadius(tag: OsmClaimFeature['resourceTag'], isHarvestable: boolean): number {
  if (tag === 'Intersection') return 0.00014
  if (tag === 'Forest')       return isHarvestable ? 0.00048 : 0.00022
  if (tag === 'Settlement')   return 0.00032
  return 0.00028 // Quarry
}

function polityLabel(claimedBy: string, aiPolities: { id: string; name: string }[]): string {
  if (claimedBy === 'player') return 'Your claim'
  return aiPolities.find(p => p.id === claimedBy)?.name ?? 'Rival claim'
}

// ─── Map sub-components ───────────────────────────────────────────────────────

/** Fly to player coordinate on first fix */
function MapRecenter({ coord }: { coord: Coordinate | null }) {
  const map = useMap()
  useEffect(() => {
    if (coord) map.flyTo([coord.lat, coord.lon], Math.max(map.getZoom(), 15), { duration: 1.4 })
  }, [coord, map])
  return null
}

/** Forward map clicks to parent for move-order handling */
function MapClickHandler({ onMapClick }: { onMapClick: (c: Coordinate) => void }) {
  useMapEvents({
    click(e) { onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng }) },
  })
  return null
}

// ─── OSM claim cells ──────────────────────────────────────────────────────────
// Claimed features → hex polygon; unclaimed → tiny dot

function OsmClaimCells() {
  const features      = usePhaseOneGameStore(s => s.claimFeatures)
  const aiPolities    = usePhaseOneGameStore(s => s.aiPolities)
  const selected      = usePhaseOneGameStore(s => s.selectedFeatureId)
  const selectFeature = usePhaseOneGameStore(s => s.selectFeature)
  const claimFeature  = usePhaseOneGameStore(s => s.claimFeature)

  return (
    <>
      {features.map(f => {
        const isSel       = selected === f.id
        const claimColor  = f.claimedBy ? (POLITY_COLORS[f.claimedBy] ?? '#888') : RESOURCE_COLORS[f.resourceTag]
        const radius      = cellRadius(f.resourceTag, f.isHarvestable)

        if (f.claimedBy || isSel) {
          // ── Polygon cell ──────────────────────────────────────────────────
          const sides  = f.resourceTag === 'Forest' ? 8 : 6
          const jitter = f.resourceTag === 'Forest' ? 0.28 : 0.04
          const cell   = makeCell(f.coordinate, radius, sides, jitter)

          return (
            <Polygon
              key={f.id}
              positions={cell}
              pathOptions={{
                color:       isSel ? '#ffffff' : claimColor,
                weight:      isSel ? 2 : 1,
                fillColor:   claimColor,
                fillOpacity: f.claimedBy === 'player' ? 0.52 : 0.35,
              }}
              eventHandlers={{
                click: () => selectFeature(isSel ? null : f.id),
              }}
            >
              <Tooltip direction="top" opacity={0.95}>
                <div className="min-w-[148px] p-1.5 text-xs">
                  <div className="font-semibold text-slate-100">{f.name}</div>
                  <div style={{ color: RESOURCE_COLORS[f.resourceTag] }}>
                    {f.resourceTag}
                    {f.resourceTag === 'Forest' && !f.isHarvestable && ' · no timber'}
                  </div>
                  {f.claimedBy && (
                    <div className="mt-0.5" style={{ color: claimColor }}>
                      {polityLabel(f.claimedBy, aiPolities)}
                    </div>
                  )}
                  {Object.keys(f.resourceYield).length > 0 && (
                    <div className="mt-0.5 text-slate-400">
                      {Object.entries(f.resourceYield).map(([k, v]) => `${k} ${v}`).join(' · ')}
                    </div>
                  )}
                </div>
              </Tooltip>
            </Polygon>
          )
        }

        // ── Unclaimed: tiny dot ───────────────────────────────────────────
        return (
          <CircleMarker
            key={f.id}
            center={[f.coordinate.lat, f.coordinate.lon]}
            radius={f.resourceTag === 'Intersection' ? 3 : 4}
            pathOptions={{
              color: claimColor, fillColor: claimColor, fillOpacity: 0.65, weight: 1,
            }}
            eventHandlers={{
              click: () => { claimFeature(f.id); selectFeature(f.id) },
            }}
          >
            <Tooltip direction="top" opacity={0.95}>
              <div className="min-w-[120px] p-1.5 text-xs">
                <div className="font-semibold text-slate-100">{f.name}</div>
                <div style={{ color: RESOURCE_COLORS[f.resourceTag] }}>
                  {f.resourceTag}
                  {f.resourceTag === 'Forest' && !f.isHarvestable && ' · no timber'}
                </div>
                <div className="mt-0.5 text-amber-300">Click to claim</div>
              </div>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}

// ─── Banner layer (unit selection + click-to-move) ────────────────────────────

function BannerLayer() {
  const banners       = usePhaseOneGameStore(s => s.movingBanners)
  const selId         = usePhaseOneGameStore(s => s.selectedBannerId)
  const selectBanner  = usePhaseOneGameStore(s => s.selectBanner)

  return (
    <>
      {banners.map(b => {
        const isSel = selId === b.id
        return (
          <div key={b.id}>
            {/* Movement trail */}
            <Polyline
              positions={[[b.origin.lat, b.origin.lon], [b.destination.lat, b.destination.lon]]}
              pathOptions={{
                color: isSel ? '#fbbf24' : '#64748b', weight: isSel ? 3 : 2,
                dashArray: '5 8', opacity: isSel ? 0.85 : 0.45,
              }}
            />
            {/* Destination ghost */}
            {isSel && (
              <CircleMarker
                center={[b.destination.lat, b.destination.lon]}
                radius={5}
                pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.3, weight: 2, dashArray: '3 3' }}
              />
            )}
            {/* Unit marker */}
            <CircleMarker
              center={[b.current.lat, b.current.lon]}
              radius={isSel ? 9 : 7}
              pathOptions={{
                color: isSel ? '#ffffff' : '#fbbf24', weight: 2,
                fillColor: '#fbbf24', fillOpacity: 0.92,
              }}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation()
                  selectBanner(isSel ? null : b.id)
                },
              }}
            >
              <Tooltip direction="top" permanent={isSel} opacity={0.95}>
                <div className="p-1 text-xs">
                  <div className="font-semibold text-slate-100">{b.name}</div>
                  <div className="text-slate-300">{Math.round(b.progress * 100)}% · {b.activeSpeedKph.toFixed(1)} kph</div>
                  {isSel && <div className="text-amber-300 mt-0.5">Click map to move</div>}
                </div>
              </Tooltip>
            </CircleMarker>
          </div>
        )
      })}
    </>
  )
}

// ─── Compact HUD overlay ──────────────────────────────────────────────────────

function TelemetryHud() {
  const clock   = usePhaseOneGameStore(s => s.clock)
  const weather = usePhaseOneGameStore(s => s.weather)
  const tick    = usePhaseOneGameStore(s => s.processEngineTick)

  useEffect(() => {
    tick()
    const t = window.setInterval(() => tick(), 1000)
    return () => window.clearInterval(t)
  }, [tick])

  const ms   = Math.max(0, new Date(clock.nextTickAt).getTime() - Date.now())
  const mm   = String(Math.floor(ms / 60000)).padStart(2, '0')
  const ss   = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
  const mvt  = Math.round(weather.movementMultiplier * 100)
  const warn = weather.movementMultiplier < 0.8

  return (
    <div className="absolute right-3 top-3 z-[1000] w-52 rounded border border-slate-700 bg-slate-950/88 p-2.5 text-[11px] text-slate-300 shadow-xl backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Engine</span>
        <span className={clock.isRunning ? 'text-emerald-400' : 'text-slate-500'}>
          {clock.isRunning ? 'Live' : 'Paused'}
        </span>
      </div>
      <div className="space-y-0.5">
        <Row label="Day / Hour"  value={`D${clock.inGameDay} H${String(clock.inGameHour).padStart(2,'0')}`} />
        <Row label="Next tick"   value={`${mm}:${ss}`} valueClass="tabular-nums text-sky-300" />
        <Row label="1 hr = 1 day" value={`${LOOP_TICK_MS / 60000}m tick`} />
        <Row label="Movement"    value={`${mvt}%`} valueClass={warn ? 'text-orange-400' : ''} />
        <Row label="Season"      value={weather.season} valueClass="capitalize" />
      </div>
      {warn && (
        <div className="mt-1.5 border-t border-slate-800 pt-1 text-[10px] text-orange-300">
          {weather.penaltyReasons[0]}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass || 'text-slate-200'}>{value}</span>
    </div>
  )
}

// ─── Map legend ───────────────────────────────────────────────────────────────

function MapLegend() {
  const aiPolities = usePhaseOneGameStore(s => s.aiPolities)
  return (
    <div className="absolute bottom-6 left-3 z-[1000] rounded border border-slate-700 bg-slate-950/88 p-2.5 text-[11px] text-slate-300 shadow-xl backdrop-blur-sm">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Claims</div>
      <div className="space-y-1">
        <LegendItem color={POLITY_COLORS.player} label="Your territory" />
        {aiPolities.map(p => (
          <LegendItem key={p.id} color={POLITY_COLORS[p.id] ?? '#888'} label={p.name} />
        ))}
        <div className="mt-1.5 border-t border-slate-800 pt-1.5">
          {Object.entries(RESOURCE_COLORS).map(([tag, color]) => (
            <LegendItem key={tag} color={color} label={tag} dot />
          ))}
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={dot ? 'w-2.5 h-2.5 rounded-full' : 'w-3 h-2.5 rounded-sm'}
        style={{ background: color, opacity: 0.85 }}
      />
      <span>{label}</span>
    </div>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function GameMapInner() {
  const playerCoordinate    = usePhaseOneGameStore(s => s.playerCoordinate)
  const setPlayerCoordinate = usePhaseOneGameStore(s => s.setPlayerCoordinate)
  const selectedBannerId    = usePhaseOneGameStore(s => s.selectedBannerId)
  const moveBannerTo        = usePhaseOneGameStore(s => s.moveBannerTo)
  const selectBanner        = usePhaseOneGameStore(s => s.selectBanner)

  const activeCoord = playerCoordinate ?? FALLBACK

  // Wire up external data hooks
  useOpenMeteoWeather(activeCoord)
  useOsmClaimFeatures(activeCoord)

  // Geolocation bootstrap
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!navigator.geolocation) { setPlayerCoordinate(FALLBACK); return }
    navigator.geolocation.getCurrentPosition(
      pos => setPlayerCoordinate({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      ()  => setPlayerCoordinate(FALLBACK),
      { enableHighAccuracy: true, maximumAge: 600_000, timeout: 8000 },
    )
  }, [setPlayerCoordinate])

  // Click-to-move selected banner
  const handleMapClick = useCallback((coord: Coordinate) => {
    if (selectedBannerId) {
      moveBannerTo(selectedBannerId, coord)
      selectBanner(null)
    }
  }, [selectedBannerId, moveBannerTo, selectBanner])

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[activeCoord.lat, activeCoord.lon]}
        zoom={15}
        className="h-full w-full"
        style={{ background: '#0f172a' }}
        minZoom={5}
        maxZoom={19}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        <MapRecenter coord={playerCoordinate} />
        <OsmClaimCells />
        <BannerLayer />
      </MapContainer>

      <TelemetryHud />
      <MapLegend />

      {/* Geolocation pending hint */}
      {!playerCoordinate && (
        <div className="absolute inset-x-0 top-14 z-[1001] flex justify-center">
          <div className="rounded border border-sky-700 bg-sky-950/90 px-4 py-2 text-xs text-sky-300 shadow-lg backdrop-blur-sm">
            Requesting your location… grant permission or a default map will load.
          </div>
        </div>
      )}
    </div>
  )
}
