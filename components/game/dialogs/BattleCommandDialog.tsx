'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/game/store'
import { BattleFormation, BattleFocus, BattleOrder } from '@/lib/game/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Swords, Shield, Target, Flag, Users, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const FORMATIONS: { value: BattleFormation; label: string; description: string }[] = [
  { value: 'shield_wall', label: 'Shield Wall', description: '+30% defense, -20% attack' },
  { value: 'skirmish', label: 'Skirmish', description: 'Balanced, +10% morale' },
  { value: 'charge', label: 'Charge', description: '+40% attack, -30% defense' },
  { value: 'defensive', label: 'Defensive', description: '+50% defense, -40% attack' },
]

const FOCUS_TARGETS: { value: BattleFocus; label: string; icon: React.ReactNode }[] = [
  { value: 'infantry', label: 'Infantry', icon: <Users className="h-4 w-4" /> },
  { value: 'archers', label: 'Archers', icon: <Target className="h-4 w-4" /> },
  { value: 'cavalry', label: 'Cavalry', icon: <ArrowRight className="h-4 w-4" /> },
  { value: 'commander', label: 'Commander', icon: <Flag className="h-4 w-4" /> },
]

const ORDERS: { value: BattleOrder; label: string; description: string }[] = [
  { value: 'hold_ground', label: 'Hold Ground', description: 'Maintain position, steady losses' },
  { value: 'flank', label: 'Flank', description: 'Risk for high reward' },
  { value: 'feigned_retreat', label: 'Feigned Retreat', description: 'Lure enemy, then strike' },
  { value: 'all_out_attack', label: 'All Out Attack', description: 'Maximum damage, high casualties' },
]

export function BattleCommandDialog() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  const closeBattleCommand = useGameStore(state => state.closeBattleCommand)
  const submitBattleOrders = useGameStore(state => state.submitBattleOrders)
  
  const [formation, setFormation] = useState<BattleFormation>('skirmish')
  const [focus, setFocus] = useState<BattleFocus>('infantry')
  const [order, setOrder] = useState<BattleOrder>('hold_ground')
  
  if (!game || !ui.showBattleCommand) return null
  
  const battle = game.activeBattles.get(ui.showBattleCommand)
  if (!battle) return null
  
  const attackerArmy = game.armies.get(battle.attackerArmyId)
  const defenderArmy = game.armies.get(battle.defenderArmyId)
  const territory = game.territories.get(battle.territoryId)
  
  if (!attackerArmy || !defenderArmy || !territory) return null
  
  const attackerFaction = game.factions.get(attackerArmy.ownerId)
  const defenderFaction = game.factions.get(defenderArmy.ownerId)
  
  const playerArmy = battle.playerIsAttacker ? attackerArmy : defenderArmy
  const enemyArmy = battle.playerIsAttacker ? defenderArmy : attackerArmy
  const playerFaction = battle.playerIsAttacker ? attackerFaction : defenderFaction
  const enemyFaction = battle.playerIsAttacker ? defenderFaction : attackerFaction
  
  const playerUnits = playerArmy.units.reduce((sum, u) => sum + u.count, 0)
  const enemyUnits = enemyArmy.units.reduce((sum, u) => sum + u.count, 0)
  
  const handleSubmit = () => {
    submitBattleOrders(battle.id, formation, focus, order)
    closeBattleCommand()
  }
  
  const handleRetreat = () => {
    // Retreat logic - auto-resolve with retreat
    closeBattleCommand()
  }
  
  const handleAutoResolve = () => {
    // Let it auto-resolve
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
                <Progress value={playerArmy.morale} className="h-2" />
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
                <Progress value={enemyArmy.morale} className="h-2" />
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
              <Target className="h-4 w-4" /> Focus Target
            </div>
            <div className="grid grid-cols-4 gap-2">
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
                  {t.icon}
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
