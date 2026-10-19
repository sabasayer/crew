# Green / Move brief

Write the simplest code that makes the tests pass. Read the spec at `<spec path>`.

- Do not edit tests. Exception: selectors the spec names. If a test is wrong, stop and report.
- Stay inside the spec scope.
- Check each new `data-testid` or attribute in the rendered DOM. Show the proof. A prop that does not reach the DOM does not count.
- Run unit tests, the type-check and the lint script on the touched files only. Fix every failure. The first mate runs `/prove` once, after review.
- Run only the specs of this change. Follow [e2e.md](../e2e.md). Run Docker once, after the last source change, on the touched visual specs.
- Follow [common.md](common.md).

Done when: every test passes, the type-check is clean, and the report lists any test you wanted to change and why.
