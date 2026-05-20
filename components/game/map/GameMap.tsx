'use client'

// Dynamic import for Leaflet map to avoid SSR issues
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Spinner } from '@/components/ui/spinner'

const GameMapInner = dynamic(
  () => import('./GameMapInner').then(mod => mod.GameMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#1a1f2e]">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-amber-500" />
          <span className="text-sm text-slate-400">Loading map...</span>
        </div>
      </div>
    ),
  }
)

export function GameMap() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center bg-[#1a1f2e]">
        <Spinner className="h-8 w-8 text-amber-500" />
      </div>
    }>
      <GameMapInner />
    </Suspense>
  )
}
