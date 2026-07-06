#!/usr/bin/env node
/* eslint-disable no-console */
// Clone a remote git repo and sync its skills/ subdirectory into a target skills directory.
// Existing skill folders with the same name are replaced; missing ones are copied in.

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const args = { repo: null, target: null, skillsSubdir: 'skills', branch: null, keep: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') args.repo = argv[++i];
    else if (a === '--target') args.target = argv[++i];
    else if (a === '--skills-subdir') args.skillsSubdir = argv[++i];
    else if (a === '--branch') args.branch = argv[++i];
    else if (a === '--keep') args.keep = true;
    else if (a === '-h' || a === '--help') {
      printUsage();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      printUsage();
      process.exit(2);
    }
  }
  return args;
}

function printUsage() {
  console.log(
    `Usage: node sync_skills.cjs --repo <git-url> [--target <dir>] [--skills-subdir <rel-path>] [--branch <name>] [--keep]

  --repo            (required) Git URL to clone.
  --target          Target skills directory. Defaults to ./skills relative to cwd, or cwd itself if it is already a skills dir.
  --skills-subdir   Subdirectory inside the repo containing skill folders. Default: "skills".
  --branch          Optional branch/tag to checkout.
  --keep            Keep the cloned temp directory after sync (for debugging).
`
  );
}

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

function forceChmod(p) {
  try {
    const stat = fs.lstatSync(p);
    // 0o777 for dirs, 0o666 for files; clears read-only on Windows.
    fs.chmodSync(p, stat.isDirectory() ? 0o777 : 0o666);
  } catch (_) {
    /* ignore */
  }
}

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  // On Windows, read-only files/dirs cause EPERM. Walk the tree, clear read-only, then remove.
  const stack = [p];
  const dirs = [];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch (_) {
      /* not a dir or inaccessible */
    }
    for (const e of entries) {
      const child = path.join(cur, e.name);
      forceChmod(child);
      if (e.isDirectory()) stack.push(child);
      else {
        try { fs.unlinkSync(child); } catch (_) { /* ignore */ }
      }
    }
    forceChmod(cur);
    dirs.push(cur);
  }
  for (let i = dirs.length - 1; i >= 0; i--) {
    try { fs.rmdirSync(dirs[i]); } catch (_) { /* ignore */ }
  }
  if (fs.existsSync(p)) {
    // Last resort fallback.
    try { fs.rmSync(p, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function listSkillDirs(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => !n.startsWith('.'));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.repo) {
    console.error('Error: --repo is required.');
    printUsage();
    process.exit(2);
  }

  let target = args.target;
  if (!target) {
    const cwd = process.cwd();
    const candidate = path.join(cwd, 'skills');
    target = fs.existsSync(candidate) ? candidate : cwd;
  }
  target = path.resolve(target);
  if (!fs.existsSync(target)) {
    console.error(`Error: target directory does not exist: ${target}`);
    process.exit(1);
  }

  const tempRoot = path.join(os.tmpdir(), `sync-skills-${Date.now()}`);
  fs.mkdirSync(tempRoot, { recursive: true });
  const cloneDir = path.join(tempRoot, 'repo');

  console.log(`Cloning ${args.repo} -> ${cloneDir}`);
  const cloneArgs = ['clone', '--depth', '1'];
  if (args.branch) cloneArgs.push('--branch', args.branch);
  cloneArgs.push(args.repo, cloneDir);
  try {
    run('git', cloneArgs);
  } catch (e) {
    console.error('git clone failed');
    rmrf(tempRoot);
    process.exit(1);
  }

  const sourceSkillsDir = path.join(cloneDir, args.skillsSubdir);
  if (!fs.existsSync(sourceSkillsDir)) {
    console.error(`Error: skills subdir not found in repo: ${args.skillsSubdir} (resolved ${sourceSkillsDir})`);
    if (!args.keep) rmrf(tempRoot);
    process.exit(1);
  }

  const skillNames = listSkillDirs(sourceSkillsDir);
  if (skillNames.length === 0) {
    console.log(`No skill folders found in ${sourceSkillsDir}`);
    if (!args.keep) rmrf(tempRoot);
    return;
  }

  let replaced = 0;
  let copied = 0;
  const report = [];
  for (const name of skillNames) {
    const src = path.join(sourceSkillsDir, name);
    const dest = path.join(target, name);
    const exists = fs.existsSync(dest);
    if (exists) {
      rmrf(dest);
      replaced++;
    } else {
      copied++;
    }
    copyDir(src, dest);
    report.push(`${exists ? 'REPLACED' : 'COPIED   '}: ${name}`);
  }

  console.log('\n--- Sync report ---');
  for (const line of report) console.log(line);
  console.log(`\nDone. Replaced: ${replaced}, Copied: ${copied}, Total: ${skillNames.length}`);
  console.log(`Target: ${target}`);

  if (!args.keep) {
    rmrf(tempRoot);
    console.log(`Cleaned up temp clone: ${tempRoot}`);
  } else {
    console.log(`Kept temp clone: ${tempRoot}`);
  }
}

main();
