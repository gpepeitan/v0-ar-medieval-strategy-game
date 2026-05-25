'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/lib/game/store'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Save, FolderOpen, Trash2, Clock, Swords } from 'lucide-react'

interface SaveSlot {
  id: string
  name: string
  factionName: string
  year: number
  day: number
  territoriesOwned: number
  totalTerritories: number
  savedAt: number
}

function parseSaveSlots(): SaveSlot[] {
  if (typeof window === 'undefined') return []
  const slots: SaveSlot[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('medievalSave_')) {
      try {
        const raw = JSON.parse(localStorage.getItem(key)!)
        slots.push({
          id: key,
          name: raw.slotName || 'Campaign',
          factionName: raw.playerFactionName || 'Unknown',
          year: raw.time?.year || 1,
          day: raw.time?.day || 1,
          territoriesOwned: raw.territoriesOwned || 0,
          totalTerritories: raw.totalTerritories || 0,
          savedAt: raw.savedAt || 0,
        })
      } catch {
        // corrupted save, skip
      }
    }
  }
  return slots.sort((a, b) => b.savedAt - a.savedAt)
}

export function SaveLoadDialog({ 
  mode, 
  onClose 
}: { 
  mode: 'save' | 'load'
  onClose: () => void 
}) {
  const game = useGameStore(state => state.game)
  const saveGame = useGameStore(state => state.saveGame)
  const loadGame = useGameStore(state => state.loadGame)
  const addNotification = useGameStore(state => state.addNotification)
  const [slots, setSlots] = useState<SaveSlot[]>([])
  const [saveName, setSaveName] = useState('Campaign')

  useEffect(() => {
    setSlots(parseSaveSlots())
  }, [])

  const handleSave = () => {
    if (!game) return
    const playerFaction = Array.from(game.factions.values()).find(f => f.isPlayer)
    const playerTerritories = Array.from(game.territories.values()).filter(
      t => t.ownerId === playerFaction?.id
    )
    const slotKey = `medievalSave_${Date.now()}`
    const saveData = {
      ...game,
      factions: Object.fromEntries(game.factions),
      territories: Object.fromEntries(game.territories),
      armies: Object.fromEntries(game.armies),
      commanders: Object.fromEntries(game.commanders),
      activeBattles: Object.fromEntries(game.battles),
      slotName: saveName,
      playerFactionName: playerFaction?.name || 'Unknown',
      territoriesOwned: playerTerritories.length,
      totalTerritories: game.territories.size,
      savedAt: Date.now(),
    }
    localStorage.setItem(slotKey, JSON.stringify(saveData))
    saveGame()
    setSlots(parseSaveSlots())
    addNotification({ type: 'success', title: 'Game Saved', message: `"${saveName}" saved.`, duration: 3000, timestamp: Date.now() })
  }

  const handleLoad = (slotId: string) => {
    const raw = localStorage.getItem(slotId)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      loadGame(parsed)
      onClose()
    } catch {
      addNotification({ type: 'danger', title: 'Load Failed', message: 'Save file is corrupted.', duration: 4000, timestamp: Date.now() })
    }
  }

  const handleDelete = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.removeItem(slotId)
    setSlots(parseSaveSlots())
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100">
            {mode === 'save' 
              ? <><Save className="h-5 w-5 text-amber-400" /> Save Game</>
              : <><FolderOpen className="h-5 w-5 text-blue-400" /> Load Game</>
            }
          </DialogTitle>
        </DialogHeader>

        {mode === 'save' && game && (
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Save name..."
            />
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-500 text-white"
            >
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        )}

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {slots.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">No saved games found.</p>
          ) : (
            slots.map(slot => (
              <button
                key={slot.id}
                onClick={() => mode === 'load' && handleLoad(slot.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  mode === 'load'
                    ? 'border-slate-600 hover:border-amber-500 hover:bg-slate-800 cursor-pointer'
                    : 'border-slate-700 bg-slate-800/50 cursor-default'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-slate-100">{slot.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                      {slot.factionName}
                    </Badge>
                    <button
                      onClick={e => handleDelete(slot.id, e)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Year {slot.year}, Day {slot.day}
                  </span>
                  <span className="flex items-center gap-1">
                    <Swords className="h-3 w-3" />
                    {slot.territoriesOwned}/{slot.totalTerritories} territories
                  </span>
                  <span className="ml-auto">{formatDate(slot.savedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-full mt-2 text-slate-400 hover:text-slate-200"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  )
}
