# Rules for every agent

- Write your status with `crew-status`, as [status.md](../status.md) says. Send `running` first. Finish with `done` or `failed` and a one-line summary.
- Write scripts, logs and reports in the run folder or the spec folder. Never write them in the project repo.
- Never open an image (PNG or JPG). Read text. To judge a visual diff, run `crew-visual-diff <test-results folder>`. It prints the image size, the changed pixels, the ratio and the changed area. Only the browser agent opens an image, and only for a problem.
- Need a captain decision? End your run with the question. Do not keep the run open to wait.
- Stop and report when you are blocked. Do not retry the same step more than twice.
