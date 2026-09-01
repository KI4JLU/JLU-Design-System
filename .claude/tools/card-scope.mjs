#!/usr/bin/env node
/**
 * card-scope — determine which files belong to a kanban card, and emit their diff.
 *
 * WHAT THIS IS, AND WHAT IT USED TO BE
 * ------------------------------------
 * This file was `review-tier.mjs`, and its headline job was to compute a review tier
 * (`quick` / `full` / `full+cross-review`). **The tiering has been removed** — measured
 * across seven runs, a full review cost 98k–180k tokens and the first real run of the cheap
 * tier cost 114k, i.e. inside the same band. It saved nothing, because the cheap half was
 * only the reading: the judge still had to run the four gates and re-derive every finding,
 * which is the job. Every card now gets one full independent review. Work that is never
 * carded — an ad-hoc request the project manager handles itself — is not a cheaper review but
 * none at all, and is reported that way.
 *
 * What survives is the part that was worth having on its own merits: **collecting the file
 * set of one card, correctly**, and emitting the diff text a reviewer actually reads. That
 * collection fixed three confirmed silent-failure bugs (see COLLECTION HARDENING) and it
 * carries the `claim-base` scoping rule. The reviewer and the `cross-review` skill both still
 * need to know which files belong to a card.
 *
 * WHAT IT DOES NOT DO ANY MORE
 * ----------------------------
 * No tier, no `driver`, no `reason`, and no inert-path allowlist. There is nothing left for
 * an "inert" judgement to decide: reading surface is not chosen by file extension any more.
 * The one path-list that stays is `CROSS_REVIEW_PATHS` — not a tier, but the trigger list
 * for the mandatory second model, which is a CLAUDE.md architecture invariant older than
 * the tiering ever was. It is reported per file (`crossReview`) and once for the whole set
 * (`crossReviewRequired`), and it is printable with `--guarded-paths` so that no prompt
 * file ever needs a second hand-maintained copy of it.
 *
 * WHAT GIT ACTUALLY PRINTS (verified against git 2.51.2 in scratch repos, 2026-08-18)
 * ----------------------------------------------------------------------------------
 * These are the facts the prose version of this collection got wrong, and the reason
 * everything below is NUL-separated with no field splitting anywhere:
 *
 *   git status --porcelain            (NO -z)  a staged rename prints
 *                                              `R  pkg/old.go -> pkg/new.go`
 *                                              and a path with a space is QUOTED:
 *                                              ` M "with space.txt"`, an embedded quote
 *                                              is escaped: `?? "quo\"te.go"`.
 *                                              Feeding either to `git diff -- <path>`
 *                                              exits 0 with EMPTY output — identical to
 *                                              "no changes". That is the silent failure.
 *   git status --porcelain -z                  rename is `R  <NEW>\0<OLD>\0` — new path
 *                                              FIRST. No quoting, no `->`.
 *   git diff --name-status -z                  rename is `R100\0<OLD>\0<NEW>\0` — old
 *                                              path FIRST. The OPPOSITE order from
 *                                              `status -z`. The status letter is its own
 *                                              NUL field.
 *   git ls-files --others --exclude-standard -z
 *                                              individual untracked FILES, unquoted —
 *                                              unlike porcelain, which collapses a wholly
 *                                              untracked directory into one `?? dir/`
 *                                              entry. This is why untracked paths come
 *                                              from here and not from porcelain.
 *   git diff --name-status -z <base>...HEAD    COMMITTED changes since the merge base.
 *                                              DISJOINT from the working tree, not a
 *                                              superset. Both are needed; see --base.
 *
 * Both paths of a rename count: the old path leaving the tree is as much a reviewable
 * change as the new one arriving. `--find-renames` is passed explicitly so the result does
 * not depend on the caller's `diff.renames` config.
 *
 * COLLECTION HARDENING (three reproduced ways the file set came back too small)
 * ----------------------------------------------------------------------------
 * The first version collected from `git diff HEAD` plus `git ls-files --others`. A review
 * round reproduced three git-legal states in which that reports an empty or short file set
 * for a tree that has genuinely changed, committable content. All three were re-reproduced
 * against git 2.51.2 before being fixed, and each has a test:
 *
 *   1. THE INDEX IS NOT THE WORKTREE. `git add` a change, then write the original content
 *      back into the worktree. `git diff HEAD` is empty — it compares the WORKTREE to HEAD
 *      — while `git diff --cached HEAD` shows `M app.go` and `git commit` ships the staged
 *      content. FIX: the index-vs-HEAD diff is its own collection source ("index").
 *   2. THE SAME BLIND SPOT VIA PLUMBING. `git update-index --add --cacheinfo
 *      160000,<sha>,docs/external.md` puts a raw gitlink in the index with no `.gitmodules`
 *      anywhere. Invisible to `git diff HEAD`, visible as `A docs/external.md` to
 *      `git diff --cached HEAD`. FIX: same index source; plus a gitlink (index mode 160000)
 *      is reported with a `contentWarning`, because its name says nothing about what a
 *      reader would find behind it.
 *   3. `.gitignore` WIDENING. In one uncommitted step, add `evil.go` to `.gitignore` and
 *      drop an untracked `evil.go`. `git ls-files --others --exclude-standard` obeys the
 *      NEW `.gitignore`, so `evil.go` is not merely mis-reported — it never appears at all.
 *      FIX: when this diff changes an ignore file, every currently-ignored path on disk
 *      whose excluding pattern is absent from that file's HEAD version is pulled back into
 *      the file set with a WARNING note (`selectNewlyIgnored`).
 *
 * And one route that cannot be made robust, so it fails loudly instead:
 *   4. `git update-index --assume-unchanged` / `--skip-worktree` tell git to stop looking at
 *      a file, so an edit to it is invisible to `git diff HEAD` AND to `git diff --cached
 *      HEAD`. There is no cheap correct scoping for a file git refuses to stat, so
 *      `assertNoHiddenIndexFlags` exits 2 rather than under-report.
 *
 * SCOPING A BRANCH THAT CARRIES SEVERAL CARDS (the --base decision)
 * ----------------------------------------------------------------
 * A feature branch can already contain commits belonging to *other* cards. Reproduced on
 * this repo: `--base main` returned 15 files including four sibling-card files, while
 * `--no-base` returned 6 and omitted `CLAUDE.md`, which really did belong to the card but
 * had been committed together with sibling work. Neither reproduced the card's diff.
 *
 * DECIDED, and documented identically in `--help`, `project-manager/SKILL.md` and
 * `CLAUDE.md`:
 *
 *   * `--base <ref>` is the only supported way to scope a review. Default `main`.
 *   * The PM records the branch tip as `claim-base: <sha>` on the card when the card is
 *     claimed — the output of `git rev-parse HEAD` at that moment, NOT the branch point
 *     against `main`. The reviewer then runs `--base <that sha>`, which scopes exactly the
 *     commits made after the claim plus the working tree — the card's own work, with no
 *     sibling commits and nothing omitted. A wrong sha is not an error: it yields a plausible
 *     file set that is simply the wrong one (measured: `f5f4f4c` instead of the real tip
 *     turned a 10-file card into 18 files).
 *   * Without a recorded claim-base, `--base main` is the fallback: it OVER-scopes (a
 *     reviewer reads a sibling card's files) and never under-scopes. Over-scoping costs
 *     reading time; under-scoping is the defect class this file exists to end.
 *   * `--no-base` is DIAGNOSTIC ONLY and must never scope a review. It cannot see committed
 *     card work, and `committedWorkIncluded: false` plus a WARNING note say so in the
 *     output. Wanting a smaller set is not a reason to use it.
 *
 * `committedCommits` in the output names every commit the base scoped, so a reviewer can
 * see at a glance whether sibling work was dragged in.
 *
 * EMITTING THE DIFF (--format diff)
 * ---------------------------------
 * The documented recipe used to be `--format paths0 | xargs -0 git diff --`. That pipeline
 * emits ZERO bytes for a file whose change is already committed on the branch and for an
 * untracked file — reproduced: correct file names, empty diff, i.e. a reviewer would have
 * been handed nothing to read. `--format diff` therefore does the work in here, where it is
 * tested: base..worktree for tracked paths, base..index as a separate labelled section
 * whenever the index differs from the worktree, and `git diff --no-index` against
 * `/dev/null` for untracked and newly-ignored paths. `paths0` stays for pathspec use.
 *
 * NO SILENT FAILURE
 * -----------------
 * A path that cannot be resolved (does not exist in the worktree and is not explained by
 * a delete, a rename source or the index) is an error with exit code 2 — never an empty
 * result. An unresolvable `--base` is likewise exit 2, because silently dropping the
 * committed half of a card's work is exactly the class of bug this file exists to end.
 *
 * USAGE
 *   node .claude/tools/card-scope.mjs [--repo <dir>] [--base <ref> | --no-base]
 *                                     [--format json|paths0|diff] [--guarded-paths]
 *
 *   --base <ref>   also include committed changes <ref>...HEAD (default: "main"), so a
 *                  card whose work is partly committed on the branch is still scoped in
 *                  full. Pass the card's recorded claim-base sha here. Unresolvable
 *                  ref -> exit 2.
 *   --no-base      DIAGNOSTIC ONLY, never for scoping a review: working tree + untracked
 *                  only. Records committedWorkIncluded:false and a WARNING note so the
 *                  omission is visible rather than silent.
 *   --format diff  the review input itself: real diff text for every path in the set,
 *                  including committed-on-branch, staged-only and untracked ones.
 *   --format paths0
 *                  NUL-separated absolute paths on stdout, for pathspec use
 *                  (`... | xargs -0 git log --`). NOT a way to produce the diff — see
 *                  EMITTING THE DIFF above.
 *   --guarded-paths
 *                  print CROSS_REVIEW_PATHS, one per line, and exit. The single copy of
 *                  the trigger-path list, for any prompt that needs to consult it
 *                  (`cross-review`'s mandatory gate, and the PM guard hook, which imports it).
 *
 * EXIT CODES  0 = ok (including an empty file set) | 2 = error
 */

