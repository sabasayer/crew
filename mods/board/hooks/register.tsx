import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Agent, Board, Ticket } from '../types'
import { age, bar, isStale, parseAgent, sortChain } from './board'

const PANE = 'crew-board'
const POLL_MS = 2_000
const board = atom({ plugin: 'crew-board', key: 'board' } as const, { tickets: [], now: 0 } as Board)

const LOOK: Record<string, { icon: string; color: string }> = {
  queued: { icon: '○', color: 'gray' },
  running: { icon: '▶', color: 'cyan' },
  blocked: { icon: '⏸', color: 'yellow' },
  done: { icon: '✔', color: 'green' },
  failed: { icon: '✖', color: 'red' },
}
const UNKNOWN = { icon: '?', color: 'red' }

async function scan($: EngineInterface, root: string): Promise<Board> {
  const now = Date.now()
  const folders = (await $.fs.list(root).catch(() => [])).filter(f => f.kind === 'directory')
  const tickets = await Promise.all(
    folders.map(async (folder): Promise<Ticket> => {
      const dir = `${root}/${folder.name}`
      const files = (await $.fs.list(dir).catch(() => [])).filter(f => f.name.endsWith('.json'))
      const agents = await Promise.all(
        files.map(async f => parseAgent(f.name, await $.fs.read(`${dir}/${f.name}`).catch(() => '{'), f.mtimeMs)),
      )

      return { name: folder.name, agents: sortChain(agents), newestMs: Math.max(folder.mtimeMs, ...agents.map(a => a.updatedMs)) }
    }),
  )

  return { tickets: tickets.sort((a, b) => b.newestMs - a.newestMs), now }
}

const refresh = ($: EngineInterface, root: string) => scan($, root).then(next => update($, board, () => next))

export const register: Register = (on, options) => {
  const root = String(options?.root ?? '/tmp/crew')

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'crew-board', description: 'Show the live board of /crew agents' })
    await refresh($, root)
    $.clock.every(POLL_MS, () => refresh($, root))

    return next(e)
  })

  on('command.run', { command: 'crew-board' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Crew' })

    return { text: 'Crew board opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const { tickets, now } = await read($, board)
    const tick = Math.floor(now / POLL_MS)
    const columns = e.viewport?.columns ?? 100
    const room = Math.max(1, (e.viewport?.rows ?? 30) - 3)
    let used = 0

    if (tickets.length === 0) return <Text dimColor>No crew run found in {root}.</Text>

    const row = (a: Agent) => {
      const stale = isStale(a, now)
      const look = LOOK[a.state] ?? UNKNOWN
      const count = a.done != null && a.total != null ? ` ${a.done}/${a.total}` : ''

      return (
        <Text wrap="truncate-end">
          <Text color={stale ? 'red' : look.color} bold>
            {look.icon} {a.role.padEnd(18)}
          </Text>
          <Text color={look.color}> {a.state.padEnd(8)} </Text>
          <Text color={stale ? 'red' : look.color}>{bar(a, 12, tick)}</Text>
          <Text dimColor>{count.padEnd(8)}</Text>
          <Text> {a.phase ?? ''}</Text>
          <Text color={stale ? 'red' : undefined} dimColor={!stale} bold={stale}>
            {'  '}
            {age(now - a.updatedMs)} ago{stale ? '  STALE' : ''}
          </Text>
        </Text>
      )
    }

    const chain = (agents: Agent[]) => (
      <Text wrap="truncate-end">
        {agents.map((a, i) => (
          <Text color={isStale(a, now) ? 'red' : (LOOK[a.state] ?? UNKNOWN).color} bold={a.state === 'running'}>
            {i > 0 ? ' → ' : ''}
            {(LOOK[a.state] ?? UNKNOWN).icon} {a.role}
          </Text>
        ))}
      </Text>
    )

    return (
      <Box flexDirection="column">
        {tickets.map((t, i) => {
          const lines = 3 + t.agents.length
          const shown = used + lines <= room || i === 0
          used += lines

          return shown ? (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold color="magenta">
                {t.name}
                <Text dimColor> {'─'.repeat(Math.max(0, Math.min(columns, 100) - t.name.length - 2))}</Text>
              </Text>
              {chain(t.agents)}
              {t.agents.map(row)}
            </Box>
          ) : null
        })}
      </Box>
    )
  })
}
