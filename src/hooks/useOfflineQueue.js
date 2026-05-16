import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { enqueue, getQueue, removeFromQueue } from '../lib/offlineQueue'

// Executes a single queued sale action against Supabase
async function executeSale(action) {
  const { salePayload, productId, newQuantity, debtPayload } = action

  const { data: saleData, error } = await supabase
    .from('sales').insert(salePayload).select().single()
  if (error) throw error

  await supabase.from('products').update({ quantity: newQuantity }).eq('id', productId)

  if (debtPayload) {
    await supabase.from('debts').insert({ ...debtPayload, sale_id: saleData.id })
  }
}

export function useOfflineQueue() {
  const [pending, setPending] = useState(getQueue().length)
  const [syncing, setSyncing] = useState(false)

  const sync = useCallback(async () => {
    const queue = getQueue()
    if (queue.length === 0 || !navigator.onLine) return
    setSyncing(true)
    for (const action of queue) {
      try {
        await executeSale(action)
        removeFromQueue(action.id)
        setPending(p => Math.max(0, p - 1))
      } catch (e) {
        console.error('Sync failed for action', action.id, e)
        break // stop on first failure, retry next time
      }
    }
    setSyncing(false)
  }, [])

  // Sync when coming back online
  useEffect(() => {
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [sync])

  // Try to sync on mount (in case there's a queue from a previous session)
  useEffect(() => { sync() }, [])

  function addToQueue(action) {
    enqueue(action)
    setPending(p => p + 1)
  }

  return { pending, syncing, addToQueue, sync }
}
