'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/lib/game/store'
import { Button } from '@/components/ui/button'
import { Scroll, Zap, Skull, Coins, Wheat, Users, Sun, CloudRain } from 'lucide-react'

interface RandomEvent {
  id: string
  title: string
  description: string
  icon: 'scroll' | 'zap' | 'skull' | 'coins' | 'food' | 'people' | 'sun' | 'rain'
  choices: {
    label: string
    description: string
    effect: string
    resourceDelta?: Partial<{ gold: number; food: number; iron: number; wood: number }>
    moraleEffect?: number
  }[]
}

const RANDOM_EVENTS: RandomEvent[] = [
  {
    id: 'plague',
    title: 'Plague Spreads',
    description: 'A mysterious illness has swept through your lands, weakening your workforce and threatening your armies.',
    icon: 'skull',
    choices: [
      {
        label: 'Quarantine territories',
        description: 'Seal off affected regions. Costs gold but slows the spread.',
        effect: '-200 gold, -10 morale, plague contained',
        resourceDelta: { gold: -200 },
        moraleEffect: -10,
      },
      {
        label: 'Continue as normal',
        description: 'Hope it passes on its own. Risk further spread.',
        effect: '-100 food, -5 iron over time',
        resourceDelta: { food: -100, iron: -50 },
        moraleEffect: -5,
      },
      {
        label: 'Pray for divine intervention',
        description: 'Rally your people through faith. Boosts morale but no direct cure.',
        effect: '+15 morale, -50 gold for offerings',
        resourceDelta: { gold: -50 },
        moraleEffect: 15,
      },
    ],
  },
  {
    id: 'harvest',
    title: 'Bountiful Harvest',
    description: 'This season\'s crops have exceeded all expectations. Your granaries overflow with plenty.',
    icon: 'food',
    choices: [
      {
        label: 'Stockpile for winter',
        description: 'Store reserves to weather future hardships.',
        effect: '+400 food',
        resourceDelta: { food: 400 },
        moraleEffect: 5,
      },
      {
        label: 'Hold a grand feast',
        description: 'Celebrate with your people. Massive morale boost.',
        effect: '+200 food, +25 morale, +20 gold from merchants',
        resourceDelta: { food: 200, gold: 20 },
        moraleEffect: 25,
      },
      {
        label: 'Sell the surplus',
        description: 'Trade excess grain for gold.',
        effect: '+300 gold, +100 food',
        resourceDelta: { gold: 300, food: 100 },
        moraleEffect: 0,
      },
    ],
  },
  {
    id: 'mercenaries',
    title: 'Mercenary Band Arrives',
    description: 'A battle-hardened company of mercenaries offers their services. They are expensive but formidable.',
    icon: 'people',
    choices: [
      {
        label: 'Hire them',
        description: 'Pay handsomely for elite soldiers.',
        effect: '-300 gold, +experienced troops',
        resourceDelta: { gold: -300 },
        moraleEffect: 10,
      },
      {
        label: 'Decline politely',
        description: 'Thank them and send them on their way.',
        effect: 'No change',
        resourceDelta: {},
        moraleEffect: 0,
      },
      {
        label: 'Offer them land instead',
        description: 'Grant them territory in exchange for loyalty.',
        effect: '+loyal troops, -1 territory in your name',
        resourceDelta: { gold: 0 },
        moraleEffect: 5,
      },
    ],
  },
  {
    id: 'drought',
    title: 'Severe Drought',
    description: 'Weeks without rain have dried up rivers and scorched fields. Food production is in crisis.',
    icon: 'sun',
    choices: [
      {
        label: 'Ration food stores',
        description: 'Impose strict rationing to extend supplies.',
        effect: '-15 morale, food reserves last longer',
        resourceDelta: { food: -50 },
        moraleEffect: -15,
      },
      {
        label: 'Buy food from merchants',
        description: 'Spend gold to keep your people fed.',
        effect: '-400 gold, food stable, morale maintained',
        resourceDelta: { gold: -400 },
        moraleEffect: 0,
      },
      {
        label: 'Raid a neighbor for supplies',
        description: 'Desperate times call for desperate measures.',
        effect: '+200 food, -30 diplomatic standing',
        resourceDelta: { food: 200 },
        moraleEffect: -5,
      },
    ],
  },
  {
    id: 'mine_discovery',
    title: 'Rich Vein Discovered',
    description: 'Miners have struck an exceptionally rich seam of iron ore deep in your mountains.',
    icon: 'zap',
    choices: [
      {
        label: 'Expand the mine',
        description: 'Invest heavily for maximum output.',
        effect: '-200 gold, +5 iron/day permanently',
        resourceDelta: { gold: -200, iron: 150 },
        moraleEffect: 5,
      },
      {
        label: 'Exploit it cautiously',
        description: 'Extract at a sustainable rate.',
        effect: '+100 iron immediately, +2 iron/day',
        resourceDelta: { iron: 200 },
        moraleEffect: 3,
      },
    ],
  },
  {
    id: 'rebellion',
    title: 'Peasant Unrest',
    description: 'Heavy taxation and war have pushed your peasants to the brink. Riots have broken out in three provinces.',
    icon: 'skull',
    choices: [
      {
        label: 'Reduce taxes temporarily',
        description: 'Show compassion. Short-term cost, long-term loyalty.',
        effect: '-150 gold/season, +20 morale',
        resourceDelta: { gold: -150 },
        moraleEffect: 20,
      },
      {
        label: 'Crush the rebellion',
        description: 'Send troops to restore order by force.',
        effect: '-50 morale, rebellion suppressed, -100 food',
        resourceDelta: { food: -100 },
        moraleEffect: -20,
      },
      {
        label: 'Offer amnesty and reform',
        description: 'Promise reforms. Requires keeping your word.',
        effect: '+15 morale, +goodwill from nobles',
        resourceDelta: {},
        moraleEffect: 15,
      },
    ],
  },
  {
    id: 'trade_caravan',
    title: 'Wealthy Merchant Convoy',
    description: 'A rich merchant convoy requests safe passage through your lands, offering generous payment.',
    icon: 'coins',
    choices: [
      {
        label: 'Grant safe passage',
        description: 'Let them pass in exchange for the offered fee.',
        effect: '+250 gold, improved trade relations',
        resourceDelta: { gold: 250 },
        moraleEffect: 5,
      },
      {
        label: 'Tax them heavily',
        description: 'Demand a larger cut. Profitable but may discourage future trade.',
        effect: '+500 gold, -trade reputation',
        resourceDelta: { gold: 500 },
        moraleEffect: -5,
      },
      {
        label: 'Rob them',
        description: 'A bold move that will attract enemies.',
        effect: '+800 gold, -40 diplomatic standing',
        resourceDelta: { gold: 800 },
        moraleEffect: -10,
      },
    ],
  },
]

