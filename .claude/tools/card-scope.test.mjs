// @vitest-environment node
/**
 * Tests for `card-scope.mjs` — which files belong to a card, and their diff.
 *
 * THE ORACLE, AND WHY IT IS INDEPENDENT
 * ------------------------------------
 * **Real git, in real scratch repositories.** These tests do not feed the parser
 * hand-written porcelain strings; each one creates a repository, performs the actual
 * operation (`git mv`, `git rm`, a file with a space in its name, an untracked directory, a
 * commit on a branch, `git update-index --cacheinfo`), and asserts the collected file set
 * against *what the test itself created*. The prose version of this collection was wrong
 * twice, and both times the error was a wrong belief about what git prints — so a simulated
 * string would have reproduced the belief instead of testing it. A few supplementary parser
 * unit tests pin the verified field order; they are a supplement, never the primary evidence.
 *
 * Two tests go further and use **git itself** as the oracle: the `paths0` pathspec test
 * (a pathspec this tool produced must make `git diff` report the modification the test made
 * — the historical defect, `git diff -- 'old.go -> new.go'`, exits 0 with empty output) and
 * the `--format diff` test that first reproduces the old `paths0 | xargs -0 git diff --`
 * recipe emitting zero bytes.
 *
 * WHAT IS NO LONGER TESTED HERE, AND WHY
 * -------------------------------------
 * The hand-written `POLICY_TABLE` and every tier assertion are gone, together with the
 * review tiering they tested (see the header of `card-scope.mjs`: measured, the quick tier
 * saved nothing). Their target was deleted deliberately — the tests were not dropped
 * because they had become inconvenient to keep passing. Everything covering collection, the
 * git edge cases, `--format diff` and `claim-base` scoping is kept, because that work stands
 * on its own: it fixed three reproduced silent-failure bugs.
 *
 * Hermetic per docs/TESTING.md: no network, no database, no backend. It needs the `git`
 * binary, and it neutralises the host's git configuration (HOME, global and system config)
 * so the result cannot depend on the developer's `~/.gitconfig`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  lstatSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CROSS_REVIEW_PATHS,
  assertResolvable,
  crossReviewMatch,
  parseNameStatusZ,
  parseNulPathList,
} from './card-scope.mjs'

const SCRIPT = fileURLToPath(new URL('./card-scope.mjs', import.meta.url))

// ---------------------------------------------------------------------------
// Part 1 — the trigger-path list. Pure: no git, no filesystem.
//
// In this repository the list is EMPTY by decision: the JLU Design System has no spec, auth
// or credential surface, so no path mandates a second review model. The mechanism stays
// (`--guarded-paths`, `crossReview`/`crossReviewRequired` in the output, the guard's import),
// so these tests pin the decision itself: an entry appearing here is a deliberate change with
// an argument, never an accident.
// ---------------------------------------------------------------------------

describe('the trigger-path list (decision: empty — this repo has no spec/auth surface)', () => {
  it('is empty, and growing it is a decision, not a drive-by', () => {
    expect(CROSS_REVIEW_PATHS).toHaveLength(0)
  })

  it('crossReviewMatch matches nothing while the list is empty', () => {
    expect(crossReviewMatch('src/components/ui/button.tsx')).toBeNull()
    expect(crossReviewMatch('.claude/settings.json')).toBeNull()
    expect(crossReviewMatch('anything/at/all')).toBeNull()
  })

  it('--guarded-paths prints the (empty) list, with no repository and no git state', () => {
    // The single-copy rule made mechanical: the PM guard hook imports the list from here
    // instead of keeping its own copy, and a refusal decision has to be answerable before
    // anything has been edited — hence no repo argument. Empty list -> empty output.
    const out = spawnSync('node', [SCRIPT, '--guarded-paths'], { encoding: 'utf8' })
    expect(out.status).toBe(0)
    expect(out.stdout.trim()).toBe('')
  })
})


describe('parser field order (supplement — the primary evidence is real git below)', () => {
  it('diff --name-status -z puts the OLD rename path first', () => {
    // Verified against git 2.51.2 in a scratch repo before this was written; pinned here
    // so a refactor cannot quietly swap the order. `status -z` uses the OPPOSITE order,
    // which is exactly the kind of detail prose got wrong.
    const buf = Buffer.from('R100\0pkg/old.go\0pkg/new.go\0M\0src/a.ts\0', 'utf8')
    expect(parseNameStatusZ(buf)).toEqual([
      { status: 'R100', path: 'pkg/old.go', renameSource: true },
      { status: 'R100', path: 'pkg/new.go', renameSource: false },
      { status: 'M', path: 'src/a.ts', renameSource: false },
    ])
  })

  it('a truncated entry is an error, never a dropped path', () => {
    expect(() => parseNameStatusZ(Buffer.from('R100\0only-one-path\0', 'utf8'))).toThrow(
      /missing a path/,
    )
    expect(() => parseNameStatusZ(Buffer.from('M\0', 'utf8'))).toThrow(/missing its path/)
  })

  it('a NUL path list keeps spaces and quotes intact', () => {
    const buf = Buffer.from('with space.txt\0quo"te.go\0', 'utf8')
    expect(parseNulPathList(buf)).toEqual(['with space.txt', 'quo"te.go'])
  })
})

describe('the no-silent-failure tripwire (oracle: the rule, stated in words)', () => {
  // The rule: a path git reported that is absent from the worktree is acceptable ONLY if a
  // deletion or a rename source explains it. Anything else means our own parsing produced a
  // path that names no real file, and the only honest outcome is an error — never a quietly
  // shorter file set. This is a unit test on purpose: with correct NUL parsing the condition
  // cannot be provoked through real git (see the mutation-testing note in the DONE summary),
  // so the guard has to be tested where it lives.
  it('an absent path with no deletion and no rename source is an error', () => {
    expect(() =>
      assertResolvable({
        path: 'src/ghost.ts',
        statuses: ['M'],
        sources: ['worktree'],
        renameSource: false,
        exists: false,
      }),
    ).toThrow(/unresolvable path/)
  })

  it('an absent path explained by a deletion is accepted', () => {
    expect(() =>
      assertResolvable({
        path: 'src/gone.ts',
        statuses: ['D'],
        sources: ['worktree'],
        renameSource: false,
        exists: false,
      }),
    ).not.toThrow()
  })

  it('an absent path explained by being a rename source is accepted', () => {
    expect(() =>
      assertResolvable({
        path: 'src/old.ts',
        statuses: ['R100'],
        sources: ['worktree'],
        renameSource: true,
        exists: false,
      }),
    ).not.toThrow()
  })

  it('a path that exists is always accepted', () => {
    expect(() =>
      assertResolvable({
        path: 'src/here.ts',
        statuses: ['??'],
        sources: ['untracked'],
        renameSource: false,
        exists: true,
      }),
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Part 2 — real git in real scratch repositories.
// The oracle for the file set is what the test itself created.
// ---------------------------------------------------------------------------

let workspace

const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_TERMINAL_PROMPT: '0',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.invalid',
}

beforeAll(() => {
  // realpath: on macOS os.tmpdir() is a symlink, and `git rev-parse --show-toplevel`
  // returns the resolved path — absolute-path assertions would fail otherwise.
  workspace = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'card-scope-')))
})

afterAll(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true })
})

let repoCounter = 0

function git(repo, args) {
  return execFileSync('git', args, { cwd: repo, env: GIT_ENV, encoding: 'utf8' })
}

function write(repo, relPath, content) {
  const abs = path.join(repo, relPath)
  mkdirSync(path.dirname(abs), { recursive: true })
  writeFileSync(abs, content)
  return abs
}

/** A fresh repo with one commit containing `files`, on branch `main`. */
function repoWith(files) {
  const repo = path.join(workspace, `r${++repoCounter}`)
  mkdirSync(repo, { recursive: true })
  git(repo, ['init', '-q', '-b', 'main', '.'])
  for (const [relPath, content] of Object.entries(files)) write(repo, relPath, content)
  if (Object.keys(files).length > 0) {
    git(repo, ['add', '-A'])
    git(repo, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'base'])
  }
  return repo
}

