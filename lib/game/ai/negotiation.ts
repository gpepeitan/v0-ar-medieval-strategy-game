import { Faction, DiplomaticRelation, Territory, Army, GameState } from '../types'
import { FACTION_CONFIG } from '../constants'

// Helper: get relation between two factions from faction.relations Map
function getRelation(faction: Faction, targetId: string): DiplomaticRelation | undefined {
  return faction.relations.get(targetId)
}

// Helper: compute military strength from game armies
function getMilitaryStrength(factionId: string, game: GameState): number {
  return Array.from(game.armies.values())
    .filter(a => a.ownerId === factionId)
    .reduce((sum, a) => sum + a.units.reduce((u, s) => u + s.count, 0), 0)
}

export interface ProposalTerms {
  offeredGold?: number
  offeredTerritories?: string[]
  offeredTroops?: number
  demandedGold?: number
  demandedTerritories?: string[]
  demandedTroops?: number
  proposedAlliance?: boolean
  proposedTrade?: boolean
  proposedNonAggression?: boolean
  proposedPeace?: boolean
  targetFactionId?: string  // "Help me destroy X"
  tributeAmount?: number
  marriageAlliance?: boolean
}

export interface NegotiationMessage {
  id: string
  speaker: 'player' | 'ai'
  text: string
  timestamp: number
  proposalTerms?: ProposalTerms
}

export interface NegotiationState {
  factionId: string
  messages: NegotiationMessage[]
  currentOffer: ProposalTerms | null
  aiMood: 'hostile' | 'suspicious' | 'neutral' | 'receptive' | 'eager'
  concessionsMade: number
  playerConcessions: number
  deadlockCount: number
  lastAIResponse: string
}

export interface ProposalEvaluation {
  economicValue: number
  strategicValue: number
  relationshipValue: number
  vengeanceValue: number
  riskValue: number
  totalValue: number
  willAccept: boolean
  counterOffer: ProposalTerms | null
  responseType: 'accept' | 'counter' | 'reject_negotiable' | 'reject_final' | 'threaten'
}

// Parse player text to extract proposal terms
export function parsePlayerProposal(text: string, gameState: GameState, targetFactionId: string): ProposalTerms {
  const terms: ProposalTerms = {}
  const lowerText = text.toLowerCase()

  // Gold offers
  const goldOfferMatch = lowerText.match(/(?:give|offer|pay|provide)\s*(?:you\s*)?(\d+)\s*gold/i)
  if (goldOfferMatch) {
    terms.offeredGold = parseInt(goldOfferMatch[1])
  }

  // Gold demands
  const goldDemandMatch = lowerText.match(/(?:want|demand|need|require|give me)\s*(\d+)\s*gold/i)
  if (goldDemandMatch) {
    terms.demandedGold = parseInt(goldDemandMatch[1])
  }

  // Alliance proposals
  if (lowerText.includes('alliance') || lowerText.includes('ally') || lowerText.includes('allies')) {
    terms.proposedAlliance = true
  }

  // Trade proposals
  if (lowerText.includes('trade') || lowerText.includes('trading') || lowerText.includes('commerce')) {
    terms.proposedTrade = true
  }

  // Non-aggression
  if (lowerText.includes('non-aggression') || lowerText.includes('peace') || lowerText.includes('truce')) {
    terms.proposedNonAggression = true
  }

  // Peace offers
  if (lowerText.includes('end the war') || lowerText.includes('stop fighting') || lowerText.includes('make peace')) {
    terms.proposedPeace = true
  }

  // Target enemy detection - "destroy", "attack", "fight against", "enemy"
  const enemyPatterns = [
    /(?:destroy|attack|fight|war against|eliminate|crush)\s+(?:the\s+)?(\w+)/i,
    /(?:common enemy|mutual enemy|shared enemy).*?(\w+)/i,
    /(\w+)\s+(?:is|are)\s+(?:our|your|a)\s+(?:common\s+)?(?:enemy|threat)/i
  ]

  for (const pattern of enemyPatterns) {
    const match = lowerText.match(pattern)
    if (match) {
      // Try to find a faction matching this name
      const factionName = match[1].toLowerCase()
      const targetFaction = Array.from(gameState.factions.values()).find(f => 
        f.name.toLowerCase().includes(factionName) ||
        factionName.includes(f.name.toLowerCase().split(' ')[0])
      )
      const playerFaction = Array.from(gameState.factions.values()).find(f => f.isPlayer)
      if (targetFaction && targetFaction.id !== targetFactionId && targetFaction.id !== playerFaction?.id) {
        terms.targetFactionId = targetFaction.id
      }
    }
  }

  // Tribute
  const tributeMatch = lowerText.match(/tribute\s*(?:of\s*)?(\d+)/i)
  if (tributeMatch) {
    terms.tributeAmount = parseInt(tributeMatch[1])
  }

  // Marriage alliance
  if (lowerText.includes('marriage') || lowerText.includes('wed') || lowerText.includes('marry')) {
    terms.marriageAlliance = true
  }

  return terms
}

