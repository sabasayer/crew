# Red / Pin brief

Write tests only. Write no implementation.

Read first: the spec at `<spec path>`.

## Both modes
- Select by role, `data-testid` or visible text. Never by library class.
- Check what tests exist. Write only the missing ones.
- E2E covers journeys and stacking. Component tests cover props, events and states. Never test one thing at both levels.
- Run only the specs of this change. Wait for e2e with `crew-run-e2e`. Never write a sleep or poll loop. Never copy the repo to run tests.
- Run Docker once, at the end of your phase. You create or check baselines.
- Write the status file as the Status rules in the crew skill say: write `<role>.json.tmp` then rename it; `running` first; `done` or `failed` last, with a one-line `summary`.

## Pin mode (migration)
- Every test passes on the old code. Run it and show the output.
- Audit the whole repo with `git grep` for old selectors, not only the files in scope. Rewrite each hit.
- Report each UI with no path on the dev server.

## Red mode (feature or bugfix)
- Every new test fails for the right reason. Show each failure.

Done when: the report lists each test, its result, and each item in the spec with no test.
