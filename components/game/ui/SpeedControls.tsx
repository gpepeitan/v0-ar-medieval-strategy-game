'use client'

import { useGameStore } from '@/lib/game/store'
import { GameSpeed, GAME_SPEED_MULTIPLIERS } from '@/lib/game/types'
import { Button } from '@/components/ui/button'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const SPEED_LABELS: Record<GameSpeed, string> = {
  0: 'Paused',
  1: '1x',
  2: '2x',
  3: '5x',
  4: '10x',
}

export function SpeedControls() {
  const speed = useGameStore(state => state.game?.speed ?? 1)
  const isRunning = useGameStore(state => state.game?.isRunning ?? false)
  const setSpeed = useGameStore(state => state.setSpeed)
  const togglePause = useGameStore(state => state.togglePause)
  
  return (
    <div className="flex items-center gap-1">
      {/* Pause/Play button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePause}
        className={cn(
          "h-8 w-8 p-0",
          speed === 0 && "bg-amber-500/20 text-amber-400"
        )}
        title={speed === 0 ? "Resume (Space)" : "Pause (Space)"}
      >
        {speed === 0 ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>
      
      {/* Speed buttons */}
      {([1, 2, 3, 4] as GameSpeed[]).map((s) => (
        <Button
          key={s}
          variant="ghost"
          size="sm"
          onClick={() => setSpeed(s)}
          className={cn(
            "h-8 px-2 text-xs",
            speed === s && "bg-amber-500/20 text-amber-400"
          )}
          title={`Speed ${SPEED_LABELS[s]} (${s})`}
        >
          {SPEED_LABELS[s]}
        </Button>
      ))}
    </div>
  )
}
