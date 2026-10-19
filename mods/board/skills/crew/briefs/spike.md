# Spike brief

Answer one technical question in a real browser. Read-only for the final repo state.

Question: `<one question>`.

- Make a temporary change. Test by mouse and keyboard with a browser tool (for example the Chrome DevTools tools).
- If it fails, try the smallest fix and say which fixes work and which do not. Show the exact working code.
- Use the running dev server. Do not start a second one. Do not stop it.
- Restore with `git checkout -- <files>`. Delete throwaway files. Check `git status --short`: only the untracked spec may remain.
- Write scripts, logs and reports in `~/.crew/<ticket>/`. Never write them in the project repo.
- Need a captain decision? End your run with the question. Do not keep the run open to wait.
- Write the status file at each step (see Status in the crew skill).

Done when: the report gives yes or no for each item, the working fix with code, and proof paths. Under 400 words. Stop after two failed tries at the same step.
