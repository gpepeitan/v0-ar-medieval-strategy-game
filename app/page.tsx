'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/lib/game/store'
import {
  Swords,
  Crown,
  Handshake,
  Coins,
  Shield,
  Map,
  FolderOpen,
  ChevronRight,
} from 'lucide-react'

// The 12 faction colors for the decorative strip
const FACTION_COLORS = [
  '#c0392b', '#e67e22', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
  '#795548', '#607d8b', '#ff5722', '#8bc34a',
]

interface SaveSlot {
  name: string
  factionName: string
  year: number
  day: number
  savedAt: number
  key: string
}

function getLatestSave(): SaveSlot | null {
  if (typeof window === 'undefined') return null
  let latest: SaveSlot | null = null
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('medievalSave_') || key === 'medievalStrategyGame') {
      try {
        const raw = JSON.parse(localStorage.getItem(key)!)
        const slot: SaveSlot = {
          name: raw.slotName || 'Campaign',
          factionName: raw.playerFactionName || 'Unknown',
          year: raw.time?.year || 1,
          day: raw.time?.day || 1,
          savedAt: raw.savedAt || 0,
          key: key,
        }
        if (!latest || slot.savedAt > latest.savedAt) {
          latest = slot
        }
      } catch { /* corrupted save */ }
    }
  }
  return latest
}

const FEATURES = [
  {
    icon: Map,
    title: '12 Unique Factions',
    description: 'From Mongol Khanate to Byzantine Empire — each with distinct AI personalities, strengths, and agendas.',
    color: 'text-amber-400',
  },
  {
    icon: Swords,
    title: 'Real-Time Battles',
    description: 'Armies clash in real time. You get a countdown timer to issue orders or let your commanders decide.',
    color: 'text-red-400',
  },
  {
    icon: Shield,
    title: '6-Phase Sieges',
    description: 'Besiege fortifications through approach, bombardment, sapping, starvation, and full assault.',
    color: 'text-blue-400',
  },
  {
    icon: Handshake,
    title: 'AI Negotiation',
    description: 'Chat in natural language with rival rulers — forge alliances, broker peace, propose joint wars.',
    color: 'text-emerald-400',
  },
  {
    icon: Coins,
    title: 'Deep Economy',
    description: 'Manage gold, food, iron, and wood. Build trade routes, tax your territories, fund your armies.',
    color: 'text-yellow-400',
  },
  {
    icon: Crown,
    title: 'Commander System',
    description: 'Recruit legendary generals with unique stats. Level them up through battles and sieges.',
    color: 'text-orange-400',
  },
]

export default function HomePage() {
  const [latestSave, setLatestSave] = useState<SaveSlot | null>(null)
  const loadGame = useGameStore(state => state.loadGame)
  const router = useRouter()

  useEffect(() => {
    setLatestSave(getLatestSave())
  }, [])

  const handleContinue = () => {
    if (!latestSave) return
    try {
      const raw = JSON.parse(localStorage.getItem(latestSave.key)!)
      loadGame(raw)
      router.push('/game')
    } catch { /* corrupted save, ignore */ }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Faction color strip */}
      <div className="flex h-1 w-full">
        {FACTION_COLORS.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-700/50 bg-amber-950/30 text-amber-400 text-xs uppercase tracking-widest mb-2">
            <Crown className="h-3 w-3" />
            Single Player Strategy
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold text-foreground tracking-tight text-balance leading-tight">
            Realm<br />
            <span className="text-amber-400">Conquest</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed text-pretty max-w-xl mx-auto">
            Command armies, forge alliances, and conquer a medieval world.
            12 AI factions, real-time warfare, deep diplomacy — every campaign unique.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/game">
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-base px-8 h-12 gap-2"
              >
                <Swords className="h-5 w-5" />
                New Campaign
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>

            {latestSave && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleContinue}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 font-medium text-base px-8 h-12 gap-2"
              >
                <FolderOpen className="h-5 w-5" />
                Continue — {latestSave.factionName}, Year {latestSave.year}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
            What awaits you
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                className="p-5 rounded-lg border border-border bg-card hover:border-amber-700/50 transition-colors"
              >
                <feature.icon className={`h-5 w-5 ${feature.color} mb-3`} />
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom faction strip */}
      <div className="flex h-1 w-full">
        {[...FACTION_COLORS].reverse().map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
    </main>
  )
}
