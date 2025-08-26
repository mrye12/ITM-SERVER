"use client"
import { useState, useEffect, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useRealtime } from '@/contexts/RealtimeContext'

interface UseRealtimeTableOptions<T> {
  table: string
  select?: string
  orderBy?: { column: string; ascending?: boolean }
  filter?: { column: string; operator: string; value: any }
}

export function useRealtimeTable<T = any>(options: UseRealtimeTableOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribeToTable } = useRealtime()

  const { table, select = '*', orderBy, filter } = options

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabaseBrowser().from(table).select(select)

      if (filter) {
        query = query.filter(filter.column, filter.operator, filter.value)
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false })
      }

      const { data: result, error: fetchError } = await query

      if (fetchError) throw fetchError

      setData((result as T[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [table, select, orderBy, filter])

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setData(currentData => {
      switch (eventType) {
        case 'INSERT':
          // Add new record, maintain order
          const newData = [...currentData, newRecord]
          if (orderBy) {
            return newData.sort((a, b) => {
              const aVal = a[orderBy.column]
              const bVal = b[orderBy.column]
              if (orderBy.ascending) {
                return aVal > bVal ? 1 : -1
              } else {
                return aVal < bVal ? 1 : -1
              }
            })
          }
          return newData

        case 'UPDATE':
          return currentData.map(item => 
            (item as any).id === newRecord.id ? newRecord : item
          )

        case 'DELETE':
          return currentData.filter(item => (item as any).id !== oldRecord.id)

        default:
          return currentData
      }
    })
  }, [orderBy])

  useEffect(() => {
    fetchData()

    // Subscribe to realtime changes
    const unsubscribe = subscribeToTable(table, handleRealtimeUpdate)

    return () => {
      unsubscribe()
    }
  }, [fetchData, subscribeToTable, table, handleRealtimeUpdate])

  // Insert function with optimistic update
  const insert = useCallback(async (newItem: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: result, error } = await supabaseBrowser()
        .from(table)
        .insert(newItem)
        .select()
        .single()

      if (error) throw error

      // Optimistic update will be handled by realtime subscription
      return { data: result, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Insert failed' 
      }
    }
  }, [table])

  // Update function with optimistic update
  const update = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const { data: result, error } = await supabaseBrowser()
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data: result, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Update failed' 
      }
    }
  }, [table])

  // Delete function
  const remove = useCallback(async (id: string) => {
    try {
      const { error } = await supabaseBrowser()
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Delete failed' 
      }
    }
  }, [table])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    insert,
    update,
    remove
  }
}
