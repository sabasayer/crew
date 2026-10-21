# Red / Pin brief

Write tests only. Write no implementation.

Read first: the spec at `<spec path>`.

## Both modes
- Select by role, `data-testid` or visible text. Never by library class.
- Check what tests exist. Write only the missing ones.
- E2E covers journeys and stacking. Component tests cover props, events and states. Never test one thing at both levels.
- E2E budget: run only the changed specs while you work. Run the repeat or flake check once, at the end. Make at most 8 e2e calls. After that, report and ask the captain. Never use `tail -f`, `sleep` or a poll loop: make one blocking call. Details in [e2e.md](../e2e.md).
- Run Docker once, at the end of your phase. You create or check baselines.
- Follow [common.md](common.md).

## Pin mode (migration)
- Every test passes on the old code. Run it and show the output.
- Audit the whole repo with `git grep` for old selectors, not only the files in scope. Rewrite each hit.
- Report each UI with no path on the dev server.

## Red mode (feature or bugfix)
- Every new test fails for the right reason. Show each failure.

Done when: the report lists each test, its result, and each item in the spec with no test.
