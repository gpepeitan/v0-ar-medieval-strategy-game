'use client'


import { useState } from 'react'
import { useGameStore } from '@/lib/game/store'
import { ChevronUp, ChevronDown, Scroll, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EventLog() {
  const [isExpanded, setIsExpanded] = useState(false)
  const game = useGameStore(state => state.game)
  
  if (!game) return null
  
  const recentEvents = game.eventLog
    .filter(e => e.factionIds.some(fid => game.factions.get(fid)?.isPlayer))
    .slice(-10)
    .reverse()
  
  const unreadCount = recentEvents.filter(e => !e.isRead).length
  
  if (recentEvents.length === 0) return null
  
  return (
    <div className="absolute top-4 right-4 z-[1000] w-72">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-t-lg',
          'bg-slate-900/95 backdrop-blur-sm border border-slate-700',
          !isExpanded && 'rounded-b-lg',
          'hover:bg-slate-800/95 transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          <Scroll className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-slate-200">Event Log</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-semibold bg-amber-600 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-t-0 border-slate-700 rounded-b-lg max-h-80 overflow-y-auto">
          {recentEvents.map(event => (
            <div 
              key={event.id}
              className={cn(
                'px-3 py-2 border-b border-slate-800 last:border-0',
                !event.isRead && 'bg-slate-800/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200">
                    {event.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {event.description}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Turn {event.turn}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {recentEvents.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              No events yet
            </div>
          )}
        </div>
      )}
    </div>
  )
}