import { execFileSync, spawnSync } from 'node:child_process'
import { lstatSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** git's canonical empty tree — lets us diff a repository that has no commit yet. */
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/**
 * Files whose content decides what `git ls-files --others --exclude-standard` can see, i.e.
 * files that can shrink this tool's own input. A diff touching one of these gets the
 * newly-ignored scan in `collectFileSet`.
 *
 * `.git/info/exclude` and `core.excludesFile` are deliberately absent: they are not tracked,
 * so they can never appear in a diff at all.
 * // TODO: a change to `.git/info/exclude` or to `core.excludesFile` between HEAD and now is
 * // therefore NOT detected by this tool. Whether that is reachable in this repo's workflow
 * // (both are local-only and never shipped in a PR) is not yet confirmed.
 */
export const IGNORE_FILE_BASENAMES = new Set(['.gitignore'])

/**
 * THE TRIGGER-PATH LIST — the surface for which a second, external review model would be
 * mandatory.
 *
 * EMPTY IN THIS REPOSITORY, deliberately: the JLU Design System has no API spec, no auth,
 * no token or credential surface — nothing here needs a mandatory second model. The
 * MECHANISM stays wired (`--guarded-paths` prints the list, `crossReview`/`crossReviewRequired`
 * appear in the JSON output, and `.claude/hooks/pm-guard.mjs` imports this array as the first
 * half of what the PM guard refuses), so a future card that introduces such a surface only has
 * to populate this array — the plumbing, the tests and the guard follow automatically.
 *
 * This is the single copy. It lives here, in code, for two reasons: it has a test, and it
 * has more than one consumer. Print it with `--guarded-paths` rather than pasting it into a
 * prompt file — in the upstream repo (CampusAgents), three review rounds were spent repairing
 * hand-maintained copies of exactly this list.
 *
 * It is a *mandatory-second-model* trigger, not a review depth: every card gets one full
 * independent review whether or not a path here is touched. Entries ending in `/` match by
 * prefix, the rest match exactly.
 */
export const CROSS_REVIEW_PATHS = []

/**
 * The cross-review entry this path matches, or null.
 *
 * A trailing-slash entry matches by prefix AND matches the slashless path exactly: a
 * reviewer found that `crossReviewMatch('go-backend/internal/auth')` returned null, so a
 * FILE literally named `go-backend/internal/auth` (no slash) would not have triggered the
 * mandatory second model. It cannot occur in this repo's current layout — the directory of
 * that name already exists, so a file cannot take the same path — but the two-character fix
 * costs nothing and removes the reasoning step.
 */
export function crossReviewMatch(repoRelativePath) {
  for (const entry of CROSS_REVIEW_PATHS) {
    if (entry.endsWith('/')) {
      if (repoRelativePath.startsWith(entry) || repoRelativePath === entry.slice(0, -1)) {
        return entry
      }
    } else if (repoRelativePath === entry) {
      return entry
    }
  }
  return null
}

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
}

