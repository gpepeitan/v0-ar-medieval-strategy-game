"use client"

import { useGameStore } from "@/lib/game/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Coins, 
  Wheat, 
  Trees, 
  Mountain,
  Anvil,
  Package,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowRight
} from "lucide-react"

export function EconomyPanel() {
  const { 
    factions, 
    playerFactionId,
    territories,
    tradeRoutes
  } = useGameStore()

  const playerFaction = factions.find(f => f.id === playerFactionId)
  if (!playerFaction) return null

  const playerTerritories = territories.filter(t => t.ownerId === playerFactionId)
  
  // Calculate total income
  const totalIncome = playerTerritories.reduce((acc, t) => ({
    gold: acc.gold + t.resources.gold,
    food: acc.food + t.resources.food,
    wood: acc.wood + t.resources.wood,
    stone: acc.stone + t.resources.stone,
    iron: acc.iron + t.resources.iron,
    tradeGoods: acc.tradeGoods + t.resources.tradeGoods
  }), { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 })

  // Estimate expenses (simplified)
  const armyUpkeep = Math.floor(playerFaction.resources.gold * 0.1)
  const buildingUpkeep = playerTerritories.length * 5

  const playerTradeRoutes = tradeRoutes.filter(
    r => r.faction1Id === playerFactionId || r.faction2Id === playerFactionId
  )

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Economy</h2>

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Treasury</h3>
          <div className="grid grid-cols-2 gap-2">
            <ResourceDisplay 
              icon={<Coins className="h-5 w-5 text-yellow-500" />}
              label="Gold"
              value={playerFaction.resources.gold}
              income={totalIncome.gold - armyUpkeep - buildingUpkeep}
            />
            <ResourceDisplay 
              icon={<Wheat className="h-5 w-5 text-amber-600" />}
              label="Food"
              value={playerFaction.resources.food}
              income={totalIncome.food}
            />
            <ResourceDisplay 
              icon={<Trees className="h-5 w-5 text-green-600" />}
              label="Wood"
              value={playerFaction.resources.wood}
              income={totalIncome.wood}
            />
            <ResourceDisplay 
              icon={<Mountain className="h-5 w-5 text-stone-500" />}
              label="Stone"
              value={playerFaction.resources.stone}
              income={totalIncome.stone}
            />
            <ResourceDisplay 
              icon={<Anvil className="h-5 w-5 text-slate-400" />}
              label="Iron"
              value={playerFaction.resources.iron}
              income={totalIncome.iron}
            />
            <ResourceDisplay 
              icon={<Package className="h-5 w-5 text-purple-500" />}
              label="Trade Goods"
              value={playerFaction.resources.tradeGoods}
              income={totalIncome.tradeGoods}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Population</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Population</span>
              <span className="font-medium text-foreground">
                {playerTerritories.reduce((acc, t) => acc + t.population, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available Labor</span>
              <span className="font-medium text-foreground">
                {Math.floor(playerTerritories.reduce((acc, t) => acc + t.population * 0.3, 0)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Expenses</h3>
          <div className="space-y-2">
            <ExpenseRow label="Army Upkeep" value={armyUpkeep} />
            <ExpenseRow label="Building Maintenance" value={buildingUpkeep} />
            <ExpenseRow label="Garrison Wages" value={playerTerritories.reduce((acc, t) => acc + t.garrison, 0)} />
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center font-semibold">
            <span className="text-foreground">Net Income</span>
            <span className={totalIncome.gold - armyUpkeep - buildingUpkeep >= 0 ? 'text-green-500' : 'text-red-500'}>
              {totalIncome.gold - armyUpkeep - buildingUpkeep >= 0 ? '+' : ''}
              {totalIncome.gold - armyUpkeep - buildingUpkeep} gold/turn
            </span>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">
            Trade Routes ({playerTradeRoutes.length})
          </h3>
          {playerTradeRoutes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active trade routes</p>
          ) : (
            <div className="space-y-2">
              {playerTradeRoutes.map(route => {
                const from = territories.find(t => t.id === route.territory1Id)
                const to = territories.find(t => t.id === route.territory2Id)
                return (
                  <div 
                    key={route.id}
                    className="p-2 rounded border border-border text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{from?.name}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground">{to?.name}</span>
                    </div>
                    <p className="text-xs text-green-500">
                      +{route.goldPerTurn} gold/turn
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <Button className="w-full" variant="outline" size="sm">
            <Building2 className="h-4 w-4 mr-2" />
            Build Market (+trade)
          </Button>
          <Button className="w-full" variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Establish Trade Route
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

function ResourceDisplay({ 
  icon, 
  label, 
  value, 
  income 
}: { 
  icon: React.ReactNode
  label: string
  value: number
  income: number 
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold text-foreground">{value.toLocaleString()}</span>
        <span className={`text-xs ${income >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {income >= 0 ? '+' : ''}{income}/turn
        </span>
      </div>
    </div>
  )
}

function ExpenseRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-red-400">-{value} gold</span>
    </div>
  )
}
