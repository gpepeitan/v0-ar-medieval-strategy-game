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
  type NegotiationState,
  type ProposalTerms
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
  Heart,
  X,
  MessageSquare,
  Frown,
  Meh,
  Smile,
  ThumbsUp,
  Sparkles
} from "lucide-react"
import { v4 as uuidv4 } from 'uuid'

export function NegotiationChat() {
  const { 
    factions, 
    playerFactionId,
    selectedFaction,
    negotiationOpen,
    setNegotiationOpen,
    setSelectedFaction,
    diplomaticRelations,
    territories,
    armies,
    addTreaty,
    updateRelation,
    addNotification
  } = useGameStore()

  const [messages, setMessages] = useState<NegotiationMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [negotiationState, setNegotiationState] = useState<NegotiationState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const aiFaction = factions.find(f => f.id === selectedFaction)
  const playerFaction = factions.find(f => f.id === playerFactionId)
  const factionConfig = aiFaction ? FACTION_CONFIG[aiFaction.templateId] : null

  const relation = diplomaticRelations.find(
    r => (r.faction1Id === playerFactionId && r.faction2Id === selectedFaction) ||
         (r.faction2Id === playerFactionId && r.faction1Id === selectedFaction)
  )
  const relationValue = relation?.value || 0

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (negotiationOpen && aiFaction && playerFaction && messages.length === 0) {
      const greeting = generateGreeting(aiFaction, playerFaction, relation)
      const initialMessage: NegotiationMessage = {
        id: uuidv4(),
        speaker: 'ai',
        text: greeting,
        timestamp: Date.now()
      }
      setMessages([initialMessage])
      setNegotiationState({
        factionId: aiFaction.id,
        messages: [initialMessage],
        currentOffer: null,
        aiMood: getMoodFromRelation(relationValue),
        concessionsMade: 0,
        playerConcessions: 0,
        deadlockCount: 0,
        lastAIResponse: greeting
      })
    }
  }, [negotiationOpen, aiFaction, playerFaction, relation, relationValue, messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Reset on close
  const handleClose = () => {
    setNegotiationOpen(false)
    setSelectedFaction(null)
    setMessages([])
    setNegotiationState(null)
  }

  const getMoodFromRelation = (value: number): NegotiationState['aiMood'] => {
    if (value >= 50) return 'eager'
    if (value >= 20) return 'receptive'
    if (value >= -20) return 'neutral'
    if (value >= -50) return 'suspicious'
    return 'hostile'
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

    const gameState = useGameStore.getState()

    // Add player message
    const playerMessage: NegotiationMessage = {
      id: uuidv4(),
      speaker: 'player',
      text: inputText,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, playerMessage])
    setInputText("")
    setIsTyping(true)

    // Parse player proposal
    const terms = parsePlayerProposal(inputText, gameState, aiFaction.id)
    playerMessage.proposalTerms = terms

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500))

    // Evaluate proposal
    const evaluation = evaluateProposal(terms, aiFaction, playerFaction, relation, gameState)

    // Generate AI response
    const aiResponseText = generateAIResponse(evaluation, aiFaction, playerFaction, relation, terms, gameState)

    const aiMessage: NegotiationMessage = {
      id: uuidv4(),
      speaker: 'ai',
      text: aiResponseText,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, aiMessage])
    setIsTyping(false)

    // Handle accepted proposals
    if (evaluation.willAccept) {
      // Apply the agreed terms
      if (terms.proposedAlliance) {
        addTreaty(playerFactionId!, aiFaction.id, 'alliance')
        addNotification({
          type: 'diplomacy',
          title: 'Alliance Formed!',
          message: `You have formed an alliance with ${aiFaction.name}`,
          factionId: aiFaction.id
        })
        updateRelation(playerFactionId!, aiFaction.id, 20)
      }
      if (terms.proposedTrade) {
        addTreaty(playerFactionId!, aiFaction.id, 'trade')
        addNotification({
          type: 'diplomacy',
          title: 'Trade Agreement!',
          message: `You have established trade with ${aiFaction.name}`,
          factionId: aiFaction.id
        })
        updateRelation(playerFactionId!, aiFaction.id, 10)
      }
      if (terms.proposedNonAggression) {
        addTreaty(playerFactionId!, aiFaction.id, 'non_aggression')
        updateRelation(playerFactionId!, aiFaction.id, 10)
      }
      if (terms.proposedPeace) {
        // End war
        addNotification({
          type: 'diplomacy',
          title: 'Peace Treaty!',
          message: `You have made peace with ${aiFaction.name}`,
          factionId: aiFaction.id
        })
        updateRelation(playerFactionId!, aiFaction.id, 15)
      }
      if (terms.targetFactionId) {
        // Joint war against common enemy
        const target = factions.find(f => f.id === terms.targetFactionId)
        addTreaty(playerFactionId!, aiFaction.id, 'alliance')
        addNotification({
          type: 'war',
          title: 'Joint War Declared!',
          message: `${aiFaction.name} has agreed to join you in war against ${target?.name}!`,
          factionId: aiFaction.id
        })
        updateRelation(playerFactionId!, aiFaction.id, 25)
      }

      // Update mood
      setNegotiationState(prev => prev ? {
        ...prev,
        aiMood: 'receptive',
        currentOffer: null
      } : null)
    }
  }

  const handleQuickAction = (action: string) => {
    let text = ""
    switch (action) {
      case 'gift':
        text = "I would like to offer you 200 gold as a gift of good faith."
        break
      case 'trade':
        text = "I propose we establish a trade agreement between our realms."
        break
      case 'alliance':
        text = "I wish to propose a military alliance between our factions."
        break
      case 'non-aggression':
        text = "Let us sign a non-aggression pact to ensure peace between our peoples."
        break
      case 'peace':
        text = "I come to offer peace. Let us end this war."
        break
      case 'enemy':
        // Find AI's most hated faction
        const aiEnemies = diplomaticRelations
          .filter(r => r.faction1Id === selectedFaction || r.faction2Id === selectedFaction)
          .filter(r => r.value < -20)
          .map(r => r.faction1Id === selectedFaction ? r.faction2Id : r.faction1Id)
        if (aiEnemies.length > 0) {
          const enemyFaction = factions.find(f => f.id === aiEnemies[0])
          if (enemyFaction) {
            text = `I know the ${enemyFaction.name} is a threat to us both. What if we joined forces to destroy them?`
          }
        } else {
          text = "Is there any faction you consider a threat? Perhaps we could deal with them together."
        }
        break
    }
    setInputText(text)
  }

  if (!aiFaction || !playerFaction) return null

  return (
    <Dialog open={negotiationOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: factionConfig?.color || '#666' }}
              >
                {aiFaction.name.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-lg">{aiFaction.name}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{factionConfig?.personality}</span>
                  <span>|</span>
                  <span className={relationValue >= 0 ? 'text-green-500' : 'text-red-500'}>
                    Relations: {relationValue > 0 ? '+' : ''}{relationValue}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
                      {getMoodIcon(negotiationState?.aiMood || 'neutral')}
                      <span className="text-xs capitalize">{negotiationState?.aiMood || 'neutral'}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current negotiation mood</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(message => (
              <div 
                key={message.id}
                className={`flex ${message.speaker === 'player' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.speaker === 'player' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  {message.proposalTerms && Object.keys(message.proposalTerms).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/30 flex flex-wrap gap-1">
                      {message.proposalTerms.offeredGold && (
                        <Badge variant="outline" className="text-xs">
                          <Coins className="h-3 w-3 mr-1" />
                          Offering {message.proposalTerms.offeredGold}g
                        </Badge>
                      )}
                      {message.proposalTerms.proposedAlliance && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Alliance
                        </Badge>
                      )}
                      {message.proposalTerms.proposedTrade && (
                        <Badge variant="outline" className="text-xs">
                          <Package className="h-3 w-3 mr-1" />
                          Trade
                        </Badge>
                      )}
                      {message.proposalTerms.targetFactionId && (
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
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border flex-shrink-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickAction('gift')}
              className="text-xs"
            >
              <Coins className="h-3 w-3 mr-1" />
              Offer Gift
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickAction('trade')}
              className="text-xs"
            >
              <Package className="h-3 w-3 mr-1" />
              Propose Trade
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickAction('alliance')}
              className="text-xs"
            >
              <Shield className="h-3 w-3 mr-1" />
              Propose Alliance
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickAction('non-aggression')}
              className="text-xs"
            >
              <Handshake className="h-3 w-3 mr-1" />
              Non-Aggression
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickAction('enemy')}
              className="text-xs bg-red-500/10 hover:bg-red-500/20"
            >
              <Swords className="h-3 w-3 mr-1" />
              Target Enemy
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your proposal..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputText.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Tip: Mention their enemies by name to propose joint wars. Offer gold to sweeten deals.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
