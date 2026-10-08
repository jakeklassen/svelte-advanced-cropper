# Changesets

Every change that users will notice needs a changeset: run `pnpm changeset`, pick the bump (patch, minor or major) and write a line for the changelog. Commit the generated `.changeset/*.md` file with the change.

On `main`, CI keeps a "Version Packages" pull request open that applies the pending changesets: it bumps `package.json` and writes `CHANGELOG.md`. Merging that pull request publishes the new version to npm and creates the GitHub release. See [Releasing](../README.md#releasing).
