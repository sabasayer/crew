import type { Agent } from '../types'

export type Run = { t: string; fg?: string; bg?: string }
type Grid = (string | null)[][]

export const WIDTH = 34
const SAIL = '#e8e4d8'
const WOOD = '#8b5a2b'
const HULL = '#5c3a1c'
const SKIN = '#f2c9a0'
const SEA = '#3b82c4'
const CREW_X = [2, 4, 6, 10, 12, 14, 16, 18]
const CHARACTER_X = [0, 4, 10, 14, 18, 22, 26, 30]
const HATS = ['#d9534f', '#4f8fd9', '#e5c04b', '#9b6fd1', '#e08a3c', '#3fb3a0', '#d96fa8', '#8a8a8a']
const LEGS = '#3a3a4a'
const STATE_COLOR: Record<string, string> = {
  queued: '#8a8a8a',
  running: '#33c3d6',
  blocked: '#e5c04b',
  done: '#4fbf6f',
  failed: '#e5484d',
}

const hash = (text: string) => [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)

export function drawShip(agents: Agent[], frame: number, isSailing: boolean, characters = false): Grid {
  const deck = characters ? 9 : 7
  const grid: Grid = Array.from({ length: deck + 3 }, () => Array<string | null>(WIDTH).fill(null))
  const dy = isSailing && frame % 2 ? 1 : 0
  const put = (x: number, y: number, color: string) => {
    if (grid[y + dy]?.[x] !== undefined) grid[y + dy]![x] = color
  }
  const allDone = agents.length > 0 && agents.every(a => a.state === 'done')
  const anyFailed = agents.some(a => a.state === 'failed')
  const flag = anyFailed ? STATE_COLOR.failed! : allDone ? STATE_COLOR.done! : '#d9534f'

  for (let y = 0; y < deck; y++) put(8, y, WOOD)
  put(9, 0, flag)
  if (isSailing && frame % 2) put(10, 0, flag)
  for (let y = 1; y <= 4; y++) {
    for (let x = 8 - y; x < 8; x++) put(x, y, SAIL)
    for (let x = 9; x <= 9 + y; x++) put(x, y, SAIL)
  }
  for (let x = 0; x < WIDTH; x++) put(x, deck, HULL)
  for (let x = 2; x < WIDTH - 2; x++) put(x, deck + 1, HULL)

  const spots = characters ? CHARACTER_X : CREW_X
  agents.slice(0, spots.length).forEach((a, i) => {
    const x = spots[i]!
    const body = STATE_COLOR[a.state] ?? '#e5484d'
    const working = a.state === 'running' && (frame + i) % 2 === 1
    if (!characters) {
      put(x, deck - 2 - (working ? 1 : 0), SKIN)
      put(x, deck - 1 - (working ? 1 : 0), body)

      return
    }
    const look = hash(a.role)
    const hat = HATS[look % HATS.length]!
    const top = deck - 4
    put(x + 1, top, hat)
    if (look % 2) {
      put(x, top, hat)
      put(x + 2, top, hat)
    }
    put(x + 1, top + 1, SKIN)
    put(x + 1, top + 2, body)
    const arms = working ? top + 1 : top + 2
    put(x, arms, body)
    put(x + 2, arms, body)
    put(x, top + 3, LEGS)
    put(x + 2, top + 3, LEGS)
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

export function shipSvg(grid: Grid, frame: number, isSailing: boolean, px: number) {
  const rects: string[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const color = row[x]
      if (!color) {
        x++
        continue
      }
      let end = x
      while (row[end + 1] === color) end++
      rects.push(`<rect x="${x * px}" y="${y * px}" width="${(end - x + 1) * px}" height="${px}" fill="${color}"/>`)
      x = end + 1
    }
  })
  const shift = isSailing ? frame % 4 : 0
  const waveTop = grid.length * px
  for (let x = 0; x < WIDTH; x++) {
    const high = (x + shift) % 4 < 2
    rects.push(`<rect x="${x * px}" y="${waveTop + (high ? 0 : px / 2)}" width="${px}" height="${px / 2}" fill="${SEA}"/>`)
  }
  const width = WIDTH * px
  const height = waveTop + px

  return { source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects.join('')}</svg>`, width, height }
}
