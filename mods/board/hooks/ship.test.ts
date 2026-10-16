import { expect, test } from 'claude-code/testing'

import { drawShip, halfBlocks, water, WIDTH } from './ship'

const agent = (state: string) => ({ role: 'x', state, updatedMs: 0 })

test('ship is 5 text lines of 22 cells, bobbing only while sailing', () => {
  const lines = halfBlocks(drawShip([agent('running')], 0, true))
  expect(lines).toHaveLength(5)
  expect(lines.every(l => l.reduce((n, r) => n + r.t.length, 0) === WIDTH)).toBe(true)
  const still = JSON.stringify(halfBlocks(drawShip([agent('done')], 0, false)))
  expect(JSON.stringify(halfBlocks(drawShip([agent('done')], 1, false)))).toBe(still)
  expect(JSON.stringify(halfBlocks(drawShip([agent('running')], 1, true)))).not.toBe(JSON.stringify(lines))
})

test('water scrolls only while sailing and keeps its width', () => {
  expect(water(1, true).t).not.toBe(water(0, true).t)
  expect(water(1, false).t).toBe(water(0, false).t)
  expect(water(3, true).t).toHaveLength(WIDTH)
})
