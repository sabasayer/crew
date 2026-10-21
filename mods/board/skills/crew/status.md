# Status files

The crew board shows the status files. Write them only with the `crew-status` command. Never write the JSON by hand.

```
crew-status --run <run folder> <role> <state> "<summary>" [--order N] [--phase "text"] [--done N --total N]
```

- **Run folder.** The spawn text gives it. You can set `CREW_RUN` in the same command instead of `--run`. The run folder is in the crew skill.
- **State.** `queued`, `running`, `blocked`, `done` or `failed`.
- **Summary.** One short line. `blocked`, `done` and `failed` need one, and the command refuses an empty one. The board shows it in place of the phase.
- **Order.** The first call for a role needs `--order`. The command keeps it after that.
- **Phase.** What you do now, in a few words. Use `--phase` with `running`. The board shows it.
- **Progress.** `--done` and `--total` show a bar.
- **Command not found.** Stop and tell the first mate. The plugin `bin` folder holds it, and a session loads it at the start. Do not write the file by hand.

## Rules

- **Folder.** Never reuse a run folder for a new run. Every top-level `*.json` file in it shows as an agent, so put other JSON in a subfolder. Screenshots and logs are fine.
- **Open the board.** At the start of a run, call `mcp__crew-board__crew_board_open` with the ticket name. The board then shows every MR of that ticket. Skip this if the tool is not there.
- **Queue every role at the start.** Run `crew-status` with `queued` and its `--order` for each planned role. Without a file, the board cannot show what comes next.
- **Gates are roles.** One file per gate: `gate-spec`, `gate-tests`, `gate-captain`. Set `blocked` while the captain must act, and `done` after the yes. The summary says what the captain must do.
- **Order.** One whole number for each role. Steps of 10. Parallel agents share a number. The numbers are in the phase list of the crew skill.
- **A skipped role** gets `done` and the summary `skipped`. Do not delete its file.
- **Name.** The role name is the file name without `.json`.
- **Long call.** Before a call of about 10 minutes (Docker, e2e), set the phase, for example `--phase "docker run, about 10 min"`. Add "about X min" only when you know the time. Set it again after the call. A `running` file with no update for 15 minutes shows as stale.
- **End.** Finish with `done` or `failed` and a summary.
