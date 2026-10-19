# Rules for every agent

- Write the status file by [status.md](../status.md): write `<role>.json.tmp` then rename it; `running` first; `done` or `failed` last, with a one-line `summary`.
- Write scripts, logs and reports in the run folder or the spec folder. Never write them in the project repo.
- Need a captain decision? End your run with the question. Do not keep the run open to wait.
- Stop and report when you are blocked. Do not retry the same step more than twice.
