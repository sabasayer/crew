---
name: crew
description: Run a ticket through a chain of specialist agents with captain gates. Use when the user asks to run /crew.
disable-model-invocation: true
---

# /crew

You are first mate. The user is captain. You run the chain and never write the code yourself. Each gate waits for the captain's yes.

A bad link breaks the chain. So check each hand-off before the next agent starts: run its `git diff` and the project's checks yourself. Do not pass on a claim you have not seen.

## Pick the mode

- **Feature or bugfix:** Spec, Red, Green. Tests fail first, then pass.
- **Migration or refactor:** Spec, Pin, Move. Behavior stays the same. Tests pass before and after. A test may fail first only for an allowed behavior change.

Both modes end the same way: Review, Check, Captain test, Ship.

## Project commands

Find these in the project docs (`CLAUDE.md`, `README.md`, `package.json`). Ask the captain when you cannot find one.

- **Dev server:** the command that runs the app for manual tests.
- **Checks:** the commands that must pass before a ship (lint, types, tests, build).
- **Ship:** how this project opens a merge request or pull request.

## Phases

Order numbers for the status files are in brackets.

1. **Fetch** (before the chain). Run `git fetch origin`. Branch from the fresh default branch. Check the tree is clean and the dev server answers on this branch. Restart a stale server. Done when `git log origin/<default>..HEAD` is empty.
2. **Spec** (10, `gate-spec`). Talk with the captain until the spec is clear. Write the spec to `docs/specs/<ticket>.md`, untracked. Add three sections: allowed behavior changes, how the captain tests it on the dev server, and the mocks that needs. Gate: captain approves the spec.
3. **Spike** (20, `spike`, only when a technical unknown can change the spec). Spawn with [briefs/spike.md](briefs/spike.md). One agent edits the working tree at a time. Put the answer in the spec.
4. **Red or Pin** (30). Spawn with [briefs/red.md](briefs/red.md). Gate (40, `gate-tests`): captain reads the tests. Back to this phase if they do not pass.
5. **Green or Move** (50). Spawn with [briefs/green.md](briefs/green.md). It may not edit tests. Check its diff.
6. **Review** (60, `review-standards` and `review-spec` run in parallel). Spawn with [briefs/review.md](briefs/review.md). They report only. Then one fixer (70) gets the findings. Reject a finding in writing or fix it.
7. **Check** (80, `browser`). Run the project's checks. Then spawn the browser agent with [briefs/browser.md](briefs/browser.md). Add missing mocks.
8. **Captain test** (90, `gate-captain`). Give the captain the dev server URL and the steps. Gate: captain says okay.
9. **Ship.** Use the project's ship flow. Commit only when each commit is green alone, or else squash. Watch the pipeline. Ask who reviews. Do not assign anyone yourself.

Next MR of the same ticket: start phase 4 for it while the last MR waits for review. Use a new folder name.

## Status

The crew board shows the status files. Use these rules exactly.

- **Folder.** One folder per MR: `~/.crew/<ticket>-mr<N>/`. Never reuse a folder for a new run. Every top-level `*.json` file in it shows as an agent, so put other JSON in a subfolder. Screenshots and logs are fine. If `CREW_BOARD_ROOT` is set, use that folder in place of `~/.crew`.
- **Open the board.** At the start of a run, call `mcp__crew-board__crew_board_open` with the folder name. Skip this if the tool is not there.
- **Queue every role at the start.** Write one file for each planned role with `state: queued` and its `order`. Without a file, the board cannot show what comes next.
- **Gates are roles.** One file per gate: `gate-spec`, `gate-tests`, `gate-captain`. Set `blocked` while the captain must act, and `done` after the yes. The phase text says what the captain must do.
- **Order.** One whole number in each file. Steps of 10. Parallel agents share a number. The numbers are in the phase list above.
- **A skipped role** gets `state: done` and `summary: "skipped"`. Do not delete its file.
- **Name.** The `role` field equals the file name without `.json`.
- **Write in two steps.** Write `<role>.json.tmp`, then rename it. The board never reads half a file.
- **Long call.** Before a call of about 10 minutes (Docker), write the phase, for example "docker run, about 10 min". Write it again after. A `running` file with no update for 15 minutes shows as stale.
- **End.** On `done` or `failed`, add `summary`: one short line. The board shows it instead of the phase.

```json
{"role":"red","order":30,"state":"running","phase":"writing e2e tests","done":12,"total":35,"summary":"","updated":"<ISO time>"}
```

`state` is `queued`, `running`, `blocked`, `done` or `failed`. `done` and `total` are optional.

Before each agent starts, tell the captain the expected time. Use the times of earlier runs when you have them. When the captain asks, show the newest line of each file. Do not say "still working".

## Tokens

- Agents get the spec path and the files to read. They do not get the chat history.
- Give each agent only its brief and its own gate. Review agents read the diff only.
- An agent stops and reports when it is blocked. It does not retry the same step more than twice.

## Rules

- Never create, move or delete tags.
- Never deploy.
- Delete the spec after the last MR merges.
