'use client'

import { usePhaseOneGameStore, OsmClaimFeature, BuildingType } from '@/lib/game/state/gameStore'

type YieldKey = 'wood' | 'livestockForage' | 'stone' | 'iron' | 'labor' | 'population' | 'gold'

const RESOURCE_COLORS: Record<string, string> = {
  Forest: '#22c55e', Quarry: '#f59e0b', Settlement: '#38bdf8', Intersection: '#f43f5e',
}

const BUILDING_DEFS: Record<string, {
  label: string
  requiredTag: OsmClaimFeature['resourceTag']
  goldCost: number
  description: string
  yieldBonuses: Partial<Record<YieldKey, number>>
}> = {
  lumber_camp:    { label: 'Lumber Camp',    requiredTag: 'Forest',       goldCost: 80,  description: 'Extracts timber from harvestable woodland.',     yieldBonuses: { wood: 0.6 } },
  nature_reserve: { label: 'Nature Reserve', requiredTag: 'Forest',       goldCost: 50,  description: 'Marks green space for livestock grazing.',       yieldBonuses: { livestockForage: 0.4 } },
  stone_works:    { label: 'Stone Works',    requiredTag: 'Quarry',       goldCost: 100, description: 'Improves extraction of stone and iron deposits.', yieldBonuses: { stone: 0.6, iron: 0.6 } },
  guild_hall:     { label: 'Guild Hall',     requiredTag: 'Settlement',   goldCost: 120, description: 'Organises local labor and population.',           yieldBonuses: { labor: 0.6, population: 0.5 } },
  market_post:    { label: 'Market Post',    requiredTag: 'Intersection', goldCost: 60,  description: 'Converts foot traffic into steady gold income.',  yieldBonuses: { gold: 2 } },
}

const YIELD_LABELS: Record<YieldKey, string> = {
  wood: 'Timber', livestockForage: 'Forage', stone: 'Stone',
  iron: 'Iron', labor: 'Labor', population: 'Population', gold: 'Gold',
}

function availableBuilding(tag: OsmClaimFeature['resourceTag'], isHarvestable: boolean): BuildingType | null {
  if (tag === 'Forest')       return isHarvestable ? 'lumber_camp' : 'nature_reserve'
  if (tag === 'Quarry')       return 'stone_works'
  if (tag === 'Settlement')   return 'guild_hall'
  if (tag === 'Intersection') return 'market_post'
  return null
}

function wxMultiplier(key: YieldKey, wx: { agricultureMultiplier: number; laborMultiplier: number }): number {
  if (key === 'wood' || key === 'livestockForage') return wx.agricultureMultiplier
  if (key === 'stone' || key === 'iron' || key === 'labor' || key === 'population') return wx.laborMultiplier
  return 1
}

function buildingBonus(key: YieldKey, type: BuildingType | undefined, complete: boolean): number {
  if (!type || !complete) return 1
  return 1 + (BUILDING_DEFS[type]?.yieldBonuses?.[key] ?? 0)
}

