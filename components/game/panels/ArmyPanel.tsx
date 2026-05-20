"use client"

import { useGameStore } from "@/lib/game/store"
import { FACTION_CONFIG } from "@/lib/game/constants"
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
  ChevronRight,
  Footprints,
  Crosshair,
  Anvil,
  Star,
  Waypoints
} from "lucide-react"
import type { Army, Commander } from "@/lib/game/types"

export function ArmyPanel() {
  const { 
    armies, 
    commanders, 
    factions, 
    playerFactionId,
    territories,
    selectedArmy,
    setSelectedArmy
  } = useGameStore()

  const playerArmies = armies.filter(a => a.factionId === playerFactionId)
  const playerCommanders = commanders.filter(c => c.factionId === playerFactionId)

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
                  isSelected={selectedArmy === army.id}
                  onSelect={() => setSelectedArmy(army.id === selectedArmy ? null : army.id)}
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

function ArmyCard({ 
  army, 
  isSelected,
  onSelect 
}: { 
  army: Army
  isSelected: boolean
  onSelect: () => void 
}) {
  const { territories, factions } = useGameStore()
  const territory = territories.find(t => t.id === army.currentTerritoryId)
  const totalTroops = army.units.infantry + army.units.cavalry + army.units.archers + army.units.siegeEngines
  const maxMorale = 100

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
        <Badge variant={army.status === 'ready' ? 'default' : 'secondary'}>
          {army.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-4 gap-1 mb-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Footprints className="h-3 w-3" />
          <span>{army.units.infantry}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Waypoints className="h-3 w-3" />
          <span>{army.units.cavalry}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Crosshair className="h-3 w-3" />
          <span>{army.units.archers}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Anvil className="h-3 w-3" />
          <span>{army.units.siegeEngines}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Morale</span>
          <span className="text-foreground">{army.morale}%</span>
        </div>
        <Progress value={army.morale} className="h-1" />
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Location: {territory?.name || 'Unknown'}
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
  const xpToNextLevel = commander.level * 100
  const xpProgress = (commander.experience / xpToNextLevel) * 100

  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">{commander.name}</span>
        <Badge variant="outline">Lvl {commander.level}</Badge>
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
          <span className="text-foreground">{commander.experience}/{xpToNextLevel}</span>
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
