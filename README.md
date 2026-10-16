# crew-board

A Claude Code mod. It shows a live board of the agents in a `/crew` run.
It only reads. It never writes the status files.

## Install

In a Claude Code session:

```
/plugin install crew-board --marketplace sabasayer/crew
```

To try it from a local clone, without install:

```sh
claude --plugin-dir ./mods/board
```

## Use

Type `/crew-board`. A pane opens. It checks `/tmp/crew` every 2 seconds.
No refresh needed.

- One block per ticket (a folder in `/tmp/crew/`). The newest ticket is first.
- Each ticket has a tiny pixel ship. One crew member stands on deck for each agent, colored by state.
  The ship bobs and the sea moves while an agent runs and is not stale. Crew members of running agents hop.
  A stale or idle ship stays still. The flag turns green when all agents are done and red if one failed.
- A chain line shows the order: `✔ red → ▶ green → ○ fixer`.
- One row per agent: role, state, bar, count, phase, time since the last update.
- A `running` agent with no update for 5 minutes shows in red with `STALE`.
- A file that is not valid JSON shows as `unreadable`.

Change the folder with the `root` option if you need to. The default is `/tmp/crew`.

## Status file contract

One file per agent: `/tmp/crew/<ticket>/<role>.json`.

```json
{"role":"red","state":"running","phase":"writing e2e tests","done":12,"total":35,"order":2,"updated":"2026-10-16T14:40:00Z"}
```

| Field | Needed | Meaning |
| --- | --- | --- |
| `role` | no | Name on the board. The file name is used if missing. |
| `state` | yes | `queued`, `running`, `blocked`, `done` or `failed`. |
| `phase` | no | What the agent does now. |
| `done`, `total` | no | Progress. Without them the bar is a moving block. |
| `updated` | yes | ISO time of the last write. |
| `order` | no | Place in the chain. Lower comes first. |

The mod shows any `*.json` file. It does not need a fixed list of roles.
Without `order`, it sorts by the usual flow:
`gate-spec, spec, red, pin, gate-tests, green, move, review-*, fixer, browser, gate-captain`.
Unknown roles go last.

## Changes to suggest for `crew/SKILL.md`

The first mate should make these changes. This repo does not edit the skill.

1. **Write the whole chain at the start.** Before phase 2, write one file per planned
   agent with `state: queued` and an `order` number. Then the board shows what comes next.
2. **Write the gates as files.** A gate is a role that starts with `gate-`.
   While it waits for the captain, set `state: blocked` and `phase` to what the
   captain must do. When the captain says yes, set `state: done`.
   - `gate-spec` — spec approved (phase 2)
   - `gate-tests` — captain reads the tests (phase 3)
   - `gate-captain` — captain test (phase 7)
3. **Say who writes the file.** An agent writes its own file at each phase.
   The first mate writes the gate files and the `queued` files.
4. **Write `updated` on every tool burst**, not only at a phase change.
   Else a long phase looks stale after 5 minutes.
5. **Write atomically.** Write to `<role>.json.tmp`, then rename. The board then never reads half a file.

## Develop

```sh
claude plugin validate mods/board
claude plugin test mods/board
```

The tests cover the logic in `mods/board/hooks/board.ts`: stale check, chain order,
bad JSON, bar and age. The pane drawing is not tested by a script. Check it by eye with demo files:

```sh
mkdir -p /tmp/crew/demo && echo '{"role":"red","state":"running","phase":"demo","done":3,"total":10,"updated":"'$(date -u +%FT%TZ)'"}' > /tmp/crew/demo/red.json
```

## Move this mod

The mod is one folder: `mods/board`. It does not use mr-triage or any server.
To merge it with other mods, copy that folder and add a line to the other repo's
`.claude-plugin/marketplace.json`.
