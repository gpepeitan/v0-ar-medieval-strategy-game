'use client'


import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SidePanelProps {
  side: 'left' | 'right'
  children: ReactNode
}

export function SidePanel({ side, children }: SidePanelProps) {
  const hasContent = !!children
  
  if (!hasContent) {
    return null
  }
  
  return (
    <aside 
      className={cn(
        'w-80 shrink-0 border-slate-800 bg-slate-900/95 backdrop-blur-sm overflow-y-auto',
        side === 'left' ? 'border-r' : 'border-l'
      )}
    >
      {children}
    </aside>
  )
}
