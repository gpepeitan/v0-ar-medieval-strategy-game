'use client'

import { useEffect } from 'react'
import {
  Coordinate,
  OsmClaimFeature,
  ResourceTag,
  usePhaseOneGameStore,
} from '@/lib/game/state/gameStore'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: {
    lat: number
    lon: number
  }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements?: OverpassElement[]
}

function classifyResource(tags: Record<string, string>): ResourceTag | null {
  const landuse = tags.landuse
  const leisure = tags.leisure
  const natural = tags.natural
  const amenity = tags.amenity
  const building = tags.building

  if (
    amenity === 'park' ||
    amenity === 'community_centre' ||
    leisure === 'park' ||
    leisure === 'garden' ||
    natural === 'wood' ||
    natural === 'forest' ||
    landuse === 'forest' ||
    landuse === 'grass' ||
    landuse === 'farmland' ||
    landuse === 'orchard' ||
    landuse === 'allotments'
  ) {
    return 'Forest'
  }

  if (
    landuse === 'industrial' ||
    landuse === 'quarry' ||
    landuse === 'construction' ||
    amenity === 'industrial' ||
    amenity === 'workshop' ||
    amenity === 'marketplace' ||
    tags.shop === 'trade' ||
    tags.office === 'industrial' ||
    building === 'industrial' ||
    building === 'warehouse'
  ) {
    return 'Quarry'
  }

  if (
    landuse === 'residential' ||
    amenity === 'shelter' ||
    amenity === 'school' ||
    amenity === 'college' ||
    amenity === 'university' ||
    building === 'residential' ||
    building === 'apartments' ||
    building === 'house' ||
    building === 'dormitory'
  ) {
    return 'Settlement'
  }

  if (tags.highway === 'traffic_signals' || tags.highway === 'crossing') {
    return 'Intersection'
  }

  return null
}

function getResourceYield(resourceTag: ResourceTag, tags: Record<string, string>): OsmClaimFeature['resourceYield'] {
  if (resourceTag === 'Forest') {
    return {
      wood: tags.natural === 'wood' || tags.landuse === 'forest' ? 3 : 1,
      livestockForage: tags.landuse === 'farmland' || tags.landuse === 'grass' ? 2 : 1,
    }
  }

  if (resourceTag === 'Quarry') {
    return {
      stone: tags.landuse === 'quarry' || tags.landuse === 'construction' ? 3 : 1,
      iron: tags.landuse === 'industrial' || tags.building === 'industrial' ? 2 : 1,
    }
  }

  if (resourceTag === 'Settlement') {
    return {
      labor: tags.amenity === 'school' || tags.amenity === 'university' ? 2 : 1,
      population: tags.building === 'apartments' || tags.landuse === 'residential' ? 3 : 1,
    }
  }

  return {}
}

function getFeatureName(tags: Record<string, string>, resourceTag: ResourceTag, id: number) {
  if (tags.name) return tags.name
  if (resourceTag === 'Forest') return 'Forest resource point'
  if (resourceTag === 'Quarry') return 'Quarry resource point'
  if (resourceTag === 'Settlement') return 'Settlement cluster'
  return `Intersection node ${id}`
}

function createSyntheticFeatures(coordinate: Coordinate): OsmClaimFeature[] {
  const offsets = [
    { lat: 0.002, lon: 0.002, resourceTag: 'Intersection' as ResourceTag, name: 'Micro-grid claim node' },
    { lat: -0.003, lon: 0.0015, resourceTag: 'Forest' as ResourceTag, name: 'Local park placeholder' },
    { lat: 0.0015, lon: -0.003, resourceTag: 'Settlement' as ResourceTag, name: 'Neighborhood block placeholder' },
  ]

  return offsets.map((offset, index) => ({
    id: `synthetic-${index}`,
    osmType: 'synthetic',
    osmId: null,
    name: offset.name,
    coordinate: {
      lat: coordinate.lat + offset.lat,
      lon: coordinate.lon + offset.lon,
    },
    resourceTag: offset.resourceTag,
    resourceYield: getResourceYield(offset.resourceTag, { generated: 'fallback' }),
    sourceTags: { generated: 'fallback' },
    claimedBy: index === 0 ? 'player' : null,
    influence: index === 0 ? 1 : 0.45,
    confidence: 0.4,
  }))
}

function toClaimFeature(element: OverpassElement): OsmClaimFeature | null {
  const tags = element.tags ?? {}
  const resourceTag = classifyResource(tags)
  const lat = element.lat ?? element.center?.lat
  const lon = element.lon ?? element.center?.lon
  if (!resourceTag || lat === undefined || lon === undefined) return null

  return {
    id: `${element.type}-${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name: getFeatureName(tags, resourceTag, element.id),
    coordinate: { lat, lon },
    resourceTag,
    resourceYield: getResourceYield(resourceTag, tags),
    sourceTags: tags,
    claimedBy: resourceTag === 'Intersection' ? 'player' : null,
    influence: resourceTag === 'Intersection' ? 1 : 0.55,
    confidence: element.tags ? 0.9 : 0.5,
  }
}

function buildOverpassQuery(coordinate: Coordinate) {
  const radiusMeters = 900
  return `
    [out:json][timeout:12];
    (
      node(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["highway"~"traffic_signals|crossing"];
      node(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["amenity"~"park|community_centre|shelter|school|college|university|marketplace|workshop"];
      node(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["leisure"~"park|garden"];
      way(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["leisure"~"park|garden"];
      way(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["amenity"~"park|community_centre|shelter|school|college|university|marketplace|workshop"];
      way(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["landuse"~"forest|grass|farmland|orchard|allotments|industrial|quarry|construction|residential"];
      way(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["building"~"residential|apartments|house|industrial|warehouse"];
      way(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["shop"~"trade|hardware|building_materials"];
      way(around:${radiusMeters},${coordinate.lat},${coordinate.lon})["office"~"industrial|company"];
    );
    out center tags 45;
  `
}

export function useOsmClaimFeatures(coordinate: Coordinate | null) {
  const setClaimFeatures = usePhaseOneGameStore(state => state.setClaimFeatures)

  useEffect(() => {
    if (!coordinate) return

    const activeCoordinate = coordinate
    const controller = new AbortController()

    async function loadOsmFeatures() {
      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: buildOverpassQuery(activeCoordinate),
          signal: controller.signal,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
          },
        })

        if (!response.ok) throw new Error(`Overpass ${response.status}`)
        const data = (await response.json()) as OverpassResponse
        const features = (data.elements ?? [])
          .map(toClaimFeature)
          .filter((feature): feature is OsmClaimFeature => feature !== null)
          .slice(0, 36)

        setClaimFeatures(features.length > 0 ? features : createSyntheticFeatures(activeCoordinate))
      } catch {
        if (!controller.signal.aborted) {
          setClaimFeatures(createSyntheticFeatures(activeCoordinate))
        }
      }
    }

    setClaimFeatures(createSyntheticFeatures(activeCoordinate))
    void loadOsmFeatures()

    return () => controller.abort()
  }, [coordinate, setClaimFeatures])
}
