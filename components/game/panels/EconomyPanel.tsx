'use client'

import { useGameStore } from "@/lib/game/store"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Coins, 
  Wheat, 
  Trees, 
  Mountain,
  Anvil,
  Package,
  Building2
} from "lucide-react"
import type { Population } from "@/lib/game/types"

function totalPop(pop: Population) {
  return pop.peasants + pop.craftsmen + pop.merchants + pop.soldiers + pop.nobles
}

export function EconomyPanel() {
  const game = useGameStore(state => state.game)

  if (!game) return null

  const playerFactionId = Array.from(game.factions.values()).find(f => f.isPlayer)?.id ?? ""
  const playerFaction = game.factions.get(playerFactionId)
  if (!playerFaction) return null

  const territories = Array.from(game.territories.values())
  const playerTerritories = territories.filter(t => t.ownerId === playerFactionId)

  const totalIncome = playerTerritories.reduce((acc, t) => ({
    gold: acc.gold + t.resourceProduction.gold,
    food: acc.food + t.resourceProduction.food,
    wood: acc.wood + t.resourceProduction.wood,
    stone: acc.stone + t.resourceProduction.stone,
    iron: acc.iron + t.resourceProduction.iron,
    tradeGoods: acc.tradeGoods + t.resourceProduction.tradeGoods,
  }), { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 })

  const armyUpkeep = playerFaction.armies.length * 10
  const buildingUpkeep = playerTerritories.length * 5
  const netGold = totalIncome.gold - armyUpkeep - buildingUpkeep

  const totalPopulation = playerTerritories.reduce((acc, t) => acc + totalPop(t.population), 0)

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
              income={netGold}
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
              <span className="font-medium text-foreground">{totalPopulation.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Territories</span>
              <span className="font-medium text-foreground">{playerTerritories.length}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Expenses</h3>
          <div className="space-y-2">
            <ExpenseRow label="Army Upkeep" value={armyUpkeep} />
            <ExpenseRow label="Building Maintenance" value={buildingUpkeep} />
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center font-semibold">
            <span className="text-foreground">Net Income</span>
            <span className={netGold >= 0 ? 'text-green-500' : 'text-red-500'}>
              {netGold >= 0 ? '+' : ''}{netGold} gold/turn
            </span>
          </div>
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

function ResourceDisplay({ icon, label, value, income }: {
  icon: React.ReactNode; label: string; value: number; income: number
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold text-foreground">{Math.floor(value).toLocaleString()}</span>
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
