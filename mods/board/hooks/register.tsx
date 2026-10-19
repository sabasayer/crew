import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Agent, Board, Ticket } from '../types'
import { LEGACY_ROOT, age, bar, isStale, oldRuns, parseAgent, resolveRoot, sortChain } from './board'
import { drawShip, halfBlocks, hatSvg, miniHatGrid, shipSvg, shipWidth, water } from './ship'

const PANE = 'crew-board'
const POLL_MS = 2_000
const FRAME_MS = 500
const board = atom({ plugin: 'crew-board', key: 'board' } as const, { tickets: [], now: 0 } as Board)

const focus = atom({ plugin: 'crew-board', key: 'focus' } as const, '')
const style = atom({ plugin: 'crew-board', key: 'style' } as const, '')
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

async function scanRoot($: EngineInterface, root: string): Promise<Ticket[]> {
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

  return tickets.filter(t => t.agents.length > 0)
}

async function scan($: EngineInterface, root: string): Promise<Board> {
  const now = Date.now()
  const main = await scanRoot($, root)
  const legacy = root === LEGACY_ROOT ? [] : (await scanRoot($, LEGACY_ROOT)).filter(t => !main.some(m => m.name === t.name))

  return { tickets: [...main, ...legacy].sort((a, b) => b.newestMs - a.newestMs), now }
}

const refresh = ($: EngineInterface, root: string) => scan($, root).then(next => update($, board, () => next))

const cleanRuns = async ($: EngineInterface, root: string, isConfirmed: boolean) => {
  await refresh($, root)
  const { tickets, now } = await read($, board)
  const folders = (await $.fs.list(root).catch(() => [])).filter(f => f.kind === 'dir').map(f => f.name)
  const old = oldRuns(tickets, now).filter(t => folders.includes(t.name))
  if (old.length === 0) return { text: `No runs older than 30 days in ${root}.` }
  const names = old.map(t => `${t.name} (${Math.floor((now - t.newestMs) / 86_400_000)} days old)`).join('\n')
  if (!isConfirmed) return { text: `Runs older than 30 days in ${root}:\n${names}\nTo delete them, type: /crew-board clean yes` }
  const gone = await Promise.all(old.map(t => $.process.run(['rm', '-r', '--', `${root}/${t.name}`]).then(r => r.exitCode === 0)))
  await refresh($, root)

  return { text: `Deleted ${gone.filter(Boolean).length} of ${old.length} runs from ${root}.` }
}

let rootPromise: Promise<string> | undefined

const getRoot = ($: EngineInterface, option: unknown) =>
  (rootPromise ??= (async () => resolveRoot(await $.env.get('CREW_BOARD_ROOT'), option, await $.env.get('HOME')))())

const show = async ($: EngineInterface, ticket: string) => {
  await update($, focus, () => ticket)
  await $.ui.open({ id: PANE, title: ticket ? `Crew · ${ticket}` : 'Crew' })
}

