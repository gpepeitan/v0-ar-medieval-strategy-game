'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/lib/game/store'
import { Button } from '@/components/ui/button'
import { Crown, Skull, Swords, Trophy, RotateCcw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function VictoryScreen() {
  const game = useGameStore(state => state.game)
  const startNewGame = useGameStore(state => state.startNewGame)
  const router = useRouter()

  const result = useMemo(() => {
    if (!game) return null
    const playerFaction = Array.from(game.factions.values()).find(f => f.isPlayer)
    if (!playerFaction) return null

    // Check if player is defeated (all territories lost)
    const playerTerritories = Array.from(game.territories.values()).filter(
      t => t.ownerId === playerFaction.id
    )
    if (playerFaction.isDefeated || playerTerritories.length === 0) {
      return { type: 'defeat' as const, faction: playerFaction }
    }

    // Check victory via event log
    const victoryEvent = game.eventLog.find(e => e.type === 'victory' && e.factionIds?.includes(playerFaction.id))
    if (victoryEvent) {
      return { type: 'victory' as const, faction: playerFaction, event: victoryEvent }
    }

    // Check domination victory (80% of territories)
    const totalTerritories = game.territories.size
    const dominationThreshold = Math.ceil(totalTerritories * 0.8)
    if (playerTerritories.length >= dominationThreshold) {
      return { type: 'victory' as const, faction: playerFaction, event: null }
    }

    return null
  }, [game])

  if (!result || !game) return null

  const isVictory = result.type === 'victory'
  const playerTerritories = Array.from(game.territories.values()).filter(
    t => t.ownerId === result.faction.id
  )
  const survivingFactions = Array.from(game.factions.values()).filter(f => !f.isDefeated && !f.isPlayer)
  const defeatedFactions = Array.from(game.factions.values()).filter(f => f.isDefeated)
  const totalDays = game.time.totalDays

  const handleNewGame = () => {
    router.push('/')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className={`relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl overflow-hidden ${
        isVictory
          ? 'border-amber-600/50 bg-gradient-to-b from-amber-950/90 to-slate-900/95'
          : 'border-red-800/50 bg-gradient-to-b from-red-950/90 to-slate-900/95'
      }`}>
        {/* Header */}
        <div className={`px-8 pt-10 pb-6 text-center ${isVictory ? 'text-amber-400' : 'text-red-400'}`}>
          {isVictory ? (
            <Crown className="h-16 w-16 mx-auto mb-4 drop-shadow-lg" />
          ) : (
            <Skull className="h-16 w-16 mx-auto mb-4 drop-shadow-lg" />
          )}
          <h1 className="text-4xl font-bold text-slate-100 text-balance">
            {isVictory ? 'Victory!' : 'Defeat'}
          </h1>
          <p className={`text-lg mt-2 font-medium ${isVictory ? 'text-amber-400' : 'text-red-400'}`}>
            {isVictory
              ? `The ${result.faction.name} has conquered the realm!`
              : `The ${result.faction.name} has fallen.`}
          </p>
        </div>

        {/* Stats */}
        <div className="px-8 pb-6 grid grid-cols-3 gap-3">
          <StatCard
            icon={<Swords className="h-5 w-5 text-slate-400" />}
            label="Days Played"
            value={totalDays.toString()}
          />
          <StatCard
            icon={<Trophy className="h-5 w-5 text-amber-400" />}
            label="Territories"
            value={`${playerTerritories.length} / ${game.territories.size}`}
          />
          <StatCard
            icon={<Crown className="h-5 w-5 text-red-400" />}
            label="Rivals Defeated"
            value={defeatedFactions.length.toString()}
          />
        </div>

        {/* Surviving factions */}
        {isVictory && survivingFactions.length > 0 && (
          <div className="px-8 pb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Surviving factions</p>
            <div className="flex flex-wrap gap-2">
              {survivingFactions.map(f => (
                <span
                  key={f.id}
                  className="px-2 py-1 rounded text-xs text-slate-300 border border-slate-700"
                  style={{ borderLeftColor: f.color, borderLeftWidth: 3 }}
                >
                  {f.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          <Button
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold"
            onClick={handleNewGame}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            onClick={() => router.push('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
      {icon}
      <span className="text-lg font-bold text-slate-100">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}
