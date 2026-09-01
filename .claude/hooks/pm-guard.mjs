#!/usr/bin/env node
/**
 * The PM guard's decision logic — a BOUNDARY, not a blanket block.
 *
 * WHAT CHANGED, AND WHY IT MATTERS MORE NOW
 * -----------------------------------------
 * The first version of this hook refused every Edit/Write in the main session. That absolute
 * rule was not in the harness this one was adapted from, and it is what forced an escape hatch
 * into existence: a whole unreviewed lane, unlocked by a sentinel file that had to be created,
 * remembered, expired and removed again, and that was not path-aware — with the sentinel in
 * place a write to the API spec returned exit 0. Hatch and lane are deleted. The guard stays
 * and narrows: **the main session may edit ordinary files, and may never touch the guarded
 * surface.**
 *
 * That trade raises the stakes on this file. Under the old design the guard was a discipline
 * aid — the PM's own instructions already said "delegate". Under the new one it is the ONLY
 * mechanical barrier between an unreviewed main-session edit and the spec, auth, migration,
 * CI and deploy surface. Hence `pm-guard.test.mjs`, hence the mutation matrix recorded on the
 * card, and hence the rule below.
 *
 * THE RULE: EVERY UNCERTAINTY BLOCKS
 * ----------------------------------
 * Malformed JSON, an absent or non-existent `cwd`, a `cwd` outside any git repository, a tool
 * this file does not know how to read a path out of, a `tool_input` with no path, a target the
 * filesystem refuses to resolve, a missing or broken `card-scope.mjs` — every one of them exits 2
 * (block). A guard that cannot establish where the write lands must not permit it. There is no
 * code path here that returns "allow" because something failed — and, since round 2, none that
 * quietly drops a candidate it could not judge, which amounts to the same thing.
 *
 * Claude Code's contract makes this sharper than usual: **only exit code 2 blocks a tool
 * call.** Any other non-zero status is surfaced to the user and the tool proceeds. So a crash
 * is an allow unless it is caught and turned into a 2 — which is what the shell wrapper
 * (`pm-no-direct-edit.sh`) exists to do.
 *
 * WHERE THE PROTECTED ROOT COMES FROM  (round 2 — this was the review FAIL)
 * ------------------------------------------------------------------------
 * The first version derived the protected repository from the payload's `cwd` alone
 * (`git rev-parse --show-toplevel`) and then DISCARDED every candidate whose `path.relative`
 * result began with `..`, reading that as "outside this repository, not our business".
 * Discarding falls through to ALLOW, so making a guarded file merely *look* external defeated
 * the entire property. Two routes were reproduced against this file, both exit 0:
 *
 *   1. `git init` any directory, hand it in as `cwd`, pass an ABSOLUTE path to the real spec.
 *      The payload got to choose which repository was protected.
 *   2. No `cd` needed at all: the CORRECT `cwd` plus an all-lowercase absolute path to the same
 *      file. `path.relative` compares bytes, so the case variant produced a `..`-climb and was
 *      dropped BEFORE `guardedMatch`'s case-insensitive comparison could ever run. On APFS that
 *      lowercase path opens the identical file — and an LLM can emit it by accident, which makes
 *      this a correctness bug and not only an anti-tampering one.
 *
 * Two independent changes. The first closes route 1, both close route 2:
 *
 *   * The protected root is ANCHORED TO THIS FILE — `SELF_ROOT`, derived from `import.meta.url`,
 *     which no payload can influence. The `cwd`-derived root is still consulted, but only as an
 *     ADDITIONAL root: it can add a block, never remove one. That inverts the old relationship,
 *     in which controlling `cwd` controlled the guard.
 *   * Containment is decided by `relativeInside` — an explicit case-folded, NFC-normalised
 *     SEGMENT comparison — instead of by "does the relative path start with `..`". "Outside" is
 *     now a determination made against every trusted root, not a side effect of string
 *     arithmetic on one attacker-chosen root.
 *
 * And the direction of the leftover uncertainty is corrected: a candidate whose canonical form
 * the filesystem refuses to give us (EACCES, ELOOP, …) used to be tolerated and then dropped,
 * i.e. allowed. It now BLOCKS, like every other uncertainty in this file.
 *
 * THE GUARDED LIST IS NOT DUPLICATED HERE
 * --------------------------------------
 * The trigger-path entries are IMPORTED from `../tools/card-scope.mjs` (`CROSS_REVIEW_PATHS`,
 * the single copy — also printable with `--guarded-paths`). In THIS repository that array is
 * empty by decision (no spec/auth/credential surface), so `HOOK_ONLY_PATHS` below is currently
 * the whole guarded surface — but the import stays: the day a card populates the list, the
 * guard follows automatically. A real ES import, not a subprocess: same single source, no
 * shelling out from a shell hook, no output parsing, and one node process for the whole hook.
 * `pm-guard.test.mjs` asserts that no entry of that list appears as a literal in this file,
 * so a future "quick fix" that pastes the list in fails the suite.
 *
 * `HOOK_ONLY_PATHS` below is an EXTENSION, not a second copy: those paths appear in no other
 * list. They are deliberately not added to `CROSS_REVIEW_PATHS`, because that array has one
 * specific meaning — "a second model must additionally read this change" — and a Dockerfile
 * edit does not need that. Two different questions, so two lists, with no overlapping entries.
 */
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync, readlinkSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { CROSS_REVIEW_PATHS } from '../tools/card-scope.mjs'

