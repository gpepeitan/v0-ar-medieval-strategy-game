"use client"

import { useGameStore } from "@/lib/game/store"
import { FACTION_CONFIG } from "@/lib/game/constants"
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

// Terrain display config
const TERRAIN_DISPLAY: Record<string, { color: string; label: string }> = {
  plains: { color: '#90b855', label: 'Plains' },
  hills: { color: '#a1887f', label: 'Hills' },
  mountains: { color: '#78909c', label: 'Mountains' },
  forest: { color: '#4a7c4e', label: 'Forest' },
  marsh: { color: '#6d8b74', label: 'Marsh' },
  coastal: { color: '#64b5f6', label: 'Coastal' },
  river: { color: '#42a5f5', label: 'River' },
  desert: { color: '#e6c47f', label: 'Desert' },
}

export function TerritoryPanel() {
  const game = useGameStore(state => state.game)
  const selectTerritory = useGameStore(state => state.selectTerritory)
  const startSiege = useGameStore(state => state.startSiege)

  if (!game) {
    return (
      <div className="p-4 text-muted-foreground text-center">
        <Castle className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No game loaded</p>
      </div>
    )
  }

  const selectedTerritoryId = game.selectedTerritoryId
  if (!selectedTerritoryId) {
    return (
      <div className="p-4 text-muted-foreground text-center">
        <Castle className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Select a territory on the map</p>
      </div>
    )
  }

  const territory = game.territories.get(selectedTerritoryId)
  if (!territory) return null

  const owner = territory.ownerId ? game.factions.get(territory.ownerId) : null
  const factionConfig = owner ? FACTION_CONFIG[owner.id] : null
  const terrainDisplay = TERRAIN_DISPLAY[territory.terrain] || { color: '#666', label: territory.terrain }
  const playerFaction = Array.from(game.factions.values()).find(f => f.isPlayer) ?? null
  const playerFactionId = playerFaction?.id ?? null
  
  const isPlayerOwned = territory.ownerId === playerFactionId
  
  // Find armies in this territory
  const armiesInTerritory = Array.from(game.armies.values()).filter(a => 
    a.currentTerritoryId === territory.id
  )
  const playerArmies = armiesInTerritory.filter(a => a.ownerId === playerFactionId)
  const enemyArmies = armiesInTerritory.filter(a => 
    a.ownerId !== playerFactionId && a.ownerId !== territory.ownerId
  )

  const canAttack = !isPlayerOwned && 
    territory.ownerId && 
    playerArmies.length > 0 && 
    !territory.siegeState

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{territory.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline" 
                className="text-xs capitalize"
                style={{ 
                  borderColor: terrainDisplay.color,
                  color: terrainDisplay.color 
                }}
              >
                {terrainDisplay.label}
              </Badge>
              {territory.isCapital && (
                <Badge variant="secondary" className="text-xs">Capital</Badge>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => selectTerritory(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {owner && (
          <div 
            className="p-3 rounded-lg border"
            style={{ 
              borderColor: owner.color,
              backgroundColor: `${owner.color}10`
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: owner.color }}
              />
              <span className="font-medium text-foreground">{owner.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {owner.personality} faction
            </p>
          </div>
        )}

        {!owner && (
          <div className="p-3 rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-sm text-muted-foreground">Unclaimed Territory</p>
          </div>
        )}

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Production</h3>
          <div className="grid grid-cols-2 gap-2">
            <ResourceItem icon={<Coins className="h-4 w-4 text-yellow-500" />} label="Gold"  value={`+${territory.resourceProduction?.gold  ?? 0}/day`} />
            <ResourceItem icon={<Wheat className="h-4 w-4 text-amber-600" />}  label="Food"  value={`+${territory.resourceProduction?.food  ?? 0}/day`} />
            <ResourceItem icon={<Trees className="h-4 w-4 text-green-600" />}  label="Wood"  value={`+${territory.resourceProduction?.wood  ?? 0}/day`} />
            <ResourceItem icon={<Mountain className="h-4 w-4 text-stone-500" />} label="Stone" value={`+${territory.resourceProduction?.stone ?? 0}/day`} />
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
              <span className="text-sm text-muted-foreground">Population</span>
              <span className="font-medium text-foreground">{territory.population?.toLocaleString() || 0}</span>
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
                Phase: {territory.siegeState.phase} | Day {territory.siegeState.daysElapsed}
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
                  const totalTroops = army.units.reduce((sum, u) => sum + u.count, 0)
                  return (
                    <div 
                      key={army.id}
                      className="p-2 rounded border text-sm"
                      style={{
                        borderColor: armyFaction?.color || '#666',
                        backgroundColor: `${armyFaction?.color || '#666'}10`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{army.name}</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{totalTroops}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {armyFaction?.name || 'Unknown'}
                      </p>
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
              onClick={() => {
                if (playerArmies[0]) {
                  startSiege(playerArmies[0].id, territory.id)
                }
              }}
            >
              <Sword className="h-4 w-4 mr-2" />
              Begin Siege
            </Button>
          )}

          {!isPlayerOwned && !territory.ownerId && playerArmies.length > 0 && (
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

function ResourceItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode
  label: string
  value: string 
}) {
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