/** Run the tool as a real child process, the way the PM will. */
function runTool(repo, extraArgs = []) {
  const result = spawnSync('node', [SCRIPT, '--repo', repo, ...extraArgs], {
    env: GIT_ENV,
    encoding: 'utf8',
  })
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    json: result.status === 0 && result.stdout.startsWith('{') ? JSON.parse(result.stdout) : null,
  }
}

const pathsOf = (json) => json.files.map((f) => f.path).sort()

describe('real git: mandatory scenarios', () => {
  it('a modified tracked file is collected, and its unmodified sibling is not', () => {
    // Oracle: the test changed exactly one of the two committed files, so it knows the
    // correct file set is that one path — and, just as importantly, not the other.
    const repo = repoWith({ 'docs/note.md': 'a\n', 'src/app.ts': 'x\n' })
    write(repo, 'docs/note.md', 'a\nb\n')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['docs/note.md'])
    expect(out.json.crossReviewRequired).toBe(false)
  })

  it('a tracked modification and an untracked new file are collected together', () => {
    // The union of two different sources in one set. Oracle: the test made exactly these two
    // changes, one tracked and one untracked — and `git diff` alone would show only the first.
    const repo = repoWith({ 'docs/note.md': 'a\n' })
    write(repo, 'docs/note.md', 'a\nb\n')
    write(repo, 'go-backend/internal/widgets/handler.go', 'package widgets\n')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual([
      'docs/note.md',
      'go-backend/internal/widgets/handler.go',
    ])
    const loose = out.json.files.find((f) => f.path.endsWith('handler.go'))
    expect(loose.sources).toEqual(['untracked'])
  })

  it('crossReviewRequired stays false with the empty trigger list, and is still reported', () => {
    // The mechanism must keep answering explicitly (`crossReviewRequired: false`, not an
    // absent key), so a future card that populates CROSS_REVIEW_PATHS changes an answer
    // rather than adding one. Oracle: the list is empty by decision, so no path can match.
    const repo = repoWith({ 'src/components/ui/button.tsx': 'export const a = 1\n' })
    write(repo, 'src/components/ui/button.tsx', 'export const a = 2\n')

    const out = runTool(repo)
    expect(out.json.crossReviewRequired).toBe(false)
    expect(out.json.crossReviewPaths).toEqual([])
    expect(out.json.files[0].crossReview).toBeNull()
  })

  it('a real staged rename contributes BOTH paths', () => {
    // `git mv` of a source file to a .md name. Both paths of a rename belong to the card —
    // the old path leaving the tree is as much a reviewable change as the new one arriving.
    // A tool that only read the new path would see nothing but a Markdown file. Oracle: the
    // test performed the rename, so it knows both paths.
    const repo = repoWith({
      'src/lib/token.ts': 'export const t = 1\n',
      'docs/keep.md': 'a\n', // so docs/ exists — `git mv` will not create the directory
    })
    git(repo, ['mv', 'src/lib/token.ts', 'docs/removed.md'])

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual([
      'docs/removed.md',
      'src/lib/token.ts',
    ])

    const oldEntry = out.json.files.find((f) => f.path === 'src/lib/token.ts')
    expect(oldEntry.renameSource).toBe(true)
    expect(oldEntry.existsInWorktree).toBe(false)
    expect(oldEntry.statuses[0]).toMatch(/^R/)

    // The specific historical bug: no path may carry the porcelain arrow. Feeding
    // `git diff -- 'old -> new'` exits 0 with empty output, i.e. it reviews nothing while
    // looking clean.
    for (const f of out.json.files) expect(f.path).not.toContain('->')
  })

  it('a path containing a space survives with the space intact', () => {
    // Oracle: the test created the exact filename, so the expected string is known
    // independently of any porcelain parsing. Naive field splitting on
    // `" M \"with space.ts\""` yields `space.ts"`, which then matches nothing.
    const repo = repoWith({ 'src/with space.ts': 'export const a = 1\n' })
    write(repo, 'src/with space.ts', 'export const a = 2\n')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['src/with space.ts'])
  })

  it('a space in a path under a different directory is handled the same way', () => {
    // The same parsing hazard reached through a second shape, so a fix that special-cased
    // one directory or one extension would not pass both. Oracle: the exact filename the
    // test created.
    const repo = repoWith({ 'docs/with space.md': 'a\n' })
    write(repo, 'docs/with space.md', 'a\nb\n')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['docs/with space.md'])
  })

  it('a path containing a double quote survives unmangled', () => {
    // Porcelain without -z prints `?? "quo\"te.ts"`; `tr -d '"'` mangles it. With -z there
    // is no quoting at all. Oracle: the exact filename the test created.
    const repo = repoWith({ 'keep.md': 'a\n' })
    write(repo, 'src/quo"te.ts', 'export const a = 1\n')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['src/quo"te.ts'])
  })

  it('a deleted file is reported and is not mistaken for an unresolvable path', () => {
    // A deletion is a change, and the path is absent from the worktree by definition, so the
    // resolution check must accept it via its D status rather than erroring. Oracle: the test
    // deleted that exact file.
    const repo = repoWith({ 'src/gone.ts': 'export const a = 1\n', 'keep.md': 'a\n' })
    git(repo, ['rm', '-q', 'src/gone.ts'])

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['src/gone.ts'])
    const entry = out.json.files[0]
    expect(entry.existsInWorktree).toBe(false)
    expect(entry.statuses).toContain('D')
  })

  it('a deletion as the only change is still exit 0, not an error', () => {
    // Guards the resolution check from over-firing: a lone deletion must not be turned into
    // an exit-2 "unresolvable path". Oracle: the test deleted that exact file.
    const repo = repoWith({ 'docs/gone.md': 'a\n', 'keep.md': 'a\n' })
    git(repo, ['rm', '-q', 'docs/gone.md'])

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['docs/gone.md'])
  })

  it('untracked files are found individually, even inside a wholly untracked directory', () => {
    // `git diff` never shows untracked files, and `git status --porcelain` collapses a
    // wholly untracked directory into one `?? dir/` entry — so a .ts file two levels down
    // would be invisible as a path. `git ls-files --others` lists the files.
    // Oracle: the files the test wrote.
    const repo = repoWith({ 'keep.md': 'a\n' })
    write(repo, 'src/new/deep/thing.ts', 'export const a = 1\n')
    write(repo, 'notes.txt', 'plain\n')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['notes.txt', 'src/new/deep/thing.ts'])
    for (const f of out.json.files) expect(f.sources).toContain('untracked')
  })

  it('a dangling symlink is a normal file, not an unresolvable path', () => {
    // Regression guard, and the reason `entryExists` uses lstat: `existsSync` follows the
    // link and reports false for a dangling one, which made the resolution check reject a
    // perfectly valid tree with exit 2. Oracle: the test created the symlink and knows it is
    // a real entry — and that a reader following its name learns nothing about its content,
    // which is what the contentWarning has to say.
    const repo = repoWith({ 'keep.md': 'a\n' })
    symlinkSync('nowhere-at-all', path.join(repo, 'dangling.go'))

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['dangling.go'])
    expect(out.json.files[0].existsInWorktree).toBe(true)
    expect(out.json.files[0].contentWarning).toMatch(/symbolic link/)
  })

  it('a clean tree is an empty file set with exit 0, not an error', () => {
    // An empty file set is its own result, and it is the one derived fact a caller still
    // keys off: it is what puts the reviewer in verification-only mode. It must be
    // distinguishable from an error and from a silently-empty parse. Oracle: the test
    // committed everything, so nothing belongs to this card.
    const repo = repoWith({ 'keep.md': 'a\n', 'src/app.ts': 'x\n' })

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(out.json.files).toEqual([])
    expect(out.json.fileCount).toBe(0)
    expect(out.json.crossReviewRequired).toBe(false)
  })
})

