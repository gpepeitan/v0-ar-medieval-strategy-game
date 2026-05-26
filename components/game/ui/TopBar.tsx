'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/game/store'
import { Button } from '@/components/ui/button'
import { 
  Map, 
  Swords, 
  Handshake, 
  Coins, 
  Users,
  Save,
  FolderOpen,
  Wheat,
  Hammer,
  Trees,
} from 'lucide-react'
import { SpeedControls } from './SpeedControls'
import { SaveLoadDialog } from '../dialogs/SaveLoadDialog'

export function TopBar() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  const setActivePanel = useGameStore(state => state.setActivePanel)
  const getPlayerFaction = useGameStore(state => state.getPlayerFaction)
  const [saveDialog, setSaveDialog] = useState<'save' | 'load' | null>(null)
  
  if (!game) return null
  
  const playerFaction = getPlayerFaction()
  
  const navItems = [
    { id: 'territory' as const, icon: Map, label: 'Map' },
    { id: 'army' as const, icon: Swords, label: 'Armies' },
    { id: 'diplomacy' as const, icon: Handshake, label: 'Diplomacy' },
    { id: 'economy' as const, icon: Coins, label: 'Economy' },
    { id: 'commander' as const, icon: Users, label: 'Commanders' },
  ]
  
  const seasonColors: Record<string, string> = {
    spring: 'text-emerald-400',
    summer: 'text-amber-400',
    autumn: 'text-orange-400',
    winter: 'text-blue-400',
  }
  
  const season = game.time.season
  
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
      {/* Left: Game Info */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-slate-100">
            {playerFaction?.name || 'Medieval Strategy'}
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Year {game.time.year}</span>
            <span className={seasonColors[season] ?? 'text-slate-400'}>
              {season.charAt(0).toUpperCase() + season.slice(1)}
            </span>
            <span>Day {game.time.day}</span>
          </div>
        </div>
        
        {/* Resources */}
        {playerFaction && (
          <div className="flex items-center gap-4 border-l border-slate-700 pl-4">
            <ResourceDisplay icon="gold"  value={playerFaction.resources.gold}  label="Gold" />
            <ResourceDisplay icon="food"  value={playerFaction.resources.food}  label="Food" />
            <ResourceDisplay icon="iron"  value={playerFaction.resources.iron}  label="Iron" />
            <ResourceDisplay icon="wood"  value={playerFaction.resources.wood}  label="Wood" />
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
      
      {/* Right: Speed Controls + Save/Load */}
      <div className="flex items-center gap-2">
        <SpeedControls />
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSaveDialog('load')}
          title="Load Game"
          className="text-slate-400 hover:text-slate-100"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setSaveDialog('save')}
          title="Save Game"
          className="text-slate-400 hover:text-amber-400"
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
      
      {saveDialog && (
        <SaveLoadDialog mode={saveDialog} onClose={() => setSaveDialog(null)} />
      )}
    </header>
  )
}

function ResourceDisplay({ icon, value, label }: { 
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
  const IconComponents = {
    gold: Coins,
    food: Wheat,
    iron: Hammer,
    wood: Trees,
  }
  const Icon = IconComponents[icon]
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <Icon className={`h-3.5 w-3.5 ${iconColors[icon]}`} />
      <span className="text-sm font-medium text-slate-200">
        {Math.floor(value).toLocaleString()}
      </span>
    </div>
  )
}