// Calculate the value of a proposal from the AI's perspective
export function evaluateProposal(
  terms: ProposalTerms,
  aiFaction: Faction,
  playerFaction: Faction,
  relation: DiplomaticRelation | undefined,
  gameState: GameState
): ProposalEvaluation {
  const config = FACTION_CONFIG[aiFaction.id]
  const personality = config?.personality || 'opportunist'
  const relationValue = relation?.value || 0
  
  let economicValue = 0
  let strategicValue = 0
  let relationshipValue = 0
  let vengeanceValue = 0
  let riskValue = 0

  // Economic value
  if (terms.offeredGold) {
    economicValue += terms.offeredGold / 100  // Normalize
  }
  if (terms.demandedGold) {
    economicValue -= terms.demandedGold / 50  // Demands are weighted more negatively
  }
  if (terms.proposedTrade) {
    economicValue += 10
  }

  // Strategic value
  if (terms.proposedAlliance) {
    const playerStrength = getMilitaryStrength(playerFaction.id, gameState)
    const aiStrength = getMilitaryStrength(aiFaction.id, gameState)
    if (playerStrength > aiStrength) {
      strategicValue += 20
    } else {
      strategicValue += 5
    }
  }

  if (terms.proposedNonAggression) {
    strategicValue += 5
  }

  // VENGEANCE VALUE - The key feature!
  // "Help me destroy your biggest enemy" should be HUGE
  if (terms.targetFactionId) {
    const targetFaction = gameState.factions.get(terms.targetFactionId)
    if (targetFaction) {
      // Check AI's relation with target using faction.relations array
      const aiTargetRelation = getRelation(aiFaction, terms.targetFactionId)
      const aiTargetValue = aiTargetRelation?.value || 0

      if (aiTargetValue <= -50) {
        vengeanceValue += 50
      } else if (aiTargetValue <= -20) {
        vengeanceValue += 25
      } else if (aiTargetValue <= 0) {
        vengeanceValue += 10
      } else {
        vengeanceValue -= 30
      }

      // Is this their BIGGEST threat?
      const threats = Array.from(gameState.factions.values())
        .filter(f => f.id !== aiFaction.id && !f.isDefeated)
        .map(f => {
          const rel = getRelation(aiFaction, f.id)
          const strength = getMilitaryStrength(f.id, gameState)
          return { faction: f, threat: strength - (rel?.value || 0) }
        })
        .sort((a, b) => b.threat - a.threat)

      if (threats[0]?.faction.id === terms.targetFactionId) {
        vengeanceValue += 30
      }
    }
  }

  // Relationship consideration
  if (relationValue < -50) {
    relationshipValue -= 20  // Very hard to negotiate
  } else if (relationValue < -20) {
    relationshipValue -= 10
  } else if (relationValue > 50) {
    relationshipValue += 15
  }

  // Risk assessment
  if (terms.proposedAlliance && relationValue < 0) {
    riskValue -= 15  // Risky to ally with someone who hates you
  }

  // Check for betrayal history
  const wasBetrayed = relation?.treaties?.some(t => !t.isActive && t.type === 'alliance')

  if (wasBetrayed) riskValue -= 25 // Never forget betrayal

  // Personality modifiers
  const personalityMods: Record<string, { strategic: number; economic: number; vengeance: number; relationship: number }> = {
    expansionist: { strategic: 1.5, economic: 0.8, vengeance: 1.2, relationship: 0.8 },
    merchant:     { strategic: 0.8, economic: 1.8, vengeance: 0.7, relationship: 1.2 },
    militarist:   { strategic: 1.3, economic: 0.7, vengeance: 1.5, relationship: 0.7 },
    diplomat:     { strategic: 1.0, economic: 1.0, vengeance: 0.8, relationship: 1.5 },
    opportunist:  { strategic: 1.2, economic: 1.2, vengeance: 1.0, relationship: 1.0 },
    raider:       { strategic: 0.9, economic: 1.4, vengeance: 1.3, relationship: 0.6 },
    defender:     { strategic: 1.4, economic: 0.9, vengeance: 0.9, relationship: 1.1 },
  }

  const mods = personalityMods[personality as keyof typeof personalityMods] || personalityMods.opportunist

  economicValue *= mods.economic
  strategicValue *= mods.strategic
  vengeanceValue *= mods.vengeance
  if (mods.relationship) {
    relationshipValue *= mods.relationship
  }

  const totalValue = economicValue + strategicValue + relationshipValue + vengeanceValue + riskValue

  // Determine acceptance threshold based on relationship
  let acceptThreshold = 20
  if (relationValue < -50) acceptThreshold = 60  // Need amazing offer
  else if (relationValue < -20) acceptThreshold = 40
  else if (relationValue > 50) acceptThreshold = 5  // Friends accept easily

  const willAccept = totalValue >= acceptThreshold

  // Generate counter offer if close but not accepting
  let counterOffer: ProposalTerms | null = null
  let responseType: ProposalEvaluation['responseType'] = 'reject_negotiable'

  if (willAccept) {
    responseType = 'accept'
  } else if (totalValue >= acceptThreshold - 20) {
    // Close enough to counter
    responseType = 'counter'
    counterOffer = generateCounterOffer(terms, totalValue, acceptThreshold, aiFaction, personality)
  } else if (relationValue <= -75) {
    responseType = 'reject_final'
  } else if (getMilitaryStrength(aiFaction.id, gameState) > getMilitaryStrength(playerFaction.id, gameState) * 1.5) {
    responseType = 'threaten'
  }

  return {
    economicValue,
    strategicValue,
    relationshipValue,
    vengeanceValue,
    riskValue,
    totalValue,
    willAccept,
    counterOffer,
    responseType
  }
}

