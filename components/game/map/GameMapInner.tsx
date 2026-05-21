'use client'


import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGameStore } from '@/lib/game/store'
import { Territory, Faction } from '@/lib/game/types'
import { MAP_REGIONS } from '@/lib/game/constants'

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

export function GameMapInner() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  
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
        
        {territories.map(territory => (
          <TerritoryPolygon key={territory.id} territory={territory} />
        ))}
        
        <ArmyMarkers />
      </MapContainer>
      
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
