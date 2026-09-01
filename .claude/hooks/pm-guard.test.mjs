// @vitest-environment node
/**
 * Tests for the PM guard — `pm-no-direct-edit.sh` + `pm-guard.mjs`.
 *
 * WHY THIS SUITE EXISTS
 * ---------------------
 * The guard used to refuse every Edit/Write in the main session, and an escape hatch existed to
 * work around it. Now it refuses a NAMED SET OF PATHS and permits everything else, which makes
 * it the only mechanical barrier between an unreviewed main-session edit and the spec, auth,
 * migration, CI, deploy and harness surface. Path matching is the entire security property, so
 * "it worked when I tried it by hand" is not sufficient — the failure it has to prevent is a
 * write that reaches a guarded file by a route nobody thought to try by hand.
 *
 * THE ORACLE, AND WHY IT IS INDEPENDENT
 * ------------------------------------
 * Three oracles, none of them the guard's own output:
 *
 * 1. **The rule as ported for this repo (kanban card "chore(harness): port the agent-loop dev
 *    harness")** — this exact set of paths is
 *    refused, everything else is allowed, subagents pass, every uncertainty blocks. The
 *    expected verdict of each case is read off that rule, and each refusal additionally asserts
 *    WHICH entry matched. That second assertion is what stops a test passing for the wrong
 *    reason: a fail-closed refusal (malformed input, no repo) would satisfy "exit 2" while
 *    proving nothing about path matching.
 * 2. **The filesystem itself**, for the aliasing cases. Before asserting that the guard refuses
 *    `../`-relative, symlinked and case-variant routes, the test WRITES THROUGH the alias with
 *    `fs` and reads the canonical file back to prove the alias really lands on the guarded file.
 *    If the alias were not real, the aliasing assertion would be vacuous.
 * 3. **Claude Code's hook contract** for the exit codes: only 2 blocks a tool call; any other
 *    non-zero status is reported and the call PROCEEDS. So "the guard failed" and "the guard
 *    allowed" are the same event unless the wrapper normalises the status, and the tests assert
 *    the exact number 2, never merely "non-zero".
 *
 * Real subprocesses, real git repositories, real symlinks; nothing is simulated. The guard is
 * driven exactly as Claude Code drives it — the script path as argv[0], the JSON payload on
 * stdin — via `spawnSync` with no shell, so no quoting or shell-builtin behaviour is in play.
 *
 * Every subprocess runs with its own process cwd in a scratch directory that is NOT inside any
 * git repository (asserted below, not assumed). Two consequences worth naming: the tests cannot
 * accidentally depend on this repository's git state, and every relative-path case doubles as
 * proof that the guard resolves against the payload's `cwd` rather than its own — a guard
 * reading `process.cwd()` would report "not inside a git repository" instead of naming the
 * matched entry, and the reason assertion catches that.
 *
 * Hermetic per docs/TESTING.md: no network, no database, no backend. Needs `git` and `node`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { CROSS_REVIEW_PATHS } from '../tools/card-scope.mjs'
import {
  GUARDED_PATHS,
  HOOK_ONLY_PATHS,
  SELF_ROOT,
  guardedMatch,
  relativeInside,
  resolveLinks,
} from './pm-guard.mjs'

const HOOK = fileURLToPath(new URL('./pm-no-direct-edit.sh', import.meta.url))
const GUARD_SRC = fileURLToPath(new URL('./pm-guard.mjs', import.meta.url))

const GIT_ENV = {
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_TERMINAL_PROMPT: '0',
  GIT_AUTHOR_NAME: 'Test',
  GIT_AUTHOR_EMAIL: 'test@example.invalid',
  GIT_COMMITTER_NAME: 'Test',
  GIT_COMMITTER_EMAIL: 'test@example.invalid',
}

let workspace
let repo
let repoCounter = 0

beforeAll(() => {
  // realpath: on macOS os.tmpdir() is a symlink and `git rev-parse --show-toplevel` returns the
  // resolved path, so absolute-path expectations would not line up otherwise.
  workspace = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'pm-guard-')))
  repo = newRepo()
})

afterAll(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true })
})

function newRepo() {
  const dir = path.join(workspace, `r${++repoCounter}`)
  mkdirSync(dir, { recursive: true })
  execFileSync('git', ['init', '-q', '-b', 'main', '.'], {
    cwd: dir,
    env: { ...process.env, ...GIT_ENV },
  })
  return dir
}

/**
 * Drive the hook the way Claude Code does: script path as argv[0], payload on stdin.
 *
 * `cwd` of the CHILD is the scratch workspace (not a repository), so the guard has to take the
 * repository from the payload. `input` is a string, not an object, for the malformed-JSON cases.
 */
function runHook(payload, { cwd = workspace, env } = {}) {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const result = spawnSync(HOOK, [], {
    input: raw,
    cwd,
    encoding: 'utf8',
    env: env ?? { ...process.env, ...GIT_ENV },
  })
  return { status: result.status, stderr: result.stderr ?? '', stdout: result.stdout ?? '' }
}

const write = (tool_input, extra = {}) => ({ cwd: repo, tool_name: 'Write', tool_input, ...extra })

/** Assert: refused, and refused because THIS entry matched. */
function expectRefused(result, entry) {
  expect(result.status).toBe(2)
  expect(result.stderr).toContain(`matches "${entry}"`)
}

