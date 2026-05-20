"use client"

import { useEffect, useState } from "react"
import { useGameStore } from "@/lib/game/store"
import { GameLayout } from "@/components/game/GameLayout"
import { NewGameDialog } from "@/components/game/dialogs/NewGameDialog"
import { NegotiationChat } from "@/components/game/negotiation/NegotiationChat"

export default function GamePage() {
  const { game, ui } = useGameStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      {game ? (
        <GameLayout />
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-foreground">Medieval Strategy</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Build your empire, forge alliances, wage wars, and negotiate with AI factions
              in this deep medieval strategy game.
            </p>
            <NewGameDialog />
          </div>
        </div>
      )}
      
      {/* Global Dialogs */}
      {game && <NegotiationChat />}
    </main>
  )
}