describe('real git: work partly committed on the branch', () => {
  /** main with a base commit; a feature branch with one commit plus uncommitted work. */
  function repoWithCommittedWork() {
    const repo = repoWith({ 'keep.md': 'a\n' })
    git(repo, ['checkout', '-q', '-b', 'feat'])
    write(repo, 'go-backend/internal/widgets/handler.go', 'package widgets\n')
    git(repo, ['add', '-A'])
    git(repo, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'first half of the card'])
    write(repo, 'docs/note.md', 'second half, uncommitted\n')
    return repo
  }

  it('a file committed on the branch is part of the card\'s file set', () => {
    // The card's file set is the union of committed-on-branch, working tree and untracked.
    // Oracle: the test committed that file itself and knows it belongs to the card, while
    // `git diff HEAD` cannot see it at all.
    const repo = repoWithCommittedWork()

    const out = runTool(repo, ['--base', 'main'])
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual([
      'docs/note.md',
      'go-backend/internal/widgets/handler.go',
    ])
    expect(out.json.committedWorkIncluded).toBe(true)
    const committed = out.json.files.find(
      (f) => f.path === 'go-backend/internal/widgets/handler.go',
    )
    expect(committed.sources).toContain('committed')
  })

  it('--no-base drops the committed half — and says so instead of hiding it', () => {
    // The same repo scoped without a base yields ONLY the .md file — half of this card's
    // work, silently. That is the whole reason the committed half must be scoped, and why
    // the omission is recorded in the output rather than implied.
    //
    // The `--base` decision is documented: `--base <claim-base sha>` scopes a review,
    // `--base main` is the over-scoping fallback, and `--no-base` is DIAGNOSTIC ONLY. So the
    // note must not merely mention that committed work was skipped; it must say `--no-base`
    // is not for scoping a review AND point at the replacement. All three claims are
    // asserted separately so that dropping any one of them fails.
    const repo = repoWithCommittedWork()

    const out = runTool(repo, ['--no-base'])
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['docs/note.md'])
    expect(out.json.committedWorkIncluded).toBe(false)
    const notes = out.json.notes.join(' ')
    expect(notes).toMatch(/[Cc]ommitted changes on this branch were NOT scoped/)
    expect(notes).toMatch(/diagnostic only/i)
    expect(notes).toMatch(/--base/)
  })

  it('a file DELETED in a branch commit resolves via its D status, not an error', () => {
    // The path is absent from the worktree AND absent from the working-tree diff (the
    // worktree matches HEAD) — it exists only in the committed half. Oracle: the test
    // deleted that exact file in a commit, so it knows the path belongs to the card.
    const repo = repoWith({ 'keep.md': 'a\n', 'src/doomed.ts': 'export const a = 1\n' })
    git(repo, ['checkout', '-q', '-b', 'feat'])
    git(repo, ['rm', '-q', 'src/doomed.ts'])
    git(repo, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'drop it'])

    const out = runTool(repo, ['--base', 'main'])
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['src/doomed.ts'])
    const entry = out.json.files[0]
    expect(entry.existsInWorktree).toBe(false)
    expect(entry.statuses).toContain('D')
    expect(entry.sources).toEqual(['committed'])
  })

  it('a rename inside a branch commit contributes both paths', () => {
    // Same two-path rule as the working-tree rename, but reached through <base>...HEAD.
    const repo = repoWith({
      'keep.md': 'a\n',
      'docs/keep.md': 'a\n',
      'src/lib/token.ts': 'export const t = 1\n',
    })
    git(repo, ['checkout', '-q', '-b', 'feat'])
    git(repo, ['mv', 'src/lib/token.ts', 'docs/moved.md'])
    git(repo, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'move it'])

    const out = runTool(repo, ['--base', 'main'])
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual([
      'docs/moved.md',
      'src/lib/token.ts',
    ])
    expect(out.json.crossReviewRequired).toBe(false)
  })

  it('main...HEAD alone would be the wrong set too — the union is what is correct', () => {
    // Documents the round-1 defect from the other side: the committed set and the
    // uncommitted set are DISJOINT, not nested. Oracle: git's own answer for each half,
    // compared against what the test created in each half.
    const repo = repoWithCommittedWork()
    const committedOnly = git(repo, ['diff', '--name-only', 'main...HEAD']).trim().split('\n')
    expect(committedOnly).toEqual(['go-backend/internal/widgets/handler.go'])
    expect(git(repo, ['diff', '--name-only', 'HEAD']).trim()).toBe('')

    const out = runTool(repo, ['--base', 'main'])
    expect(pathsOf(out.json)).toEqual([
      'docs/note.md',
      'go-backend/internal/widgets/handler.go',
    ])
  })
})

