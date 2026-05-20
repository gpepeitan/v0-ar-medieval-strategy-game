"use client"

import { useGameStore } from "@/lib/game/store"
import { FACTION_CONFIG } from "@/lib/game/constants"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Flag,
  Swords,
  Handshake,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Skull,
  ShieldAlert
} from "lucide-react"
import type { Faction, DiplomaticRelation } from "@/lib/game/types"

export function DiplomacyPanel() {
  const { 
    factions, 
    playerFactionId,
    diplomaticRelations,
    setSelectedFaction,
    setNegotiationOpen
  } = useGameStore()

  const playerFaction = factions.find(f => f.id === playerFactionId)
  const otherFactions = factions.filter(f => f.id !== playerFactionId && f.isAlive)

  const getRelation = (factionId: string): DiplomaticRelation | undefined => {
    return diplomaticRelations.find(
      r => (r.faction1Id === playerFactionId && r.faction2Id === factionId) ||
           (r.faction2Id === playerFactionId && r.faction1Id === factionId)
    )
  }

  const getRelationColor = (value: number): string => {
    if (value >= 50) return 'text-green-500'
    if (value >= 20) return 'text-green-400'
    if (value >= -20) return 'text-yellow-500'
    if (value >= -50) return 'text-orange-500'
    return 'text-red-500'
  }

  const getRelationLabel = (value: number): string => {
    if (value >= 75) return 'Allied'
    if (value >= 50) return 'Friendly'
    if (value >= 20) return 'Warm'
    if (value >= -20) return 'Neutral'
    if (value >= -50) return 'Cold'
    if (value >= -75) return 'Hostile'
    return 'Blood Feud'
  }

  const getRelationIcon = (value: number) => {
    if (value >= 50) return <Heart className="h-4 w-4 text-green-500" />
    if (value >= -20) return <Minus className="h-4 w-4 text-yellow-500" />
    if (value >= -50) return <ShieldAlert className="h-4 w-4 text-orange-500" />
    return <Skull className="h-4 w-4 text-red-500" />
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Diplomacy</h2>
        
        <p className="text-sm text-muted-foreground">
          {otherFactions.length} factions in play
        </p>

        <div className="space-y-3">
          {otherFactions.map(faction => {
            const config = FACTION_CONFIG[faction.templateId]
            const relation = getRelation(faction.id)
            const relationValue = relation?.value || 0
            const isAtWar = relation?.treaties.some(t => t.type === 'war' && t.active)
            const hasAlliance = relation?.treaties.some(t => t.type === 'alliance' && t.active)
            const hasTrade = relation?.treaties.some(t => t.type === 'trade' && t.active)

            return (
              <div 
                key={faction.id}
                className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config?.color || '#666' }}
                    />
                    <div>
                      <span className="font-semibold text-foreground">{faction.name}</span>
                      <p className="text-xs text-muted-foreground">{config?.personality}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getRelationIcon(relationValue)}
                    <span className={`text-sm font-medium ${getRelationColor(relationValue)}`}>
                      {relationValue > 0 ? '+' : ''}{relationValue}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRelationColor(relationValue)}`}
                  >
                    {getRelationLabel(relationValue)}
                  </Badge>
                  {isAtWar && (
                    <Badge variant="destructive" className="text-xs">
                      <Swords className="h-3 w-3 mr-1" />
                      At War
                    </Badge>
                  )}
                  {hasAlliance && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      <Handshake className="h-3 w-3 mr-1" />
                      Allied
                    </Badge>
                  )}
                  {hasTrade && (
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trade
                    </Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  <span>Territories: {faction.territories.length}</span>
                  <span className="mx-2">|</span>
                  <span>Strength: {faction.militaryStrength}</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedFaction(faction.id)
                      setNegotiationOpen(true)
                    }}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Negotiate
                  </Button>
                  {!isAtWar ? (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="flex-1"
                    >
                      <Swords className="h-3 w-3 mr-1" />
                      Declare War
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="flex-1"
                    >
                      <Handshake className="h-3 w-3 mr-1" />
                      Offer Peace
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {otherFactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Flag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No other factions remain</p>
            <p className="text-sm">You have achieved total domination!</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
