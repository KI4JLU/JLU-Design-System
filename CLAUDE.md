# JLU Design System

## Commit messages

Conventional Commits, one short lowercase summary line:

```
fix(docker): npm auth for @ki4jlu/design-system in frontend image build
```

- Format: `type(scope): summary` — types: feat, fix, chore, docs, refactor, test, ci
- **Summary is the message. Max 72 characters, and usually that is the whole commit.**
- **A body is at most 3 lines, and only for a decision or a non-obvious *why*.** Never restate the
  diff or list what was verified — the kanban card is the durable record and is where reviewers look.
- Enforced by `.githooks/commit-msg`; wire it once per clone with `git config core.hooksPath
  .githooks`. Merges, reverts and fixups are exempt.
- Do NOT add a `Co-Authored-By: Claude` trailer. Co-author trailers are for humans only.