describe('real git: no silent failure', () => {
  it('an unresolvable --base is exit 2, not a smaller file set', () => {
    // Requirement: never silently narrow the scope. Oracle: the ref does not exist, so
    // the only honest outcomes are an error or a guess — and a guess is forbidden.
    const repo = repoWith({ 'keep.md': 'a\n' })
    write(repo, 'src/app.ts', 'x\n')

    const out = runTool(repo, ['--base', 'nosuchref'])
    expect(out.status).toBe(2)
    expect(out.json).toBeNull()
    expect(out.stderr).toMatch(/does not resolve to a commit/)
    expect(out.stderr).toMatch(/--no-base/)
  })

  it('a directory that is not a git repository is exit 2', () => {
    const notARepo = path.join(workspace, 'not-a-repo')
    mkdirSync(notARepo, { recursive: true })

    const out = runTool(notARepo)
    expect(out.status).toBe(2)
    expect(out.stderr).toMatch(/not a git repository|git failed/)
  })

  it('an unknown flag is exit 2', () => {
    const repo = repoWith({ 'keep.md': 'a\n' })
    const out = runTool(repo, ['--depth', 'shallow'])
    expect(out.status).toBe(2)
    expect(out.stderr).toMatch(/unknown argument/)
  })

  it('a repository with no commit at all is handled explicitly, not skipped', () => {
    // There cannot be committed work in a repo with no commits, so the committed source is
    // provably empty. The distinction between "provably empty" and "not looked at" is
    // recorded in the notes. Oracle: the test staged exactly one file into a fresh repo.
    const repo = path.join(workspace, 'fresh')
    mkdirSync(repo, { recursive: true })
    git(repo, ['init', '-q', '-b', 'main', '.'])
    write(repo, 'src/new.ts', 'export const a = 1\n')
    git(repo, ['add', 'src/new.ts'])

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['src/new.ts'])
    expect(out.json.committedWorkIncluded).toBe(true)
    expect(out.json.notes.join(' ')).toMatch(/no commit yet/)
  })
})

