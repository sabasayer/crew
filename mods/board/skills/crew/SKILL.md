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

1. **Fetch** (before the chain). Read the repo's `AGENTS.md` and the docs it points to. They hold the tag, deploy and dev-server rules. Run `git fetch origin`. Branch from the fresh default branch. Check the tree is clean. Start the dev server on a free port (see the E2E step). Check that it answers HTTP 200 on that port, not on a default one. Restart a stale server. Write the port in `~/.crew/<ticket>/spec/port`, so later phases use the same one. Done when `git log origin/<default>..HEAD` is empty. Then create the task (see Task tracking).
2. **Spec** (10, `gate-spec`). Tell the captain to start a grilling session to make the spec. You cannot start it. Write the spec to `~/.crew/<ticket>/spec/<ticket>.md`, outside the repo. Add three sections: allowed behavior changes, how the captain tests it on the dev server, and the mocks that needs. Gate: captain approves the spec.
3. **Spike** (20, `spike`, only when a technical unknown can change the spec). Spawn with [briefs/spike.md](briefs/spike.md). One agent edits the working tree at a time. Put the answer in the spec.
4. **Red or Pin** (30). Spawn with [briefs/red.md](briefs/red.md). Gate (40, `gate-tests`): captain reads the tests. Back to this phase if they do not pass.
5. **Green or Move** (50). Spawn with [briefs/green.md](briefs/green.md). It may not edit tests. Check its diff.
6. **Review** (60, `review-standards` and `review-spec` run in parallel). When they start, set the task state `reviewing`. Spawn with [briefs/review.md](briefs/review.md). They report only. Then one fixer (70) gets the findings. Reject a finding in writing or fix it.
7. **Prove** (80, `browser`). Run `/prove` once. Then spawn the browser agent with [briefs/browser.md](briefs/browser.md). Add missing mocks.
8. **Captain test** (90, `gate-captain`). Give the captain the dev server URL with the port from `~/.crew/<ticket>/spec/port`, and the steps. Gate: captain says okay. When the captain says they tested it on the dev server, set the task state `local_testing`. Do not set it on your own guess.
9. **Ship.** Use the project's ship flow. When the MR is open, update the task with `mr_url`. Commit only when each commit is green alone, or else squash. Watch the pipeline. Ask who reviews. Do not assign anyone yourself.

Next MR of the same ticket: start phase 4 for it while the last MR waits for review. Use a new folder name.

## E2E step

Every e2e run must do these things. This holds in any repo.

- Run the specs of this change in one call. The call waits by itself. Never write a sleep or poll loop.
- Print one pass or fail result for each spec. For each failure, print the log path and the last lines.
- Decide the rebuild by itself. Rebuild once when an input of the build changed. Otherwise reuse the last build. The agent never chooses.
- Keep the local `.env` safe. Move it out for visual runs. Put it back after, also on failure and on kill.
- Run visual specs in the CI Linux image, never natively. Check baselines only. Change a baseline only when the spec says so.
- Run one container at a time. Use at most 4 workers.
- Use a free port for every e2e run, and print the port you used. Never use a fixed or default port. If the repo's e2e script picks and prints its own free port, use that. Otherwise ask the OS for one and set it with the repo's port variable. A taken port can make Playwright reuse another agent's server and test its code. One way to ask the OS: `python3 -c 'import socket;s=socket.socket();s.bind(("",0));print(s.getsockname()[1])'`
- Work in the real worktree. Never copy the repo to run tests.
- Run Docker once. Green and Move run it after the last source change. Red and Pin run it at the end of their phase.

### Find the repo's scripts

1. Read the repo's `AGENTS.md` and the doc it points to for e2e and visual runs.
2. Read the `package.json` scripts and the README or e2e docs. Look for a script that runs one spec or a few specs. Look for a Docker or CI-image script for visual specs.
3. Check each script against the list above. Write one line for each: what it covers and what it does not. Also check how it sets its port. Write: "picks its own port", "reads a port variable" or "fixed port". For a fixed port, pass a free one through the variable. If there is no variable, tell the captain the script needs a fix.
4. Use the best script. Do each missing part by hand. For example: move `.env` out yourself, run all specs in one call with the output in a log file, and use one blocking call with a timeout.
5. If the repo has no script, run the repo's own e2e command once. Use one blocking call. Send the output to a log file, then read the log. Do not poll.

### What crew adds

- Before a long call, write the phase in your status file, for example "e2e, 3 specs". Add "about X min" only when you know the time. Write the phase again after the call.
- Write the logs to `logs/` in the status folder. It is a subfolder, so the board does not show it as an agent.

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
