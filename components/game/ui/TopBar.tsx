'use client'

import { useGameStore } from '@/lib/game/store'
import { Button } from '@/components/ui/button'
import { 
  Map, 
  Swords, 
  Handshake, 
  Coins, 
  Users,
  Play,
  Pause,
  Save,
  SkipForward,
} from 'lucide-react'
import { SEASON_EFFECTS } from '@/lib/game/constants'

export function TopBar() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  const setActivePanel = useGameStore(state => state.setActivePanel)
  const endTurn = useGameStore(state => state.endTurn)
  const saveGame = useGameStore(state => state.saveGame)
  const getPlayerFaction = useGameStore(state => state.getPlayerFaction)
  
  if (!game) return null
  
  const playerFaction = getPlayerFaction()
  
  const navItems = [
    { id: 'map' as const, icon: Map, label: 'Map' },
    { id: 'army' as const, icon: Swords, label: 'Armies' },
    { id: 'diplomacy' as const, icon: Handshake, label: 'Diplomacy' },
    { id: 'economy' as const, icon: Coins, label: 'Economy' },
    { id: 'commanders' as const, icon: Users, label: 'Commanders' },
  ]
  
  const seasonColors = {
    spring: 'text-emerald-400',
    summer: 'text-amber-400',
    autumn: 'text-orange-400',
    winter: 'text-blue-400',
  }
  
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
      {/* Left: Game Info */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-slate-100">
            {playerFaction?.name || 'Medieval Strategy'}
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Year {game.year}</span>
            <span className={seasonColors[game.season]}>
              {game.season.charAt(0).toUpperCase() + game.season.slice(1)}
            </span>
            <span>Turn {game.turn}</span>
          </div>
        </div>
        
        {/* Resources */}
        {playerFaction && (
          <div className="flex items-center gap-4 border-l border-slate-700 pl-4">
            <ResourceDisplay 
              icon="gold" 
              value={playerFaction.resources.gold} 
              label="Gold"
            />
            <ResourceDisplay 
              icon="food" 
              value={playerFaction.resources.food} 
              label="Food"
            />
            <ResourceDisplay 
              icon="iron" 
              value={playerFaction.resources.iron} 
              label="Iron"
            />
            <ResourceDisplay 
              icon="wood" 
              value={playerFaction.resources.wood} 
              label="Wood"
            />
          </div>
        )}
      </div>
      
      {/* Center: Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map(item => (
          <Button
            key={item.id}
            variant={ui.activePanel === item.id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel(item.id)}
            className="gap-2"
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Button>
        ))}
      </nav>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={saveGame}
          title="Save Game"
        >
          <Save className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={endTurn}
          disabled={!game.isPlayerTurn}
          className="gap-2 bg-amber-600 hover:bg-amber-700"
        >
          <SkipForward className="h-4 w-4" />
          End Turn
        </Button>
      </div>
    </header>
  )
}

function ResourceDisplay({ 
  icon, 
  value, 
  label 
}: { 
  icon: 'gold' | 'food' | 'iron' | 'wood'
  value: number
  label: string 
}) {
  const iconColors = {
    gold: 'text-amber-400',
    food: 'text-emerald-400',
    iron: 'text-slate-300',
    wood: 'text-orange-400',
  }
  
  const iconSymbols = {
    gold: '🪙',
    food: '🌾',
    iron: '⚒️',
    wood: '🪵',
  }
  
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <span className={iconColors[icon]}>{iconSymbols[icon]}</span>
      <span className="text-sm font-medium text-slate-200">
        {value.toLocaleString()}
      </span>
    </div>
  )
}
