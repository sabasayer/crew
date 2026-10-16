import type { Agent } from '../types'

export const STALE_MS = 15 * 60_000

const CHAIN = ['gate-spec', 'spec', 'spike', 'red', 'pin', 'gate-tests', 'green', 'move', 'review', 'fixer', 'browser', 'gate-captain']

export function chainIndex(role: string) {
  const i = CHAIN.findIndex(name => role === name || role.startsWith(`${name}-`))

  return i === -1 ? CHAIN.length : i
}

export function sortChain(agents: Agent[]) {
  return [...agents].sort(
    (a, b) =>
      (a.order ?? Infinity) - (b.order ?? Infinity) ||
      chainIndex(a.role) - chainIndex(b.role) ||
      a.role.localeCompare(b.role),
  )
}

export function parseAgent(file: string, text: string, mtimeMs: number): Agent {
  const fallback = file.replace(/\.json$/, '')
  try {
    const j = JSON.parse(text)
    const updated = Date.parse(j.updated)

    return {
      role: String(j.role ?? fallback),
      state: String(j.state ?? 'unknown'),
      phase: j.phase == null ? undefined : String(j.phase),
      done: typeof j.done === 'number' ? j.done : undefined,
      total: typeof j.total === 'number' ? j.total : undefined,
      summary: j.summary == null ? undefined : String(j.summary),
      order: typeof j.order === 'number' ? j.order : undefined,
      updatedMs: Number.isNaN(updated) ? mtimeMs : updated,
    }
  } catch {
    return { role: fallback, state: 'unreadable', updatedMs: mtimeMs, broken: true }
  }
}

export const isStale = (a: Agent, now: number) => a.state === 'running' && now - a.updatedMs > STALE_MS

export function age(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`

  return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`
}

export function bar(a: Agent, width: number, tick: number) {
  if (a.done != null && a.total) {
    const filled = Math.min(width, Math.round((width * a.done) / a.total))

    return '█'.repeat(filled) + '░'.repeat(width - filled)
  }
  if (a.state === 'done') return '█'.repeat(width)
  if (a.state !== 'running') return '░'.repeat(width)
  const at = tick % width

  return '░'.repeat(at) + '██' + '░'.repeat(Math.max(0, width - at - 2))
}
