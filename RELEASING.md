# Releasing

> For maintainers only. Contributors just submit PRs to `staging`.

## Quick Release

```bash
# Bump version and create release
bun run release patch  # or: minor, major

# Then deploy to production
# Go to GitHub Actions → "Deploy to Production" → Run workflow
```

## What Happens Automatically

1. Version bumped in `apps/web/package.json`
2. Git tag created and pushed
3. GitHub Release created with changelog
4. Vercel deploys staging automatically

## Manual Production Deploy

After the release is created, deploy to production:

1. Go to [GitHub Actions](https://github.com/bcamarneiro/adamastor/actions)
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Type `deploy` to confirm
5. Wait for completion

## Manual Release (if script fails)

```bash
# 1. Edit apps/web/package.json version
# 2. Commit
git commit -am "chore: bump to vX.Y.Z"

# 3. Tag
git tag vX.Y.Z

# 4. Push
git push origin staging
git push origin vX.Y.Z
```

## Versioning

We use [Semantic Versioning](https://semver.org/):

- **patch** (0.0.X): Bug fixes, minor changes
- **minor** (0.X.0): New features, backward compatible
- **major** (X.0.0): Breaking changes

## Rollback

If something goes wrong:

1. Go to [GitHub Actions](https://github.com/bcamarneiro/adamastor/actions)
2. Select "Revert Production"
3. Run workflow with the commit SHA to revert to
