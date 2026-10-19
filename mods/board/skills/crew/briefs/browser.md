# Browser check brief

Start the dev server and use a browser tool (for example the Chrome DevTools tools). Open every changed UI by the steps in the spec.

- Check the look, close by X, Escape, backdrop, and the console.
- List each UI you could not reach and what mock it needs.
- Stop every server you started.
- Write the status file as the Status rules in the crew skill say: write `<role>.json.tmp` then rename it; `running` first; `done` or `failed` last, with a one-line `summary`.

Done when: each changed UI has `ok` or `problem`, with a screenshot path for each problem.
