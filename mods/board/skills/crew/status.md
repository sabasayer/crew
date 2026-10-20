# Status files

The crew board shows the status files. Use these rules exactly. The run folder is in the crew skill.

- **Folder.** Never reuse a run folder for a new run. Every top-level `*.json` file in it shows as an agent, so put other JSON in a subfolder. Screenshots and logs are fine.
- **Open the board.** At the start of a run, call `mcp__crew-board__crew_board_open` with the ticket name. The board then shows every MR of that ticket. Skip this if the tool is not there.
- **Queue every role at the start.** Write one file for each planned role with `state: queued` and its `order`. Without a file, the board cannot show what comes next.
- **Gates are roles.** One file per gate: `gate-spec`, `gate-tests`, `gate-captain`. Set `blocked` while the captain must act, and `done` after the yes. The phase text says what the captain must do.
- **Order.** One whole number in each file. Steps of 10. Parallel agents share a number. The numbers are in the phase list of the crew skill.
- **A skipped role** gets `state: done` and `summary: "skipped"`. Do not delete its file.
- **Name.** The `role` field equals the file name without `.json`.
- **Write in two steps.** Write `<role>.json.tmp`, then rename it. The board never reads half a file.
- **Long call.** Before a call of about 10 minutes (Docker, e2e), write the phase, for example "docker run, about 10 min". Add "about X min" only when you know the time. Write the phase again after the call. A `running` file with no update for 15 minutes shows as stale.
- **End.** On `done` or `failed`, add `summary`: one short line. The board shows it instead of the phase.

```json
{"role":"red","order":30,"state":"running","phase":"writing e2e tests","done":12,"total":35,"summary":"","updated":"<ISO time>"}
```

`state` is `queued`, `running`, `blocked`, `done` or `failed`. `done` and `total` are optional.