/**
 * The repository this guard protects, taken from the guard's own location on disk.
 *
 * `<root>/.claude/hooks/pm-guard.mjs` → two levels up is `<root>`. Both spellings are kept: the
 * lexical one and the symlink-resolved one, because either may be the form a payload arrives in.
 *
 * This is the anti-tampering anchor. Everything else about a hook payload is supplied by the
 * caller — `cwd` included — so a root derived from `cwd` is a root the caller chooses. A guard
 * whose scope its subject can redirect is not a guard; that was exactly the reproduced bypass.
 *
 * Deployment note, and its failure direction: `settings.json` wires the hook through
 * `$CLAUDE_PROJECT_DIR/.claude/hooks/`, so `SELF_ROOT` is the project checkout. Were the harness
 * ever installed user-globally (`~/.claude/hooks/`), `SELF_ROOT` would become `$HOME` and the
 * infrastructure globs would over-block there. Over-blocking, not under-blocking — the safe
 * direction, and visible immediately rather than silently.
 */
const SELF_FILE = fileURLToPath(import.meta.url)
export const SELF_ROOT_LEXICAL = path.resolve(path.dirname(SELF_FILE), '..', '..')
export const SELF_ROOT = realpathSync(SELF_ROOT_LEXICAL)

/**
 * The harness/infrastructure half of the guarded surface. Extension, never a duplicate — no
 * entry here is in `CROSS_REVIEW_PATHS`, and the test asserts the two sets are disjoint.
 *
 * Per-entry rationale (JLU Design System, 2026-09-01 — CROSS_REVIEW_PATHS is empty here, so
 * this list IS the guarded surface):
 *   .claude/settings.json        the harness's permissions and the hook wiring itself.
 *   .claude/settings.local.json  same surface, local overrides. Two exact entries instead of
 *                                the upstream `.claude/settings*.json` glob: settings.json and
 *                                settings.local.json are the only two names Claude Code reads
 *                                there, so exact entries carry the same protection with no
 *                                glob machinery — a `.claude/my-settings.json` is not guarded
 *                                because nothing loads it.
 *   .claude/hooks/               THIS GUARD — the wrapper, this file and their tests.
 *   .claude/tools/               the guarded list is imported from
 *                                `.claude/tools/card-scope.mjs`. If the main session can edit
 *                                that file it can empty the list and then edit anything, so
 *                                leaving it out would make the single-source decision into the
 *                                bypass. A guard whose source of truth is writable by the
 *                                session it guards is not a guard.
 *   .githooks/                   the commit-msg hook that enforces the commit convention —
 *                                repo-local git hooks are enforcement, i.e. CI by another name.
 *   .github/workflows/           the CI gates themselves — the thing that would catch the rest.
 *   *Dockerfile*                 image build (would carry the @ki4jlu registry npm auth).
 *   *docker-compose*.yml         service wiring.
 *   *nginx*.conf                 proxy/deploy configuration. None of the three exists in this
 *                                repo today; the globs guard the day one appears, because that
 *                                first appearance is exactly when nobody has thought about
 *                                guarding it yet.
 *
 * WHY THE THREE INFRASTRUCTURE GLOBS LEAD WITH `*` (upstream round 2)
 * Upstream specified `nginx*.conf`, `Dockerfile*`, `docker-compose*.yml`, and a review
 * confirmed the prefix-anchoring gap that follows: `widget-test-nginx.conf` was a real proxy
 * config in that repository and was NOT guarded, because the pattern is anchored at the start
 * of the basename. The same weakness is latent in the other two — `frontend.Dockerfile` and
 * `test-docker-compose.yml` are ordinary naming conventions — so all three are widened.
 *
 * Known over-block, accepted: `*Dockerfile*` has no extension anchor, so a prose file whose
 * NAME contains "dockerfile" is refused too. The cost of that is one card; the cost of the
 * other direction is an unreviewed edit to an image build that carries registry credentials.
 * `*docker-compose*.yml` and `*nginx*.conf` stay anchored on their extension, so they do not
 * have that side effect.
 *
 * Entries ending in `/` match by prefix; entries containing `*` are globs (see `guardedMatch`);
 * everything else matches exactly.
 */
