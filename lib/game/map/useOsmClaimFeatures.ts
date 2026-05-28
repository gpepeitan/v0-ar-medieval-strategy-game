'use client'

import { useEffect } from 'react'
import { Coordinate, OsmClaimFeature, ResourceTag, usePhaseOneGameStore } from '@/lib/game/state/gameStore'

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements?: OverpassElement[]
}

function classifyResource(tags: Record<string, string>): ResourceTag | null {
  const { landuse, leisure, natural, amenity, building, highway } = tags

  // True forests (harvestable wood sources)
  if (natural === 'wood' || natural === 'forest' || landuse === 'forest') return 'Forest'

  // Green space (parks, gardens — visible but not timber-harvestable)
  if (
    leisure === 'park' || leisure === 'garden' || amenity === 'park' ||
    amenity === 'community_centre' || landuse === 'grass' ||
    landuse === 'farmland' || landuse === 'orchard' || landuse === 'allotments'
  ) return 'Forest'

  if (
    landuse === 'industrial' || landuse === 'quarry' || landuse === 'construction' ||
    amenity === 'industrial' || amenity === 'workshop' || amenity === 'marketplace' ||
    tags.shop === 'trade' || building === 'industrial' || building === 'warehouse'
  ) return 'Quarry'

  if (
    landuse === 'residential' || amenity === 'shelter' ||
    amenity === 'school' || amenity === 'college' || amenity === 'university' ||
    building === 'residential' || building === 'apartments' || building === 'house'
  ) return 'Settlement'

  if (highway === 'traffic_signals' || highway === 'crossing') return 'Intersection'

  return null
}

/** Only actual woodland/forest is harvestable — parks/gardens are not */
function isFeatureHarvestable(resourceTag: ResourceTag, tags: Record<string, string>): boolean {
  if (resourceTag !== 'Forest') return true
  return tags.natural === 'wood' || tags.natural === 'forest' || tags.landuse === 'forest'
}

function getResourceYield(resourceTag: ResourceTag, tags: Record<string, string>): OsmClaimFeature['resourceYield'] {
  if (resourceTag === 'Forest') {
    const harvestable = isFeatureHarvestable(resourceTag, tags)
    return { wood: harvestable ? (tags.natural === 'wood' ? 3 : 2) : 0, livestockForage: tags.landuse === 'farmland' ? 2 : 1 }
  }
  if (resourceTag === 'Quarry') return { stone: tags.landuse === 'quarry' ? 3 : 1, iron: tags.landuse === 'industrial' ? 2 : 1 }
  if (resourceTag === 'Settlement') return { labor: tags.amenity === 'school' ? 2 : 1, population: tags.building === 'apartments' ? 3 : 1 }
  return {}
}

function getFeatureName(tags: Record<string, string>, resourceTag: ResourceTag, id: number): string {
  if (tags.name) return tags.name
  if (resourceTag === 'Forest') return tags.natural === 'wood' || tags.landuse === 'forest' ? 'Woodland' : 'Green space'
  if (resourceTag === 'Quarry') return 'Industrial site'
  if (resourceTag === 'Settlement') return 'Residential block'
  return `Intersection ${id}`
}

function toClaimFeature(element: OverpassElement): OsmClaimFeature | null {
  const tags = element.tags ?? {}
  const resourceTag = classifyResource(tags)
  const lat = element.lat ?? element.center?.lat
  const lon = element.lon ?? element.center?.lon
  if (!resourceTag || lat === undefined || lon === undefined) return null

  return {
    id: `${element.type}-${element.id}`,
    osmType: element.type, osmId: element.id,
    name: getFeatureName(tags, resourceTag, element.id),
    coordinate: { lat, lon },
    resourceTag,
    isHarvestable: isFeatureHarvestable(resourceTag, tags),
    resourceYield: getResourceYield(resourceTag, tags),
    sourceTags: tags,
    claimedBy: resourceTag === 'Intersection' ? 'player' : null,
    influence: resourceTag === 'Intersection' ? 1 : 0.55,
    confidence: element.tags ? 0.9 : 0.5,
  }
}