/** Split raw NUL-separated git output into fields, dropping the trailing empty one. */
function nulFields(buffer) {
  const text = buffer.toString('utf8')
  const fields = text.split('\0')
  if (fields.length > 0 && fields[fields.length - 1] === '') fields.pop()
  return fields
}

/**
 * Parse `git diff --name-status -z` output.
 *
 * Field layout, verified in a scratch repo: `<status>\0<path>\0`, and for a rename or copy
 * `<R|C><score>\0<old>\0<new>\0` — OLD FIRST, the opposite order from `git status -z`.
 * Both paths are returned; the old one carries `renameSource: true` so a caller knows why
 * it is allowed to be absent from the worktree.
 */
export function parseNameStatusZ(buffer) {
  const fields = nulFields(buffer)
  const entries = []
  let i = 0
  while (i < fields.length) {
    const status = fields[i]
    const letter = status[0]
    if (letter === 'R' || letter === 'C') {
      const oldPath = fields[i + 1]
      const newPath = fields[i + 2]
      if (oldPath === undefined || newPath === undefined) {
        throw new Error(
          `git diff --name-status -z: ${status} entry is missing a path (got ${JSON.stringify(fields.slice(i))})`,
        )
      }
      entries.push({ status, path: oldPath, renameSource: true })
      entries.push({ status, path: newPath, renameSource: false })
      i += 3
    } else {
      const only = fields[i + 1]
      if (only === undefined) {
        throw new Error(
          `git diff --name-status -z: ${status} entry is missing its path (got ${JSON.stringify(fields.slice(i))})`,
        )
      }
      entries.push({ status, path: only, renameSource: false })
      i += 2
    }
  }
  return entries
}

/** Parse a plain NUL-separated path list (`git ls-files -z`). */
export function parseNulPathList(buffer) {
  return nulFields(buffer)
}

/**
 * Parse `git ls-files -s -z`: `<mode> <sha> <stage>\t<path>\0`. Returns path -> mode.
 *
 * The mode is the only place a gitlink announces itself without a `.gitmodules` file:
 * `git update-index --add --cacheinfo 160000,<sha>,<path>` stages one with nothing else on
 * disk to notice. Verified in a scratch repo (git 2.51.2).
 */
export function parseLsFilesStage(buffer) {
  const modes = new Map()
  for (const field of nulFields(buffer)) {
    const tab = field.indexOf('\t')
    if (tab === -1) {
      throw new Error(`git ls-files -s -z: entry has no TAB separator: ${JSON.stringify(field)}`)
    }
    const [mode] = field.slice(0, tab).split(' ')
    modes.set(field.slice(tab + 1), mode)
  }
  return modes
}

