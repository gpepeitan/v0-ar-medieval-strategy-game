'use client'

import { useGameStore } from '@/lib/game/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sword, Shield, Heart, Star, Users } from 'lucide-react'

export function CommanderPanel() {
  const game = useGameStore(state => state.game)
  
  if (!game) return null
  
  const playerFaction = game.factions.get(game.playerFactionId)
  if (!playerFaction) return null
  
  // Get commanders from player's armies
  const playerArmies = Array.from(game.armies.values())
    .filter(army => army.ownerId === game.playerFactionId)
  
  const commanders = playerArmies
    .filter(army => army.commanderId)
    .map(army => ({
      ...game.commanders.get(army.commanderId!)!,
      armyId: army.id,
      armyName: army.name,
    }))
    .filter(c => c)
  
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
          {commanders.map(commander => (
            <Card key={commander.id} className="bg-card/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{commander.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Level {commander.level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Commanding: {commander.armyName}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-muted/30">
                    <Sword className="w-4 h-4 mx-auto text-red-400" />
                    <p className="text-xs text-muted-foreground mt-1">Attack</p>
                    <p className="font-semibold">{commander.attack}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <Shield className="w-4 h-4 mx-auto text-blue-400" />
                    <p className="text-xs text-muted-foreground mt-1">Defense</p>
                    <p className="font-semibold">{commander.defense}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/30">
                    <Users className="w-4 h-4 mx-auto text-green-400" />
                    <p className="text-xs text-muted-foreground mt-1">Leadership</p>
                    <p className="font-semibold">{commander.leadership}</p>
                  </div>
                </div>
                
                {/* Experience */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Experience</span>
                    <span>{commander.experience} / {commander.level * 100}</span>
                  </div>
                  <Progress 
                    value={(commander.experience / (commander.level * 100)) * 100} 
                    className="h-1.5"
                  />
                </div>
                
                {/* Morale */}
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Morale</span>
                      <span>{commander.morale}%</span>
                    </div>
                    <Progress 
                      value={commander.morale} 
                      className="h-1.5"
                    />
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
          ))}
        </div>
      )}
    </div>
  )
}
