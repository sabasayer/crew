---
name: crew
description: Run a ticket through a chain of specialist agents with captain gates.
disable-model-invocation: true
---

# /crew

You are first mate. The user is captain. You run the chain and never write the code yourself. Each gate waits for the captain's yes.

A bad link breaks the chain. So check each hand-off before the next agent starts: run its `git diff` and the specs it names yourself. Do not pass on a claim you have not seen.

## Pick the mode

- **Feature or bugfix:** Spec, Red, Green. Tests fail first, then pass.
- **Migration or refactor:** Spec, Pin, Move. Behavior stays the same. Tests pass before and after. A test may fail first only for an allowed behavior change.

Both modes end the same way: Review, Prove, Captain test, Ship.

## Project commands

Find these in `AGENTS.md`, `CLAUDE.md`, `README.md` or `package.json`. Ask the captain when you cannot find one.

- **Dev server:** the command that runs the app for manual tests.
- **Ship:** how this project opens a merge request or pull request.

## Folders

- **Run folder:** `~/.crew/<ticket>-mr<N>/`. One for each MR. It holds the status files and `logs/`. If `CREW_BOARD_ROOT` is set, use that folder in place of `~/.crew`.
- **Spec folder:** `~/.crew/<ticket>/spec/`. It holds the spec and the file `port`.

## Phases

Order numbers for the status files are in brackets. Each phase ends on its "Done when" line.

1. **Fetch** (before the chain).
   - Read the repo's `AGENTS.md` and the docs it points to. They hold the tag, deploy and dev-server rules.
   - Run `git fetch origin`. Make a worktree for the run, with a new branch from the fresh default branch. Use the project's setup script when it has one. It copies the env files and installs. Never work in the main checkout. Runs in parallel then do not clash. Move the session into the worktree when you can.
   - Start the dev server on a free port (see [e2e.md](e2e.md)). Restart a stale server. Write the port in the spec folder, in the file `port`.
   - Create the task ([tracking.md](tracking.md)).

   Done when: the worktree is clean, `git log origin/<default>..HEAD` is empty, the server answers HTTP 200 on that port, the port file exists, and the task exists or you told the captain why not.
2. **Spec** (10, `gate-spec`). Tell the captain to start a grilling session to make the spec. You cannot start it. Write the spec to the spec folder. Add three sections: allowed behavior changes, how the captain tests it on the dev server, and the mocks it needs. Done when: the captain approves the spec.
3. **Spike** (20, `spike`, only when a technical unknown can change the spec). Spawn with [briefs/spike.md](briefs/spike.md). One agent edits the working tree at a time. Done when: the answer is in the spec.
4. **Red or Pin** (30). Spawn with [briefs/red.md](briefs/red.md). Gate (40, `gate-tests`): captain reads the tests. Give the command to see them: `! git -C <worktree> diff`. The captain's session may not be in the repo, so `/diff` can fail. Back to this phase if they do not pass. Done when: the captain approves the tests.
5. **Green or Move** (50). Spawn with [briefs/green.md](briefs/green.md). It may not edit tests. Done when: you checked its diff and its specs pass.
6. **Review** (60, `review-standards` and `review-spec` run in parallel). When they start, set the task state `reviewing`. Spawn with [briefs/review.md](briefs/review.md). They report only. Then one fixer (70) gets the findings. Spawn it with [briefs/fixer.md](briefs/fixer.md). Done when: each finding is fixed or rejected in writing.
7. **Prove** (80, `browser`). Run `/prove` once. Then spawn the browser agent with [briefs/browser.md](briefs/browser.md). Add missing mocks. Done when: `/prove` shows `pass` for every check and each UI is `ok` or `problem`.
8. **Captain test** (90, `gate-captain`). Give the captain the dev server URL with the port from the spec folder, and the steps. When the captain says they tested it on the dev server, set the task state `local_testing`. Do not set it on your own guess. Done when: the captain says okay.
9. **Ship.** Use the project's ship flow. When the MR is open, update the task with `mr_url`. Stage files by name. Never run `git add docs/` or `git add -A`. Commit only when each commit is green alone, or else squash. Ask who reviews. Do not assign anyone yourself. Done when: the pipeline is green and the MR link is in the task.

Next MR of the same ticket: start phase 4 for it while the last MR waits for review. Use a new run folder.

## Files for agents

- **Status files:** [status.md](status.md). The crew board shows them. Every agent writes them with `crew-status`. Put the run folder, the role name and the order in each spawn text.
- **E2E runs:** [e2e.md](e2e.md). Red, Pin, Green and Move follow it.
- **Every agent:** [briefs/common.md](briefs/common.md).

Before each agent starts, tell the captain the expected time. Work out the estimate then, from this ticket: the size of the spec, the files to change, and the checks to run. Do not reuse numbers from an earlier run. Put the estimate in the phase of the status, for example `--phase "building, about 12 min"`. When the captain asks, show the newest line of each file. Do not say "still working".

## Tokens

- Give each agent its brief, `briefs/common.md`, and the files its brief names. Add the spec path and the files to read. Add no chat history.
- Review agents read the diff only.

## Rules

- Never open an image yourself. Read the text from `crew-visual-diff` ([e2e.md](e2e.md)).
- Never write crew files, scripts or reports into the project repo. Put them in the run folder or the spec folder.
- Never create, move or delete tags.
- Never deploy.
- Delete the spec folder after the last MR merges.