export const HOOK_ONLY_PATHS = [
  '.claude/settings.json',
  '.claude/settings.local.json',
  '.claude/hooks/',
  '.claude/tools/',
  '.githooks/',
  '.github/workflows/',
  '*Dockerfile*',
  '*docker-compose*.yml',
  '*nginx*.conf',
]

/** The effective guarded surface: the imported spec/auth list plus the infrastructure list. */
export const GUARDED_PATHS = [...CROSS_REVIEW_PATHS, ...HOOK_ONLY_PATHS]

/**
 * Tools this guard knows how to read a target path out of, and the keys to read.
 *
 * Anything else BLOCKS. That is not caution for its own sake: the hook is wired to a matcher in
 * `settings.json`, and if that matcher is ever widened to a tool whose input shape is not
 * handled here, the failure must be a loud block ("the guard cannot evaluate this tool") rather
 * than a silent pass. `MultiEdit` is listed although the current matcher does not include it.
 */
export const EDITOR_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
export const PATH_KEYS = ['file_path', 'notebook_path', 'path']

/** Glob → RegExp. `*` matches any run of characters, `/` included (like Python's fnmatch). */
function globToRegExp(pattern) {
  let out = '^'
  for (const ch of pattern) {
    if (ch === '*') out += '.*'
    else if (ch === '?') out += '.'
    else out += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`${out}$`)
}

/**
 * The guarded entry a repo-relative path matches, or null.
 *
 * Case-INSENSITIVE, deliberately. macOS ships a case-insensitive filesystem by default, so
 * `GO-BACKEND/internal/apidocs/OPENAPI.YAML` opens the very same file that a case-sensitive
 * comparison would have waved through — a real bypass on the machine this harness runs on, and
 * `realpath` does not canonicalise case. The cost is over-blocking a file on Linux whose path
 * differs from a guarded one only in case; over-blocking is the safe direction.
 */
export function guardedMatch(repoRelativePath) {
  const rel = repoRelativePath.split(path.sep).join('/').toLowerCase()
  const base = rel.slice(rel.lastIndexOf('/') + 1)
  for (const entry of GUARDED_PATHS) {
    const e = entry.toLowerCase()
    if (e.includes('*')) {
      const re = globToRegExp(e)
      // A pattern without a slash is a basename pattern too: `Dockerfile*` must catch
      // `go-backend/Dockerfile`, not only a root-level one.
      if (re.test(rel) || (!e.includes('/') && re.test(base))) return entry
    } else if (e.endsWith('/')) {
      // Prefix entry — and the slashless form exactly, so a FILE named `src/auth` cannot slip
      // past the directory entry (the same reasoning as `crossReviewMatch` in card-scope.mjs).
      if (rel.startsWith(e) || rel === e.slice(0, -1)) return entry
    } else if (rel === e) {
      return entry
    }
  }
  return null
}

/**
 * Resolve symlinks in `p` WITHOUT throwing, including when the final component does not exist
 * or dangles.
 *
 * `fs.realpathSync` is unusable here twice over: it throws ENOENT for a file a Write is about
 * to create, and it also throws for a DANGLING symlink — which is precisely the interesting
 * case, because `ln -s <repo>/go-backend/migrations/main/0004_new.sql /tmp/x` dangles and
 * writing to `/tmp/x` still creates the guarded file. So parents are resolved recursively and
 * the final component's link target is read explicitly. The depth cap breaks symlink loops.
 */
