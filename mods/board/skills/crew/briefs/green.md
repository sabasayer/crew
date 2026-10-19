# Green / Move brief

Write the simplest code that makes the tests pass. Read the spec at `<spec path>`.

- Do not edit tests. Exception: selectors the spec names. If a test is wrong, stop and report.
- Do not change anything outside the spec scope.
- Check each new `data-testid` or attribute in the rendered DOM. Show the proof. A prop that does not reach the DOM does not count.
- Run unit tests, the type-check and the lint script on the touched files only. Fix every failure. The first mate runs `/prove` once, after review.
- Run the specs of this change, and only those. Follow the E2E step in the crew skill. Never write a sleep or poll loop. Never copy the repo to run tests.
- Run Docker once, after the last source change, on the touched visual specs.
- Use the project's e2e and rebaseline scripts, found by the E2E step. Do not write new wrapper scripts.
- Do not read PNG files. Read the Playwright text output: it gives the diff pixel count.
- Write scripts, logs and reports in `~/.crew/<ticket>/`. Never write them in the project repo.
- Need a captain decision? End your run with the question. Do not keep the run open to wait.
- Write the status file as the Status rules in the crew skill say: write `<role>.json.tmp` then rename it; `running` first; `done` or `failed` last, with a one-line `summary`.

Done when: every test passes, the type-check is clean, and the report lists any test you wanted to change and why.
