"use client"

import { useGameStore } from "@/lib/game/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  Coins, Wheat, Trees, Mountain, Anvil, Package,
  TrendingUp, TrendingDown, Building2, ArrowRight
} from "lucide-react"
import type { Resources } from "@/lib/game/types"

const ZERO_RESOURCES: Resources = { gold: 0, food: 0, wood: 0, stone: 0, iron: 0, tradeGoods: 0 }

export function EconomyPanel() {
  const game = useGameStore(state => state.game)

  if (!game) return null

  const playerFaction = Array.from(game.factions.values()).find(f => f.isPlayer)
  if (!playerFaction) return null

  const playerTerritories = Array.from(game.territories.values())
    .filter(t => t.ownerId === playerFaction.id)

  // Production per day from territories
  const totalProduction = playerTerritories.reduce<Resources>((acc, t) => ({
    gold:       acc.gold       + (t.resourceProduction?.gold       ?? 0),
    food:       acc.food       + (t.resourceProduction?.food       ?? 0),
    wood:       acc.wood       + (t.resourceProduction?.wood       ?? 0),
    stone:      acc.stone      + (t.resourceProduction?.stone      ?? 0),
    iron:       acc.iron       + (t.resourceProduction?.iron       ?? 0),
    tradeGoods: acc.tradeGoods + (t.resourceProduction?.tradeGoods ?? 0),
  }), { ...ZERO_RESOURCES })

  // Army upkeep (100 gold per army per day roughly)
  const playerArmies = Array.from(game.armies.values())
    .filter(a => a.ownerId === playerFaction.id)
  const armyUpkeep = playerArmies.reduce((sum, a) => {
    const totalUnits = a.units.reduce((u, stack) => u + stack.count, 0)
    return sum + Math.floor(totalUnits * 0.5)
  }, 0)

  const buildingUpkeep = playerTerritories.length * 5
  const netGold = totalProduction.gold - armyUpkeep - buildingUpkeep

  // Total population
  const totalPop = playerTerritories.reduce((sum, t) => {
    return sum + (t.population?.peasants ?? 0) + (t.population?.craftsmen ?? 0) + (t.population?.merchants ?? 0)
  }, 0)

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Economy</h2>

        {/* Resources */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Treasury</h3>
          <div className="grid grid-cols-2 gap-2">
            <ResourceDisplay icon={<Coins className="h-5 w-5 text-yellow-500" />}     label="Gold"        value={playerFaction.resources.gold}        income={netGold} />
            <ResourceDisplay icon={<Wheat className="h-5 w-5 text-amber-600" />}      label="Food"        value={playerFaction.resources.food}        income={totalProduction.food} />
            <ResourceDisplay icon={<Trees className="h-5 w-5 text-green-600" />}      label="Wood"        value={playerFaction.resources.wood}        income={totalProduction.wood} />
            <ResourceDisplay icon={<Mountain className="h-5 w-5 text-stone-500" />}   label="Stone"       value={playerFaction.resources.stone}       income={totalProduction.stone} />
            <ResourceDisplay icon={<Anvil className="h-5 w-5 text-slate-400" />}      label="Iron"        value={playerFaction.resources.iron}        income={totalProduction.iron} />
            <ResourceDisplay icon={<Package className="h-5 w-5 text-purple-500" />}   label="Trade Goods" value={playerFaction.resources.tradeGoods}   income={totalProduction.tradeGoods} />
          </div>
        </div>

        <Separator />

        {/* Population */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Population</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Population</span>
              <span className="font-medium text-foreground">{totalPop.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Territories</span>
              <span className="font-medium text-foreground">{playerTerritories.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Active Armies</span>
              <span className="font-medium text-foreground">{playerArmies.length}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Expenses */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-foreground">Expenses (per day)</h3>
          <div className="space-y-2">
            <ExpenseRow label="Army Upkeep"           value={armyUpkeep} />
            <ExpenseRow label="Building Maintenance"  value={buildingUpkeep} />
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center font-semibold">
            <span className="text-foreground">Net Gold/Day</span>
            <span className={netGold >= 0 ? 'text-green-500' : 'text-red-500'}>
              {netGold >= 0 ? '+' : ''}{Math.floor(netGold)}
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
        <span className={`text-xs flex items-center gap-0.5 ${income >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {income >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {income >= 0 ? '+' : ''}{Math.floor(income)}/day
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
