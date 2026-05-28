"use client"

import { useGameStore } from "@/lib/game/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Sword,
  Shield,
  Target,
  Footprints,
  Crosshair,
  Anvil,
  Star,
  Waypoints
} from "lucide-react"
import type { Army, Commander, ArmyUnit } from "@/lib/game/types"

export function ArmyPanel() {
  const game = useGameStore(state => state.game)
  const selectArmy = useGameStore(state => state.selectArmy)

  if (!game) return null

  const playerFaction = Array.from(game.factions.values()).find(f => f.isPlayer)
  if (!playerFaction) return null

  const playerArmies = Array.from(game.armies.values()).filter(a => a.ownerId === playerFaction.id)
  const playerCommanders = Array.from(game.commanders.values()).filter(c => c.factionId === playerFaction.id)
  const selectedArmyId = game.selectedArmyId

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Your Forces</h2>

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
            <Sword className="h-4 w-4" />
            Armies ({playerArmies.length})
          </h3>

          {playerArmies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No armies raised</p>
          ) : (
            <div className="space-y-2">
              {playerArmies.map(army => (
                <ArmyCard
                  key={army.id}
                  army={army}
                  isSelected={selectedArmyId === army.id}
                  onSelect={() => selectArmy(army.id === selectedArmyId ? null : army.id)}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
            <Star className="h-4 w-4" />
            Commanders ({playerCommanders.length})
          </h3>

          {playerCommanders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commanders</p>
          ) : (
            <div className="space-y-2">
              {playerCommanders.map(commander => (
                <CommanderCard key={commander.id} commander={commander} />
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <Button className="w-full" variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Raise New Army
          </Button>
          <Button className="w-full" variant="outline" size="sm">
            <Star className="h-4 w-4 mr-2" />
            Recruit Commander
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

function getUnitCount(units: ArmyUnit[], type: string): number {
  return units.filter(u => u.type === type).reduce((sum, u) => sum + u.count, 0)
}

function getTotalTroops(units: ArmyUnit[]): number {
  return units.reduce((sum, u) => sum + u.count, 0)
}

function ArmyCard({
  army,
  isSelected,
  onSelect
}: {
  army: Army
  isSelected: boolean
  onSelect: () => void
}) {
  const game = useGameStore(state => state.game)
  const territory = game?.territories.get(army.currentTerritoryId)
  const infantry = getUnitCount(army.units, 'heavy_infantry') + getUnitCount(army.units, 'light_infantry') + getUnitCount(army.units, 'levies')
  const cavalry = getUnitCount(army.units, 'heavy_cavalry') + getUnitCount(army.units, 'light_cavalry')
  const archers = getUnitCount(army.units, 'archers') + getUnitCount(army.units, 'crossbowmen')
  const siege = getUnitCount(army.units, 'trebuchet') + getUnitCount(army.units, 'battering_ram') + getUnitCount(army.units, 'siege_tower') + getUnitCount(army.units, 'catapult')
  const statusLabel = army.isInBattle ? 'in battle' : army.battleId ? 'engaged' : army.targetTerritoryId ? 'marching' : 'ready'
  const statusVariant: 'default' | 'secondary' | 'destructive' = army.isInBattle ? 'destructive' : army.targetTerritoryId ? 'secondary' : 'default'

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">{army.name}</span>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>

      <div className="grid grid-cols-4 gap-1 mb-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Footprints className="h-3 w-3" />
          <span>{infantry}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Waypoints className="h-3 w-3" />
          <span>{cavalry}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Crosshair className="h-3 w-3" />
          <span>{archers}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Anvil className="h-3 w-3" />
          <span>{siege}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Units</span>
          <span className="text-foreground">{army.units.reduce((s, u) => s + u.count, 0)}</span>
        </div>
        <Progress value={Math.min(100, army.supplies)} className="h-1" />
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Location: {territory?.name ?? 'Unknown'}
      </p>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <Button size="sm" variant="outline" className="w-full">
            <Target className="h-3 w-3 mr-2" />
            Set Destination
          </Button>
          <Button size="sm" variant="outline" className="w-full">
            <Users className="h-3 w-3 mr-2" />
            Manage Units
          </Button>
        </div>
      )}
    </div>
  )
}

function CommanderCard({ commander }: { commander: Commander }) {
  const level = Math.floor(commander.xp / 100) + 1
  const xpToNextLevel = level * 100
  const xpProgress = Math.min(100, (commander.xp / xpToNextLevel) * 100)

  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">{commander.name}</span>
        <Badge variant="outline">Lvl {level}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <StatItem icon={<Sword className="h-3 w-3" />} label="Leadership" value={commander.stats.leadership} />
        <StatItem icon={<Target className="h-3 w-3" />} label="Tactics" value={commander.stats.tactics} />
        <StatItem icon={<Shield className="h-3 w-3" />} label="Siege" value={commander.stats.siege} />
        <StatItem icon={<Footprints className="h-3 w-3" />} label="Logistics" value={commander.stats.logistics} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Experience</span>
          <span className="text-foreground">{commander.xp}/{xpToNextLevel}</span>
        </div>
        <Progress value={xpProgress} className="h-1" />
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Age: {commander.age} | {commander.armyId ? 'Assigned' : 'Available'}
      </p>
    </div>
  )
}

function StatItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      {icon}
      <span>{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}
