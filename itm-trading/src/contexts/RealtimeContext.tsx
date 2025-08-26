"use client"
import { createContext, useContext, useEffect, useRef } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeContextType {
  subscribeToTable: (table: string, callback: (payload: any) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())

  const subscribeToTable = (table: string, callback: (payload: any) => void) => {
    const channelName = `realtime:${table}`
    
    // Check if channel already exists
    if (channelsRef.current.has(channelName)) {
      const existingChannel = channelsRef.current.get(channelName)!
      existingChannel.on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      return () => {
        existingChannel.unsubscribe()
      }
    }

    // Create new channel
    const channel = supabaseBrowser()
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe()

    channelsRef.current.set(channelName, channel)

    return () => {
      channel.unsubscribe()
      supabaseBrowser().removeChannel(channel)
      channelsRef.current.delete(channelName)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup all channels on unmount
      channelsRef.current.forEach(channel => {
        supabaseBrowser().removeChannel(channel)
      })
      channelsRef.current.clear()
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ subscribeToTable }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}