export function RandomEventDialog() {
  const game = useGameStore(state => state.game)
  const addNotification = useGameStore(state => state.addNotification)
  const syncGameState = useGameStore(state => state.syncGameState)
  const [currentEvent, setCurrentEvent] = useState<RandomEvent | null>(null)
  const [lastEventDay, setLastEventDay] = useState(0)

  // Trigger random events every ~90 days
  useEffect(() => {
    if (!game?.isRunning) return
    const day = game.time.totalDays
    if (day > 0 && day - lastEventDay >= 90 && !currentEvent) {
      const chance = Math.random()
      if (chance < 0.6) { // 60% chance each 90 day window
        const idx = Math.floor(Math.random() * RANDOM_EVENTS.length)
        setCurrentEvent(RANDOM_EVENTS[idx])
        setLastEventDay(day)
        // Pause the game while event is showing
      }
    }
  }, [game?.time?.totalDays, game?.isRunning, lastEventDay, currentEvent])

  if (!currentEvent || !game) return null

  const handleChoice = (choice: typeof currentEvent.choices[number]) => {
    const playerFaction = Array.from(game.factions.values()).find(f => f.isPlayer)
    if (!playerFaction) {
      setCurrentEvent(null)
      return
    }
    // Apply resource delta
    if (choice.resourceDelta) {
      const newResources = { ...playerFaction.resources }
      for (const [key, delta] of Object.entries(choice.resourceDelta)) {
        if (delta !== undefined) {
          newResources[key as keyof typeof newResources] = Math.max(
            0,
            (newResources[key as keyof typeof newResources] || 0) + delta
          )
        }
      }
      const updatedFaction = { ...playerFaction, resources: newResources }
      const newFactions = new Map(game.factions)
      newFactions.set(playerFaction.id, updatedFaction)
      syncGameState({ ...game, factions: newFactions })
    }

    addNotification({
      type: 'info',
      title: currentEvent.title,
      message: `You chose: ${choice.label}. ${choice.effect}`,
      duration: 5000,
    })
    setCurrentEvent(null)
  }

  const iconMap: Record<RandomEvent['icon'], React.ReactNode> = {
    scroll: <Scroll className="h-8 w-8" />,
    zap: <Zap className="h-8 w-8" />,
    skull: <Skull className="h-8 w-8" />,
    coins: <Coins className="h-8 w-8" />,
    food: <Wheat className="h-8 w-8" />,
    people: <Users className="h-8 w-8" />,
    sun: <Sun className="h-8 w-8" />,
    rain: <CloudRain className="h-8 w-8" />,
  }

  const iconColors: Record<RandomEvent['icon'], string> = {
    scroll: 'text-slate-400',
    zap: 'text-yellow-400',
    skull: 'text-red-400',
    coins: 'text-amber-400',
    food: 'text-emerald-400',
    people: 'text-blue-400',
    sun: 'text-orange-400',
    rain: 'text-cyan-400',
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-slate-800">
          <div className={`${iconColors[currentEvent.icon]}`}>
            {iconMap[currentEvent.icon]}
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Random Event</p>
            <h2 className="text-xl font-bold text-slate-100">{currentEvent.title}</h2>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-4">
          <p className="text-slate-300 leading-relaxed">{currentEvent.description}</p>
        </div>

        {/* Choices */}
        <div className="px-6 pb-6 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Choose your response</p>
          {currentEvent.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(choice)}
              className="w-full text-left p-4 rounded-lg border border-slate-700 hover:border-amber-600 hover:bg-slate-800 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                    {choice.label}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">{choice.description}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-mono">{choice.effect}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
