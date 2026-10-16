import { expect, test } from 'claude-code/testing'

import { age, bar, isStale, parseAgent, sortChain } from './board'

const at = (role: string, extra = {}) =>
  parseAgent(`${role}.json`, JSON.stringify({ role, state: 'running', updated: '2026-10-16T14:00:00Z', ...extra }), 0)

test('running agent silent for over 5 minutes is stale', () => {
  const a = at('green')
  expect(isStale(a, a.updatedMs + 4 * 60_000)).toBe(false)
  expect(isStale(a, a.updatedMs + 6 * 60_000)).toBe(true)
  expect(isStale({ ...a, state: 'done' }, a.updatedMs + 6 * 60_000)).toBe(false)
})

test('chain order: known roles in flow order, unknown last, order field wins', () => {
  const roles = sortChain(['browser', 'zzz', 'review-spec', 'green', 'red', 'fixer'].map(r => at(r))).map(a => a.role)
  expect(roles).toEqual(['red', 'green', 'review-spec', 'fixer', 'browser', 'zzz'])
  expect(sortChain([at('red'), at('zzz', { order: 1 })])[0]?.role).toBe('zzz')
})

test('bad json becomes an unreadable row', () => {
  expect(parseAgent('x.json', '{', 5)).toMatchObject({ role: 'x', state: 'unreadable', updatedMs: 5 })
})

test('bar and age', () => {
  expect(bar(at('r', { done: 12, total: 24 }), 10, 0)).toBe('█████░░░░░')
  expect(bar(at('r'), 10, 3)).toHaveLength(10)
  expect(age(90_000)).toBe('1m')
  expect(age(3_900_000)).toBe('1h5m')
})