describe('real git: the emitted paths actually work as git pathspecs', () => {
  it('--format paths0 feeds `xargs -0 git diff --` and git reports the change', () => {
    // Oracle: GIT ITSELF. The test modified two awkward filenames, so a correct pathspec
    // must make `git diff` produce non-empty output naming both. The historical bug
    // (`git diff -- 'old.go -> new.go'`) exits 0 with EMPTY output — indistinguishable
    // from "no changes" — so this assertion fails on the old behaviour.
    const repo = repoWith({
      'src/with space.ts': 'export const a = 1\n',
      'src/quo"te.ts': 'export const b = 1\n',
    })
    write(repo, 'src/with space.ts', 'export const a = 2\n')
    write(repo, 'src/quo"te.ts', 'export const b = 2\n')

    const out = runTool(repo, ['--format', 'paths0'])
    expect(out.status).toBe(0)
    const abs = out.stdout.split('\0').filter(Boolean)
    expect(abs.sort()).toEqual(
      [path.join(repo, 'src/quo"te.ts'), path.join(repo, 'src/with space.ts')].sort(),
    )

    // Use them as pathspecs, exactly as the PM is instructed to.
    const diff = execFileSync('git', ['diff', '--', ...abs], {
      cwd: repo,
      env: GIT_ENV,
      encoding: 'utf8',
    })
    expect(diff).not.toBe('')
    // Assert on the CONTENT of both hunks, not on the header: `git diff` renders a path
    // containing a quote in its own escaped form (`"a/src/quo\\"te.ts"`). Both content
    // lines being present is what proves both pathspecs actually matched.
    expect(diff).toContain('-export const a = 1') // src/with space.ts
    expect(diff).toContain('-export const b = 1') // src/quo"te.ts
    expect(diff).toContain('with space.ts')
  })

  it('paths0 on a clean tree emits nothing at all', () => {
    const repo = repoWith({ 'keep.md': 'a\n' })
    const out = runTool(repo, ['--format', 'paths0'])
    expect(out.status).toBe(0)
    expect(out.stdout).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Part 3 (round 2) — index != worktree != HEAD, all three simultaneously.
//
// WHY THIS BLOCK EXISTS. A review round reproduced three git-legal states in which the
// first version of this tool reported an EMPTY or short file set for a tree holding
// genuinely changed, committable content. It also established WHY the earlier suite could
// not catch them: every git case in Part 2 is a plain worktree modification, deletion,
// rename, or a committed-then-untracked split. None decouples the INDEX from the working
// tree. These cases do exactly that, with real git plumbing.
//
// The oracle is not the script. For each case the test itself stages the content and then
// asks GIT what `git commit` would ship (`git diff --cached HEAD --name-only`, or
// `git cat-file`/`git ls-files -s` for the plumbing cases). The assertion is that the
// tool's file set contains what git says is committable. A tool that only ever looked at
// the worktree fails these regardless of how its own output is shaped.
// ---------------------------------------------------------------------------

describe('real git: the index is not the working tree', () => {
  it('a staged change with the worktree restored to HEAD is still in the file set', () => {
    // ROUTE 1 of the three reproduced holes. `git add` a modification, then write the
    // ORIGINAL bytes back into the worktree. `git diff HEAD` (worktree vs HEAD) is empty;
    // `git diff --cached HEAD` shows the file; `git commit` ships the staged content.
    //
    // Oracle: git, twice over. (a) The test asserts `git diff HEAD --name-only` is EMPTY,
    // which is what proves this state really is invisible to the round-1 collection source
    // — the test would be vacuous if the setup did not actually reproduce the hole.
    // (b) `git diff --cached HEAD --name-only` names the file, and that name is what the
    // tool's file set must contain — an empty set here would send the reviewer into
    // verification-only mode on a tree that has committable content in it.
    const repo = repoWith({ 'go-backend/internal/widgets/handler.go': 'package widgets\n' })
    write(repo, 'go-backend/internal/widgets/handler.go', 'package widgets\n// staged evil\n')
    git(repo, ['add', 'go-backend/internal/widgets/handler.go'])
    write(repo, 'go-backend/internal/widgets/handler.go', 'package widgets\n')

    // The setup really is the hole: the worktree matches HEAD again.
    expect(git(repo, ['diff', 'HEAD', '--name-only'])).toBe('')
    // ... and git agrees content is nonetheless staged for commit.
    expect(git(repo, ['diff', '--cached', 'HEAD', '--name-only']).trim()).toBe(
      'go-backend/internal/widgets/handler.go',
    )

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(out.json.fileCount).toBe(1)
    expect(pathsOf(out.json)).toEqual(['go-backend/internal/widgets/handler.go'])
    // The path must be attributed to the index source, otherwise a future refactor could
    // pass this test for the wrong reason (e.g. by scanning the whole tree).
    expect(out.json.files[0].sources).toContain('index')
  })

  it('the same hole with an ordinary prose filename is still reported, not dropped', () => {
    // The second shape of route 1, so a fix cannot pass by special-casing source extensions.
    // The defect is that the first version lost the file entirely and reported 0 files:
    // "one staged .md file" is an honest answer, "nothing changed" is not. Oracle: git says
    // one path is staged for commit, and the test wrote that staged content itself.
    const repo = repoWith({ 'notes.md': 'a\n' })
    write(repo, 'notes.md', 'a\nstaged\n')
    git(repo, ['add', 'notes.md'])
    write(repo, 'notes.md', 'a\n')

    expect(git(repo, ['diff', 'HEAD', '--name-only'])).toBe('')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['notes.md'])
    expect(out.json.fileCount).toBe(1)
  })

  it('a file staged for addition and then deleted from disk is reported, with a warning', () => {
    // Index-only content in its starkest form: `git add new.md && rm new.md`. Nothing is on
    // disk, so a reader looking at the worktree sees nothing, yet `git commit` ships the
    // blob. The path must appear AND must carry the warning that what a reviewer would read
    // on disk is not what would be committed. Oracle: `git ls-files -s` proves the blob is in
    // the index.
    const repo = repoWith({ 'keep.md': 'a\n' })
    write(repo, 'sneaky.md', 'index-only content\n')
    git(repo, ['add', 'sneaky.md'])
    rmSync(path.join(repo, 'sneaky.md'))

    expect(git(repo, ['ls-files', '-s', 'sneaky.md'])).toMatch(/^100644 [0-9a-f]{40} 0\tsneaky\.md/)

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['sneaky.md'])
    expect(out.json.files[0].existsInWorktree).toBe(false)
    expect(out.json.files[0].contentWarning).toMatch(/only in the INDEX/)
    expect(out.json.notes.join(' ')).toMatch(/staged in the index but absent from the worktree/)
  })

  it('a raw gitlink staged via plumbing, with no .gitmodules, is seen and flagged', () => {
    // ROUTE 2. `git update-index --add --cacheinfo 160000,<sha>,<path>` writes a submodule
    // pointer straight into the index. Nothing lands on disk and no `.gitmodules` is created,
    // so nothing but the index mode announces what this path is — while its NAME reads as
    // ordinary Markdown (`docs/external.md`). It must be in the set at all, and it must say
    // that the name is not the content.
    //
    // Oracle: git plumbing, independent of the tool. The test asserts `git ls-files -s`
    // reports mode 160000 for the path and that `git diff HEAD --name-only` is EMPTY (the
    // hole is genuinely reproduced), then requires the tool's set to contain the path.
    const repo = repoWith({ 'keep.md': 'a\n' })
    const sha = git(repo, ['rev-parse', 'HEAD']).trim()
    git(repo, ['update-index', '--add', '--cacheinfo', `160000,${sha},docs/external.md`])

    expect(git(repo, ['ls-files', '-s', 'docs/external.md'])).toMatch(/^160000 /)
    expect(git(repo, ['diff', 'HEAD', '--name-only'])).toBe('')
    // No .gitmodules anywhere — the route that does NOT announce itself.
    expect(git(repo, ['ls-files', '.gitmodules'])).toBe('')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['docs/external.md'])
    const file = out.json.files[0]
    expect(file.sources).toContain('index')
    // With nothing on disk, the index-only rule is the one that fires first and its reason is
    // the accurate one for this state ("`git commit` would ship content that nothing on disk
    // shows"). The mode-160000 rule is what covers the same pointer once the submodule
    // directory IS checked out — the next case pins that branch, so neither is untested.
    expect(file.contentWarning).toMatch(/only in the INDEX/)
  })

  it('a gitlink whose directory IS on disk is flagged by its mode 160000', () => {
    // The other half of ROUTE 2, and the branch that judges by git object type rather than by
    // absence from disk. Here the path exists in the worktree, so the index-only rule does not
    // apply and only `parseLsFilesStage` reporting mode 160000 can tell a reader that the name
    // ending in `.md` is not Markdown.
    //
    // Oracle: git plumbing. `git ls-files -s` must report 160000 for the path — that is what
    // makes "this is a commit pointer, not Markdown" a fact rather than an inference.
    const repo = repoWith({ 'keep.md': 'a\n' })
    const sha = git(repo, ['rev-parse', 'HEAD']).trim()
    // A real nested repository at a path whose name reads as ordinary prose.
    const nested = path.join(repo, 'docs', 'external.md')
    mkdirSync(nested, { recursive: true })
    git(nested, ['init', '-q', '-b', 'main', '.'])
    writeFileSync(path.join(nested, 'f.txt'), 'x\n')
    git(nested, ['add', '-A'])
    git(nested, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'nested'])
    git(repo, ['update-index', '--add', '--cacheinfo', `160000,${sha},docs/external.md`])

    expect(git(repo, ['ls-files', '-s', 'docs/external.md'])).toMatch(/^160000 /)
    expect(git(repo, ['ls-files', '.gitmodules'])).toBe('')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    const link = out.json.files.find((f) => f.path === 'docs/external.md')
    expect(link, 'the gitlink must be in the file set').toBeTruthy()
    expect(link.existsInWorktree).toBe(true)
    expect(link.contentWarning).toMatch(/gitlink|160000/)
  })

  it('assume-unchanged cannot be scoped honestly, so it is exit 2 rather than a small set', () => {
    // ROUTE 4 of the reproduced holes, and the one case that is NOT made robust: with
    // `--assume-unchanged` set, git stops comparing the path, so BOTH `git diff HEAD` and
    // `git diff --cached HEAD` are empty for a real edit. The rule for exactly this situation
    // is to fail loudly rather than under-report.
    //
    // Oracle: the rule, plus git confirming that both diffs really are blind here — which is
    // what makes exit 2 the only honest answer rather than a conservative choice.
    const repo = repoWith({ 'go-backend/internal/widgets/handler.go': 'package widgets\n' })
    git(repo, ['update-index', '--assume-unchanged', 'go-backend/internal/widgets/handler.go'])
    write(repo, 'go-backend/internal/widgets/handler.go', 'package widgets\n// invisible\n')

    expect(git(repo, ['diff', 'HEAD', '--name-only'])).toBe('')
    expect(git(repo, ['diff', '--cached', 'HEAD', '--name-only'])).toBe('')

    const out = runTool(repo)
    expect(out.status).toBe(2)
    expect(out.stderr).toMatch(/assume-unchanged/)
    expect(out.stderr).toMatch(/Refusing to under-report/)
    // Explicitly NOT a zero-file success: that is the failure mode being ruled out.
    expect(out.stdout).toBe('')
  })

  it('skip-worktree is refused the same way', () => {
    // Same rule, the other flag. `git ls-files -v` prints `S` for skip-worktree and a
    // LOWERCASE tag for assume-unchanged; both must trip the tripwire.
    const repo = repoWith({ 'src/app.ts': 'export const a = 1\n' })
    git(repo, ['update-index', '--skip-worktree', 'src/app.ts'])
    write(repo, 'src/app.ts', 'export const a = 2\n')

    const out = runTool(repo)
    expect(out.status).toBe(2)
    expect(out.stderr).toMatch(/skip-worktree/)
  })
})

