'use client'

import dynamic from 'next/dynamic'

const GameMapInner = dynamic(
  () => import('./GameMapInner').then(mod => ({ default: mod.GameMapInner })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#1a1f2e]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading Leaflet and OSM claim layers...</span>
        </div>
      </div>
    ),
  }
)

export function GameMap() {
  return <GameMapInner />
}