/**
 * Parse `git ls-files -v -z`: `<tag><space><path>\0`.
 *
 * Verified in a scratch repo (git 2.51.2): `--assume-unchanged` prints the tag in LOWERCASE
 * (`h a.go`), `--skip-worktree` prints `S`.
 */
export function parseLsFilesV(buffer) {
  return nulFields(buffer).map((field) => {
    if (field.length < 3 || field[1] !== ' ') {
      throw new Error(`git ls-files -v -z: unexpected entry ${JSON.stringify(field)}`)
    }
    return { tag: field[0], path: field.slice(2) }
  })
}

/**
 * Parse `git check-ignore -v -z --stdin`: groups of four NUL fields,
 * `<source>\0<linenum>\0<pattern>\0<pathname>\0`. Verified in a scratch repo.
 */
export function parseCheckIgnoreZ(buffer) {
  const fields = nulFields(buffer)
  if (fields.length % 4 !== 0) {
    throw new Error(
      `git check-ignore -v -z: expected groups of 4 fields, got ${fields.length} (${JSON.stringify(fields.slice(0, 8))})`,
    )
  }
  const out = []
  for (let i = 0; i < fields.length; i += 4) {
    out.push({ source: fields[i], line: Number(fields[i + 1]), pattern: fields[i + 2], path: fields[i + 3] })
  }
  return out
}

/** The pattern lines of an ignore file, normalised the way `check-ignore -v` reports them. */
export function ignorePatternSet(text) {
  const patterns = new Set()
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '').trim()
    if (line === '' || line.startsWith('#')) continue
    patterns.add(line)
  }
  return patterns
}

export class ScopeError extends Error {}

/**
 * Tripwire: an index flag that makes a real content change invisible to EVERY diff.
 *
 * `--assume-unchanged` and `--skip-worktree` tell git to stop comparing a path against the
 * worktree. Reproduced in a scratch repo: with `--assume-unchanged` set and the file then
 * edited, BOTH `git diff HEAD` and `git diff --cached HEAD` are empty, and the first version
 * of this tool reported an empty file set for a tree with modified source in it. Unlike the
 * index and `.gitignore` holes, there is no cheap correct scoping available — git is
 * deliberately not looking. The rule for exactly this situation: if a case cannot be made
 * robust, it must fail loudly with a non-zero exit rather than under-report.
 */
export function assertNoHiddenIndexFlags(entries) {
  const hidden = entries.filter((e) => e.tag === 'S' || (e.tag >= 'a' && e.tag <= 'z'))
  if (hidden.length === 0) return
  const listed = hidden.map((e) => `${e.path} (${e.tag === 'S' ? 'skip-worktree' : 'assume-unchanged'})`)
  throw new ScopeError(
    `index flags hide ${hidden.length} path(s) from every git diff: ${listed.join(', ')}. ` +
      `A change to such a path is invisible to \`git diff HEAD\` AND to \`git diff --cached HEAD\`, ` +
      `so no honest file set can be produced. Refusing to under-report. Clear the flags ` +
      `(\`git update-index --no-assume-unchanged <path>\` / \`--no-skip-worktree <path>\`) and re-run.`,
  )
}

/**
 * Which paths on disk are hidden by an ignore pattern that THIS DIFF adds?
 *
 * Pure, so the rule is testable without git. `candidates` are `{path, source, pattern}` as
 * `git check-ignore -v -z` reports them for the currently-ignored paths; `changedIgnoreFiles`
 * is the set of ignore files in this diff; `headPatterns` maps each of those to the pattern
 * set its HEAD version contained.
 *
 * A candidate counts as newly hidden iff the ignore file that excludes it is part of this
 * diff AND the excluding pattern is absent from that file's HEAD version. That second
 * condition is what keeps the check affordable and useful: without it, every review that
 * touches `.gitignore` would drag `node_modules/`, `dist/` and every other long-committed
 * exclusion into the file set, and the signal would be discarded as noise within a week.
 */
export function selectNewlyIgnored({ candidates, changedIgnoreFiles, headPatterns }) {
  const newly = []
  for (const candidate of candidates) {
    if (!changedIgnoreFiles.has(candidate.source)) continue
    const before = headPatterns.get(candidate.source) ?? new Set()
    if (before.has(candidate.pattern)) continue
    newly.push(candidate)
  }
  return newly
}

/**
 * Does this repo entry exist in the worktree?
 *
 * `lstat`, not `existsSync`: `existsSync` follows symlinks and therefore reports `false`
 * for a *dangling* symlink — a legitimate tracked or untracked file. Using it made the
 * resolution check below reject a valid tree (found while writing the test for that check,
 * and covered by the "dangling symlink" case in `card-scope.test.mjs`).
 */
function lstatOrNull(absPath) {
  try {
    return lstatSync(absPath)
  } catch {
    return null
  }
}

/**
 * The no-silent-failure tripwire, as a pure function so it can be tested directly.
 *
 * A path git reported that is absent from the worktree must be *explained* — by a deletion,
 * by being the source side of a rename, or by living in the index. Anything else means our
 * own parsing or decoding produced a path that does not name a real file, and the only
 * honest response is an error with an exit code. Returning a partial file set instead is how
 * two earlier rounds "reviewed" nothing while reporting success.
 *
 * With correct NUL parsing this should never fire; it is a guard against a future
 * regression in the parsing, not an expected condition.
 */