// ---------------------------------------------------------------------------
// Part 1 — the guarded surface. Pure: no subprocess, no filesystem.
// Oracle: the path list the card enumerates, plus the single-source rule.
// ---------------------------------------------------------------------------

describe('the guarded surface (oracle: the ported card’s path list + the single-copy rule)', () => {
  it('is the imported trigger list plus the infrastructure list, in that order', () => {
    // The composition, asserted structurally: if `CROSS_REVIEW_PATHS` gains an entry (it is
    // empty in this repo by decision), the guard follows automatically. No second copy.
    expect(GUARDED_PATHS).toEqual([...CROSS_REVIEW_PATHS, ...HOOK_ONLY_PATHS])
    expect(CROSS_REVIEW_PATHS).toHaveLength(0)
    expect(HOOK_ONLY_PATHS).toHaveLength(9)
    expect(GUARDED_PATHS).toHaveLength(9)
  })

  it('keeps the two lists disjoint — the second is an extension, not a copy', () => {
    const overlap = HOOK_ONLY_PATHS.filter((p) => CROSS_REVIEW_PATHS.includes(p))
    expect(overlap).toEqual([])
  })

  it('does not restate a single spec/auth path as a literal in the guard code', () => {
    // The mechanical form of "do not paste the list into the hook". Comments are stripped
    // first: the header deliberately uses `openapi.yaml` as a worked example, and prose is not
    // a second source of truth — a duplicate list would be code.
    const code = readFileSync(GUARD_SRC, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    const restated = CROSS_REVIEW_PATHS.filter((p) => code.includes(p))
    expect(restated).toEqual([])
    expect(code).toContain("from '../tools/card-scope.mjs'")
  })

  it('matches prefix entries, exact entries and globs, and nothing adjacent', () => {
    expect(guardedMatch('.claude/settings.json')).toBe('.claude/settings.json')
    expect(guardedMatch('.claude/settings.local.json')).toBe('.claude/settings.local.json')
    expect(guardedMatch('.claude/hooks/pm-guard.mjs')).toBe('.claude/hooks/')
    expect(guardedMatch('.claude/hooks')).toBe('.claude/hooks/')
    expect(guardedMatch('.claude/tools/card-scope.mjs')).toBe('.claude/tools/')
    expect(guardedMatch('.githooks/commit-msg')).toBe('.githooks/')
    expect(guardedMatch('.github/workflows/ci.yml')).toBe('.github/workflows/')
    expect(guardedMatch('go-backend/Dockerfile')).toBe('*Dockerfile*')
    expect(guardedMatch('docker-compose.override.yml')).toBe('*docker-compose*.yml')
    // Adjacent, and deliberately allowed:
    expect(guardedMatch('.claude/settings.json.bak')).toBeNull()
    expect(guardedMatch('.claude/skills/project-manager/SKILL.md')).toBeNull()
    expect(guardedMatch('.claude/skills/kanban-doku/SKILL.md')).toBeNull()
    expect(guardedMatch('.claude/agents/code-reviewer.md')).toBeNull()
    expect(guardedMatch('.claude/README.md')).toBeNull()
    expect(guardedMatch('.github/dependabot.yml')).toBeNull()
  })

  it('guards an infrastructure file whose name is PREFIXED, not only suffixed', () => {
    // Upstream round 2. The pattern `nginx*.conf` is anchored at the start of the basename, and
    // a review confirmed the consequence with a filesystem oracle (`widget-test-nginx.conf` was
    // a real, unguarded proxy config there). No Dockerfile/compose/nginx file exists in THIS
    // repository today — the globs guard the day one appears, so the class assertions stand on
    // ordinary naming conventions rather than a live instance.
    expect(guardedMatch('widget-test-nginx.conf')).toBe('*nginx*.conf')
    expect(guardedMatch('frontend.Dockerfile')).toBe('*Dockerfile*')
    expect(guardedMatch('deploy/test-docker-compose.yml')).toBe('*docker-compose*.yml')
    for (const entry of ['*Dockerfile*', '*docker-compose*.yml', '*nginx*.conf']) {
      expect(HOOK_ONLY_PATHS).toContain(entry)
    }
    // The accepted over-block, asserted so that it stays a decision rather than a surprise:
    // `*Dockerfile*` has no extension anchor, so a prose file named after it is refused too.
    expect(guardedMatch('docs/dockerfile-notes.md')).toBe('*Dockerfile*')
    // The settings entries are exact (not the upstream `.claude/settings*.json` glob):
    // settings.json and settings.local.json are the only names Claude Code loads there, so a
    // differently-named JSON file in .claude/ is not part of the guarded surface.
    expect(guardedMatch('.claude/local-settings.json')).toBeNull()
  })

  it('matches case-insensitively, because macOS is', () => {
    // A case-insensitive filesystem opens the same file for a differently-cased path, and
    // realpath does not canonicalise case. Over-blocking on a case-sensitive filesystem is the
    // safe direction; under-blocking here would be a bypass on the developer's own machine.
    expect(guardedMatch('.CLAUDE/SETTINGS.JSON')).toBe('.claude/settings.json')
    expect(guardedMatch('.GitHooks/commit-msg')).toBe('.githooks/')
    expect(guardedMatch('.GITHUB/Workflows/ci.yml')).toBe('.github/workflows/')
  })

  it('resolveLinks follows a dangling link instead of giving up on it', () => {
    // The interesting symlink is the one whose target does not exist yet: a Write creates it.
    const dir = path.join(workspace, 'links')
    mkdirSync(dir, { recursive: true })
    const target = path.join(dir, 'not-created-yet.sql')
    const link = path.join(dir, 'dangling')
    symlinkSync(target, link)
    expect(() => statSync(link)).toThrow() // the oracle: it really does dangle
    expect(resolveLinks(link)).toBe(target)
  })
})

// ---------------------------------------------------------------------------
// Part 2 — the real hook, driven as a subprocess against real git repositories.
// ---------------------------------------------------------------------------

describe('the scratch workspace itself (assumption, checked rather than assumed)', () => {
  it('is not inside a git repository, so the payload cwd is the only source of a repo root', () => {
    const probe = spawnSync('git', ['-C', workspace, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      env: { ...process.env, ...GIT_ENV },
    })
    expect(probe.status).not.toBe(0)
  })

  it('the hook script is executable, as Claude Code invokes it by path', () => {
    expect(statSync(HOOK).mode & 0o111).not.toBe(0)
  })
})

describe('every guarded entry is refused (oracle: the card’s path list)', () => {
  // One representative path per entry. Prefix and exact entries are derived from the entry
  // itself — that IS the rule ("anything under this prefix") — while the glob entries get
  // hand-written instances taken from real filenames in this repository.
  const GLOB_CASES = {
    '*Dockerfile*': ['Dockerfile', 'go-backend/Dockerfile', 'frontend.Dockerfile'],
    '*docker-compose*.yml': [
      'docker-compose.yml',
      'docker-compose.override.yml',
      'test-docker-compose.yml',
    ],
    '*nginx*.conf': ['nginx.conf', 'nginx.staging.conf', 'widget-test-nginx.conf'],
  }

  for (const entry of GUARDED_PATHS) {
    const cases = entry.includes('*')
      ? GLOB_CASES[entry]
      : entry.endsWith('/')
        ? [`${entry}some-file.go`]
        : [entry]
    if (!cases) throw new Error(`no representative path for guarded entry ${entry}`)
    for (const relPath of cases) {
      it(`refuses ${relPath}`, () => {
        expectRefused(runHook(write({ file_path: path.join(repo, relPath) })), entry)
        // …and by the repo-relative route as well, which also proves the payload's `cwd` is
        // what the guard resolves against (this process's cwd is not a repository at all).
        expectRefused(runHook(write({ file_path: relPath })), entry)
      })
    }
  }
})

describe('ordinary files are not blocked', () => {
  const ALLOWED = [
    'src/components/ui/button.tsx',
    'src/components/ui/button.stories.tsx',
    'src/tokens.css',
    'src/index.ts',
    'docs/notes.md',
    'CLAUDE.md',
    'README.md',
    'package.json',
    'vite.config.ts',
    'eslint.config.js',
    '.storybook/main.ts',
    '.claude/skills/project-manager/SKILL.md',
    '.claude/agents/milestone-worker.md',
    '.claude/README.md',
    // Adjacent to guarded entries, and correctly outside them:
    '.github/dependabot.yml',
    '.claude/settings.json.bak',
    'src/App.test.tsx',
  ]
  for (const relPath of ALLOWED) {
    it(`allows ${relPath}`, () => {
      expect(runHook(write({ file_path: path.join(repo, relPath) })).status).toBe(0)
      expect(runHook(write({ file_path: relPath })).status).toBe(0)
    })
  }

  it('allows every editing tool the matcher covers', () => {
    for (const tool of ['Edit', 'Write', 'MultiEdit']) {
      expect(
        runHook({ cwd: repo, tool_name: tool, tool_input: { file_path: 'docs/note.md' } }).status,
      ).toBe(0)
    }
    expect(
      runHook({
        cwd: repo,
        tool_name: 'NotebookEdit',
        tool_input: { notebook_path: 'docs/scratch.ipynb' },
      }).status,
    ).toBe(0)
  })
})

describe('subagents pass through', () => {
  it('allows a subagent to write the harness settings — that is what the pipeline is for', () => {
    const payload = write(
      { file_path: '.claude/settings.json' },
      { agent_id: 'agent_01ABC' },
    )
    expect(runHook(payload).status).toBe(0)
  })

  it('allows a subagent to write a CI workflow and the guard itself', () => {
    for (const p of ['.github/workflows/ci.yml', '.claude/hooks/pm-guard.mjs']) {
      expect(runHook(write({ file_path: p }, { agent_id: 'agent_01ABC' })).status).toBe(0)
    }
  })

  it('refuses the same writes without the agent_id — the field is what decides', () => {
    expectRefused(
      runHook(write({ file_path: '.claude/settings.json' })),
      '.claude/settings.json',
    )
  })
})

describe('cwd handling', () => {
  it('resolves a relative path against a cwd in a SUBDIRECTORY of the repo', () => {
    // The reproduced false block upstream: the old hook looked for `$CWD/.claude`, so a cwd
    // that had drifted into a subdirectory could not find the repo root.
    // `git rev-parse --show-toplevel` fixes it in both directions — the guarded path is still
    // caught…
    const sub = path.join(repo, '.claude')
    mkdirSync(sub, { recursive: true })
    expectRefused(
      runHook({
        cwd: sub,
        tool_name: 'Write',
        tool_input: { file_path: 'settings.json' },
      }),
      '.claude/settings.json',
    )
    // …and ordinary work from the same subdirectory is not blocked.
    expect(
      runHook({
        cwd: sub,
        tool_name: 'Write',
        tool_input: { file_path: 'skills/project-manager/SKILL.md' },
      }).status,
    ).toBe(0)
  })

  it('refuses a `../`-relative route to a guarded file, and the route is real', () => {
    const sub = path.join(repo, 'src')
    mkdirSync(sub, { recursive: true })
    const canonical = path.join(repo, '.claude/settings.json')
    mkdirSync(path.dirname(canonical), { recursive: true })
    writeFileSync(canonical, '{}\n')
    // Oracle: the filesystem. Write through the `../` route, read the canonical file back.
    const via = '../.claude/settings.json'
    writeFileSync(path.join(sub, via), 'REACHED\n')
    expect(readFileSync(canonical, 'utf8')).toBe('REACHED\n')
    expectRefused(
      runHook({ cwd: sub, tool_name: 'Write', tool_input: { file_path: via } }),
      '.claude/settings.json',
    )
  })

  it('blocks when cwd is absent, empty, or not a directory — even for an ordinary file', () => {
    // Fail closed: with no repository root, no path can be classified at all. The assertions use
    // an ORDINARY path deliberately — a guarded path would be caught by several routes at once,
    // so the test could pass while the branch under test was gone.
    //
    // Each case also asserts WHICH diagnosis was given. That is not decoration: these checks are
    // layered (`repoRoot` refuses an absent, empty or non-directory cwd as well), so the exit
    // code alone cannot distinguish them and a mutation to any one of them would go unnoticed.
    // The diagnosis is also the only thing the developer sees when the guard fires, and a wrong
    // one sends them looking in the wrong place.
    const ordinary = { file_path: 'docs/note.md' }
    const absent = runHook({ tool_name: 'Write', tool_input: ordinary })
    expect(absent.status).toBe(2)
    expect(absent.stderr).toContain('carried no "cwd"')
    for (const cwd of ['', 42, null]) {
      const r = runHook({ cwd, tool_name: 'Write', tool_input: ordinary })
      expect(r.status).toBe(2)
      expect(r.stderr).toContain('carried no "cwd"')
    }
    const missing = runHook({
      cwd: path.join(workspace, 'nope'),
      tool_name: 'Write',
      tool_input: ordinary,
    })
    expect(missing.status).toBe(2)
    expect(missing.stderr).toContain('does not exist')

    const notADir = path.join(repo, 'a-file')
    writeFileSync(notADir, 'x\n') // exists, but is not a directory
    const wrongKind = runHook({ cwd: notADir, tool_name: 'Write', tool_input: ordinary })
    expect(wrongKind.status).toBe(2)
    expect(wrongKind.stderr).toContain('is not a directory')
  })

  it('blocks when cwd is outside any git repository, guarded path or not', () => {
    // The reproduced fail-OPEN: the old hook found an orphaned sentinel outside the repo and
    // returned 0. There is no sentinel now, and no repository means no answer, so: block.
    const outside = path.join(workspace, 'not-a-repo')
    mkdirSync(outside, { recursive: true })
    const guarded = runHook({
      cwd: outside,
      tool_name: 'Write',
      tool_input: { file_path: path.join(repo, '.claude/settings.json') },
    })
    expect(guarded.status).toBe(2)
    expect(guarded.stderr).toContain('not inside a git repository')
    expect(
      runHook({ cwd: outside, tool_name: 'Write', tool_input: { file_path: 'docs/note.md' } })
        .status,
    ).toBe(2)
  })
})

describe('symlink routes to a guarded file', () => {
  it('refuses a link that lives OUTSIDE the repo and points into it', () => {
    const target = path.join(repo, '.claude/settings.json')
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, '{}\n')
    const link = path.join(workspace, 'settings-alias.json')
    rmSync(link, { force: true })
    symlinkSync(target, link)
    // Oracle: the filesystem. The alias really is the guarded file.
    writeFileSync(link, 'REACHED VIA LINK\n')
    expect(readFileSync(target, 'utf8')).toBe('REACHED VIA LINK\n')
    expectRefused(
      runHook(write({ file_path: link })),
      '.claude/settings.json',
    )
  })

  it('refuses a link whose PARENT directory is the symlink', () => {
    const canonicalDir = path.join(repo, '.github/workflows')
    mkdirSync(canonicalDir, { recursive: true })
    const dirLink = path.join(repo, 'workflows-dir')
    rmSync(dirLink, { force: true })
    symlinkSync(canonicalDir, dirLink)
    writeFileSync(path.join(dirLink, 'ci.yml'), 'REACHED VIA DIR LINK\n')
    expect(readFileSync(path.join(canonicalDir, 'ci.yml'), 'utf8')).toBe(
      'REACHED VIA DIR LINK\n',
    )
    expectRefused(
      runHook(write({ file_path: path.join(dirLink, 'ci.yml') })),
      '.github/workflows/',
    )
  })

  it('refuses a DANGLING link to a git hook that does not exist yet', () => {
    // The write would create the guarded file. `fs.realpathSync` throws here, which is why the
    // guard resolves links itself.
    const target = path.join(repo, '.githooks/pre-push')
    const link = path.join(workspace, 'new-hook')
    rmSync(link, { force: true })
    symlinkSync(target, link)
    expect(() => statSync(link)).toThrow()
    expectRefused(runHook(write({ file_path: link })), '.githooks/')
  })

  it('refuses a guarded NAME even when its directory is a symlink pointing out of the repo', () => {
    // The mirror image of the case above, and the reason both the lexical and the
    // link-resolved form are checked: here the literal path is guarded while the resolved one
    // lands outside the repository. Trusting only the resolved form would allow it.
    const outsideDir = path.join(workspace, 'elsewhere-workflows')
    mkdirSync(outsideDir, { recursive: true })
    const otherRepo = newRepo()
    const linkParent = path.join(otherRepo, '.github')
    mkdirSync(linkParent, { recursive: true })
    symlinkSync(outsideDir, path.join(linkParent, 'workflows'))
    const viaName = path.join(otherRepo, '.github/workflows/ci.yml')
    expect(resolveLinks(viaName)).toBe(path.join(outsideDir, 'ci.yml'))
    expectRefused(
      runHook({ cwd: otherRepo, tool_name: 'Write', tool_input: { file_path: viaName } }),
      '.github/workflows/',
    )
  })

  it('does not block a file OUTSIDE the repository that shares a guarded basename', () => {
    // The guard is about this repository. A `Dockerfile` somewhere else on disk resolves to
    // `../…/Dockerfile` relative to the root, and the basename glob would match it if
    // out-of-tree candidates were not discarded — an over-block that would stop the session
    // touching unrelated files.
    const outside = path.join(workspace, 'elsewhere')
    mkdirSync(outside, { recursive: true })
    const r = runHook(write({ file_path: path.join(outside, 'Dockerfile') }))
    expect(r.status).toBe(0)
  })

  it('survives a symlink loop instead of crashing on it', () => {
    // `a -> b -> a`. Without the depth cap in `resolveLinks` this is unbounded recursion: node
    // dies, the wrapper turns that into a block, and an ORDINARY file would suddenly be
    // unwritable. The cap is why this is a clean allow — the assertion is exit 0, so removing
    // the cap turns it red rather than merely changing a message.
    const a = path.join(repo, 'loop-a')
    const b = path.join(repo, 'loop-b')
    for (const p of [a, b]) rmSync(p, { force: true })
    symlinkSync(b, a)
    symlinkSync(a, b)
    const r = runHook(write({ file_path: a }))
    expect(r.status).toBe(0)
    expect(r.stderr).toBe('')
  })

  it('refuses a `../` route from a cwd that is itself a symlink into the repo', () => {
    // Found by the round-2 mutation run, not by reading: dropping the link-resolved form of the
    // payload's `cwd` survived all 93 tests, so this route had no test. It is a real hole, not
    // an equivalent mutant — with the mutation applied the case below returns exit 0.
    //
    // Why the lexical form alone is not enough: `path.resolve('<link>/…', '../x')` climbs out of
    // the LINK's directory, which lands somewhere entirely outside the repository, and that
    // nonexistent path has no symlink for `resolveLinks` to follow back in. Only resolving the
    // cwd first puts the `..` in the real tree.
    const canonical = path.join(repo, '.claude/settings.json')
    mkdirSync(path.dirname(canonical), { recursive: true })
    writeFileSync(canonical, 'canonical\n')
    const realDir = path.join(repo, 'src')
    mkdirSync(realDir, { recursive: true })
    const linkedCwd = path.join(workspace, 'cwd-via-link')
    rmSync(linkedCwd, { force: true })
    symlinkSync(realDir, linkedCwd)
    // Oracle: the filesystem. The route really does reach the guarded file.
    const via = '../.claude/settings.json'
    // String concatenation, not `path.join`: joining would collapse the `..` lexically and
    // sidestep the very kernel resolution this case is about (the OS resolves the link first,
    // THEN the `..`, which is why the route lands in the repo at all).
    writeFileSync(`${linkedCwd}/${via}`, 'REACHED VIA LINKED CWD\n')
    expect(readFileSync(canonical, 'utf8')).toBe('REACHED VIA LINKED CWD\n')
    expectRefused(
      runHook({ cwd: linkedCwd, tool_name: 'Write', tool_input: { file_path: via } }),
      '.claude/settings.json',
    )
  })

  it('refuses a case-variant route, and the route is real on this filesystem', () => {
    const canonical = path.join(repo, '.claude/settings.json')
    mkdirSync(path.dirname(canonical), { recursive: true })
    writeFileSync(canonical, 'canonical\n')
    const variant = path.join(repo, '.claude/SETTINGS.JSON')
    let caseInsensitive = false
    try {
      caseInsensitive = readFileSync(variant, 'utf8') === 'canonical\n'
    } catch {
      caseInsensitive = false
    }
    // The oracle is the filesystem's own answer. On a case-sensitive filesystem the alias does
    // not exist, so the aliasing claim is not made there — but the refusal is asserted either
    // way, because over-blocking is the safe direction.
    if (caseInsensitive) expect(readFileSync(variant, 'utf8')).toBe('canonical\n')
    expectRefused(
      runHook(write({ file_path: variant })),
      '.claude/settings.json',
    )
  })
})

