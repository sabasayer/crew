import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Agent, Board, Ticket } from '../types'
import { age, bar, isStale, parseAgent, sortChain } from './board'
import { WIDTH, drawShip, halfBlocks, water } from './ship'

const PANE = 'crew-board'
const POLL_MS = 2_000
const FRAME_MS = 500
const board = atom({ plugin: 'crew-board', key: 'board' } as const, { tickets: [], now: 0 } as Board)

const focus = atom({ plugin: 'crew-board', key: 'focus' } as const, '')
const TOOL = 'crew_board_open'
const frame = atom({ plugin: 'crew-board', key: 'frame' } as const, 0)
const isSailing = (t: Ticket, now: number) => t.agents.some(a => a.state === 'running' && !isStale(a, now))

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
  const folders = (await $.fs.list(root).catch(() => [])).filter(f => f.kind === 'dir')
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

  return { tickets: tickets.filter(t => t.agents.length > 0).sort((a, b) => b.newestMs - a.newestMs), now }
}

const refresh = ($: EngineInterface, root: string) => scan($, root).then(next => update($, board, () => next))

const show = async ($: EngineInterface, ticket: string) => {
  await update($, focus, () => ticket)
  await $.ui.open({ id: PANE, title: ticket ? `Crew · ${ticket}` : 'Crew' })
}

export const register: Register = (on, options) => {
  const root = String(options?.root ?? '/tmp/crew')

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'crew-board',
      description: 'Show the live board of /crew agents. Add a ticket name to show only that ticket',
      argumentHint: '[ticket]',
    })
    await $.tool.register({
      name: TOOL,
      description: 'Open the crew board pane for one ticket. Call it once when a /crew run starts. The ticket is the folder name under /tmp/crew.',
      inputSchema: { type: 'object', properties: { ticket: { type: 'string' } }, required: ['ticket'] },
      isDeferred: false,
    })
    await refresh($, root)
    $.clock.every(POLL_MS, () => refresh($, root))
    $.clock.every(FRAME_MS, async () => {
      const { tickets, now } = await read($, board)
      if (tickets.some(t => isSailing(t, now))) await update($, frame, n => n + 1)
    })

    return next(e)
  })

  on('command.run', { command: 'crew-board' }, async ($, e) => {
    const ticket = e.args.trim()
    await show($, ticket)

    return { text: ticket ? `Crew board opened for ${ticket}.` : 'Crew board opened.' }
  })

  on('tool.call', { tool: 'mcp__crew-board__crew_board_open' }, async ($, e) => {
    const ticket = String((e as { ticket?: unknown }).ticket ?? '').trim()
    await show($, ticket)

    return { result: ticket ? `Crew board opened for ${ticket}.` : 'Crew board opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const all = await read($, board)
    const only = (await read($, focus)).toLowerCase()
    const tickets = only ? all.tickets.filter(t => t.name.toLowerCase() === only) : all.tickets
    const now = all.now
    const step = await read($, frame)
    const tick = Math.floor(now / POLL_MS)
    const columns = e.viewport?.columns ?? 100
    const room = Math.max(1, (e.viewport?.rows ?? 30) - 3)
    let used = 0

    if (tickets.length === 0) {
      return <Text dimColor>{only ? `Waiting for ${root}/${only} ... (/crew-board shows all tickets)` : `No crew run found in ${root}.`}</Text>
    }

    const row = (a: Agent) => {
      const stale = isStale(a, now)
      const look = LOOK[a.state] ?? UNKNOWN
      const count = a.done != null && a.total != null ? ` ${a.done}/${a.total}` : ''

      return (
        <Text wrap="truncate-end">
          <Text color={stale ? 'red' : look.color} bold>
            {look.icon}{' '}
          </Text>
          <Text bold>{a.role.padEnd(18)}</Text>
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
          <Text>
            <Text dimColor>{i > 0 ? ' → ' : ''}</Text>
            <Text color={isStale(a, now) ? 'red' : (LOOK[a.state] ?? UNKNOWN).color}>{(LOOK[a.state] ?? UNKNOWN).icon} </Text>
            <Text bold={a.state === 'running'} dimColor={a.state === 'queued'}>{a.role}</Text>
          </Text>
        ))}
      </Text>
    )

    return (
      <Box flexDirection="column">
        {tickets.map((t, i) => {
          const lines = 8 + t.agents.length
          const sea = water(step, isSailing(t, now))
          const shown = used + lines <= room || i === 0
          used += lines

          return shown ? (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold color="magenta">
                {t.name}
                <Text dimColor> {'─'.repeat(Math.max(0, Math.min(columns, 100) - t.name.length - 2))}</Text>
              </Text>
              <Box>
                <Box flexDirection="column" width={WIDTH + 2}>
                  {halfBlocks(drawShip(t.agents, step, isSailing(t, now))).map(runs => (
                    <Text>
                      {runs.map(r => (
                        <Text color={r.fg} backgroundColor={r.bg}>
                          {r.t}
                        </Text>
                      ))}
                    </Text>
                  ))}
                  <Text color={sea.fg}>{sea.t}</Text>
                </Box>
                <Box flexDirection="column">{chain(t.agents)}</Box>
              </Box>
              {t.agents.map(row)}
            </Box>
          ) : null
        })}
      </Box>
    )
  })
}