export function ClaimInfoPanel() {
  const selectedId     = usePhaseOneGameStore(s => s.selectedFeatureId)
  const features       = usePhaseOneGameStore(s => s.claimFeatures)
  const aiPolities     = usePhaseOneGameStore(s => s.aiPolities)
  const weather        = usePhaseOneGameStore(s => s.weather)
  const selectFeature  = usePhaseOneGameStore(s => s.selectFeature)
  const claimFeature   = usePhaseOneGameStore(s => s.claimFeature)
  const buildOnFeature = usePhaseOneGameStore(s => s.buildOnFeature)

  if (!selectedId) return null
  const f = features.find(x => x.id === selectedId)
  if (!f) return null

  const isPlayer = f.claimedBy === 'player'
  const isEnemy  = !!f.claimedBy && !isPlayer
  const ownerLabel = isPlayer ? 'Your territory'
    : f.claimedBy ? (aiPolities.find(p => p.id === f.claimedBy)?.name ?? 'Rival claim')
    : 'Unclaimed'
  const ownerColor = isPlayer ? '#fbbf24' : isEnemy ? '#ef4444' : '#64748b'

  const yields = (Object.entries(f.resourceYield) as [YieldKey, number][])
    .filter(([, v]) => v > 0)

  const bType     = f.building?.type
  const bComplete = !!f.building?.completedAt
  const bPending  = !!f.building && !bComplete

  let constructPct = 0
  if (bPending && f.building) {
    constructPct = Math.min(99, Math.round(
      ((Date.now() - new Date(f.building.startedAt).getTime()) / (15 * 60 * 1000)) * 100
    ))
  }

  const availBuild = availableBuilding(f.resourceTag, f.isHarvestable)
  const availDef   = availBuild ? BUILDING_DEFS[availBuild] : null
  const canBuild   = isPlayer && !f.building && !!availBuild

  return (
    <div className="absolute bottom-6 left-1/2 z-[1001] w-[320px] -translate-x-1/2 rounded border border-slate-700 bg-slate-950/96 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 px-3 py-2.5">
        <div>
          <div className="text-sm font-semibold text-slate-100">{f.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
            <span style={{ color: RESOURCE_COLORS[f.resourceTag] }}>{f.resourceTag}</span>
            {f.resourceTag === 'Forest' && (
              <span className={f.isHarvestable ? 'text-emerald-400' : 'text-slate-500'}>
                · {f.isHarvestable ? 'harvestable' : 'inert green space'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: ownerColor }}>{ownerLabel}</span>
          <button
            onClick={() => selectFeature(null)}
            className="rounded px-1 text-xs text-slate-500 hover:text-slate-300"
          >
            ×
          </button>
        </div>
      </div>

      {/* Yields table */}
      <div className="px-3 py-2">
        {yields.length > 0 ? (
          <>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Yield per tick
            </div>
            <div className="space-y-0.5">
              {yields.map(([key, base]) => {
                const wx  = wxMultiplier(key, weather)
                const bx  = buildingBonus(key, bType, bComplete)
                const tot = Math.round(base * wx * bx * 10) / 10
                return (
                  <div key={key} className="flex items-center justify-between text-[11px]">
                    <span className="w-24 text-slate-400">{YIELD_LABELS[key] ?? key}</span>
                    <span className="tabular-nums text-slate-500">{base}</span>
                    {wx !== 1 && (
                      <span className="tabular-nums text-[10px] text-sky-400">×{wx.toFixed(2)}</span>
                    )}
                    {bx !== 1 && (
                      <span className="tabular-nums text-[10px] text-amber-400">×{bx.toFixed(2)}</span>
                    )}
                    <span className={`tabular-nums font-semibold ${wx !== 1 || bx !== 1 ? 'text-white' : 'text-slate-300'}`}>
                      = {tot}
                    </span>
                  </div>
                )
              })}
            </div>
            {(weather.agricultureMultiplier !== 1 || weather.laborMultiplier !== 1) && (
              <div className="mt-1 text-[10px] text-sky-400">
                Weather · agri ×{weather.agricultureMultiplier.toFixed(2)} · labor ×{weather.laborMultiplier.toFixed(2)}
              </div>
            )}
          </>
        ) : (
          <p className="text-[11px] text-slate-500">No resource yield for this cell.</p>
        )}
      </div>

      {/* Building section */}
      <div className="border-t border-slate-800 px-3 pb-3 pt-2">
        {bComplete && bType && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-300 font-medium">{BUILDING_DEFS[bType]?.label}</span>
            <span className="text-slate-500">— operational</span>
          </div>
        )}
        {bPending && bType && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-amber-400">Building: {BUILDING_DEFS[bType]?.label}</span>
              <span className="tabular-nums text-slate-400">{constructPct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded bg-slate-800">
              <div
                className="h-1 rounded bg-amber-400 transition-all duration-700"
                style={{ width: `${constructPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">Completes next 15-minute tick</p>
          </div>
        )}
        {canBuild && availBuild && availDef && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-400">{availDef.description}</p>
            <button
              onClick={() => buildOnFeature(f.id, availBuild)}
              className="w-full rounded border border-amber-700 bg-amber-950/50 px-3 py-1.5 text-[11px] font-medium text-amber-300 transition-colors hover:bg-amber-900/50"
            >
              Build {availDef.label} — {availDef.goldCost}g
            </button>
          </div>
        )}
        {!f.claimedBy && (
          <button
            onClick={() => claimFeature(f.id)}
            className="w-full rounded border border-sky-700 bg-sky-950/50 px-3 py-1.5 text-[11px] font-medium text-sky-300 transition-colors hover:bg-sky-900/50"
          >
            Claim this {f.resourceTag.toLowerCase()}
          </button>
        )}
        {isEnemy && (
          <p className="text-[11px] text-orange-400">
            Held by a rival — move a banner here to contest it.
          </p>
        )}
      </div>
    </div>
  )
}