describe('the trusted root is the guard’s own location (round 2 — the review FAIL)', () => {
  // WHY THIS BLOCK EXISTS
  // The first round derived the protected repository from the payload's `cwd` and then DISCARDED
  // any candidate whose `path.relative` result began with `..`. Discarding falls through to
  // allow, so making a guarded file merely LOOK external was a full bypass. The review
  // reproduced two live routes against the real hook; both are asserted here, because neither
  // was in the original 79 tests — the mutation set could only test the code that existed.
  //
  // Oracle for every case in this block: the ported rule ("a guarded path is refused however
  // it is reached"), plus the filesystem itself wherever an alias is claimed to be real, plus
  // the exact exit code 2 from Claude Code's hook contract. Never the guard's own output.
  //
  // The representative guarded file is the harness's own settings.json — in this repo the
  // infrastructure list is the whole guarded surface (CROSS_REVIEW_PATHS is empty).
  const SPEC = '.claude/settings.json'

  it('SELF_ROOT is this checkout, derived from the guard’s own path and nothing else', () => {
    expect(SELF_ROOT).toBe(realpathSync(path.resolve(path.dirname(GUARD_SRC), '..', '..')))
    // Oracle: the repository layout. These files exist because the project does, not because
    // this card created them.
    for (const marker of ['CLAUDE.md', 'package.json', '.claude/hooks/pm-guard.mjs', SPEC]) {
      expect(existsSync(path.join(SELF_ROOT, marker))).toBe(true)
    }
    // …and it is emphatically not the scratch area the rest of this suite works in, so the
    // cases below really do cross a repository boundary.
    expect(workspace.startsWith(SELF_ROOT)).toBe(false)
  })

  it('refuses an absolute path into THIS repo from a FOREIGN repository’s cwd', () => {
    // Review bypass 1, verbatim: `git init` any directory, hand it in as `cwd`, then name the
    // real guarded file absolutely. Measured exit 0 before the fix.
    const foreign = newRepo()
    const target = path.join(SELF_ROOT, SPEC)
    expect(existsSync(target)).toBe(true) // a real guarded file, not a phantom path
    expectRefused(
      runHook({ cwd: foreign, tool_name: 'Write', tool_input: { file_path: target } }),
      SPEC,
    )
    // The control that stops this passing for the wrong reason: the guard did not simply start
    // refusing everything that names this repository.
    expect(
      runHook({
        cwd: foreign,
        tool_name: 'Write',
        tool_input: { file_path: path.join(SELF_ROOT, 'CLAUDE.md') },
      }).status,
    ).toBe(0)
  })

  it('refuses a guarded path in the FOREIGN repo too — a foreign cwd widens, not relocates', () => {
    // The direction of the fix, asserted: the cwd-derived root is an ADDITIONAL root, so a
    // second checkout gets the same protection instead of taking protection away from this one.
    const foreign = newRepo()
    expectRefused(
      runHook({ cwd: foreign, tool_name: 'Write', tool_input: { file_path: SPEC } }),
      SPEC,
    )
  })

  it('refuses an absolute path whose ROOT differs only in case (no cd needed)', () => {
    // Review bypass 2, the more serious one: no setup at all, just an absolute path spelled in
    // a different case than the checkout. `path.relative` compares bytes, produced a `..`-climb
    // and the candidate was dropped — upstream of `guardedMatch`'s case-insensitive comparison,
    // which is why the guard's own case defence never got a say. Measured exit 0 before the fix.
    const canonical = path.join(repo, SPEC)
    mkdirSync(path.dirname(canonical), { recursive: true })
    writeFileSync(canonical, 'canonical\n')
    const shouted = path.join(repo.toUpperCase(), SPEC)
    // Oracle: the filesystem, where it can answer. On a case-insensitive filesystem the
    // differently-cased root really does open the same file; on a case-sensitive one the path is
    // a different (nonexistent) file and the refusal is a deliberate over-block.
    let sameFile = false
    try {
      sameFile = readFileSync(shouted, 'utf8') === 'canonical\n'
    } catch {
      sameFile = false
    }
    if (sameFile) {
      writeFileSync(shouted, 'REACHED VIA CASE VARIANT\n')
      expect(readFileSync(canonical, 'utf8')).toBe('REACHED VIA CASE VARIANT\n')
    }
    expectRefused(
      runHook({ cwd: repo, tool_name: 'Write', tool_input: { file_path: shouted } }),
      SPEC,
    )
  })

  it('refuses the review’s repro: correct cwd, all-lowercase absolute path to the spec', () => {
    // The same route against the real repository rather than a scratch one, because that is what
    // the reviewer ran and what an LLM session would actually emit. Read-only: nothing is
    // written to this checkout.
    const lowered = path.join(SELF_ROOT.toLowerCase(), SPEC)
    expectRefused(
      runHook({ cwd: SELF_ROOT, tool_name: 'Write', tool_input: { file_path: lowered } }),
      SPEC,
    )
    // Oracle, where the filesystem can give one: on macOS the lowercase path opens the identical
    // bytes, which is what makes this an alias rather than a typo.
    if (existsSync(lowered)) {
      expect(readFileSync(lowered, 'utf8')).toBe(readFileSync(path.join(SELF_ROOT, SPEC), 'utf8'))
    }
    // Both defects at once, since they compose: foreign cwd AND a case variant.
    expectRefused(
      runHook({
        cwd: newRepo(),
        tool_name: 'Write',
        tool_input: { file_path: path.join(SELF_ROOT.toLowerCase(), SPEC) },
      }),
      SPEC,
    )
  })

  it('refuses a root spelled in NFD when the repository is NFC (and the reverse)', () => {
    // The third variant of the same root cause, which the review flagged as plausible but did
    // not reproduce. HFS+ decomposes, APFS preserves what it is handed, and a home directory at
    // a German university can carry an umlaut — so the two spellings of one directory reaching
    // the guard is not an exotic scenario. The comparison is normalisation-insensitive, so the
    // refusal holds on a normalisation-sensitive filesystem too (an over-block there).
    // Written as escapes on purpose: the difference between these two strings is invisible
    // in an editor, and a well-meaning reflow that "fixed" one of them would silently turn
    // this test into a tautology.
    const nfc = 'caf\u00e9-repo' // é as one composed code point
    const nfd = 'cafe\u0301-repo' // e + combining acute
    expect(nfc).not.toBe(nfd)
    expect(nfc.normalize('NFC')).toBe(nfd.normalize('NFC'))
    const dir = path.join(workspace, nfc)
    mkdirSync(dir, { recursive: true })
    execFileSync('git', ['init', '-q', '-b', 'main', '.'], {
      cwd: dir,
      env: { ...process.env, ...GIT_ENV },
    })
    const decomposed = path.join(workspace, nfd, SPEC)
    expectRefused(
      runHook({ cwd: dir, tool_name: 'Write', tool_input: { file_path: decomposed } }),
      SPEC,
    )
  })

  it('relativeInside compares SEGMENTS, folded and normalised, and null means outside', () => {
    // Pure, and the oracle is the containment relation as the filesystem defines it — not the
    // guard's other logic. `/a/bc` inside `/a/b` is the classic string-prefix bug.
    expect(relativeInside('/a/b', '/a/b/c/d')).toBe('c/d')
    expect(relativeInside('/a/b', '/a/bc/d')).toBeNull()
    expect(relativeInside('/a/b', '/a/b')).toBeNull()
    expect(relativeInside('/a/b', '/a')).toBeNull()
    expect(relativeInside('/a/b', '/elsewhere/b/c')).toBeNull()
    expect(relativeInside('/A/B', '/a/b/go-backend/x')).toBe('go-backend/x')
    expect(relativeInside('/x/caf\u00e9', '/x/cafe\u0301/y')).toBe('y')
    expect(relativeInside('/x/cafe\u0301', '/x/caf\u00e9/y')).toBe('y')
    // The target's own spelling is preserved, so the refusal message names what was passed.
    expect(relativeInside('/a/b', '/a/b/GO-BACKEND/x')).toBe('GO-BACKEND/x')
  })

  it('BLOCKS — rather than dropping — a candidate the filesystem will not resolve', () => {
    // The card's rule is "every uncertainty blocks", and this was the one place it was inverted:
    // an unresolvable candidate was tolerated and then discarded, i.e. allowed. The path here is
    // ORDINARY on purpose — a guarded one would be refused by path matching anyway, so the test
    // would pass with this branch removed.
    // ENAMETOOLONG first, because it needs no permissions and therefore holds under `root` too
    // — CI runs as root in a container, and a case that quietly skips there would leave this
    // branch untested exactly where nobody is watching.
    const tooLong = path.join(repo, 'a'.repeat(400), 'notes.md')
    const long = runHook(write({ file_path: tooLong }))
    expect(long.status).toBe(2)
    expect(long.stderr).toContain('would not resolve')

    // EACCES, the same branch through a different errno. Skipped under `root`, which ignores
    // permission bits — hence the case above.
    if (typeof process.getuid === 'function' && process.getuid() === 0) return
    const sealed = path.join(repo, 'sealed')
    mkdirSync(sealed, { recursive: true })
    chmodSync(sealed, 0o000)
    try {
      const r = runHook(write({ file_path: path.join(sealed, 'notes.md') }))
      expect(r.status).toBe(2)
      expect(r.stderr).toContain('would not resolve')
    } finally {
      chmodSync(sealed, 0o700)
    }
  })
})

