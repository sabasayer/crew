---
name: crew
description: Run a ticket through a chain of specialist agents with captain gates. Use when the user asks to run /crew.
disable-model-invocation: true
---

# /crew

You are first mate. The user is captain. You run the chain and never write the code yourself. Each gate waits for the captain's yes.

A bad link breaks the chain. So check each hand-off before the next agent starts: run its `git diff` and `/prove` yourself. Do not pass on a claim you have not seen.

## Pick the mode

- **Feature or bugfix:** Spec, Red, Green. Tests fail first, then pass.
- **Migration or refactor:** Spec, Pin, Move. Behavior stays the same. Tests pass before and after. A test may fail first only for an allowed behavior change.

Both modes end the same way: Review, Prove, Captain test, Ship.

## Project commands

Find these in the project docs (`CLAUDE.md`, `README.md`, `package.json`). Ask the captain when you cannot find one.

- **Dev server:** the command that runs the app for manual tests.
- **Checks:** the commands that must pass before a ship (lint, types, tests, build).
- **Ship:** how this project opens a merge request or pull request.

## Phases

Order numbers for the status files are in brackets.

1. **Fetch** (before the chain). Read the repo's `AGENTS.md` and the docs it points to. They hold the tag, deploy and dev-server rules. Run `git fetch origin`. Branch from the fresh default branch. Check the tree is clean and the dev server answers on this branch. Restart a stale server. Done when `git log origin/<default>..HEAD` is empty. Then create the task (see Task tracking).
2. **Spec** (10, `gate-spec`). Tell the captain to start a grilling session to make the spec. You cannot start it. Write the spec to `docs/specs/<ticket>.md`, untracked. Add three sections: allowed behavior changes, how the captain tests it on the dev server, and the mocks that needs. Gate: captain approves the spec.
3. **Spike** (20, `spike`, only when a technical unknown can change the spec). Spawn with [briefs/spike.md](briefs/spike.md). One agent edits the working tree at a time. Put the answer in the spec.
4. **Red or Pin** (30). Spawn with [briefs/red.md](briefs/red.md). Gate (40, `gate-tests`): captain reads the tests. Back to this phase if they do not pass.
5. **Green or Move** (50). Spawn with [briefs/green.md](briefs/green.md). It may not edit tests. Check its diff.
6. **Review** (60, `review-standards` and `review-spec` run in parallel). When they start, set the task state `reviewing`. Spawn with [briefs/review.md](briefs/review.md). They report only. Then one fixer (70) gets the findings. Reject a finding in writing or fix it.
7. **Prove** (80, `browser`). Run `/prove` once. Then spawn the browser agent with [briefs/browser.md](briefs/browser.md). Add missing mocks.
8. **Captain test** (90, `gate-captain`). Give the captain the dev server URL and the steps. Gate: captain says okay. When the captain says they tested it on the dev server, set the task state `local_testing`. Do not set it on your own guess.
9. **Ship.** Use the project's ship flow. When the MR is open, update the task with `mr_url`. Commit only when each commit is green alone, or else squash. Watch the pipeline. Ask who reviews. Do not assign anyone yourself.

Next MR of the same ticket: start phase 4 for it while the last MR waits for review. Use a new folder name.

## E2E helper

`bin/crew-run-e2e` in this skill folder runs the specs in one call and waits inside the script. Agents never poll. Put its full path and the repo path in each agent prompt.

```
crew-run-e2e --repo <path> --kind visual|functional --folder ~/.crew/<ticket>-mr<N> --role <role> [--project chrome] [--update-baselines] <spec>...
```

- It reads the script names from `package.json`. Use `--visual-script` or `--functional-script` when it cannot find them.
- It runs one job with 4 workers. Never run two Docker containers at once. The CPU is the limit.
- Visual runs use the Docker rebaseline script. It checks baselines only, unless you pass `--update-baselines`.
- Visual runs: it moves the local `.env` out and puts it back, also when the run fails.
- Visual runs: it rebuilds once when a build input changed since the last build. Otherwise it passes `--no-build`.
- It prints one line for each spec, and the log path and last 20 lines when a spec fails. Logs go to `logs/` in the status folder.
- It sets the phase of `<role>.json` before and after the run. It exits non-zero when a spec fails.

## Task tracking

If the `track-work` skill is installed, it shows this work as a task in mr-triage. Call it with `git -C <path>` for git commands.

- **Create.** At the end of Fetch, call `track-work` with: `repo` (the remote path, like `group/project`, never a folder name), `branch`, `title` and the Linear URL if there is one. Start the title with the Linear ID, like `ABC-123: short title`.
- **MR open.** Call it again with `mr_url`. mr-triage then moves the task to MR review by itself.
- **States you may set.** `reviewing` when the review agents start. `local_testing` when the captain says they tested it. Nothing else.
- **States you never set.** `paused`, `released`, `testing` and `done` are the user's.
- **Several MRs.** One task for each branch. A ticket with `<ticket>-mr<N>` folders has one task for each MR branch.
- **If it fails.** When mr-triage is not running, or `track-work` is not installed, say so once and go on. Never start mr-triage. Never stop the run because of it.

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
