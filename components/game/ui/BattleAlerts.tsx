'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/lib/game/store'
import { Battle } from '@/lib/game/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Swords, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BattleAlertProps {
  battle: Battle
  onCommand: (battleId: string) => void
}

function BattleAlertItem({ battle, onCommand }: BattleAlertProps) {
  const game = useGameStore(state => state.game)
  const [timeLeft, setTimeLeft] = useState(battle.timeRemaining)
  
  // Countdown timer
  useEffect(() => {
    if (battle.phase !== 'pending') return
    
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [battle.phase])
  
  if (!game) return null
  
  const attackerArmy = game.armies.get(battle.attackerArmyId)
  const defenderArmy = game.armies.get(battle.defenderArmyId)
  const territory = game.territories.get(battle.territoryId)
  
  if (!attackerArmy || !defenderArmy || !territory) return null
  
  const attackerFaction = game.factions.get(attackerArmy.ownerId)
  const defenderFaction = game.factions.get(defenderArmy.ownerId)
  
  const isPlayerBattle = battle.playerIsAttacker || battle.playerIsDefender
  const isUrgent = timeLeft < 15
  
  return (
    <Card className={cn(
      "border-red-500/50 bg-red-950/30",
      isUrgent && "animate-pulse border-red-500"
    )}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Swords className="h-4 w-4 text-red-400" />
          <span className="text-red-400">Battle at {territory.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: attackerFaction?.color }}
            />
            <span>{attackerFaction?.name}</span>
          </div>
          <span className="text-slate-500">vs</span>
          <div className="flex items-center gap-1">
            <span>{defenderFaction?.name}</span>
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: defenderFaction?.color }}
            />
          </div>
        </div>
        
        {isPlayerBattle && battle.phase === 'pending' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              <Clock className={cn("h-3 w-3", isUrgent ? "text-red-400" : "text-amber-400")} />
              <span className={isUrgent ? "text-red-400" : "text-amber-400"}>
                {Math.floor(timeLeft)}s to auto-resolve
              </span>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="h-6 text-xs px-2"
              onClick={() => onCommand(battle.id)}
            >
              Command <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
        
        {battle.phase === 'resolving' && (
          <div className="text-xs text-slate-400">
            Battle in progress...
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function BattleAlerts() {
  const game = useGameStore(state => state.game)
  const openBattleCommand = useGameStore(state => state.openBattleCommand)
  
  if (!game) return null
  
  const battles = Array.from(game.activeBattles.values())
    .filter(b => (b.playerIsAttacker || b.playerIsDefender) && b.phase === 'pending')
  
  if (battles.length === 0) return null
  
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-xs">
      {battles.map(battle => (
        <BattleAlertItem
          key={battle.id}
          battle={battle}
          onCommand={openBattleCommand}
        />
      ))}
    </div>
  )
}