describe('the entry point itself cannot be sidestepped (round 2 hardening)', () => {
  it('runs the decision even when the guard is reached through a symlink', () => {
    // `import.meta.url` is the resolved path for a main module while `argv[1]` is what was
    // typed, so the old `import.meta.url === pathToFileURL(argv[1]).href` self-check was false
    // through a symlink: `main()` never ran and node exited 0 — an allow. Measured, then fixed
    // by comparing real paths.
    const link = path.join(workspace, 'guard-via-link.mjs')
    rmSync(link, { force: true })
    symlinkSync(GUARD_SRC, link)
    const payload = JSON.stringify(write({ file_path: '.claude/settings.json' }))
    const viaLink = spawnSync('node', [link], {
      input: payload,
      cwd: workspace,
      encoding: 'utf8',
      env: { ...process.env, ...GIT_ENV },
    })
    expect(viaLink.status).toBe(2)
    // Control: the same payload through the real path, so the assertion above is about the
    // symlink and not about the payload.
    const direct = spawnSync('node', [GUARD_SRC], {
      input: payload,
      cwd: workspace,
      encoding: 'utf8',
      env: { ...process.env, ...GIT_ENV },
    })
    expect(direct.status).toBe(2)
  })

  it('is not pre-empted by NODE_OPTIONS injection', () => {
    // `NODE_OPTIONS=--require <module that exits 0>` runs before the guard and returns an allow.
    // A session cannot set this for itself (Claude Code spawns the hook, not the session's
    // shell), but a developer's shell profile or a CI runner can. The wrapper clears it.
    const preempt = path.join(workspace, 'preempt.cjs')
    writeFileSync(preempt, 'process.exit(0)\n')
    const injected = { ...process.env, ...GIT_ENV, NODE_OPTIONS: `--require ${preempt}` }
    const payload = write({ file_path: '.claude/settings.json' })
    // Oracle first: the injection genuinely works against a bare `node`, so the assertion below
    // is not vacuous.
    const bare = spawnSync('node', [GUARD_SRC], {
      input: JSON.stringify(payload),
      cwd: workspace,
      encoding: 'utf8',
      env: injected,
    })
    expect(bare.status).toBe(0)
    // …and does not work through the wrapper.
    expectRefused(
      runHook(payload, { env: injected }),
      '.claude/settings.json',
    )
  })
})

