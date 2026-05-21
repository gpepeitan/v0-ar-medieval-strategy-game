'use client'

import { useGameStore } from "@/lib/game/store"
import { TERRAIN_CONFIG, FACTION_CONFIG } from "@/lib/game/constants"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Castle, 
  Wheat, 
  Coins, 
  Trees, 
  Mountain,
  Sword,
  Users,
  ShieldAlert,
  X
} from "lucide-react"

export function TerritoryPanel({ territoryId }: { territoryId: string }) {
  const game = useGameStore(state => state.game)
  const selectTerritory = useGameStore(state => state.selectTerritory)
  const startSiege = useGameStore(state => state.startSiege)

  if (!game) return null

  const territory = game.territories.get(territoryId)
  if (!territory) return (
    <div className="p-4 text-muted-foreground text-center">
      <Castle className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>Select a territory on the map</p>
    </div>
  )

  const playerFactionId = Array.from(game.factions.values()).find(f => f.isPlayer)?.id ?? ""
  const owner = territory.ownerId ? game.factions.get(territory.ownerId) : null
  const factionConfig = owner ? FACTION_CONFIG[owner.id] : null
  const terrainConfig = TERRAIN_CONFIG[territory.terrain]
  const isPlayerOwned = territory.ownerId === playerFactionId

  const armies = Array.from(game.armies.values())
  const armiesInTerritory = armies.filter(a => a.position === territory.id)
  const playerArmies = armiesInTerritory.filter(a => a.ownerId === playerFactionId)

  const canAttack = !isPlayerOwned && territory.ownerId && playerArmies.length > 0 && !territory.siegeState
  const canClaim = !territory.ownerId && playerArmies.length > 0

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{territory.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-xs"
                style={{ borderColor: terrainConfig?.color, color: terrainConfig?.color }}
              >
                {territory.terrain}
              </Badge>
              {territory.isCapital && (
                <Badge variant="secondary" className="text-xs">Capital</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => selectTerritory(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {owner && factionConfig && (
          <div
            className="p-3 rounded-lg border"
            style={{ borderColor: factionConfig.color, backgroundColor: `${factionConfig.color}20` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: factionConfig.color }} />
              <span className="font-medium text-foreground">{owner.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{factionConfig.personality} faction</p>
          </div>
        )}

        {!owner && (
          <div className="p-3 rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-sm text-muted-foreground">Unclaimed Territory</p>
          </div>
        )}

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Resources</h3>
          <div className="grid grid-cols-2 gap-2">
            <ResourceItem icon={<Coins className="h-4 w-4 text-yellow-500" />} label="Gold" value={`+${territory.resourceProduction.gold}/turn`} />
            <ResourceItem icon={<Wheat className="h-4 w-4 text-amber-600" />} label="Food" value={`+${territory.resourceProduction.food}/turn`} />
            <ResourceItem icon={<Trees className="h-4 w-4 text-green-600" />} label="Wood" value={`+${territory.resourceProduction.wood}/turn`} />
            <ResourceItem icon={<Mountain className="h-4 w-4 text-stone-500" />} label="Stone" value={`+${territory.resourceProduction.stone}/turn`} />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Fortifications</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fort Level</span>
              <span className="font-medium text-foreground">{territory.fortificationLevel}/5</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(territory.fortificationLevel / 5) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Morale</span>
              <span className="font-medium text-foreground">{territory.morale}%</span>
            </div>
          </div>
        </div>

        {territory.siegeState && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                <span className="font-semibold">Under Siege!</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Phase: {territory.siegeState.phase} | Turn {territory.siegeState.turnsElapsed}
              </p>
              <p className="text-xs text-muted-foreground">
                Supplies: {territory.siegeState.defenderSupplies} remaining
              </p>
            </div>
          </>
        )}

        {armiesInTerritory.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold mb-2 text-foreground">
                Armies Present ({armiesInTerritory.length})
              </h3>
              <div className="space-y-2">
                {armiesInTerritory.map(army => {
                  const armyFaction = game.factions.get(army.ownerId)
                  const armyConfig = armyFaction ? FACTION_CONFIG[armyFaction.id] : null
                  const totalTroops = army.units.reduce((s, u) => s + u.count, 0)
                  return (
                    <div
                      key={army.id}
                      className="p-2 rounded border text-sm"
                      style={{
                        borderColor: armyConfig?.color || '#666',
                        backgroundColor: `${armyConfig?.color || '#666'}18`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{army.name}</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{totalTroops}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{armyFaction?.name || 'Unknown'}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-2">
          {isPlayerOwned && (
            <>
              <Button className="w-full" variant="outline" size="sm">
                <Castle className="h-4 w-4 mr-2" />
                Upgrade Fort (500g)
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Recruit Garrison
              </Button>
            </>
          )}
          {canAttack && (
            <Button
              className="w-full"
              variant="destructive"
              size="sm"
              onClick={() => startSiege(playerArmies[0].id, territory.id)}
            >
              <Sword className="h-4 w-4 mr-2" />
              Begin Siege
            </Button>
          )}
          {canClaim && (
            <Button className="w-full" variant="default" size="sm">
              <Castle className="h-4 w-4 mr-2" />
              Claim Territory
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}

function ResourceItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