function generateCounterOffer(
  originalTerms: ProposalTerms,
  currentValue: number,
  threshold: number,
  aiFaction: Faction,
  personality: string
): ProposalTerms {
  const counter: ProposalTerms = { ...originalTerms }
  const deficit = threshold - currentValue

  // AI demands more gold
  if (deficit > 0) {
    const additionalGold = Math.ceil(deficit * 50)
    counter.demandedGold = (counter.demandedGold || 0) + additionalGold
  }

  // Reduce what AI gives
  if (counter.offeredGold && counter.offeredGold > 100) {
    counter.offeredGold = Math.floor(counter.offeredGold * 0.7)
  }

  return counter
}

// Generate AI dialogue based on evaluation and personality
export function generateAIResponse(
  evaluation: ProposalEvaluation,
  aiFaction: Faction,
  playerFaction: Faction,
  relation: DiplomaticRelation | undefined,
  terms: ProposalTerms,
  gameState: GameState
): string {
  const config = FACTION_CONFIG[aiFaction.id]
  const personality = config?.personality || 'opportunist'
  const relationValue = relation?.value || 0

  // Check for betrayal
  const wasBetrayed = relation?.treaties?.some(t => !t.isActive && t.type === 'alliance')

  // Personality-specific dialogue templates
  const dialogues = {
    raider: {
      accept: [
        "Words mean little, but gold speaks loudly. We have a deal.",
        "Your offer is... acceptable. Do not disappoint us.",
        "Fine. But if you betray us, we will burn everything you love."
      ],
      counter: [
        "Your offer is weak. We want more. Much more.",
        "Words are wind. Show us gold, or show us targets.",
        "You want our blades? Then pay. Every. Single. Coin."
      ],
      reject: [
        "Pathetic. Come back when you have something worth our time.",
        "We don't negotiate with the weak. Grow stronger, then return."
      ],
      threaten: [
        "You come begging? Perhaps YOU should pay tribute to US.",
        "We could simply take what we want. Why should we bargain?"
      ],
      betrayed: [
        "You dare approach us after your treachery? Your tongue should be cut out.",
        "We remember your lies. Nothing you offer will ever be enough."
      ]
    },
    merchant: {
      accept: [
        "An excellent arrangement. Prosperity for us both.",
        "The numbers balance well. We have an accord.",
        "Your proposal has merit. Consider it agreed."
      ],
      counter: [
        "Interesting, but the scales are not quite balanced. We need...",
        "All things have a price. Yours is slightly higher than you think.",
        "A fair trade requires fair value. Add more gold, and we agree."
      ],
      reject: [
        "The mathematics simply don't work. Come back with better terms.",
        "We are merchants, not fools. This deal benefits only you."
      ],
      threaten: [
        "Our caravans may be peaceful, but our guards are not. Tread carefully.",
        "Perhaps we should discuss what happens to your trade routes if we refuse..."
      ],
      betrayed: [
        "Your credit with us is... exhausted. Permanently.",
        "We keep careful records. Your debts of dishonor cannot be repaid."
      ]
    },
    diplomat: {
      accept: [
        "A wise proposal. Let us seal this agreement with honor.",
        "You speak reason. We are pleased to accept.",
        "This serves both our peoples well. Agreed."
      ],
      counter: [
        "Your intentions seem genuine, but we require certain... assurances.",
        "Let us discuss the details further. Perhaps we can find middle ground.",
        "An interesting opening position. Shall we negotiate properly?"
      ],
      reject: [
        "We appreciate the attempt at dialogue, but these terms are unacceptable.",
        "Perhaps in time, with better relations, such an arrangement might work."
      ],
      threaten: [
        "We prefer words to swords, but do not mistake patience for weakness.",
        "Diplomacy requires good faith. Your offer shows none."
      ],
      betrayed: [
        "Trust, once broken, takes generations to rebuild. You have much work ahead.",
        "We have long memories. This conversation is premature."
      ]
    },
    militarist: {
      accept: [
        "A warrior's agreement. Short, direct, binding. Done.",
        "You show strength in this offer. We respect that.",
        "Alliances forged in purpose are strongest. We accept."
      ],
      counter: [
        "Alliances are forged in battle, not in words. Prove yourself first.",
        "You want our swords? Then match our commitment. More.",
        "Strength respects strength. Show us you are worth our steel."
      ],
      reject: [
        "Weakness. We do not ally with those who cannot fight.",
        "Your words are soft. Come back hardened by war."
      ],
      threaten: [
        "You should kneel and offer tribute, not make demands.",
        "Our armies grow restless. Give us a reason not to march on YOU."
      ],
      betrayed: [
        "Oathbreakers deserve only the sword. Speak quickly before we draw ours.",
        "You violated the warrior's code. There is no forgiveness for that."
      ]
    },
    expansionist: {
      accept: [
        "This serves our grand vision. We agree.",
        "Your proposal aligns with our ambitions. Done.",
        "Together, we shall reshape the map. Agreed."
      ],
      counter: [
        "We think bigger than this. What territories can you offer?",
        "Our vision requires more. What else do you bring to the table?",
        "This is a start, but we need guarantees of expansion."
      ],
      reject: [
        "This does nothing to advance our borders. Worthless.",
        "We seek to build an empire, not make petty deals."
      ],
      threaten: [
        "Everything you have could be ours. Consider that before offering so little.",
        "Our destiny is expansion. Either join us, or be consumed."
      ],
      betrayed: [
        "You interrupted our conquests with your betrayal. The price will be high.",
        "Traitors become targets. That is the natural order."
      ]
    },
    defender: {
      accept: [
        "Peace and security - what we desire most. Agreed.",
        "This protects our people. We accept with gratitude.",
        "A defensive pact serves us well. Done."
      ],
      counter: [
        "We need stronger guarantees of non-aggression. What say you?",
        "Our walls are strong, but assurances of peace are stronger. Add more.",
        "Protection of our lands must be absolute. Adjust your terms."
      ],
      reject: [
        "This threatens our security more than it helps. No.",
        "We will not trade our safety for uncertain promises."
      ],
      threaten: [
        "Our defenses are legendary. Attack us at your peril.",
        "We may be peaceful, but we are not helpless. Remember that."
      ],
      betrayed: [
        "You violated our trust and our borders. Forgiveness is... distant.",
        "We built walls because of people like you. They still stand."
      ]
    },
    opportunist: {
      accept: [
        "The timing is right, and so is the price. Deal.",
        "This benefits us in the current situation. Agreed.",
        "We see the advantage here. Done."
      ],
      counter: [
        "Good proposal, wrong price. The situation demands more.",
        "We read the winds of war. They say you need us more. Pay accordingly.",
        "Circumstances favor us. Your offer should reflect that."
      ],
      reject: [
        "The moment isn't right, and neither is your offer.",
        "We'll wait for a better opportunity. This isn't it."
      ],
      threaten: [
        "The balance of power favors us. Perhaps YOU should be offering tribute.",
        "We know weakness when we see it. Don't test us."
      ],
      betrayed: [
        "Your betrayal was... noted. It will cost you. Eventually.",
        "We are patient. Your treachery will be repaid when the time is right."
      ]
    }
  }

  const factionDialogues = dialogues[personality as keyof typeof dialogues] || dialogues.opportunist

  // Select response based on evaluation
  if (wasBetrayed && Math.random() > 0.3) {
    const responses = factionDialogues.betrayed
    return responses[Math.floor(Math.random() * responses.length)]
  }

  let responses: string[]
  switch (evaluation.responseType) {
    case 'accept':
      responses = factionDialogues.accept
      break
    case 'counter':
      responses = factionDialogues.counter
      // Add specifics about counter offer
      const base = responses[Math.floor(Math.random() * responses.length)]
      if (evaluation.counterOffer?.demandedGold) {
        return `${base} We require ${evaluation.counterOffer.demandedGold} gold.`
      }
      return base
    case 'reject_final':
      responses = factionDialogues.reject
      break
    case 'threaten':
      responses = factionDialogues.threaten
      break
    default:
      responses = factionDialogues.reject
  }

  // Add context about specific terms
  let response = responses[Math.floor(Math.random() * responses.length)]

  // Special dialogue for "destroy enemy" proposals
  if (terms.targetFactionId && evaluation.vengeanceValue > 30) {
    const targetFaction = gameState.factions.get(terms.targetFactionId)
    if (targetFaction) {
      const enemyResponses = [
        `The ${targetFaction.name}... yes, they have been a thorn in our side. Your proposal intrigues us.`,
        `You wish to move against the ${targetFaction.name}? Perhaps we have more in common than we thought.`,
        `Destroying the ${targetFaction.name} would serve our interests greatly. Continue.`
      ]
      if (evaluation.willAccept) {
        return `${enemyResponses[Math.floor(Math.random() * enemyResponses.length)]} ${response}`
      }
    }
  }

  return response
}

