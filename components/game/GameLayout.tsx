'use client'

import { useMemo } from 'react'
import { usePhaseOneGameStore } from '@/lib/game/state/gameStore'
import { GameMap } from './map/GameMap'
import { NotificationStack } from './ui/NotificationStack'
import { NegotiationChat } from './negotiation/NegotiationChat'
import { useGameStore } from '@/lib/game/store'

/** Top HUD bar — always visible regardless of game state */
function WorldHud() {
  const clock         = usePhaseOneGameStore(s => s.clock)
  const weather       = usePhaseOneGameStore(s => s.weather)
  const claimFeatures = usePhaseOneGameStore(s => s.claimFeatures)
  const playerCoord   = usePhaseOneGameStore(s => s.playerCoordinate)
  const pauseEngine   = usePhaseOneGameStore(s => s.pauseEngine)
  const resumeEngine  = usePhaseOneGameStore(s => s.resumeEngine)

  const myClaims   = claimFeatures.filter(f => f.claimedBy === 'player').length
  const totalCells = claimFeatures.length

  const BLDG_BONUSES: Record<string, Record<string, number>> = {
    lumber_camp: { wood: 0.6 }, nature_reserve: { livestockForage: 0.4 },
    stone_works: { stone: 0.6, iron: 0.6 }, guild_hall: { labor: 0.6, population: 0.5 },
    market_post: {},
  }
  const YIELD_SHORT: Record<string, string> = {
    wood: 'Tmb', livestockForage: 'Fge', stone: 'Stn',
    iron: 'Iron', labor: 'Lab', population: 'Pop', gold: 'Gold',
  }
  const economy = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const f of claimFeatures.filter(cf => cf.claimedBy === 'player')) {
      for (const [key, base] of Object.entries(f.resourceYield)) {
        if (!base || base <= 0) continue
        const wx = key === 'wood' || key === 'livestockForage' ? weather.agricultureMultiplier
                 : key !== 'gold' ? weather.laborMultiplier : 1
        const bType = f.building?.completedAt ? f.building.type : undefined
        const bx = 1 + (bType ? (BLDG_BONUSES[bType]?.[key] ?? 0) : 0)
        totals[key] = Math.round(((totals[key] ?? 0) + base * wx * bx) * 10) / 10
      }
    }
    return totals
  }, [claimFeatures, weather])

  return (
    <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-xs text-slate-300">
      {/* Left: identity */}
      <div className="flex items-center gap-4">
        <span className="font-semibold text-amber-400 tracking-wide">⚔ Neighborhood Strategy</span>
        {playerCoord && (
          <span className="text-slate-500 font-mono">
            {playerCoord.lat.toFixed(4)}, {playerCoord.lon.toFixed(4)}
          </span>
        )}
      </div>

      {/* Centre: clock */}
      <div className="flex items-center gap-4">
        <span>Day {clock.inGameDay} · H{String(clock.inGameHour).padStart(2,'0')}</span>
        <span className="text-slate-500">Claims: {myClaims}/{totalCells}</span>
        <span className={`capitalize ${weather.season === 'winter' ? 'text-sky-300' : weather.season === 'summer' ? 'text-orange-300' : 'text-slate-300'}`}>
          {weather.season}
        </span>
        {weather.movementMultiplier < 0.9 && (
          <span className="text-orange-400">Mvt {Math.round(weather.movementMultiplier * 100)}%</span>
        )}
        {Object.entries(economy)
          .filter(([, v]) => v > 0)
          .slice(0, 5)
          .map(([k, v]) => (
            <span key={k} className="text-amber-300/70 tabular-nums">
              {YIELD_SHORT[k] ?? k} {v.toFixed(1)}
            </span>
          ))
        }
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={clock.isRunning ? pauseEngine : resumeEngine}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] hover:border-slate-500 transition-colors"
        >
          {clock.isRunning ? '⏸ Pause' : '▶ Resume'}
        </button>
      </div>
    </div>
  )
}

export function GameLayout() {
  // Optional: old factions game (shown if loaded, not required)
  const legacyGame = useGameStore(state => state.game)
  const ui         = useGameStore(state => state.ui)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950">
      <WorldHud />

      {/* Map — always visible, world-map first */}
      <div className="relative flex-1 overflow-hidden">
        <GameMap />
      </div>

      {/* Legacy game overlays (only when a faction game is active) */}
      {legacyGame && ui.showNegotiationChat && legacyGame.activeNegotiation && (
        <NegotiationChat />
      )}

      <NotificationStack />
    </div>
  )
}