function createSyntheticFeatures(coordinate: Coordinate): OsmClaimFeature[] {
  return [
    { lat: 0, lon: 0, resourceTag: 'Intersection' as ResourceTag, name: 'Central node', isH: true },
    { lat: 0.003, lon: 0.002, resourceTag: 'Forest' as ResourceTag, name: 'Nearby woodland', isH: true },
    { lat: -0.004, lon: 0.003, resourceTag: 'Forest' as ResourceTag, name: 'Local park', isH: false },
    { lat: 0.002, lon: -0.004, resourceTag: 'Settlement' as ResourceTag, name: 'Residential cluster', isH: true },
    { lat: -0.002, lon: -0.003, resourceTag: 'Quarry' as ResourceTag, name: 'Industrial zone', isH: true },
  ].map((o, i) => ({
    id: `synthetic-${i}`,
    osmType: 'synthetic' as const, osmId: null,
    name: o.name,
    coordinate: { lat: coordinate.lat + o.lat, lon: coordinate.lon + o.lon },
    resourceTag: o.resourceTag,
    isHarvestable: o.isH,
    resourceYield: getResourceYield(o.resourceTag, { generated: 'fallback' }),
    sourceTags: { generated: 'fallback' },
    claimedBy: i === 0 ? 'player' : null,
    influence: i === 0 ? 1 : 0.45,
    confidence: 0.4,
  }))
}

function buildOverpassQuery(coordinate: Coordinate): string {
  const r = 700
  return `
    [out:json][timeout:12];
    (
      node(around:${r},${coordinate.lat},${coordinate.lon})["highway"~"traffic_signals|crossing"];
      node(around:${r},${coordinate.lat},${coordinate.lon})["natural"~"wood|forest"];
      way(around:${r},${coordinate.lat},${coordinate.lon})["natural"~"wood|forest"];
      way(around:${r},${coordinate.lat},${coordinate.lon})["landuse"~"forest"];
      way(around:${r},${coordinate.lat},${coordinate.lon})["leisure"~"park|garden"]["area"="yes"];
      way(around:${r},${coordinate.lat},${coordinate.lon})["amenity"~"park|community_centre|school|college|university|marketplace|workshop"];
      way(around:${r},${coordinate.lat},${coordinate.lon})["landuse"~"grass|farmland|orchard|allotments|industrial|quarry|construction|residential"];
      way(around:${r},${coordinate.lat},${coordinate.lon})["building"~"residential|apartments|house|industrial|warehouse"];
    );
    out center tags 40;
  `
}

export function useOsmClaimFeatures(coordinate: Coordinate | null) {
  const setClaimFeatures = usePhaseOneGameStore(state => state.setClaimFeatures)

  useEffect(() => {
    if (!coordinate) return
    const active = coordinate
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST', body: buildOverpassQuery(active), signal: controller.signal,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        })
        if (!res.ok) throw new Error(`Overpass ${res.status}`)
        const data = (await res.json()) as OverpassResponse
        const all = (data.elements ?? []).map(toClaimFeature).filter((f): f is OsmClaimFeature => f !== null)

        // Cap forests: max 5 harvestable + 4 non-harvestable
        const intersections = all.filter(f => f.resourceTag === 'Intersection').slice(0, 6)
        const harvestableForests = all.filter(f => f.resourceTag === 'Forest' && f.isHarvestable).slice(0, 5)
        const inertForests = all.filter(f => f.resourceTag === 'Forest' && !f.isHarvestable).slice(0, 4)
        const quarries = all.filter(f => f.resourceTag === 'Quarry').slice(0, 5)
        const settlements = all.filter(f => f.resourceTag === 'Settlement').slice(0, 6)

        const features = [...intersections, ...harvestableForests, ...inertForests, ...quarries, ...settlements]
        setClaimFeatures(features.length > 3 ? features : createSyntheticFeatures(active))
      } catch {
        if (!controller.signal.aborted) setClaimFeatures(createSyntheticFeatures(active))
      }
    }

    setClaimFeatures(createSyntheticFeatures(active))
    void load()
    return () => controller.abort()
  }, [coordinate, setClaimFeatures])
}
