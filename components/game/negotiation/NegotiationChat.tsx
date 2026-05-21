'use client'

import { useState, useRef, useEffect } from "react"
import { useGameStore } from "@/lib/game/store"
import { FACTION_CONFIG } from "@/lib/game/constants"
import {
  parsePlayerProposal,
  evaluateProposal,
  generateAIResponse,
  generateGreeting,
} from "@/lib/game/ai/negotiation"
import type { NegotiationMessage, NegotiationState, ProposalTerms } from "@/lib/game/ai/negotiation"
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
import { Send, Coins, Handshake, Swords, Package, Shield, Frown, Meh, Smile, ThumbsUp } from "lucide-react"
import { v4 as uuidv4 } from 'uuid'

export function NegotiationChat() {
  const game = useGameStore(state => state.game)
  const ui = useGameStore(state => state.ui)
  const closeNegotiation = useGameStore(state => state.closeNegotiation)
  const formAlliance = useGameStore(state => state.formAlliance)
  const proposeTrade = useGameStore(state => state.proposeTrade)
  const offerPeace = useGameStore(state => state.offerPeace)
  const addNotification = useGameStore(state => state.addNotification)

  const [messages, setMessages] = useState<NegotiationMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [aiMood, setAiMood] = useState<NegotiationState['aiMood']>('neutral')
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!game) return null

  const selectedFactionId = ui.selectedFactionForDiplomacy
  const playerFactionId = Array.from(game.factions.values()).find(f => f.isPlayer)?.id ?? ''
  const aiFaction = selectedFactionId ? game.factions.get(selectedFactionId) : null
  const playerFaction = game.factions.get(playerFactionId)
  const factionConfig = aiFaction ? FACTION_CONFIG[aiFaction.id] : null
  const relation = playerFaction?.relations.find(r => r.targetId === selectedFactionId)
  const relationValue = relation?.value ?? 0

  const getMoodFromRelation = (value: number): NegotiationState['aiMood'] => {
    if (value >= 50) return 'eager'
    if (value >= 20) return 'receptive'
    if (value >= -20) return 'neutral'
    if (value >= -50) return 'suspicious'
    return 'hostile'
  }

  useEffect(() => {
    if (ui.showNegotiationChat && aiFaction && playerFaction && messages.length === 0) {
      const greeting = generateGreeting(aiFaction as any, playerFaction as any, relation as any)
      const initialMessage: NegotiationMessage = {
        id: uuidv4(), speaker: 'ai', text: greeting, timestamp: Date.now(),
      }
      setMessages([initialMessage])
      setAiMood(getMoodFromRelation(relationValue))
    }
  }, [ui.showNegotiationChat, aiFaction?.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleClose = () => {
    closeNegotiation()
    setMessages([])
  }

  const getMoodIcon = (mood: NegotiationState['aiMood']) => {
    switch (mood) {
      case 'hostile': return <Frown className="h-4 w-4 text-red-500" />
      case 'suspicious': return <Meh className="h-4 w-4 text-orange-500" />
      case 'neutral': return <Meh className="h-4 w-4 text-yellow-500" />
      case 'receptive': return <Smile className="h-4 w-4 text-green-400" />
      case 'eager': return <ThumbsUp className="h-4 w-4 text-green-500" />
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() || !aiFaction || !playerFaction || isTyping) return

    const gameState = useGameStore.getState() as any

    const playerMessage: NegotiationMessage = {
      id: uuidv4(), speaker: 'player', text: inputText, timestamp: Date.now(),
    }

    setMessages(prev => [...prev, playerMessage])
    setInputText("")
    setIsTyping(true)

    const terms = parsePlayerProposal(inputText, gameState, aiFaction.id) as ProposalTerms
    playerMessage.proposalTerms = terms

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500))

    const evaluation = evaluateProposal(terms, aiFaction as any, playerFaction as any, relation as any, gameState)
    const aiResponseText = generateAIResponse(evaluation, aiFaction as any, playerFaction as any, relation as any, terms, gameState)

    const aiMessage: NegotiationMessage = {
      id: uuidv4(), speaker: 'ai', text: aiResponseText, timestamp: Date.now(),
    }

    setMessages(prev => [...prev, aiMessage])
    setIsTyping(false)

    if (evaluation.willAccept) {
      if (terms.proposedAlliance) {
        formAlliance(aiFaction.id)
        addNotification({ type: 'success', title: 'Alliance Formed!', message: `Allied with ${aiFaction.name}`, duration: 5000 })
      } else if (terms.proposedTrade) {
        proposeTrade(aiFaction.id, {}, {})
        addNotification({ type: 'success', title: 'Trade Agreement!', message: `Trade with ${aiFaction.name}`, duration: 5000 })
      } else if (terms.proposedPeace) {
        offerPeace(aiFaction.id)
        addNotification({ type: 'info', title: 'Peace Treaty!', message: `Peace with ${aiFaction.name}`, duration: 5000 })
      } else if (terms.targetFactionId) {
        formAlliance(aiFaction.id)
        addNotification({ type: 'warning', title: 'Joint War!', message: `${aiFaction.name} joins your war!`, duration: 5000 })
      }
      setAiMood('receptive')
    }
  }

  const handleQuickAction = (action: string) => {
    const texts: Record<string, string> = {
      gift: "I would like to offer you 200 gold as a gift of good faith.",
      trade: "I propose we establish a trade agreement between our realms.",
      alliance: "I wish to propose a military alliance between our factions.",
      peace: "I come to offer peace. Let us end this war.",
      nonaggression: "Let us sign a non-aggression pact to ensure peace between our peoples.",
    }
    if (action === 'enemy') {
      const enemy = playerFaction?.relations.filter(r => r.value < -20)[0]
      const enemyFaction = enemy ? game.factions.get(enemy.targetId) : null
      setInputText(enemyFaction
        ? `The ${enemyFaction.name} is a threat to us both. What if we joined forces against them?`
        : "Is there any faction you consider a threat? We could deal with them together.")
      return
    }
    setInputText(texts[action] ?? "")
  }

  if (!aiFaction || !playerFaction) return null

  return (
    <Dialog open={ui.showNegotiationChat} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 bg-slate-900 border-slate-700">
        <DialogHeader className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: factionConfig?.color || '#666' }}
              >
                {aiFaction.flag}
              </div>
              <div>
                <DialogTitle className="text-lg text-slate-100">{aiFaction.name}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="capitalize">{aiFaction.personality}</span>
                  <span>|</span>
                  <span className={relationValue >= 0 ? 'text-green-400' : 'text-red-400'}>
                    Relations: {relationValue > 0 ? '+' : ''}{relationValue}
                  </span>
                </div>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800">
                    {getMoodIcon(aiMood)}
                    <span className="text-xs capitalize text-slate-300">{aiMood}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>Current negotiation mood</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.speaker === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.speaker === 'player' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-100'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  {message.proposalTerms && (
                    <div className="mt-2 pt-2 border-t border-white/20 flex flex-wrap gap-1">
                      {message.proposalTerms.offeredGold ? (
                        <Badge variant="outline" className="text-xs border-white/30 text-white">
                          <Coins className="h-3 w-3 mr-1" />+{message.proposalTerms.offeredGold}g
                        </Badge>
                      ) : null}
                      {message.proposalTerms.proposedAlliance ? (
                        <Badge variant="outline" className="text-xs border-white/30 text-white">
                          <Shield className="h-3 w-3 mr-1" />Alliance
                        </Badge>
                      ) : null}
                      {message.proposalTerms.proposedTrade ? (
                        <Badge variant="outline" className="text-xs border-white/30 text-white">
                          <Package className="h-3 w-3 mr-1" />Trade
                        </Badge>
                      ) : null}
                      {message.proposalTerms.targetFactionId ? (
                        <Badge variant="outline" className="text-xs border-red-400/50 text-red-300">
                          <Swords className="h-3 w-3 mr-1" />Joint War
                        </Badge>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex-shrink-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleQuickAction('gift')} className="text-xs border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Coins className="h-3 w-3 mr-1" />Offer Gift
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickAction('trade')} className="text-xs border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Package className="h-3 w-3 mr-1" />Trade
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickAction('alliance')} className="text-xs border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Shield className="h-3 w-3 mr-1" />Alliance
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickAction('nonaggression')} className="text-xs border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Handshake className="h-3 w-3 mr-1" />Non-Aggression
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickAction('enemy')} className="text-xs border-red-500/50 bg-red-500/10 text-red-300 hover:bg-red-500/20">
              <Swords className="h-3 w-3 mr-1" />Target Enemy
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your proposal..."
              disabled={isTyping}
              className="flex-1 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
            />
            <Button onClick={handleSendMessage} disabled={!inputText.trim() || isTyping} className="bg-amber-500 hover:bg-amber-600">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Tip: Mention enemies by name to propose joint wars. Offer gold to sweeten deals.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
