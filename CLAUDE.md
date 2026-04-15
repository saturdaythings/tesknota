@AGENTS.md

## Session Rules
- Extended thinking / adaptive reasoning: OFF.
- Load files on demand per task only. Skip AUDIT.md, CONTRIBUTING.md, tokens.css at startup.
- git log default: --oneline -10.
- Every 5 prompts: full audit. Otherwise scope reads to task files only.
- After each prompt: commit, push, deploy.
