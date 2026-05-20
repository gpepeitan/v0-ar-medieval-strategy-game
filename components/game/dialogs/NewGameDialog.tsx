"use client"

import { useState } from "react"
import { useGameStore } from "@/lib/game/store"
import { FACTION_CONFIG, FACTION_DEFINITIONS } from "@/lib/game/constants"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Play,
  Crown,
  Sword,
} from "lucide-react"

export interface GameSettings {
  playerFaction: string
  numOpponents: number
  difficulty: 'easy' | 'normal' | 'hard' | 'brutal'
  mapSize: 'small' | 'medium' | 'large'
}

export function NewGameDialog() {
  const [open, setOpen] = useState(false)
  const startNewGame = useGameStore(state => state.startNewGame)
  
  const [settings, setSettings] = useState<GameSettings>({
    playerFaction: 'frankish',
    numOpponents: 6,
    difficulty: 'normal',
    mapSize: 'medium'
  })

  const selectedFactionConfig = FACTION_CONFIG[settings.playerFaction]

  const handleStartGame = () => {
    startNewGame({
      mapRegion: 'europe',
      difficulty: settings.difficulty,
      aiCount: settings.numOpponents,
      startingResources: 'normal',
      fogOfWar: false,
      battleTimer: 45,
    }, settings.playerFaction)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="text-lg px-8 py-6">
          <Play className="mr-2 h-5 w-5" />
          Start New Campaign
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Crown className="h-6 w-6" />
            New Campaign
          </DialogTitle>
          <DialogDescription>
            Choose your faction and configure your game settings
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Faction Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Choose Your Faction</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FACTION_DEFINITIONS.map((faction) => (
                  <button
                    key={faction.id}
                    onClick={() => setSettings(s => ({ ...s, playerFaction: faction.id }))}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      settings.playerFaction === faction.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: faction.color }}
                      />
                      <span className="font-medium text-sm text-foreground">{faction.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{faction.personality}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Faction Details */}
            {selectedFactionConfig && (
              <div 
                className="p-4 rounded-lg border-2"
                style={{ 
                  borderColor: selectedFactionConfig.color,
                  backgroundColor: `${selectedFactionConfig.color}10`
                }}
              >
                <h3 className="font-semibold text-lg mb-2 text-foreground">{selectedFactionConfig.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{selectedFactionConfig.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Sword className="h-3 w-3 mr-1" />
                      {selectedFactionConfig.strengths[0]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-orange-500 border-orange-500">
                      Weakness: {selectedFactionConfig.weaknesses[0]}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Number of Opponents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Number of Opponents</Label>
                <span className="text-lg font-bold text-primary">{settings.numOpponents}</span>
              </div>
              <Slider
                value={[settings.numOpponents]}
                onValueChange={([value]) => setSettings(s => ({ ...s, numOpponents: value }))}
                min={3}
                max={11}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {settings.numOpponents <= 4 ? 'Fewer rivals, more room to expand' : 
                 settings.numOpponents <= 7 ? 'Balanced competition' : 
                 'Crowded map, constant conflict'}
              </p>
            </div>

            {/* Difficulty */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Difficulty</Label>
              <RadioGroup
                value={settings.difficulty}
                onValueChange={(value) => setSettings(s => ({ ...s, difficulty: value as GameSettings['difficulty'] }))}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {[
                  { value: 'easy', label: 'Easy', desc: 'AI is passive' },
                  { value: 'normal', label: 'Normal', desc: 'Balanced AI' },
                  { value: 'hard', label: 'Hard', desc: 'Aggressive AI' },
                  { value: 'brutal', label: 'Brutal', desc: 'No mercy' }
                ].map(diff => (
                  <Label
                    key={diff.value}
                    htmlFor={diff.value}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      settings.difficulty === diff.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={diff.value} id={diff.value} className="sr-only" />
                    <span className="font-medium text-foreground">{diff.label}</span>
                    <span className="text-xs text-muted-foreground">{diff.desc}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Map Size */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Map Size</Label>
              <Select 
                value={settings.mapSize} 
                onValueChange={(value) => setSettings(s => ({ ...s, mapSize: value as GameSettings['mapSize'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (30 territories)</SelectItem>
                  <SelectItem value="medium">Medium (45 territories)</SelectItem>
                  <SelectItem value="large">Large (60 territories)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartGame} className="gap-2">
            <Play className="h-4 w-4" />
            Start Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
