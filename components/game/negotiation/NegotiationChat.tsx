"use client"

import { useState, useRef, useEffect } from "react"
import { useGameStore } from "@/lib/game/store"
import { FACTION_CONFIG } from "@/lib/game/constants"
import {
  parsePlayerProposal,
  evaluateProposal,
  generateAIResponse,
  generateGreeting,
  type NegotiationMessage,
  type NegotiationState as AINegoState,
} from "@/lib/game/ai/negotiation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Send,
  Coins,
  Handshake,
  Swords,
  Package,
  Shield,
  Frown,
  Meh,
  Smile,
  ThumbsUp,
} from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export function NegotiationChat() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  const closeNegotiation = useGameStore(state => state.closeNegotiation)
  const formAlliance = useGameStore(state => state.formAlliance)
  const getRelation = useGameStore(state => state.getRelation)
  const addNotification = useGameStore(state => state.addNotification)

  const [messages, setMessages] = useState<NegotiationMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [negoState, setNegoState] = useState<AINegoState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const negotiation = game?.activeNegotiation
  const isOpen = ui.showNegotiationChat && !!negotiation

  const playerFaction = game ? Array.from(game.factions.values()).find(f => f.isPlayer) ?? null : null
  const aiFaction = negotiation ? game?.factions.get(negotiation.factionId) ?? null : null
  const factionConfig = aiFaction ? FACTION_CONFIG[aiFaction.id] ?? null : null

  const relation = playerFaction && aiFaction
    ? getRelation(playerFaction.id, aiFaction.id)
    : null
  const relationValue = relation?.value ?? 0

  // Init conversation
  useEffect(() => {
    if (isOpen && aiFaction && playerFaction && messages.length === 0) {
      const greeting = generateGreeting(aiFaction, playerFaction, relation)
      const initial: NegotiationMessage = {
        id: uuidv4(),
        speaker: "ai",
        text: greeting,
        timestamp: Date.now(),
      }
      setMessages([initial])
      setNegoState({
        factionId: aiFaction.id,
        messages: [initial],
        currentOffer: null,
        aiMood: getMoodFromRelation(relationValue),
        concessionsMade: 0,
        playerConcessions: 0,
        deadlockCount: 0,
        lastAIResponse: greeting,
      })
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setMessages([])
      setNegoState(null)
      setInputText("")
    }
  }, [isOpen])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function getMoodFromRelation(value: number): AINegoState["aiMood"] {
    if (value >= 50) return "eager"
    if (value >= 20) return "receptive"
    if (value >= -20) return "neutral"
    if (value >= -50) return "suspicious"
    return "hostile"
  }

  function getMoodIcon(mood: AINegoState["aiMood"]) {
    switch (mood) {
      case "hostile":   return <Frown className="h-4 w-4 text-red-500" />
      case "suspicious":return <Meh className="h-4 w-4 text-orange-500" />
      case "neutral":   return <Meh className="h-4 w-4 text-yellow-500" />
      case "receptive": return <Smile className="h-4 w-4 text-green-400" />
      case "eager":     return <ThumbsUp className="h-4 w-4 text-green-500" />
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || !aiFaction || !playerFaction || isTyping || !game) return

    const playerMsg: NegotiationMessage = {
      id: uuidv4(),
      speaker: "player",
      text: inputText,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, playerMsg])
    setInputText("")
    setIsTyping(true)

    // Parse proposal
    const terms = parsePlayerProposal(inputText, game, aiFaction.id)
    playerMsg.proposalTerms = terms

    // Simulate thinking
    await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 1200))

    // Evaluate + respond
    const evaluation = evaluateProposal(terms, aiFaction, playerFaction, relation, game)
    const responseText = generateAIResponse(evaluation, aiFaction, playerFaction, relation, terms, game)

    const aiMsg: NegotiationMessage = {
      id: uuidv4(),
      speaker: "ai",
      text: responseText,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, aiMsg])
    setIsTyping(false)

    // Apply accepted proposals
    if (evaluation.willAccept) {
      if (terms.proposedAlliance || terms.targetFactionId) {
        formAlliance(aiFaction.id)
        addNotification({
          type: "success",
          title: terms.targetFactionId ? "Joint War Agreed!" : "Alliance Formed!",
          message: `${aiFaction.name} has agreed to your terms.`,
          factionId: aiFaction.id,
        })
      }
      setNegoState(prev => prev ? { ...prev, aiMood: "receptive", currentOffer: null } : null)
    }
  }

  const handleQuickAction = (action: string) => {
    const texts: Record<string, string> = {
      gift: "I would like to offer you 200 gold as a gesture of good faith.",
      trade: "I propose we establish a trade agreement between our realms.",
      alliance: "I wish to propose a military alliance between our factions.",
      "non-aggression": "Let us sign a non-aggression pact to ensure peace.",
      peace: "I come to offer peace. Let us end this conflict.",
    }
    if (action === "enemy" && game && aiFaction) {
      const worstRelation = aiFaction.relations
        .filter(r => r.value < -20)
        .sort((a, b) => a.value - b.value)[0]
      if (worstRelation) {
        const enemy = game.factions.get(worstRelation.targetId)
        if (enemy) {
          setInputText(`The ${enemy.name} threatens us both. What if we joined forces to destroy them?`)
          return
        }
      }
      setInputText("Is there any faction you consider a common enemy? Perhaps we can deal with them together.")
      return
    }
    setInputText(texts[action] ?? "")
  }

  if (!aiFaction || !playerFaction) return null

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && closeNegotiation()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: factionConfig?.color ?? aiFaction.color }}
              >
                {aiFaction.name.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-lg">{aiFaction.name}</DialogTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {factionConfig?.personality ?? aiFaction.personality} &mdash;&nbsp;
                  <span className={relationValue >= 0 ? "text-green-500" : "text-red-500"}>
                    Relations: {relationValue > 0 ? "+" : ""}{relationValue}
                  </span>
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted cursor-default">
                    {getMoodIcon(negoState?.aiMood ?? "neutral")}
                    <span className="text-xs capitalize">{negoState?.aiMood ?? "neutral"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Current negotiation mood</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.speaker === "player" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.speaker === "player"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  {msg.proposalTerms && (
                    <div className="mt-2 pt-2 border-t border-border/30 flex flex-wrap gap-1">
                      {msg.proposalTerms.offeredGold && (
                        <Badge variant="outline" className="text-xs">
                          <Coins className="h-3 w-3 mr-1" />
                          {msg.proposalTerms.offeredGold}g offered
                        </Badge>
                      )}
                      {msg.proposalTerms.proposedAlliance && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Alliance
                        </Badge>
                      )}
                      {msg.proposalTerms.proposedTrade && (
                        <Badge variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          Trade
                        </Badge>
                      )}
                      {msg.proposalTerms.targetFactionId && (
                        <Badge variant="outline" className="text-xs bg-red-500/20">
                          <Swords className="h-3 w-3 mr-1" />
                          Joint War
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map(delay => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border flex-shrink-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { action: "gift", icon: <Coins className="h-3 w-3 mr-1" />, label: "Offer Gift" },
              { action: "trade", icon: <Package className="h-3 w-3 mr-1" />, label: "Propose Trade" },
              { action: "alliance", icon: <Shield className="h-3 w-3 mr-1" />, label: "Propose Alliance" },
              { action: "non-aggression", icon: <Handshake className="h-3 w-3 mr-1" />, label: "Non-Aggression" },
              { action: "enemy", icon: <Swords className="h-3 w-3 mr-1" />, label: "Target Enemy", danger: true },
            ].map(({ action, icon, label, danger }) => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                onClick={() => handleQuickAction(action)}
                className={`text-xs ${danger ? "bg-red-500/10 hover:bg-red-500/20" : ""}`}
              >
                {icon}{label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your proposal..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button onClick={handleSendMessage} disabled={!inputText.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Mention their enemies by name to propose joint wars. Offer gold to sweeten deals.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