export function assertResolvable({ path: relPath, statuses, sources, renameSource, exists }) {
  if (exists) return
  if (statuses.some((s) => s[0] === 'D')) return
  if (renameSource) return
  // The INDEX is a third explanation. A path staged but absent from the worktree is
  // legitimate git — a gitlink added via `git update-index --cacheinfo 160000,...` never
  // puts anything on disk, and `git add new.go && rm new.go` leaves the content in the index
  // only. In both cases `git commit` still ships it, so the honest answer is to REPORT the
  // path (collectFileSet notes it and attaches a contentWarning), not to exit 2 with a
  // message about mangled parsing. The tripwire keeps its purpose: it fires for a path no
  // git source vouches for, which is what a parsing bug produces.
  if (sources.includes('index')) return
  throw new ScopeError(
    `unresolvable path: git reported "${relPath}" (status ${statuses.join(',')}, source ` +
      `${sources.join(',')}) but it is absent from the worktree and is neither a deletion nor ` +
      `a rename source. Refusing to return a partial file set.`,
  )
}

/**
 * Collect the card's file set from real git state.
 *
 * Union of four sources, each labelled in the output:
 *   worktree      — tracked changes against HEAD (staged and unstaged both)
 *   index         — the index against HEAD, which the worktree can hide entirely
 *   untracked     — `git ls-files --others --exclude-standard -z`
 *   committed     — `<base>...HEAD`, the part of the card already committed on the branch
 *   newly-ignored — on disk, hidden from the untracked scan by a pattern this diff adds
 */
