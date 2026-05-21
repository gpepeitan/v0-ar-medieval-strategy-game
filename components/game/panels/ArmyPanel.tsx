'use client'

import { useGameStore } from "@/lib/game/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Users, Sword, Shield, Target, Footprints, Zap, Crosshair, Anvil, Star } from "lucide-react"
import type { Army, Commander, UnitStack } from "@/lib/game/types"

function getUnitCount(units: UnitStack[], ...types: string[]): number {
  return units.filter(u => types.includes(u.type)).reduce((s, u) => s + u.count, 0)
}

export function ArmyPanel({ armyId }: { armyId?: string }) {
  const game = useGameStore(state => state.game)
  const selectArmy = useGameStore(state => state.selectArmy)

  if (!game) return null

  const playerFactionId = Array.from(game.factions.values()).find(f => f.isPlayer)?.id ?? ''
  const armies = Array.from(game.armies.values())
  const commanders = Array.from(game.commanders.values())

  const playerArmies = armyId
    ? armies.filter(a => a.id === armyId)
    : armies.filter(a => a.ownerId === playerFactionId)
  const playerCommanders = commanders.filter(c => c.ownerId === playerFactionId)

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Your Forces</h2>

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
            <Sword className="h-4 w-4" /> Armies ({playerArmies.length})
          </h3>
          {playerArmies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No armies raised</p>
          ) : (
            <div className="space-y-2">
              {playerArmies.map(army => (
                <ArmyCard
                  key={army.id}
                  army={army}
                  isSelected={game.selectedArmyId === army.id}
                  onSelect={() => selectArmy(game.selectedArmyId === army.id ? null : army.id)}
                  territoryName={game.territories.get(army.position)?.name ?? 'Unknown'}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
            <Star className="h-4 w-4" /> Commanders ({playerCommanders.length})
          </h3>
          {playerCommanders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commanders</p>
          ) : (
            <div className="space-y-2">
              {playerCommanders.map(c => <CommanderCard key={c.id} commander={c} />)}
            </div>
          )}
        </div>

        <Separator />
        <div className="space-y-2">
          <Button className="w-full" variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />Raise New Army
          </Button>
          <Button className="w-full" variant="outline" size="sm">
            <Star className="h-4 w-4 mr-2" />Recruit Commander
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

function ArmyCard({ army, isSelected, onSelect, territoryName }: {
  army: Army; isSelected: boolean; onSelect: () => void; territoryName: string
}) {
  const infantry = getUnitCount(army.units, 'levy', 'infantry', 'heavy_infantry')
  const cavalry = getUnitCount(army.units, 'light_cavalry', 'heavy_cavalry')
  const archers = getUnitCount(army.units, 'archers', 'crossbowmen')
  const siege = getUnitCount(army.units, 'siege_engines')
  const status = army.isSieging ? 'sieging' : army.isRaiding ? 'raiding' : 'ready'

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">{army.name}</span>
        <Badge variant={status === 'ready' ? 'default' : 'secondary'}>{status}</Badge>
      </div>
      <div className="grid grid-cols-4 gap-1 mb-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground"><Footprints className="h-3 w-3" /><span>{infantry}</span></div>
        <div className="flex items-center gap-1 text-muted-foreground"><Zap className="h-3 w-3" /><span>{cavalry}</span></div>
        <div className="flex items-center gap-1 text-muted-foreground"><Crosshair className="h-3 w-3" /><span>{archers}</span></div>
        <div className="flex items-center gap-1 text-muted-foreground"><Anvil className="h-3 w-3" /><span>{siege}</span></div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Morale</span>
          <span className="text-foreground">{army.morale}%</span>
        </div>
        <Progress value={army.morale} className="h-1" />
      </div>
      <p className="text-xs text-muted-foreground mt-2">Location: {territoryName}</p>
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <Button size="sm" variant="outline" className="w-full"><Target className="h-3 w-3 mr-2" />Set Destination</Button>
          <Button size="sm" variant="outline" className="w-full"><Users className="h-3 w-3 mr-2" />Manage Units</Button>
        </div>
      )}
    </div>
  )
}

function CommanderCard({ commander }: { commander: Commander }) {
  const level = Math.max(1, Math.floor(commander.experience / 100) + 1)
  const xpProgress = commander.experience % 100

  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">{commander.name}</span>
        <Badge variant="outline">Lvl {level}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div className="flex items-center gap-1 text-muted-foreground"><Sword className="h-3 w-3" /><span>Leadership: </span><span className="text-foreground font-medium">{commander.stats.leadership}</span></div>
        <div className="flex items-center gap-1 text-muted-foreground"><Target className="h-3 w-3" /><span>Tactics: </span><span className="text-foreground font-medium">{commander.stats.tactics}</span></div>
        <div className="flex items-center gap-1 text-muted-foreground"><Shield className="h-3 w-3" /><span>Siege: </span><span className="text-foreground font-medium">{commander.stats.siege}</span></div>
        <div className="flex items-center gap-1 text-muted-foreground"><Footprints className="h-3 w-3" /><span>Logistics: </span><span className="text-foreground font-medium">{commander.stats.logistics}</span></div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Experience</span>
          <span className="text-foreground">{commander.experience} XP</span>
        </div>
        <Progress value={xpProgress} className="h-1" />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Age: {commander.age} | {commander.assignedArmyId ? 'Assigned' : 'Available'}
      </p>
    </div>
  )
}