export class UnresolvablePath extends Error {
  constructor(target, cause) {
    super(`${target} (${cause?.code ?? cause?.message ?? cause})`)
    this.name = 'UnresolvablePath'
    this.target = target
    this.cause = cause
  }
}

export function resolveLinks(p, depth = 0) {
  const abs = path.resolve(p)
  if (depth > 16) return abs
  const parent = path.dirname(abs)
  const resolvedParent = parent === abs ? parent : resolveLinks(parent, depth + 1)
  const candidate = path.join(resolvedParent, path.basename(abs))
  try {
    if (lstatSync(candidate).isSymbolicLink()) {
      const target = readlinkSync(candidate)
      const next = path.isAbsolute(target) ? target : path.join(resolvedParent, target)
      return resolveLinks(next, depth + 1)
    }
  } catch (err) {
    // Tolerate ONLY "there is nothing there yet". A Write CREATES its target, and a component
    // that does not exist cannot be hiding a symlink at decision time, so ENOENT/ENOTDIR are
    // honest answers and resolution continues with the lexical form.
    //
    // Everything else is the filesystem REFUSING to say where this path lands. Round 1
    // tolerated those codes too and returned a best-effort path, which `candidateRelativePaths`
    // could then drop — an allow. They now raise `UnresolvablePath`, which `decide` turns into
    // a block: "every uncertainty blocks" applies here as much as to a malformed payload.
    //
    // Anything that is not an errno at all still propagates untouched. That is deliberate and
    // load-bearing: this started as a bare `catch {}`, and the mutation run found that with the
    // depth cap removed, the RangeError from unbounded recursion on a symlink LOOP was swallowed
    // by an outer frame of this same catch and the guard returned "allow".
    const code = err?.code
    if (code === 'ENOENT' || code === 'ENOTDIR') return candidate
    const unresolvable = ['EACCES', 'EPERM', 'EINVAL', 'ELOOP', 'ENAMETOOLONG', 'EIO', 'EMFILE']
    if (unresolvable.includes(code)) throw new UnresolvablePath(candidate, err)
    throw err
  }
  return candidate
}

/** Distinct entries, order preserved. */
function uniq(values) {
  return [...new Set(values)]
}

/**
 * `target`'s path relative to `root` if `target` lies strictly inside `root`, else null.
 *
 * This replaces `path.relative(root, target).startsWith('..')`, which was the review FAIL: a
 * byte comparison against one attacker-chosen root, whose "outside" answer was then thrown away
 * silently — and throwing a candidate away means allowing it.
 *
 * Three reasons it is a case-folded, NFC-normalised SEGMENT comparison and not string
 * arithmetic:
 *
 *   * Case. macOS opens the same file for `/Users/x` and `/users/x`, and `realpath` does not
 *     canonicalise case, so a byte comparison against the correctly-cased root answered
 *     "outside" for a file that is very much inside — the reproduced route 2.
 *   * Unicode. Measured on this machine's APFS: a directory created as `caf\u00e9` (NFC) is
 *     opened by the path `cafe\u0301` (NFD) — the filesystem compares normalisation-insensitively
 *     while storing the form it was handed. So a root containing a non-ASCII character (a German
 *     university has those in home directories) can reach this function in either composition
 *     while naming one directory. The review flagged this route as plausible-but-unreproduced;
 *     it reproduces.
 *   * Segments, not characters: `/a/bc` must not count as inside `/a/b`, which a `startsWith`
 *     test gets wrong unless a separator is appended by hand.
 *
 * The returned path keeps the TARGET's own spelling — `guardedMatch` case-folds again anyway —
 * so the refusal message names the path the developer actually passed.
 *
 * On a case-sensitive or normalisation-sensitive filesystem this over-blocks a file differing
 * from a guarded one only in case or composition. Over-blocking is the safe direction, the same
 * trade `guardedMatch` documents.
 *
 * Precondition: both arguments are already absolute and `..`-free (every caller passes them
 * through `path.resolve`). This function does no normalisation of its own beyond case and
 * Unicode composition, because doing it twice would hide which layer resolved what.
 */
