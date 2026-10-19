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

Type `/crew-board`. A pane opens. It checks `~/.crew` every 2 seconds.
No refresh needed.

- One block per ticket (a folder in `~/.crew/`). The newest ticket is first.
- Each ticket has a tiny pixel ship (half-block characters in the terminal, an SVG in the desktop app). One crew member stands on deck for each agent, colored by state.
  The ship bobs and the sea moves while an agent runs and is not stale. Crew members of running agents hop.
  A stale or idle ship stays still. The flag turns green when all agents are done and red if one failed.
- A summary beside the ship shows the counts, like `3/8 done  ▶ 2  ⏸ 1`. The rows are in chain order, top to bottom.
- One row per agent: role, state, bar, count, phase, time since the last update.
- A `running` agent with no update for 15 minutes shows in red with `STALE`.
- A file that is not valid JSON shows as `unreadable`.

Show one ticket only: `/crew-board <ticket>`, for example `/crew-board eng-708-mr2`.
Type `/crew-board` with no name to see all tickets again.

The first mate can open the board itself. The mod gives it a tool,
`mcp__crew-board__crew_board_open`, with one input: `ticket`.
Claude asks you once to allow it. Allow it for the session or always.

The board folder is `~/.crew`. The mod creates it. It survives a restart.
Set `CREW_BOARD_ROOT` to use another folder.
The board also shows old runs in `/tmp/crew`. The header shows the folder path.

Type `/crew-board clean` to list runs older than 30 days. Nothing is deleted.
Type `/crew-board clean yes` to delete them. It only cleans the board folder, never `/tmp/crew`.

## The crew skill

The plugin also ships a skill: `/crew-board:crew`. It is the first mate.
It runs a ticket through spec, tests, code, review and ship, with gates for you.
It writes the status files that the board shows. It reads your project docs for the dev server, the checks and the ship flow.
The skill and its briefs are in `mods/board/skills/crew/`.

The plugin ships a second skill: `/crew-board:prove`. It runs the checks CI runs before a branch ships. The first mate runs it once, after review.

The crew skill has an "E2E step". It lists what every e2e run must do. Agents then find the repo's own e2e scripts that do it.

If you also use [mr-triage](https://github.com/sabasayer/mr-triage) and its `track-work` skill, the first mate adds a task for each branch.
It moves the task to `reviewing` and `local_testing`, and adds the MR link. It skips this when mr-triage is not running.

## Style (option)

The option `style` is `full` or `simple`. The default is `full`.
- `full`:
  - Each agent is a small pixel face with a hat on the ship, up to 8.
  - The hat shape follows the role: captain cap for `gate-*`, bandana for `red` and `pin`,
    tricorn for `green` and `move`, pointed hat for `review-*`, hard hat for `fixer`,
    sailor cap for `browser`, plain cap for any other role.
  - The hat color is fixed for `red`, `green`, `fixer`, `gate-*` and `browser`.
    Other roles get a color from their name. So two `review-*` agents get different colors.
  - The face shows the state: smile when done, frown when failed, flat mouth when blocked,
    small mouth when running, gray face when queued. A running face hops.
    The collar has the state color. A stale agent has a red collar.
  - Each agent row shows the hat before the role name: 3 by 2 pixels in the terminal, 5 by 2 in the desktop app.
  - `simple`: each agent is a small one-pixel crew member on the deck. No hats, no faces,
  and the rows are compact.

Switch it with a command. The pane changes at once, and the choice is kept for the next sessions:

- `/crew-board style` switches between `full` and `simple`.
- `/crew-board style simple` or `/crew-board style full` picks one.

The command wins over the setting. The setting is the default for a new install. Change it in the plugin settings, or in `~/.claude/settings.json`:

```json
{ "pluginConfigs": { "crew-board": { "options": { "style": "simple" } } } }
```

The older option `characters` is gone. It is ignored if it is still in your settings.

## Status file contract

One file per agent: `~/.crew/<ticket>/<role>.json`.

```json
{"role":"red","state":"running","phase":"writing e2e tests","done":12,"total":35,"order":2,"updated":"2026-10-16T14:40:00Z"}
```

| Field | Needed | Meaning |
| --- | --- | --- |
| `role` | no | Name on the board. The file name is used if missing. |
| `state` | yes | `queued`, `running`, `blocked`, `done` or `failed`. |
| `phase` | no | What the agent does now. |
| `done`, `total` | no | Progress. Without them the bar is a moving block. |
| `summary` | no | Short result text. On `done` or `failed`, the board shows it in place of `phase`. |
| `updated` | yes | ISO time of the last write. |
| `order` | no | Place in the chain. Lower comes first. |

The mod shows any `*.json` file. It does not need a fixed list of roles.
Without `order`, it sorts by the usual flow:
`gate-spec, spec, spike, red, pin, gate-tests, green, move, review-*, fixer, browser, gate-captain`.
Unknown roles go last.

## Changes to suggest for `crew/SKILL.md`

The first mate should make these changes. This repo does not edit the skill.

0. **Open the board for this ticket.** In phase 1, after the ticket name is known,
   call `mcp__crew-board__crew_board_open` with `ticket` set to the folder name under `~/.crew`.
   Skip it if the tool is not there.

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
   Else a long phase looks stale after 15 minutes.
5. **Write atomically.** Write to `<role>.json.tmp`, then rename. The board then never reads half a file.

## Develop

```sh
claude plugin validate mods/board
claude plugin test mods/board
```

The tests cover the logic in `mods/board/hooks/board.ts` and `ship.ts`: stale check, chain order,
bad JSON, bar and age, ship shape, hats and faces. The pane drawing is not tested by a script. Check it by eye with demo files:

```sh
mkdir -p ~/.crew/demo && echo '{"role":"red","state":"running","phase":"demo","done":3,"total":10,"updated":"'$(date -u +%FT%TZ)'"}' > ~/.crew/demo/red.json
```

## Move this mod

The mod is one folder: `mods/board`. It does not use mr-triage or any server.
To merge it with other mods, copy that folder and add a line to the other repo's
`.claude-plugin/marketplace.json`.
