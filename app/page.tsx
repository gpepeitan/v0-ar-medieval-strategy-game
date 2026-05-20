import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-foreground tracking-tight">
            Medieval Strategy
          </h1>
          <p className="text-xl text-muted-foreground">
            Conquer territories, manage economies, command armies, and negotiate with 
            intelligent AI factions in this deep single-player strategy game.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-left">
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-2">12 Unique Factions</h3>
            <p className="text-sm text-muted-foreground">
              From the Mongol Khanate to the Byzantine Empire, each with distinct 
              personalities, strengths, and AI behaviors.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-2">Deep Economy</h3>
            <p className="text-sm text-muted-foreground">
              Manage resources, livestock, labor, and trade routes. Every decision 
              affects your realm&apos;s prosperity.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-2">Siege Warfare</h3>
            <p className="text-sm text-muted-foreground">
              6-phase siege system with bombardment, sapping, starvation, and 
              dramatic assaults on fortified positions.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-foreground mb-2">AI Negotiation</h3>
            <p className="text-sm text-muted-foreground">
              Chat with AI factions to forge alliances, broker peace, or propose 
              joint wars against common enemies.
            </p>
          </div>
        </div>

        <Link href="/game">
          <Button size="lg" className="text-lg px-8 py-6">
            Start New Campaign
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground">
          Based on real-world medieval geography with OpenStreetMap tiles
        </p>
      </div>
    </main>
  )
}