export function collectFileSet({ cwd = process.cwd(), base = 'main', useBase = true } = {}) {
  let root
  try {
    root = git(['rev-parse', '--show-toplevel'], cwd).toString('utf8').trim()
  } catch (err) {
    throw new ScopeError(`not a git repository (or git failed): ${cwd}\n${err.message}`)
  }

  // 0. Before collecting anything: refuse to work in a tree where git has been told to stop
  //    looking at a file. Nothing downstream could see such a change.
  assertNoHiddenIndexFlags(parseLsFilesV(git(['ls-files', '-v', '-z'], cwd)))
  const stageModes = parseLsFilesStage(git(['ls-files', '-s', '-z'], cwd))

  const notes = []
  const byPath = new Map()
  const add = (entry, source) => {
    let rec = byPath.get(entry.path)
    if (!rec) {
      rec = { path: entry.path, statuses: new Set(), sources: new Set(), renameSource: false }
      byPath.set(entry.path, rec)
    }
    rec.statuses.add(entry.status)
    rec.sources.add(source)
    if (entry.renameSource) rec.renameSource = true
  }

  const hasHead = (() => {
    try {
      git(['rev-parse', '--verify', '--quiet', 'HEAD^{commit}'], cwd)
      return true
    } catch {
      return false
    }
  })()

  const headRef = hasHead ? 'HEAD' : EMPTY_TREE

  // 1. tracked changes, WORKTREE against HEAD (or the empty tree, in a repo without a commit)
  for (const entry of parseNameStatusZ(
    git(['diff', '--name-status', '-z', '--find-renames', headRef], cwd),
  )) {
    add(entry, 'worktree')
  }

  // 1b. tracked changes, INDEX against HEAD. NOT redundant with 1: `git diff HEAD` compares
  //     the WORKTREE to HEAD, so staging a change and then restoring the worktree hides it
  //     completely while `git commit` still ships it. Same for a gitlink staged via
  //     `git update-index --cacheinfo 160000`. Both reproduced; see COLLECTION HARDENING.
  for (const entry of parseNameStatusZ(
    git(['diff', '--name-status', '-z', '--find-renames', '--cached', headRef], cwd),
  )) {
    add(entry, 'index')
  }

  // 2. untracked files — never visible to `git diff` in any form
  for (const p of parseNulPathList(git(['ls-files', '--others', '--exclude-standard', '-z'], cwd))) {
    add({ status: '??', path: p, renameSource: false }, 'untracked')
  }

  // 3. the part of the card already committed on this branch
  let committedWorkIncluded = false
  let baseUsed = null
  let diffFrom = headRef
  let committedCommits = []
  if (!useBase) {
    notes.push(
      'WARNING: --no-base is diagnostic only and must not be used to scope a review. Committed changes on this branch were NOT scoped, so if any part of this card is already committed its files are missing from this file set. Re-run with --base <claim-base sha> (or --base main).',
    )
  } else if (!hasHead) {
    notes.push(
      'repository has no commit yet, so no part of this card can be committed — the committed source is provably empty, not skipped.',
    )
    committedWorkIncluded = true
  } else {
    let baseSha
    try {
      baseSha = git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`], cwd)
        .toString('utf8')
        .trim()
    } catch {
      throw new ScopeError(
        `--base ref "${base}" does not resolve to a commit. Refusing to guess: silently dropping ` +
          `the committed half of a card's work is the exact failure this tool exists to prevent. ` +
          `Pass --base <ref> with a ref that exists, or --no-base to scope the working tree only.`,
      )
    }
    for (const entry of parseNameStatusZ(
      git(['diff', '--name-status', '-z', '--find-renames', `${baseSha}...HEAD`], cwd),
    )) {
      add(entry, 'committed')
    }
    committedWorkIncluded = true
    baseUsed = base
    // `<base>...HEAD` diffs from the MERGE BASE, so the emitted diff must start there too,
    // or it would show the base branch's own commits inverted.
    diffFrom = git(['merge-base', baseSha, 'HEAD'], cwd).toString('utf8').trim()
    // Name the commits the base scoped. On a branch carrying several cards this is how a
    // reviewer sees that sibling work was dragged in, instead of guessing.
    const log = git(['log', '--format=%h %s', `${diffFrom}..HEAD`], cwd).toString('utf8').trim()
    committedCommits = log === '' ? [] : log.split('\n')
  }

  // 4. Paths that an ignore pattern ADDED BY THIS DIFF hides from step 2.
  //    Reproduced hole: `.gitignore` gains `evil.go` and an untracked `evil.go` is dropped in
  //    the same uncommitted step -> `git ls-files --others --exclude-standard` obeys the NEW
  //    file, so the path never appears anywhere in the output. Pull it back in and say so:
  //    something being hidden is itself the reason it needs a human.
  const contentWarnings = new Map()
  const changedIgnoreFiles = new Set(
    [...byPath.keys()].filter((p) => IGNORE_FILE_BASENAMES.has(path.posix.basename(p))),
  )
  if (changedIgnoreFiles.size > 0) {
    // `--directory` collapses a wholly ignored directory into one entry, which is what keeps
    // this affordable: on this repo it yields 4 entries (`node_modules/`, `dist/`, ...) rather
    // than every ignored file in the tree.
    const ignored = git(
      ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z'],
      cwd,
    )
    let candidates = []
    if (nulFields(ignored).length > 0) {
      // check-ignore exits 1 when nothing matches, which execFileSync turns into a throw.
      const res = spawnSync('git', ['check-ignore', '-v', '-z', '--stdin'], {
        cwd,
        input: ignored,
        maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      })
      if (res.status === 0) candidates = parseCheckIgnoreZ(res.stdout)
      else if (res.status !== 1) {
        throw new ScopeError(
          `git check-ignore failed (exit ${res.status}): ${res.stderr?.toString('utf8') ?? ''}`,
        )
      }
    }
    const headPatterns = new Map()
    for (const file of changedIgnoreFiles) {
      let text = ''
      if (hasHead) {
        try {
          text = git(['show', `HEAD:${file}`], cwd).toString('utf8')
        } catch {
          text = '' // the ignore file is new in this diff: every pattern in it is new
        }
      }
      headPatterns.set(file, ignorePatternSet(text))
    }
    for (const candidate of selectNewlyIgnored({ candidates, changedIgnoreFiles, headPatterns })) {
      add({ status: '!!', path: candidate.path, renameSource: false }, 'newly-ignored')
      contentWarnings.set(
        candidate.path,
        `it exists on disk and is hidden from the untracked scan by "${candidate.pattern}", a pattern this diff adds to ${candidate.source}`,
      )
      notes.push(
        `WARNING: ${candidate.path} exists on disk and is newly excluded by "${candidate.pattern}" (${candidate.source}:${candidate.line}), which this diff changes. It is scoped in anyway: an uncommitted ignore-file change must not be able to shrink the file set.`,
      )
    }
  }

  // Resolve every path. A path that is absent must be *explained* by a delete, a rename
  // source or the index; anything else is an error, never an empty or partial result.
  const files = []
  for (const rec of [...byPath.values()].sort((a, b) => (a.path < b.path ? -1 : 1))) {
    const abs = path.join(root, rec.path)
    const stat = lstatOrNull(abs)
    const exists = stat !== null
    const statuses = [...rec.statuses].sort()
    const sources = [...rec.sources].sort()
    assertResolvable({
      path: rec.path,
      statuses,
      sources,
      renameSource: rec.renameSource,
      exists,
    })

    // Staged content with nothing on disk: `git commit` ships it, a reader looking at the
    // worktree sees nothing. Say so out loud.
    const stagedOnly = !exists && !statuses.some((s) => s[0] === 'D') && !rec.renameSource
    if (stagedOnly) {
      contentWarnings.set(
        rec.path,
        'it exists only in the INDEX, not in the worktree — `git commit` would ship content that nothing on disk shows',
      )
      notes.push(
        `WARNING: ${rec.path} is staged in the index but absent from the worktree (status ${statuses.join(',')}). \`git commit\` would ship it. Read the base..index section of \`--format diff\`, not the worktree.`,
      )
    }

    // Two things on disk make the path's NAME a misleading description of its content. A
    // reviewer reproduced the first one: `ln -s /etc/passwd config.md` read as harmless
    // Markdown.
    if (!contentWarnings.has(rec.path)) {
      const mode = stageModes.get(rec.path)
      if (mode === '160000') {
        contentWarnings.set(
          rec.path,
          'the index records it as a gitlink (mode 160000) — a commit pointer, not the text its name suggests',
        )
      } else if (stat?.isSymbolicLink()) {
        contentWarnings.set(
          rec.path,
          'it is a symbolic link, so its name says nothing about the content a reader would follow it to',
        )
      } else if (stat?.isDirectory()) {
        contentWarnings.set(rec.path, 'it is a directory entry, not a file')
      }
    }

    files.push({
      path: rec.path,
      absPath: abs,
      statuses,
      sources,
      existsInWorktree: exists,
      renameSource: rec.renameSource,
      contentWarning: contentWarnings.get(rec.path) ?? null,
      crossReview: crossReviewMatch(rec.path),
    })
  }

  return {
    root,
    files,
    notes,
    committedWorkIncluded,
    base: baseUsed,
    committedCommits,
    diffFrom,
  }
}