// Generate opening greeting based on relationship
export function generateGreeting(
  aiFaction: Faction,
  playerFaction: Faction,
  relation: DiplomaticRelation | undefined
): string {
  const config = FACTION_CONFIG[aiFaction.id]
  const personality = config?.personality || 'opportunist'
  const relationValue = relation?.value || 0
  const wasBetrayed = relation?.treaties?.some(t => !t.isActive && t.type === 'alliance')
  const isAtWar = relation?.status === 'war'

  if (wasBetrayed) {
    return `You have some nerve showing your face here after what you did. Speak quickly, before we change our mind about listening.`
  }

  if (isAtWar) {
    return `We are at war, and yet you come to talk. Either you seek surrender, or you bring terms worthy of our attention. Which is it?`
  }

  if (relationValue >= 50) {
    return `Ah, our trusted friend! It is always a pleasure to speak with you. What brings you to our court today?`
  }

  if (relationValue >= 20) {
    return `Welcome. Our relations have been... cordial. What do you wish to discuss?`
  }

  if (relationValue >= -20) {
    return `State your business. We will listen, though we promise nothing.`
  }

  if (relationValue >= -50) {
    return `You dare approach us? We have little patience for your kind. Speak, and be quick about it.`
  }

  return `Every moment in your presence is a moment wasted. You have ONE chance to say something worth hearing.`
}