describe('malformed input fails closed', () => {
  const CASES = {
    'not JSON at all': 'this is not json',
    'empty stdin': '',
    'a JSON array': '[]',
    'a JSON scalar': '"hello"',
    'JSON null': 'null',
    'truncated JSON': '{"cwd":"/tmp","tool_name":',
  }
  for (const [name, raw] of Object.entries(CASES)) {
    it(`blocks on ${name}`, () => {
      const r = runHook(raw)
      expect(r.status).toBe(2)
      // "not valid JSON" and "not a JSON object" are two different branches; asserting the
      // wording keeps them individually observable.
      expect(r.stderr).toMatch(/not valid JSON|not a JSON object/)
    })
  }

  it('blocks a known editing tool that arrives with no path', () => {
    for (const tool_input of [{}, undefined, 'oops', [], { file_path: '' }, { file_path: 7 }]) {
      const r = runHook({ cwd: repo, tool_name: 'Write', tool_input })
      expect(r.status).toBe(2)
      expect(r.stderr).toContain('arrived with no')
    }
  })

  it('blocks a tool it cannot read a path out of, rather than waving it through', () => {
    // If the settings.json matcher is ever widened, the failure must be loud.
    const r = runHook({
      cwd: repo,
      tool_name: 'Bash',
      tool_input: { command: 'sed -i s/x/y/ .claude/settings.json' },
    })
    expect(r.status).toBe(2)
    expect(r.stderr).toContain('does not know how to read a target path')
    expect(runHook({ cwd: repo, tool_input: { file_path: 'docs/x.md' } }).status).toBe(2)
  })
})

