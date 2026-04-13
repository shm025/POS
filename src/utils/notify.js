// Module-level event bus — callable from hooks, utils, anywhere without React deps
const listeners = new Set()

export function notify(msg, type = 'success') {
  listeners.forEach(fn => fn(msg, type))
}

export function subscribeNotify(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