export function relativeInside(root, target) {
  const fold = (seg) => seg.normalize('NFC').toLowerCase()
  const segments = (p) => p.split(path.sep).filter((seg) => seg !== '' && seg !== '.')
  const r = segments(root)
  const t = segments(target)
  if (t.length <= r.length) return null
  for (let i = 0; i < r.length; i += 1) if (fold(r[i]) !== fold(t[i])) return null
  return t.slice(r.length).join('/')
}

/**
 * Every guarded-surface-relative form of `filePath` that this guard is willing to consider.
 *
 * Path matching IS the security property, so a guarded file must be refused however it is
 * reached. Two independent resolutions of the target are checked, against every trusted root:
 *
 *   * LEXICAL (`path.resolve`) — collapses `..` and `.` without touching the filesystem. It is
 *     what catches `go-backend/../go-backend/internal/apidocs/openapi.yaml`.
 *   * LINK-RESOLVED (`resolveLinks`) — follows symlinks, so a link INTO the repo from anywhere
 *     is caught.
 *
 * Neither subsumes the other, which is why both are kept and both are tested:
 *   - lexical alone misses `/tmp/alias -> <repo>/…/openapi.yaml`;
 *   - link-resolved alone misses a repo path whose directory is a symlink pointing OUT of the
 *     repo — the literal path is guarded, the resolved one is not, and the write still goes
 *     through a guarded name.
 *
 * THE ROOTS, AND WHY THERE ARE TWO KINDS (round 2)
 * `SELF_ROOT` — this file's own repository — is the TRUSTED root: no payload can move it. The
 * `cwd`-derived root is kept as an ADDITIONAL root, never as the only one, and it can therefore
 * only ever ADD a block. That asymmetry is the fix for route 1: previously a foreign `cwd` moved
 * the whole protected surface, so `git init /tmp/x` plus an absolute path to the real spec was
 * an allow. Now a foreign `cwd` widens the guard instead of relocating it, and its own repository
 * gets the same protection as this one — which is right, since the harness cannot tell whether
 * a second checkout of this project is the one being protected.
 *
 * A match on ANY (root, form) pairing blocks.
 */
export function candidateRelativePaths(cwd, root, filePath) {
  const cwds = uniq([path.resolve(cwd), resolveLinks(cwd)])
  const roots = uniq([
    SELF_ROOT,
    SELF_ROOT_LEXICAL,
    ...(root === null ? [] : [path.resolve(root), resolveLinks(root)]),
  ])
  const targets = []
  for (const base of cwds) {
    const abs = path.resolve(base, filePath)
    targets.push(abs, resolveLinks(abs))
  }
  const rels = []
  for (const r of roots) {
    for (const t of uniq(targets)) {
      const rel = relativeInside(r, t)
      if (rel) rels.push(rel)
    }
  }
  return uniq(rels)
}

/** The repository root containing `cwd`, or null if there is none (or git cannot say). */
export function repoRoot(cwd) {
  try {
    const out = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
    const root = out.trim()
    return root === '' ? null : root
  } catch {
    return null
  }
}

/**
 * The decision. `{ block: boolean, message, matched, rel }`.
 *
 * Note the order: the subagent check comes FIRST. A `milestone-worker` legitimately edits the
 * spec, the migrations and the auth code — that is the whole point of the pipeline — so its
 * calls pass through before any path is looked at. `agent_id` is present only inside a subagent.
 */
