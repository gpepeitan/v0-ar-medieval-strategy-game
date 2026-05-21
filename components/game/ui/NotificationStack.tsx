'use client'


import { useGameStore } from '@/lib/game/store'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationStack() {
  const notifications = useGameStore(state => state.ui.notifications)
  const removeNotification = useGameStore(state => state.removeNotification)
  
  if (notifications.length === 0) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right',
            {
              'border-slate-700 bg-slate-800/95': notification.type === 'info',
              'border-amber-700 bg-amber-900/95': notification.type === 'warning',
              'border-emerald-700 bg-emerald-900/95': notification.type === 'success',
              'border-red-700 bg-red-900/95': notification.type === 'danger',
            }
          )}
        >
          <div className="shrink-0">
            {notification.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
            {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
            {notification.type === 'danger' && <AlertCircle className="h-5 w-5 text-red-400" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-100">
              {notification.title}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {notification.message}
            </div>
          </div>
          
          <button
            onClick={() => removeNotification(notification.id)}
            className="shrink-0 text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