export const register: Register = (on, options) => {
  const configured = String(options?.style ?? 'full')
  const rootOption = options?.root

  on('session.start', async ($, e, next) => {
    const root = await getRoot($, rootOption)
    await $.process.run(['mkdir', '-p', root]).catch(() => undefined)
    await $.command.register({
      name: 'crew-board',
      description: 'Show the live board of /crew agents. Add a ticket name to show only that ticket. Use "style" to switch between full and simple, or "style full" or "style simple" to pick one. Use "clean" to list runs older than 30 days',
      argumentHint: '[ticket | style [full|simple] | clean [yes]]',
    })
    await $.tool.register({
      name: TOOL,
      description: `Open the crew board pane for one ticket. Call it once when a /crew run starts. The ticket is the folder name under ${root}.`,
      inputSchema: { type: 'object', properties: { ticket: { type: 'string' } }, required: ['ticket'] },
      isDeferred: false,
    })
    const saved = await $.store.get('style')
    if (saved === 'full' || saved === 'simple') await update($, style, () => saved)
    await refresh($, root)
    $.clock.every(POLL_MS, () => refresh($, root))
    $.clock.every(FRAME_MS, async () => {
      const { tickets, now } = await read($, board)
      if (tickets.some(t => isSailing(t, now))) await update($, frame, n => n + 1)
    })

    return next(e)
  })

  on('command.run', { command: 'crew-board' }, async ($, e) => {
    const styleArgs = e.args.trim().match(/^style(?:\s+(\S+))?$/i)
    if (styleArgs) {
      const asked = styleArgs[1]?.toLowerCase()
      if (asked && asked !== 'full' && asked !== 'simple') return { text: 'Style is "full" or "simple".' }
      const now = (await read($, style)) || configured
      const next = asked ?? (now === 'simple' ? 'full' : 'simple')
      await update($, style, () => next)
      await $.store.set('style', next)

      return { text: `Crew board style: ${next}.` }
    }
    const cleanArgs = e.args.trim().match(/^clean(?:\s+(\S+))?$/i)
    if (cleanArgs) {
      const asked = cleanArgs[1]?.toLowerCase()
      if (asked && asked !== 'yes') return { text: 'Use "clean" to list old runs, or "clean yes" to delete them.' }

      return cleanRuns($, await getRoot($, rootOption), asked === 'yes')
    }
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
    const isFull = ((await read($, style)) || configured) !== 'simple'
    const root = await getRoot($, rootOption)
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const useSvg = e.surface !== 'terminal' && 'Svg' in ui
    const all = await read($, board)
    const only = (await read($, focus)).toLowerCase()
    const tickets = only ? all.tickets.filter(t => t.name.toLowerCase() === only) : all.tickets
    const now = all.now
    const step = await read($, frame)
    const tick = Math.floor(now / POLL_MS)
    const room = Math.max(1, (e.viewport?.rows ?? 30) - 4)
    let used = 0

    if (tickets.length === 0) {
      return <Text dimColor>{only ? `Waiting for ${root}/${only} ... (/crew-board shows all tickets)` : `No crew run found in ${root}.`}</Text>
    }

    const row = (a: Agent) => {
      const stale = isStale(a, now)
      const look = LOOK[a.state] ?? UNKNOWN
      const count = a.done != null && a.total != null ? ` ${a.done}/${a.total}` : ''

      const icon = (
        <Text color={stale ? 'red' : look.color} bold>
          {look.icon}{' '}
        </Text>
      )
      const rest = [
        <Text bold>{a.role.padEnd(18)}</Text>,
        <Text color={look.color}> {a.state.padEnd(8)} </Text>,
        <Text color={stale ? 'red' : look.color}>{bar(a, 12, tick)}</Text>,
        <Text dimColor>{count.padEnd(8)}</Text>,
        <Text> {(a.state === 'done' || a.state === 'failed' ? a.summary : undefined) || a.phase || ''}</Text>,
        <Text color={stale ? 'red' : undefined} dimColor={!stale} bold={stale}>
          {'  '}
          {age(now - a.updatedMs)} ago{stale ? '  STALE' : ''}
        </Text>,
      ]

      if (!isFull) {
        return (
          <Text wrap="truncate-end">
            {icon}
            {rest}
          </Text>
        )
      }
      if (useSvg) {
        return (
          <Box>
            {icon}
            <ui.Svg {...hatSvg(a.role, 3)} alt={`${a.role} hat`} />
            <Text wrap="truncate-end"> {rest}</Text>
          </Box>
        )
      }

      return (
        <Text wrap="truncate-end">
          {icon}
          {halfBlocks(miniHatGrid(a.role))[0]!.map(r => (
            <Text color={r.fg} backgroundColor={r.bg}>
              {r.t}
            </Text>
          ))}
          <Text> </Text>
          {rest}
        </Text>
      )
    }

    const svg = (t: Ticket, at: number, n: number) => shipSvg(drawShip(t.agents, n, isSailing(t, at), isFull, at), n, isSailing(t, at), 6)

    const summary = (agents: Agent[]) => (
      <Text wrap="truncate-end">
        <Text bold>
          {agents.filter(a => a.state === 'done').length}/{agents.length} done
        </Text>
        {['running', 'blocked', 'failed', 'queued'].map(state => {
          const n = agents.filter(a => a.state === state).length

          return n ? (
            <Text color={LOOK[state]!.color}>
              {'  '}
              {LOOK[state]!.icon} {n}
            </Text>
          ) : null
        })}
      </Text>
    )

    return (
      <Box flexDirection="column">
        <Text dimColor wrap="truncate-end">
          Files: {root}
          {root === LEGACY_ROOT ? '' : ` (old runs in ${LEGACY_ROOT} also show)`}
        </Text>
        {tickets.map((t, i) => {
          const lines = (isFull ? 11 : 9) + t.agents.length * (useSvg || !isFull ? 1 : 2)
          const sea = water(step, isSailing(t, now), shipWidth(t.agents.length, isFull))
          const shown = used + lines <= room || i === 0
          used += lines

          return shown ? (
            <Box flexDirection="column" marginBottom={1}>
              <Text bold color="magenta">
                {t.name}
              </Text>
              <Box>
                {useSvg ? (
                  <ui.Svg {...svg(t, now, step)} alt={`${t.name} ship`} />
                ) : (
                  <Box flexDirection="column" width={shipWidth(t.agents.length, isFull) + 2} flexShrink={0}>
                    {halfBlocks(drawShip(t.agents, step, isSailing(t, now), isFull, now)).map(runs => (
                      <Text wrap="truncate">
                        {runs.map(r => (
                          <Text color={r.fg} backgroundColor={r.bg}>
                            {r.t}
                          </Text>
                        ))}
                      </Text>
                    ))}
                    <Text color={sea.fg}>{sea.t}</Text>
                  </Box>
                )}
                <Box flexDirection="column">{summary(t.agents)}</Box>
              </Box>
              {t.agents.map(a => (
                <Box marginBottom={useSvg || !isFull ? 0 : 1}>{row(a)}</Box>
              ))}
            </Box>
          ) : null
        })}
      </Box>
    )
  })
}