describe('real git: an uncommitted .gitignore change must not shrink the file set', () => {
  it('a file hidden by a pattern this diff adds is pulled back in, loudly', () => {
    // ROUTE 3 of the three reproduced holes, and the nastiest: in ONE uncommitted step, add
    // `evil.go` to `.gitignore` and drop an untracked `evil.go`. `git ls-files --others
    // --exclude-standard` obeys the NEW `.gitignore`, so the first version reported the
    // file set `{.gitignore}` alone — `evil.go` was not mis-reported, it was ABSENT, with no
    // note and no error.
    //
    // Oracle: git and the filesystem, both independent of the tool. The test asserts that
    // (a) the file really is on disk and (b) `git ls-files --others --exclude-standard` really
    // does NOT list it — that pair is the reproduction of the hole, without which this test
    // would be vacuous. `git check-ignore -v` then names the pattern and the source file, and
    // the tool must report the same path. Either outcome would be defensible — the file
    // appears, or the tool says loudly that something is being hidden — so this asserts BOTH:
    // the path is in the set AND a WARNING note names it.
    const repo = repoWith({ '.gitignore': 'dist/\n', 'keep.md': 'a\n' })
    write(repo, '.gitignore', 'dist/\nevil.go\n')
    write(repo, 'evil.go', 'package main // dropped in the same step\n')

    // The hole, reproduced: on disk, yet invisible to the untracked scan.
    expect(lstatSync(path.join(repo, 'evil.go')).isFile()).toBe(true)
    expect(git(repo, ['ls-files', '--others', '--exclude-standard'])).not.toContain('evil.go')
    expect(git(repo, ['check-ignore', '-v', 'evil.go'])).toMatch(/\.gitignore:2:evil\.go/)

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['.gitignore', 'evil.go'])

    const evil = out.json.files.find((f) => f.path === 'evil.go')
    expect(evil.sources).toContain('newly-ignored')
    expect(evil.contentWarning).toMatch(/hidden from the untracked scan/)
    // Loud, not just present: an operator reading the notes must be told.
    expect(out.json.notes.join(' ')).toMatch(/evil\.go exists on disk and is newly excluded/)
  })

  it('a hidden file with an innocuous name is pulled in too, and says why', () => {
    // The second shape of route 3, where nothing in the diff looks alarming: an empty
    // `.gitignore` gains one line, and the file it hides is called `secret.md`. The first
    // version reported a one-file set. Oracle: git confirms the untracked scan cannot see
    // `secret.md`, and the test wrote it, so it knows the honest set is two paths.
    const repo = repoWith({ '.gitignore': '\n', 'keep.md': 'a\n' })
    write(repo, '.gitignore', 'secret.md\n')
    write(repo, 'secret.md', 'hidden notes\n')

    expect(git(repo, ['ls-files', '--others', '--exclude-standard'])).not.toContain('secret.md')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['.gitignore', 'secret.md'])
    expect(out.json.files.find((f) => f.path === 'secret.md').contentWarning).toMatch(
      /hidden from the untracked scan/,
    )
  })

  it('a pattern that was already in HEAD is NOT dragged in', () => {
    // The affordability half of the rule, and the reason the scan is worth having at all: if
    // every `.gitignore` edit pulled in `node_modules/`, `dist/` and every other long-standing
    // exclusion, the warning would be discarded as noise within a week and the real signal
    // would go with it. Only a pattern ABSENT from the ignore file's HEAD version counts.
    //
    // Oracle: what the test committed. `dist/` was in `.gitignore` at HEAD, so `dist/junk.js`
    // is old news; `fresh.go` is added to the ignore file only now, so it is new.
    const repo = repoWith({ '.gitignore': 'dist/\n', 'keep.md': 'a\n' })
    write(repo, 'dist/junk.js', 'old\n')
    write(repo, '.gitignore', 'dist/\nfresh.go\n')
    write(repo, 'fresh.go', 'package main\n')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['.gitignore', 'fresh.go'])
    expect(out.json.notes.join(' ')).not.toContain('dist/')
  })

  it('a .gitignore left untouched does not trigger the scan at all', () => {
    // The control case. Without it, a scan that always ran would pass the tests above for the
    // wrong reason, and every review in this repo would drag `node_modules/` into its file set.
    const repo = repoWith({ '.gitignore': 'dist/\n', 'keep.md': 'a\n' })
    write(repo, 'dist/junk.js', 'x\n')
    write(repo, 'keep.md', 'a\nb\n')

    const out = runTool(repo)
    expect(out.status).toBe(0)
    expect(pathsOf(out.json)).toEqual(['keep.md'])
    expect(out.json.notes).toEqual([])
  })
})

