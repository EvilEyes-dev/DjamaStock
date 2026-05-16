const KEY = 'djamastock_offline_queue'

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function enqueue(action) {
  const queue = getQueue()
  queue.push({ ...action, id: crypto.randomUUID(), createdAt: Date.now() })
  localStorage.setItem(KEY, JSON.stringify(queue))
}

export function removeFromQueue(id) {
  const queue = getQueue().filter(a => a.id !== id)
  localStorage.setItem(KEY, JSON.stringify(queue))
}

export function clearQueue() {
  localStorage.removeItem(KEY)
}
