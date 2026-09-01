#!/usr/bin/env bash
# PreToolUse guard — a boundary, not a blanket block.
#
# The main session (the project manager) may edit ordinary files. It may NEVER touch the
# guarded surface: the API spec and its generated files, `internal/specmw`, the auth/token and
# credential paths, `go-backend/migrations/`, `.github/workflows/`, `Dockerfile*`,
# `docker-compose*.yml`, `nginx*.conf`, and the harness's own `.claude/settings*.json`,
# `.claude/hooks/` and `.claude/tools/`. Those change through the pipeline only. Subagent calls
# (milestone-worker et al.) pass through: their hook input carries `agent_id`.
#
# There is no sentinel and nothing to lift. The old escape hatch and the unreviewed lane that
# unlocked it are deleted — they existed only to contain an absolute rule that has now been
# narrowed to the paths that actually need it.
#
# WHY THIS FILE IS A THIN WRAPPER
# The decision lives in `pm-guard.mjs`, next to this file: it needs the guarded list, and that
# list has exactly one copy — `CROSS_REVIEW_PATHS` in `../tools/card-scope.mjs`. A Node hook
# IMPORTS it; a shell hook would have had to shell out to `card-scope.mjs --guarded-paths` and
# parse the output. Same single source, one less moving part, and one process instead of two.
# It also means the logic is unit-testable from `npm test` (`pm-guard.test.mjs`).
#
# WHY EVERY FAILURE EXITS 2
# In Claude Code's PreToolUse contract **only exit code 2 blocks the tool call**; any other
# non-zero status is reported and the call proceeds. So an uncaught crash is an ALLOW. This
# script therefore maps every outcome that is not an explicit "allow" onto 2: node missing,
# `pm-guard.mjs` missing, a broken `card-scope.mjs`, an unreadable script directory. `set -e` is
# deliberately NOT used — it would propagate node's own status (1, 127, …) and thereby permit
# the very write the failure means we cannot judge.
#
# WHY `node` IS INVOKED WITH ITS INJECTION ENVIRONMENT CLEARED
# `NODE_OPTIONS="--require evil.cjs"` with a `process.exit(0)` in it pre-empts the guard entirely
# — reproduced, exit 0 on a payload that must block. A Claude Code session cannot set this for
# itself (the hook process is spawned by Claude Code, not from the session's shell), so it is an
# ambient risk: a developer's shell profile, a CI runner, a wrapper script. Clearing the two
# variables that can make node run foreign code is one line and removes the class.
#
# Limit, stated plainly: this guards the file-editing tools only. Editing via Bash (`sed -i`, a
# heredoc redirect) is governed by instruction, not by this hook.
set -uo pipefail

fail_closed() {
  printf 'Blocked (guard could not evaluate — failing closed): %s\n' "$1" >&2
  printf 'The guarded paths (spec, auth, migrations, CI, deploy, harness) cannot be judged, so\n' >&2
  printf 'this edit is refused. Repair the guard through the pipeline, not from this session.\n' >&2
  exit 2
}

# Bash parameter expansion, not `dirname`/`cd`/`pwd`: apart from `node` this script now needs no
# external command at all, so a stripped PATH cannot change where it looks for its own sibling.
# Found by testing exactly that — with `dirname` unavailable the old form fell back silently to
# the PROCESS cwd, which is attacker-influenced input and could name a foreign `pm-guard.mjs`.
HOOK_SRC="${BASH_SOURCE[0]:-$0}"
HOOK_DIR="${HOOK_SRC%/*}"
[ "$HOOK_DIR" = "$HOOK_SRC" ] && HOOK_DIR="."
[ -n "$HOOK_DIR" ] || fail_closed "cannot resolve the hook's own directory"

GUARD="$HOOK_DIR/pm-guard.mjs"
[ -f "$GUARD" ] || fail_closed "$GUARD is missing"

command -v node >/dev/null 2>&1 || fail_closed "node is not on PATH"

# Assigned as a command prefix, not exported and not via `env` — this script still needs no
# external command but `node` itself. `NODE_OPTIONS` carries `--require`/`--import`; `NODE_PATH`
# redirects CommonJS resolution. Neither is needed by the guard, which imports one sibling by
# relative path.
NODE_OPTIONS= NODE_PATH= NODE_REPL_EXTERNAL_MODULE= node "$GUARD"
status=$?
case "$status" in
  0) exit 0 ;;
  2) exit 2 ;;
  *) fail_closed "pm-guard.mjs exited with status $status" ;;
esac
