#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const type = process.argv[2];

if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: bun run release [patch|minor|major]');
  console.error('');
  console.error('Examples:');
  console.error('  bun run release patch  # 0.0.1 → 0.0.2');
  console.error('  bun run release minor  # 0.0.1 → 0.1.0');
  console.error('  bun run release major  # 0.0.1 → 1.0.0');
  process.exit(1);
}

// Ensure we're on staging branch
const currentBranch = execSync('git branch --show-current', {
  encoding: 'utf8',
}).trim();
if (currentBranch !== 'staging') {
  console.error(`Error: Must be on staging branch (currently on ${currentBranch})`);
  process.exit(1);
}

// Ensure working directory is clean
const status = execSync('git status --porcelain', { encoding: 'utf8' });
if (status.trim()) {
  console.error('Error: Working directory is not clean. Commit or stash changes first.');
  process.exit(1);
}

// Read current version
const pkgPath = path.join(__dirname, '../apps/web/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);

// Bump version
const newVersion =
  type === 'major'
    ? `${major + 1}.0.0`
    : type === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

console.log(`Bumping version: ${pkg.version} → ${newVersion}`);

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

// Git operations
console.log('Committing version bump...');
execSync('git add apps/web/package.json', { stdio: 'inherit' });
execSync(`git commit -m "chore: bump version to v${newVersion}"`, {
  stdio: 'inherit',
});

console.log('Creating tag...');
execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
  stdio: 'inherit',
});

console.log('Pushing to origin...');
execSync('git push origin staging', { stdio: 'inherit' });
execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });

console.log('');
console.log(`✅ Released v${newVersion}`);
console.log('');
console.log('Next steps:');
console.log('  1. GitHub Actions will create the release automatically');
console.log('  2. Go to Actions → "Deploy to Production" → Run workflow');
console.log('  3. Type "deploy" to confirm');