describe('the wrapper normalises every failure to exit 2 (oracle: only 2 blocks)', () => {
  it('exits 2 — not 127 — when node is not on PATH', () => {
    // A scratch bin holding only `bash`, so `#!/usr/bin/env bash` still resolves and `node`
    // genuinely cannot be found. Emptying PATH altogether would fail at the shebang instead,
    // which tests the operating system rather than the guard.
    const bin = path.join(workspace, 'bin-without-node')
    mkdirSync(bin, { recursive: true })
    const bash = execFileSync('sh', ['-c', 'command -v bash'], { encoding: 'utf8' }).trim()
    const bashLink = path.join(bin, 'bash')
    rmSync(bashLink, { force: true })
    symlinkSync(bash, bashLink)
    expect(spawnSync(path.join(bin, 'node'), ['-v']).error).toBeTruthy() // no node in there
    const r = runHook(write({ file_path: 'docs/note.md' }), { env: { ...GIT_ENV, PATH: bin } })
    expect(r.status).toBe(2)
    expect(r.stderr).toContain('node is not on PATH')
  })

  it('exits 2 when pm-guard.mjs is missing next to it', () => {
    const lonely = path.join(workspace, 'lonely')
    mkdirSync(lonely, { recursive: true })
    const copy = path.join(lonely, 'pm-no-direct-edit.sh')
    writeFileSync(copy, readFileSync(HOOK, 'utf8'), { mode: 0o755 })
    const r = spawnSync(copy, [], {
      input: JSON.stringify(write({ file_path: 'docs/note.md' })),
      cwd: workspace,
      encoding: 'utf8',
      env: { ...process.env, ...GIT_ENV },
    })
    expect(r.status).toBe(2)
    expect(r.stderr).toContain('is missing')
  })

  it('exits 2 when the guarded list cannot be loaded at all', () => {
    // A broken or absent `card-scope.mjs` must not degrade into "nothing is guarded". The
    // import throws, node exits 1, and the wrapper turns that into a block.
    const lonely = path.join(workspace, 'no-tools', 'hooks')
    mkdirSync(lonely, { recursive: true })
    const sh = path.join(lonely, 'pm-no-direct-edit.sh')
    writeFileSync(sh, readFileSync(HOOK, 'utf8'), { mode: 0o755 })
    writeFileSync(path.join(lonely, 'pm-guard.mjs'), readFileSync(GUARD_SRC, 'utf8'))
    const r = spawnSync(sh, [], {
      input: JSON.stringify(write({ file_path: 'docs/note.md' })),
      cwd: workspace,
      encoding: 'utf8',
      env: { ...process.env, ...GIT_ENV },
    })
    expect(r.status).toBe(2)
    expect(r.stderr).toContain('failing closed')
  })

  it('exits exactly 0 on an allow, so nothing downstream sees a warning', () => {
    const r = runHook(write({ file_path: 'docs/note.md' }))
    expect(r.status).toBe(0)
    expect(r.stderr).toBe('')
  })
})
