'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/game/store'
import type { BattleFormation, BattleFocus, BattleOrder } from '@/lib/game/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Swords, Shield, Target, Flag, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const FORMATIONS: { value: BattleFormation; label: string; description: string }[] = [
  { value: 'line', label: 'Line', description: 'Balanced formation' },
  { value: 'wedge', label: 'Wedge', description: '+30% attack, -20% defense' },
  { value: 'defensive', label: 'Defensive', description: '+40% defense, -30% attack' },
  { value: 'flanking', label: 'Flanking', description: 'Risk for high reward' },
]

const FOCUS_TARGETS: { value: BattleFocus; label: string }[] = [
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'defensive', label: 'Defensive' },
]

const ORDERS: { value: BattleOrder; label: string; description: string }[] = [
  { value: 'hold', label: 'Hold', description: 'Maintain position' },
  { value: 'advance', label: 'Advance', description: 'Push forward' },
  { value: 'retreat', label: 'Retreat', description: 'Fall back safely' },
  { value: 'flank', label: 'Flank', description: 'Attack from side' },
]

export function BattleCommandDialog() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  const closeBattleCommand = useGameStore(state => state.closeBattleCommand)
  const submitBattleOrders = useGameStore(state => state.submitBattleOrders)
  
  const [formation, setFormation] = useState<BattleFormation>('line')
  const [focus, setFocus] = useState<BattleFocus>('balanced')
  const [order, setOrder] = useState<BattleOrder>('hold')
  
  if (!game || !ui.showBattleCommand) return null
  
  const battle = game.battles.get(ui.showBattleCommand)
  if (!battle) return null
  
  const playerArmy = game.armies.get(battle.playerArmyId)
  const enemyArmy = game.armies.get(battle.enemyArmyId)
  const territory = game.territories.get(battle.territoryId)
  
  if (!playerArmy || !enemyArmy || !territory) return null
  
  const playerFaction = game.factions.get(playerArmy.factionId)
  const enemyFaction = game.factions.get(enemyArmy.factionId)
  
  const playerUnits = playerArmy.units.reduce((sum, u) => sum + u.count, 0)
  const enemyUnits = enemyArmy.units.reduce((sum, u) => sum + u.count, 0)
  
  // Calculate aggregate morale from units
  const getArmyMorale = (units: typeof playerArmy.units): number => {
    if (units.length === 0) return 50
    return Math.round(units.reduce((sum, u) => sum + u.morale, 0) / units.length)
  }
  
  const playerMorale = getArmyMorale(playerArmy.units)
  const enemyMorale = getArmyMorale(enemyArmy.units)
  
  const handleSubmit = () => {
    submitBattleOrders(battle.id, formation, focus, order)
    closeBattleCommand()
  }
  
  const handleRetreat = () => {
    closeBattleCommand()
  }
  
  const handleAutoResolve = () => {
    closeBattleCommand()
  }
  
  return (
    <Dialog open={true} onOpenChange={closeBattleCommand}>
      <DialogContent className="max-w-2xl bg-slate-900 border-red-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <Swords className="h-5 w-5" />
            Battle at {territory.name}
          </DialogTitle>
        </DialogHeader>
        
        {/* Battle overview */}
        <div className="grid grid-cols-3 gap-4 py-4">
          {/* Your army */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: playerFaction?.color }}
                />
                <span className="text-sm font-semibold text-amber-400">Your Army</span>
              </div>
              <div className="text-lg font-bold">{playerUnits.toLocaleString()}</div>
              <div className="text-xs text-slate-400">troops</div>
              <div className="mt-2">
                <div className="text-xs text-slate-400 mb-1">Morale</div>
                <Progress value={playerMorale} className="h-2" />
              </div>
            </CardContent>
          </Card>
          
          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="text-2xl font-bold text-slate-500">VS</div>
          </div>
          
          {/* Enemy army */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: enemyFaction?.color }}
                />
                <span className="text-sm font-semibold">{enemyFaction?.name}</span>
              </div>
              <div className="text-lg font-bold">{enemyUnits.toLocaleString()}</div>
              <div className="text-xs text-slate-400">troops</div>
              <div className="mt-2">
                <div className="text-xs text-slate-400 mb-1">Morale</div>
                <Progress value={enemyMorale} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Separator />
        
        {/* Commands */}
        <div className="space-y-4 py-2">
          {/* Formation */}
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Formation
            </div>
            <div className="grid grid-cols-4 gap-2">
              {FORMATIONS.map(f => (
                <Button
                  key={f.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setFormation(f.value)}
                  className={cn(
                    "h-auto py-2 flex-col",
                    formation === f.value && "border-amber-500 bg-amber-500/10"
                  )}
                >
                  <span className="text-xs font-medium">{f.label}</span>
                  <span className="text-[10px] text-slate-400">{f.description}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Focus target */}
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" /> Focus
            </div>
            <div className="grid grid-cols-3 gap-2">
              {FOCUS_TARGETS.map(t => (
                <Button
                  key={t.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setFocus(t.value)}
                  className={cn(
                    "flex items-center gap-1",
                    focus === t.value && "border-amber-500 bg-amber-500/10"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs">{t.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Special orders */}
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Flag className="h-4 w-4" /> Orders
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ORDERS.map(o => (
                <Button
                  key={o.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setOrder(o.value)}
                  className={cn(
                    "h-auto py-2 flex-col",
                    order === o.value && "border-amber-500 bg-amber-500/10"
                  )}
                >
                  <span className="text-xs font-medium">{o.label}</span>
                  <span className="text-[10px] text-slate-400">{o.description}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={handleAutoResolve}>
            Auto-Resolve
          </Button>
          <Button variant="destructive" size="sm" onClick={handleRetreat}>
            Retreat
          </Button>
          <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">
            <Swords className="h-4 w-4 mr-2" />
            Engage!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