describe('real git: --format diff emits the content the old recipe lost', () => {
  /**
   * main with a base commit; a feature branch with one COMMITTED file, one untracked file.
   * These are exactly the two shapes the documented `--format paths0 | xargs -0 git diff --`
   * recipe was reproduced returning zero bytes for.
   */
  function repoWithBothShapes() {
    const repo = repoWith({ 'keep.md': 'a\n' })
    git(repo, ['checkout', '-q', '-b', 'feat'])
    write(repo, 'committed.go', 'package main // COMMITTED_ON_BRANCH\n')
    git(repo, ['add', '-A'])
    git(repo, ['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'card work, committed'])
    write(repo, 'loose.go', 'package main // UNTRACKED_MARKER\n')
    return repo
  }

  it('the old paths0|xargs recipe really does emit zero bytes for both shapes', () => {
    // The DEFECT, reproduced as a test so the replacement is not taken on faith. This is the
    // oracle for the two cases below: `git diff -- <path>` compares the WORKTREE to the INDEX,
    // so a file whose change is already committed has nothing to show, and an untracked file is
    // not in the index at all. Both exit 0 with empty output — indistinguishable from "no
    // changes", which is how an external reviewer would have been handed a correct file list
    // and none of the content.
    //
    // If a future git version ever made this pipeline work, THIS test fails first and tells the
    // next reader the replacement may no longer be needed — it does not silently rot.
    const repo = repoWithBothShapes()

    const paths = runTool(repo, ['--format', 'paths0', '--base', 'main'])
    expect(paths.status).toBe(0)
    const abs = paths.stdout.split('\0').filter(Boolean)
    expect(abs.length).toBe(2)

    const piped = execFileSync('git', ['diff', '--', ...abs], {
      cwd: repo,
      env: GIT_ENV,
      encoding: 'utf8',
    })
    expect(piped).toBe('')
  })

  /**
   * Split `--format diff` output into its labelled `### ...` sections.
   *
   * Written because a mutation survived without it: replacing the merge-base range with
   * `HEAD` in the WORKTREE section left the marker visible anyway, because the index section
   * (still ranged from the merge base) then differed and got emitted as well. A whole-stdout
   * `toContain` therefore proved only "the bytes appear somewhere", not "they appear in the
   * section a reviewer is told to read". Asserting per section closes that.
   */
  function sectionsOf(stdout) {
    const out = new Map()
    let current = '(preamble)'
    for (const line of stdout.split('\n')) {
      if (line.startsWith('### ')) {
        current = line.slice(4)
        out.set(current, '')
      } else {
        out.set(current, `${out.get(current) ?? ''}${line}\n`)
      }
    }
    return out
  }

  it('--format diff emits real diff text for a file committed on the branch', () => {
    // Oracle: the content the test itself wrote. The marker string only exists inside the
    // committed file, so its presence proves the tool reached back past HEAD to the merge base
    // rather than diffing the (clean) worktree.
    const repo = repoWithBothShapes()

    const out = runTool(repo, ['--format', 'diff', '--base', 'main'])
    expect(out.status).toBe(0)
    expect(out.stdout).not.toBe('')
    expect(out.stdout).toContain('+++ b/committed.go')

    const sections = sectionsOf(out.stdout)
    const worktree = [...sections].find(([name]) => name.includes('..worktree (tracked'))
    expect(worktree, 'a labelled worktree section must exist').toBeTruthy()
    // The committed content must be in THAT section — the one a reviewer is told to read.
    expect(worktree[1]).toContain('COMMITTED_ON_BRANCH')
    // Nothing is staged here, so base..index and base..worktree agree and the index section
    // must NOT be emitted. This is what makes the section labels trustworthy rather than
    // decorative: a wrong range for either view would make the two disagree and show up here.
    expect([...sections.keys()].filter((n) => n.includes('..index'))).toEqual([])
  })

  it('--format diff emits real diff text for an untracked file', () => {
    // Oracle: the content the test itself wrote. `git diff --no-index /dev/null <path>` is the
    // only way to get diff text for a file git does not track; it exits 1 on difference, which
    // is success here — a naive implementation would treat that as an error and emit nothing.
    const repo = repoWithBothShapes()

    const out = runTool(repo, ['--format', 'diff', '--base', 'main'])
    expect(out.status).toBe(0)
    expect(out.stdout).toContain('UNTRACKED_MARKER')
    expect(out.stdout).toContain('### untracked: loose.go')
  })

  it('--format diff shows the staged content when the worktree hides it', () => {
    // The index hole from the block above, seen through the review INPUT rather than the file
    // set. Getting the file names right is worthless if the text handed to the reviewer is the
    // worktree's (empty) view. Oracle: the marker exists only in the staged blob — `git cat-file` on the
    // index entry is where it lives, and the worktree file does not contain it.
    const repo = repoWith({ 'app.go': 'package main\n' })
    write(repo, 'app.go', 'package main\n// STAGED_ONLY_MARKER\n')
    git(repo, ['add', 'app.go'])
    write(repo, 'app.go', 'package main\n')

    expect(git(repo, ['cat-file', '-p', ':app.go'])).toContain('STAGED_ONLY_MARKER')
    expect(git(repo, ['diff', 'HEAD'])).toBe('')

    const out = runTool(repo, ['--format', 'diff'])
    expect(out.status).toBe(0)
    expect(out.stdout).toContain('STAGED_ONLY_MARKER')
    expect(out.stdout).toMatch(/### \w+\.\.index \(staged content/)
    expect(out.stdout).toMatch(/WARNING: app\.go differ\(s\) from HEAD in the INDEX ONLY/)
  })

  it('--format diff emits the newly-ignored file that the untracked scan cannot see', () => {
    // The `.gitignore` hole, likewise seen through the review input: it is not enough for the
    // path to appear in the JSON file set, the reviewer has to be handed its content.
    // Oracle: the content the test wrote into the newly-ignored file.
    const repo = repoWith({ '.gitignore': 'dist/\n', 'keep.md': 'a\n' })
    write(repo, '.gitignore', 'dist/\nevil.go\n')
    write(repo, 'evil.go', 'package main // NEWLY_IGNORED_MARKER\n')

    const out = runTool(repo, ['--format', 'diff'])
    expect(out.status).toBe(0)
    expect(out.stdout).toContain('NEWLY_IGNORED_MARKER')
    expect(out.stdout).toContain('### newly ignored: evil.go')
    // The note travels with the diff, not only with the JSON.
    expect(out.stdout).toMatch(/# note: WARNING: evil\.go exists on disk/)
  })

  it('--format diff on a clean tree says so instead of emitting a bare header', () => {
    // The empty file set seen through the diff format: the reviewer must be able to tell
    // "nothing changed" (which is what puts it in verification-only mode) from "the tool
    // produced nothing", which is this tool's central rule.
    const repo = repoWith({ 'keep.md': 'a\n' })

    const out = runTool(repo, ['--format', 'diff'])
    expect(out.status).toBe(0)
    expect(out.stdout).toContain('0 file(s)')
    expect(out.stdout).toContain('empty file set')
  })

  it('--format diff survives a payload larger than one pipe buffer', () => {
    // Found while verifying this card, and it is the same silent-failure class the tool exists to
    // end: on POSIX `process.stdout` is synchronous to a FILE but asynchronous to a PIPE, and every
    // caller of this script reads it through a pipe. `process.exit()` therefore cut the output at
    // one pipe buffer. Reproduced on this repo: 526_552 bytes redirected to a file, 65_899 bytes
    // through a pipe, exit code 0, and the untracked section — emitted last — gone entirely.
    //
    // Oracle: the marker the test itself writes into the file that is emitted LAST, plus a
    // non-vacuity check that the payload really does exceed one 64 KiB buffer. Without the second
    // assertion this test would pass on a small diff no matter how the process exits.
    const repo = repoWith({ 'big.md': 'x\n' })
    const big = Array.from({ length: 6000 }, (_, i) => `CHANGED ${i} padding padding padding`).join('\n')
    write(repo, 'big.md', `${big}\n`)
    write(repo, 'last.go', 'package main // PIPE_TAIL_MARKER\n')

    const out = runTool(repo, ['--format', 'diff', '--no-base'])
    expect(out.status).toBe(0)
    // The setup is genuinely bigger than one pipe buffer, so a truncating exit loses the tail.
    expect(out.stdout.length).toBeGreaterThan(200_000)
    expect(out.stdout).toContain('### untracked: last.go')
    expect(out.stdout).toContain('PIPE_TAIL_MARKER')
  })

  it('--format diff keeps a path containing a space and a quote intact', () => {
    // Awkward filenames are how two earlier rounds silently produced empty diffs. Here the
    // paths go into `git diff -- <paths>` as argv (never through a shell), so both hunks must
    // appear. Oracle: the content markers the test wrote into each file.
    const repo = repoWith({
      'src/with space.ts': 'export const a = 1 // SPACE_MARKER\n',
      'src/quo"te.ts': 'export const b = 1 // QUOTE_MARKER\n',
    })
    write(repo, 'src/with space.ts', 'export const a = 2 // SPACE_MARKER\n')
    write(repo, 'src/quo"te.ts', 'export const b = 2 // QUOTE_MARKER\n')

    const out = runTool(repo, ['--format', 'diff'])
    expect(out.status).toBe(0)
    expect(out.stdout).toContain('-export const a = 1 // SPACE_MARKER')
    expect(out.stdout).toContain('-export const b = 1 // QUOTE_MARKER')
  })
})
