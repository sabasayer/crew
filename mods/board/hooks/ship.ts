import type { Agent } from '../types'

export type Run = { t: string; fg?: string; bg?: string }
type Grid = (string | null)[][]

export const WIDTH = 22
const HEIGHT = 10
const SAIL = '#e8e4d8'
const WOOD = '#8b5a2b'
const HULL = '#5c3a1c'
const SKIN = '#f2c9a0'
const SEA = '#3b82c4'
const CREW_X = [2, 4, 6, 10, 12, 14, 16, 18]
const STATE_COLOR: Record<string, string> = {
  queued: '#8a8a8a',
  running: '#33c3d6',
  blocked: '#e5c04b',
  done: '#4fbf6f',
  failed: '#e5484d',
}

export function drawShip(agents: Agent[], frame: number, isSailing: boolean): Grid {
  const grid: Grid = Array.from({ length: HEIGHT }, () => Array<string | null>(WIDTH).fill(null))
  const dy = isSailing && frame % 2 ? 1 : 0
  const put = (x: number, y: number, color: string) => {
    if (grid[y + dy]?.[x] !== undefined) grid[y + dy]![x] = color
  }
  const allDone = agents.length > 0 && agents.every(a => a.state === 'done')
  const anyFailed = agents.some(a => a.state === 'failed')
  const flag = anyFailed ? STATE_COLOR.failed! : allDone ? STATE_COLOR.done! : '#d9534f'

  for (let y = 0; y <= 6; y++) put(8, y, WOOD)
  put(9, 0, flag)
  if (isSailing && frame % 2) put(10, 0, flag)
  for (let y = 1; y <= 4; y++) {
    for (let x = 8 - y; x < 8; x++) put(x, y, SAIL)
    for (let x = 9; x <= 9 + y; x++) put(x, y, SAIL)
  }
  for (let x = 1; x <= 20; x++) put(x, 7, HULL)
  for (let x = 3; x <= 18; x++) put(x, 8, HULL)

  agents.slice(0, CREW_X.length).forEach((a, i) => {
    const x = CREW_X[i]!
    const hop = a.state === 'running' && (frame + i) % 2 ? 1 : 0
    put(x, 5 - hop, SKIN)
    put(x, 6 - hop, STATE_COLOR[a.state] ?? '#e5484d')
  })

  return grid
}

export function halfBlocks(grid: Grid): Run[][] {
  const lines: Run[][] = []
  for (let y = 0; y < grid.length; y += 2) {
    const runs: Run[] = []
    for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
      const top = grid[y]![x] ?? undefined
      const bottom = grid[y + 1]?.[x] ?? undefined
      const cell: Run = !top && !bottom ? { t: ' ' } : top && bottom ? { t: '▀', fg: top, bg: bottom } : top ? { t: '▀', fg: top } : { t: '▄', fg: bottom }
      const last = runs[runs.length - 1]
      if (last && last.fg === cell.fg && last.bg === cell.bg) last.t += cell.t
      else runs.push(cell)
    }
    lines.push(runs)
  }

  return lines
}

export function water(frame: number, isSailing: boolean): Run {
  const shift = isSailing ? frame % 4 : 0

  return { t: '≈≈~~'.repeat(WIDTH).slice(shift, shift + WIDTH), fg: SEA }
}
