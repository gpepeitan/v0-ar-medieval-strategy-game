'use client'

import { useGameStore } from "@/lib/game/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Sword,
  Shield,
  Target,
  Footprints,
  Star,
  Users,
  SkullIcon
} from "lucide-react"
import type { Commander } from "@/lib/game/types"

export function CommanderPanel() {
  const game = useGameStore(state => state.game)

  if (!game) return null

  const playerFactionId = Array.from(game.factions.values()).find(f => f.isPlayer)?.id ?? ""
  const commanders = Array.from(game.commanders.values()).filter(c => c.ownerId === playerFactionId)
  const alive = commanders.filter(c => c.isAlive)
  const dead = commanders.filter(c => !c.isAlive)

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400" />
          Commanders
        </h2>

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">
            Active ({alive.length})
          </h3>
          {alive.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commanders</p>
          ) : (
            <div className="space-y-3">
              {alive.map(c => <CommanderCard key={c.id} commander={c} game={game} />)}
            </div>
          )}
        </div>

        {dead.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-2">
                <SkullIcon className="h-4 w-4" />
                Fallen ({dead.length})
              </h3>
              <div className="space-y-2">
                {dead.map(c => (
                  <div key={c.id} className="p-2 rounded border border-border/50 opacity-60 text-sm">
                    <span className="text-muted-foreground line-through">{c.name}</span>
                    <p className="text-xs text-muted-foreground">Age {c.age} — Fallen in battle</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />
        <Button className="w-full" variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Recruit Commander (200g)
        </Button>
      </div>
    </ScrollArea>
  )
}

function CommanderCard({ commander, game }: { commander: Commander; game: any }) {
  const level = Math.max(1, Math.floor(commander.experience / 100) + 1)
  const xpProgress = commander.experience % 100
  const assignedArmy = commander.assignedArmyId ? game.armies.get(commander.assignedArmyId) : null

  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">{commander.name}</span>
        <Badge variant="outline">Lvl {level}</Badge>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {commander.traits.slice(0, 3).map(trait => (
          <Badge key={trait} variant="secondary" className="text-xs">{trait}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Sword className="h-3 w-3" /><span>Leadership: </span>
          <span className="text-foreground font-medium">{commander.stats.leadership}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Target className="h-3 w-3" /><span>Tactics: </span>
          <span className="text-foreground font-medium">{commander.stats.tactics}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Shield className="h-3 w-3" /><span>Siege: </span>
          <span className="text-foreground font-medium">{commander.stats.siege}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Footprints className="h-3 w-3" /><span>Logistics: </span>
          <span className="text-foreground font-medium">{commander.stats.logistics}</span>
        </div>
      </div>

      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Experience</span>
          <span className="text-foreground">{commander.experience} XP</span>
        </div>
        <Progress value={xpProgress} className="h-1" />
      </div>

      <p className="text-xs text-muted-foreground">
        Age: {commander.age} | {assignedArmy ? `Leads: ${assignedArmy.name}` : 'Unassigned'}
      </p>
    </div>
  )
}
