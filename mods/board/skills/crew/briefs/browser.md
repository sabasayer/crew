# Browser check brief

Start the dev server and use a browser tool (for example the Chrome DevTools tools). Open every changed UI by the steps in the spec.

- Check the look, close by X, Escape, backdrop, and the console.
- List each UI you could not reach and what mock it needs.
- Budget: about 60 calls. Take one screenshot for each UI, and one more for each problem. Use `take_snapshot` (text) in place of screenshots when you can.
- You may open images only for a problem.
- Stop every server you started.
- Write scripts, logs and reports in `~/.crew/<ticket>/`. Never write them in the project repo.
- Need a captain decision? End your run with the question. Do not keep the run open to wait.
- Write the status file as the Status rules in the crew skill say: write `<role>.json.tmp` then rename it; `running` first; `done` or `failed` last, with a one-line `summary`.

Done when: each changed UI has `ok` or `problem`, with a screenshot path for each problem.