export function decide(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return blocked('the hook input was not valid JSON, so the target path is unknown')
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return blocked('the hook input was not a JSON object, so the target path is unknown')
  }

  if (data.agent_id) return { block: false }

  const tool = typeof data.tool_name === 'string' ? data.tool_name : ''
  if (!EDITOR_TOOLS.has(tool)) {
    return blocked(
      `this guard does not know how to read a target path out of "${tool || '(no tool_name)'}". ` +
        'Either the settings.json matcher was widened past Edit|Write|MultiEdit|NotebookEdit, ' +
        'or the input is not a PreToolUse payload. Blocking, because a guard that cannot see ' +
        'where the write lands must not permit it.',
    )
  }

  const cwd = typeof data.cwd === 'string' ? data.cwd : ''
  if (cwd === '') return blocked('the hook input carried no "cwd", so the repository is unknown')
  try {
    if (!statSync(cwd).isDirectory()) return blocked(`"cwd" is not a directory: ${cwd}`)
  } catch {
    return blocked(`"cwd" does not exist: ${cwd}`)
  }

  const input = data.tool_input
  const paths =
    input !== null && typeof input === 'object' && !Array.isArray(input)
      ? PATH_KEYS.map((k) => input[k]).filter((v) => typeof v === 'string' && v !== '')
      : []
  if (paths.length === 0) {
    return blocked(
      `${tool} arrived with no ${PATH_KEYS.join('/')} in tool_input, so the target path is unknown`,
    )
  }

  const root = repoRoot(cwd)
  if (root === null) {
    return blocked(
      `"cwd" is not inside a git repository (${cwd}), so no path can be resolved against the ` +
        'repository root',
    )
  }

  for (const p of paths) {
    let candidates
    try {
      candidates = candidateRelativePaths(cwd, root, p)
    } catch (err) {
      // The one place round 1 inverted the card's own rule: an unresolvable candidate was
      // dropped, and a dropped candidate is an allowed candidate.
      if (err instanceof UnresolvablePath) {
        return blocked(
          `the filesystem would not resolve ${p} to a canonical location — ${err.message}. The ` +
            'guard cannot tell whether this write lands on a guarded file, so it refuses.',
        )
      }
      throw err
    }
    for (const rel of candidates) {
      const matched = guardedMatch(rel)
      if (matched) {
        return {
          block: true,
          matched,
          rel,
          message: `${tool} targets a guarded path: ${rel} (matches "${matched}")`,
        }
      }
    }
  }
  return { block: false }
}

function blocked(reason) {
  return { block: true, matched: null, rel: null, message: `${reason}` }
}

const BLOCK_ADVICE = `
This is the guarded surface — the harness's own settings, hooks and tools, the repo-local git
hooks (.githooks/), the CI workflows, and container/proxy config. It changes through the
pipeline only: a card, a milestone-worker, an independent code-reviewer. There is no lift, no
sentinel and no exception for a one-line change; "the developer asked me to" is what a card
records, not a bypass.

Ordinary files are NOT blocked. Create the card and spawn a milestone-worker for this one.

Limit, stated plainly: this hook sees the file-editing tools only. An edit made through Bash
(\`sed -i\`, a heredoc redirect) is governed by instruction, not by this guard — and that
instruction is absolute: a refused Edit or Write is NEVER retried through Bash. This refusal is the
routing answer, not an obstacle.
`.trim()

export function main(readStdin = () => readFileSync(0, 'utf8')) {
  let raw
  try {
    raw = readStdin()
  } catch {
    process.stderr.write('pm-guard: could not read the hook input — blocking.\n')
    return 2
  }
  const verdict = decide(raw)
  if (!verdict.block) return 0
  process.stderr.write(`Blocked: ${verdict.message}\n\n${BLOCK_ADVICE}\n`)
  return 2
}

/**
 * Was this file run as a program, rather than imported by the test suite?
 *
 * Round 1 compared `import.meta.url` with `pathToFileURL(process.argv[1]).href`. Node resolves
 * symlinks for the main module but leaves `argv[1]` as typed, so reaching the guard through a
 * symlink made the two differ, `main()` never ran, and the process exited 0 — an ALLOW. Measured,
 * not theorised: `node <symlink-to-pm-guard.mjs>` with a payload that blocks returned exit 0.
 *
 * Comparing real paths closes the class regardless of how the file is reached. Not currently
 * reachable through `settings.json`'s absolute wiring, which is why this is hardening rather
 * than a second bypass — but the guard should not depend on a deployment detail for its answer.
 */
function invokedAsProgram() {
  const argv1 = process.argv[1]
  if (!argv1) return false
  if (path.resolve(argv1) === SELF_FILE) return true
  try {
    return realpathSync(argv1) === realpathSync(SELF_FILE)
  } catch {
    // `argv[1]` names something the filesystem will not resolve. Node could not have executed
    // this file as that path, so we are being imported: do not read stdin, do not set an exit
    // code. The wrapper's own fail-closed path covers a genuinely broken invocation.
    return false
  }
}

// `process.exitCode`, not `process.exit()` — the same stdout/stderr flushing reason spelled out
// at the end of card-scope.mjs: a hook's stderr is a pipe, and `process.exit()` can truncate it.
if (invokedAsProgram()) {
  process.exitCode = main()
}
