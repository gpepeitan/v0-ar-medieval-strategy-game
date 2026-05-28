'use client'

import { useGameStore } from '@/lib/game/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sword, Shield, Heart, Star, Users } from 'lucide-react'

export function CommanderPanel() {
  const game = useGameStore(state => state.game)
  
  if (!game) return null
  
  const playerFaction = Array.from(game.factions.values()).find(f => f.isPlayer)
  if (!playerFaction) return null
  
  const playerArmies = Array.from(game.armies.values())
    .filter(army => army.ownerId === playerFaction.id)
  
  const commanders = playerArmies
    .filter(army => army.commander)
    .map(army => {
      const cmd = game.commanders.get(army.commander!)
      if (!cmd) return null
      const avgMorale = army.units.length > 0
        ? Math.round(army.units.reduce((s, u) => s + u.morale, 0) / army.units.length)
        : 100
      return { ...cmd, armyId: army.id, armyName: army.name, armyMorale: avgMorale }
    })
    .filter(Boolean) as (NonNullable<ReturnType<typeof game.commanders.get>> & { armyId: string; armyName: string; armyMorale: number })[]\

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Commanders</h2>
        <p className="text-sm text-muted-foreground">
          Your military leaders and their abilities
        </p>
      </div>
      
      {commanders.length === 0 ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center py-4">
              No commanders assigned to your armies yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {commanders.map(commander => {
            if (!commander) return null
            // Derive level from experience (1 level per 100 XP)
            const level = Math.floor(commander.xp / 100) + 1
            const xpInLevel = commander.xp % 100
            
            return (
              <Card key={commander.id} className="bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{commander.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Level {level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Age {commander.age} — Commanding: {commander.armyName}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats — Commander has stats.leadership/tactics/siege/logistics */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/30">
                      <Sword className="w-4 h-4 mx-auto text-red-400" />
                      <p className="text-xs text-muted-foreground mt-1">Tactics</p>
                      <p className="font-semibold">{commander.stats.tactics}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <Shield className="w-4 h-4 mx-auto text-blue-400" />
                      <p className="text-xs text-muted-foreground mt-1">Siege</p>
                      <p className="font-semibold">{commander.stats.siege}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <Users className="w-4 h-4 mx-auto text-green-400" />
                      <p className="text-xs text-muted-foreground mt-1">Leadership</p>
                      <p className="font-semibold">{commander.stats.leadership}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/30">
                      <Star className="w-4 h-4 mx-auto text-amber-400" />
                      <p className="text-xs text-muted-foreground mt-1">Logistics</p>
                      <p className="font-semibold">{commander.stats.logistics}</p>
                    </div>
                  </div>
                  
                  {/* Experience */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Experience</span>
                      <span>{xpInLevel} / 100 XP</span>
                    </div>
                    <Progress value={xpInLevel} className="h-1.5" />
                  </div>
                  
                  {/* Army Morale */}
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Army Morale</span>
                        <span>{Math.floor(commander.armyMorale)}%</span>
                      </div>
                      <Progress value={commander.armyMorale} className="h-1.5" />
                    </div>
                  </div>
                  
                  {/* Traits */}
                  {commander.traits && commander.traits.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Traits</p>
                      <div className="flex flex-wrap gap-1">
                        {commander.traits.map(trait => (
                          <Badge key={trait} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
