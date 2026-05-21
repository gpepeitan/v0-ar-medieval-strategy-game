'use client'

import { useState } from "react"
import { useGameStore } from "@/lib/game/store"
import { FACTION_DEFINITIONS } from "@/lib/game/constants"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Play, Crown, Sword } from "lucide-react"
import type { GameSettings } from "@/lib/game/types"

export function NewGameDialog() {
  const startNewGame = useGameStore(state => state.startNewGame)

  const [selectedFactionId, setSelectedFactionId] = useState(FACTION_DEFINITIONS[0].id)
  const [numOpponents, setNumOpponents] = useState(6)
  const [difficulty, setDifficulty] = useState<GameSettings['difficulty']>('normal')
  const [mapRegion, setMapRegion] = useState<GameSettings['mapRegion']>('europe')

  const selectedFaction = FACTION_DEFINITIONS.find(f => f.id === selectedFactionId)!

  const handleStartGame = () => {
    const settings: GameSettings = {
      mapRegion,
      difficulty,
      aiCount: numOpponents,
      startingResources: 'normal',
      fogOfWar: false,
      gameSpeed: 'normal',
    }
    startNewGame(settings, selectedFactionId)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
            <Crown className="h-8 w-8" />
            Medieval Strategy
          </h1>
          <p className="text-slate-400 mt-1">Choose your faction and forge your empire</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Faction Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-200">Choose Your Faction</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FACTION_DEFINITIONS.map(faction => (
                  <button
                    key={faction.id}
                    onClick={() => setSelectedFactionId(faction.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedFactionId === faction.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-600 hover:border-slate-400 bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{faction.flag}</span>
                      <span className="font-medium text-sm text-slate-200 leading-tight">{faction.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 capitalize">{faction.personality}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Faction Details */}
            <div
              className="p-4 rounded-lg border-2"
              style={{
                borderColor: selectedFaction.color,
                backgroundColor: `${selectedFaction.color}15`
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{selectedFaction.flag}</span>
                <h3 className="font-semibold text-lg text-slate-100">{selectedFaction.name}</h3>
              </div>
              <p className="text-sm text-slate-300 mb-3">{selectedFaction.description}</p>
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: `${selectedFaction.color}30`, color: selectedFaction.color }}
              >
                <Sword className="h-3 w-3 mr-1" />
                {selectedFaction.startingBonus}
              </Badge>
            </div>

            {/* Opponents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-slate-200">Number of Opponents</Label>
                <span className="text-lg font-bold text-amber-400">{numOpponents}</span>
              </div>
              <Slider
                value={[numOpponents]}
                onValueChange={([v]) => setNumOpponents(v)}
                min={3}
                max={11}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-slate-400">
                {numOpponents <= 4 ? 'Fewer rivals, more room to expand'
                  : numOpponents <= 7 ? 'Balanced competition'
                  : 'Crowded map, constant conflict'}
              </p>
            </div>

            {/* Difficulty */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-200">Difficulty</Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as GameSettings['difficulty'])}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {([
                  { value: 'easy', label: 'Easy', desc: 'Passive AI' },
                  { value: 'normal', label: 'Normal', desc: 'Balanced' },
                  { value: 'hard', label: 'Hard', desc: 'Aggressive' },
                  { value: 'brutal', label: 'Brutal', desc: 'No mercy' },
                ] as const).map(d => (
                  <Label
                    key={d.value}
                    htmlFor={d.value}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      difficulty === d.value
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-600 hover:border-slate-400 bg-slate-800'
                    }`}
                  >
                    <RadioGroupItem value={d.value} id={d.value} className="sr-only" />
                    <span className="font-medium text-slate-200">{d.label}</span>
                    <span className="text-xs text-slate-400">{d.desc}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Map Region */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-slate-200">Map Region</Label>
              <Select value={mapRegion} onValueChange={(v) => setMapRegion(v as GameSettings['mapRegion'])}>
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="europe">Europe (Classic Medieval)</SelectItem>
                  <SelectItem value="mediterranean">Mediterranean (Rome's Legacy)</SelectItem>
                  <SelectItem value="middle_east">Middle East (Silk Road)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          <Button onClick={handleStartGame} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 text-lg gap-2">
            <Play className="h-5 w-5" />
            Start Campaign
          </Button>
        </div>
      </div>
    </div>
  )
}
