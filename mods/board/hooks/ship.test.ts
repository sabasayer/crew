import { expect, test } from 'claude-code/testing'

import { drawShip, halfBlocks, shipSvg, water, WIDTH } from './ship'

const agent = (state: string) => ({ role: 'x', state, updatedMs: 0 })

test('ship is 5 text lines of the full width, bobbing only while sailing', () => {
  const lines = halfBlocks(drawShip([agent('running')], 0, true))
  expect(lines).toHaveLength(5)
  expect(lines.every(l => l.reduce((n, r) => n + r.t.length, 0) === WIDTH)).toBe(true)
  const still = JSON.stringify(halfBlocks(drawShip([agent('done')], 0, false)))
  expect(JSON.stringify(halfBlocks(drawShip([agent('done')], 1, false)))).toBe(still)
  expect(JSON.stringify(halfBlocks(drawShip([agent('running')], 1, true)))).not.toBe(JSON.stringify(lines))
})

test('characters mode is taller and gives each role its own look', () => {
  const lines = halfBlocks(drawShip([agent('done')], 0, false, true))
  expect(lines).toHaveLength(6)
  const a = JSON.stringify(halfBlocks(drawShip([{ ...agent('done'), role: 'red' }], 0, false, true)))
  const b = JSON.stringify(halfBlocks(drawShip([{ ...agent('done'), role: 'fixer' }], 0, false, true)))
  expect(a).not.toBe(b)
})

test('water scrolls only while sailing and keeps its width', () => {
  expect(water(1, true).t).not.toBe(water(0, true).t)
  expect(water(1, false).t).toBe(water(0, false).t)
  expect(water(3, true).t).toHaveLength(WIDTH)
})

test('svg ship has rects, a fixed size and a moving sea', () => {
  const a = shipSvg(drawShip([agent('running')], 0, true), 0, true, 6)
  const b = shipSvg(drawShip([agent('running')], 0, true), 1, true, 6)
  expect(a.source.startsWith('<svg')).toBe(true)
  expect(a.width).toBe(WIDTH * 6)
  expect(a.source).not.toBe(b.source)
})