/**
 * Collect the file set and report whether the mandatory second model applies.
 *
 * No tier: the review depth is not a function of the file set any more (see the header).
 * `fileCount: 0` is the one derived fact a caller still keys off — it is what puts the
 * reviewer in verification-only mode, and it is an explicit result rather than an absence
 * of output.
 */
export function computeCardScope(options = {}) {
  const collected = collectFileSet(options)
  const crossReviewPaths = collected.files.filter((f) => f.crossReview).map((f) => f.path)
  return {
    fileCount: collected.files.length,
    files: collected.files,
    crossReviewRequired: crossReviewPaths.length > 0,
    crossReviewPaths,
    base: collected.base,
    committedCommits: collected.committedCommits,
    committedWorkIncluded: collected.committedWorkIncluded,
    repoRoot: collected.root,
    diffFrom: collected.diffFrom,
    notes: collected.notes,
  }
}

function parseArgv(argv) {
  const options = { cwd: process.cwd(), base: 'main', useBase: true, format: 'json' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--repo') {
      options.cwd = argv[++i]
      if (!options.cwd) throw new ScopeError('--repo needs a directory')
    } else if (arg === '--base') {
      options.base = argv[++i]
      if (!options.base) throw new ScopeError('--base needs a ref')
      options.useBase = true
    } else if (arg === '--no-base') {
      options.useBase = false
    } else if (arg === '--format') {
      options.format = argv[++i]
      if (!['json', 'paths0', 'diff'].includes(options.format)) {
        throw new ScopeError(`--format must be json, paths0 or diff, got "${options.format}"`)
      }
    } else if (arg === '--guarded-paths') {
      options.guardedPaths = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    } else {
      throw new ScopeError(`unknown argument "${arg}" — see --help`)
    }
  }
  return options
}

const USAGE = `card-scope — which files belong to this card, and their diff.

  node .claude/tools/card-scope.mjs [--repo <dir>] [--base <ref> | --no-base]
                                    [--format json|paths0|diff] [--guarded-paths]

  --base <ref>       also scope committed changes <ref>...HEAD (default: main)
  --no-base          DIAGNOSTIC ONLY — never for scoping a review (see SCOPING below)
  --format json      file set + sources + notes + the cross-review trigger (default)
  --format diff      the review input itself: real diff text for every path in the set
  --format paths0    NUL-separated absolute paths, for pathspec use (\`| xargs -0 git log --\`).
                     NOT a way to get the diff — it is empty for committed and untracked
                     paths. Use --format diff.
  --guarded-paths    print the trigger-path list (CROSS_REVIEW_PATHS), one per line, and exit.
                     The single copy: \`cross-review\`'s mandatory gate reads it from here, and
                     the PM guard hook imports it, instead of either keeping its own.

SCOPING A BRANCH THAT CARRIES SEVERAL CARDS
  A branch can already hold commits belonging to other cards, so "the card's diff" is not
  the same as "the branch's diff". The rule:
    * The PM records the branch tip as \`claim-base: <sha>\` on the card when it is claimed —
      literally \`git rev-parse HEAD\` AT THAT MOMENT, not the branch point against \`main\` —
      and the reviewer runs \`--base <that sha>\`. That scopes exactly the commits made after
      the claim plus the working tree: this card, nothing else, nothing missing. A wrong base
      does not error; it returns a plausible file set that is simply the wrong one.
    * With no recorded claim-base, \`--base main\` is the fallback. It OVER-scopes (you may
      read a sibling card's files) and never under-scopes. \`committedCommits\` in the JSON
      names the commits it pulled in, so over-scoping is visible rather than confusing.
    * \`--no-base\` cannot see committed card work and will silently under-scope a card whose
      work is partly committed. It is for debugging the tool, not for scoping a review.

There is no review tier: every card gets one full independent review.   Exit: 0 ok, 2 error
`

/**
 * Emit the diff text for a computed file set.
 *
 * The recipe this replaces (\`--format paths0 | xargs -0 git diff --\`) was reproduced
 * emitting ZERO bytes for a file committed on the branch and for an untracked file, i.e. a
 * reviewer would have been handed the right file names and none of the content.
 * Three sections, each labelled so a reader knows what they are looking at:
 *
 *   1. \`git diff <diffFrom> -- <tracked paths>\`          base -> WORKTREE
 *   2. \`git diff --cached <diffFrom> -- <tracked paths>\`  base -> INDEX, emitted only when
 *      it differs from section 1, because a difference means content is staged that the
 *      worktree does not show — the hole that made this section necessary.
 *   3. \`git diff --no-index /dev/null <path>\` per untracked / newly-ignored path, which is
 *      the only way to get diff text for a file git does not track. It exits 1 on
 *      difference (that is success here), so it goes through spawnSync.
 */
