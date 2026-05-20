'use client'

import { useGameStore } from '@/lib/game/store'
import { GameMap } from './map/GameMap'
import { TopBar } from './ui/TopBar'
import { SidePanel } from './ui/SidePanel'
import { TerritoryPanel } from './panels/TerritoryPanel'
import { ArmyPanel } from './panels/ArmyPanel'
import { DiplomacyPanel } from './panels/DiplomacyPanel'
import { EconomyPanel } from './panels/EconomyPanel'
import { CommanderPanel } from './panels/CommanderPanel'
import { NegotiationChat } from './negotiation/NegotiationChat'
import { NewGameDialog } from './dialogs/NewGameDialog'
import { NotificationStack } from './ui/NotificationStack'
import { EventLog } from './ui/EventLog'

export function GameLayout() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  
  if (!game) {
    return <NewGameDialog />
  }
  
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950">
      {/* Top Bar */}
      <TopBar />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Panel */}
        <SidePanel side="left">
          {ui.activePanel === 'territory' && game.selectedTerritoryId && (
            <TerritoryPanel />
          )}
          {ui.activePanel === 'territory' && game.selectedArmyId && !game.selectedTerritoryId && (
            <ArmyPanel />
          )}
          {ui.activePanel === 'army' && <ArmyPanel />}
          {ui.activePanel === 'commanders' && <CommanderPanel />}}
        </SidePanel>
        
        {/* Map */}
        <div className="flex-1 relative">
          <GameMap />
          
          {/* Event Log Overlay */}
          <EventLog />
        </div>
        
        {/* Right Side Panel */}
        <SidePanel side="right">
          {ui.activePanel === 'diplomacy' && <DiplomacyPanel />}
          {ui.activePanel === 'economy' && <EconomyPanel />}
        </SidePanel>
      </div>
      
      {/* Dialogs */}
      {ui.showNewGameDialog && <NewGameDialog />}
      {ui.showNegotiationChat && game.activeNegotiation && <NegotiationChat />}
      
      {/* Notifications */}
      <NotificationStack />
    </div>
  )
}