function emitDiff(result, write) {
  const cwd = result.repoRoot
  const tracked = result.files.filter((f) => !f.sources.includes('untracked') && !f.sources.includes('newly-ignored'))
  const loose = result.files.filter((f) => f.sources.includes('untracked') || f.sources.includes('newly-ignored'))

  write(`# card-scope — ${result.fileCount} file(s), diff base ${result.diffFrom}\n`)
  if (result.fileCount === 0) {
    write('# empty file set: this card changed no file at all — an explicit result, not "nothing found"\n')
  }
  if (result.crossReviewRequired) {
    write(`# cross-review MANDATORY (CLAUDE.md): ${result.crossReviewPaths.join(', ')}\n`)
  }
  for (const note of result.notes) write(`# note: ${note}\n`)

  let worktreeDiff = ''
  if (tracked.length > 0) {
    const paths = tracked.map((f) => f.path)
    worktreeDiff = git(['diff', result.diffFrom, '--', ...paths], cwd).toString('utf8')
    write(`\n### ${result.diffFrom}..worktree (tracked, ${tracked.length} path(s))\n`)
    write(worktreeDiff === '' ? '# (no textual difference)\n' : worktreeDiff)

    const indexDiff = git(['diff', '--cached', result.diffFrom, '--', ...paths], cwd).toString('utf8')
    if (indexDiff !== worktreeDiff) {
      write(`\n### ${result.diffFrom}..index (staged content — what \`git commit\` would ship)\n`)
      // The two views differ for the harmless everyday reason (an unstaged edit) and for the
      // dangerous one (content staged that the worktree does not show at all). Only shout for
      // the second, which the collector already identified precisely.
      const indexOnly = tracked.filter((f) => f.sources.includes('index') && !f.sources.includes('worktree'))
      if (indexOnly.length > 0) {
        write(
          `# WARNING: ${indexOnly.map((f) => f.path).join(', ')} differ(s) from HEAD in the INDEX ONLY — the worktree shows nothing. Review THIS section, not the one above.\n`,
        )
      }
      write(indexDiff === '' ? '# (no textual difference)\n' : indexDiff)
    }
  }

  for (const file of loose) {
    const kind = file.sources.includes('newly-ignored') ? 'newly ignored' : 'untracked'
    write(`\n### ${kind}: ${file.path}\n`)
    if (file.path.endsWith('/')) {
      write(`# a wholly ignored DIRECTORY; its files are not inlined. Contents:\n`)
      for (const p of parseNulPathList(
        git(['ls-files', '--others', '--ignored', '--exclude-standard', '-z', '--', file.path], cwd),
      )) {
        write(`#   ${p}\n`)
      }
      continue
    }
    const res = spawnSync('git', ['diff', '--no-index', '--', '/dev/null', file.path], {
      cwd,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
    if (res.status !== 0 && res.status !== 1) {
      throw new ScopeError(
        `git diff --no-index failed for ${file.path} (exit ${res.status}): ${res.stderr?.toString('utf8') ?? ''}`,
      )
    }
    const text = res.stdout.toString('utf8')
    write(text === '' ? '# (empty file)\n' : text)
  }
}

export function main(argv) {
  let options
  try {
    options = parseArgv(argv)
  } catch (err) {
    process.stderr.write(`card-scope: ${err.message}\n`)
    return 2
  }
  if (options.help) {
    process.stdout.write(USAGE)
    return 0
  }
  if (options.guardedPaths) {
    // Deliberately independent of any repository: a prompt asking "may I touch this path?"
    // must be able to read the list without a git state.
    process.stdout.write(`${CROSS_REVIEW_PATHS.join('\n')}\n`)
    return 0
  }
  let result
  try {
    result = computeCardScope(options)
  } catch (err) {
    process.stderr.write(`card-scope: ${err.message}\n`)
    return 2
  }
  if (options.format === 'paths0') {
    process.stdout.write(result.files.map((f) => f.absPath).join('\0'))
    if (result.files.length > 0) process.stdout.write('\0')
    return 0
  }
  if (options.format === 'diff') {
    try {
      emitDiff(result, (text) => process.stdout.write(text))
    } catch (err) {
      process.stderr.write(`card-scope: ${err.message}\n`)
      return 2
    }
    return 0
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  return 0
}

/**
 * `process.exitCode`, NEVER `process.exit()`.
 *
 * On POSIX, `process.stdout` is synchronous when it points at a file but ASYNCHRONOUS when it
 * points at a pipe — which is what every caller of this script uses, because an agent captures
 * its output. `process.exit()` terminates the process before Node has flushed that pipe, so the
 * output is cut at the pipe buffer. Reproduced against this repo (git 2.51.2, node 24) with a
 * diff of 526_552 bytes: redirected to a file it arrived whole, through a pipe it arrived as
 * 65_899 bytes — one buffer — with exit code 0 and the untracked section, which is emitted last,
 * missing entirely. Correct file names, truncated content, success exit: exactly the silent
 * failure this tool exists to end. Setting `exitCode` and returning lets Node flush and then
 * exit with the same status.
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
