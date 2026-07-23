#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-ghpages.sh — Build and deploy to github.ibm.com Pages (gh-pages branch)
#
# Usage:
#   npm run deploy              # deploy to IBM GHE (default)
#   ./scripts/deploy-ghpages.sh                  # same
#   GH_REMOTE=origin ./scripts/deploy-ghpages.sh # deploy to github.com instead
#
# Requirements: git, node/npm, ssh access to the remote
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${GH_REMOTE:-ibm}"                          # git remote to push to
BRANCH="${GH_BRANCH:-gh-pages}"                     # target branch
COMMIT_MSG="deploy: build $(git -C "$REPO_ROOT" rev-parse --short HEAD) - $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}▶  $*${NC}"; }
success() { echo -e "${GREEN}✔  $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
die()     { echo -e "${RED}✖  $*${NC}" >&2; exit 1; }

# ── Pre-flight ────────────────────────────────────────────────────────────────
cd "$REPO_ROOT"

command -v git  >/dev/null 2>&1 || die "git not found"
command -v node >/dev/null 2>&1 || die "node not found"
command -v npm  >/dev/null 2>&1 || die "npm not found"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repo"
git remote get-url "$REMOTE" >/dev/null 2>&1 || die "Remote '${REMOTE}' not found. Add it with: git remote add ${REMOTE} <url>"

CURRENT_BRANCH="$(git symbolic-ref --short HEAD)"
info "On branch: ${CURRENT_BRANCH}  →  deploying to remote '${REMOTE}/${BRANCH}'"

# Warn if there are uncommitted changes (deploy from a clean state)
if ! git diff --quiet || ! git diff --cached --quiet; then
  warn "You have uncommitted changes — deploying from current working tree anyway"
fi

# ── Step 1: Install dependencies ──────────────────────────────────────────────
info "Installing dependencies…"
npm ci --prefer-offline --silent

# ── Step 2: Build ─────────────────────────────────────────────────────────────
info "Building production bundle…"
npm run build

DIST_DIR="$REPO_ROOT/dist"
[ -d "$DIST_DIR" ] || die "dist/ directory not found after build"

# ── Step 3: Verify no symlinks in dist (IBM GHE Jekyll chokes on them) ────────
info "Checking for symlinks in dist/…"
SYMLINKS="$(find "$DIST_DIR" -type l 2>/dev/null)"
if [ -n "$SYMLINKS" ]; then
  warn "Symlinks found — dereferencing with cp -rL"
  CLEAN_DIST="$(mktemp -d)"
  cp -rL "$DIST_DIR"/. "$CLEAN_DIST"/
else
  CLEAN_DIST="$DIST_DIR"
fi
success "dist/ is clean ($(find "$CLEAN_DIST" -type f | wc -l | tr -d ' ') files)"

# ── Step 4: Deploy via orphan worktree ────────────────────────────────────────
info "Creating orphan worktree for ${BRANCH}…"
WORKTREE="$(mktemp -d)"

# Use -B so re-runs overwrite the local branch if it exists
git worktree add --orphan -B "${BRANCH}-deploy" "$WORKTREE"

cp -r "$CLEAN_DIST"/. "$WORKTREE"/

cd "$WORKTREE"
git add -A

FILE_COUNT="$(git diff --cached --numstat | wc -l | tr -d ' ')"
info "Committing ${FILE_COUNT} files: \"${COMMIT_MSG}\""
git commit -m "$COMMIT_MSG"

info "Force-pushing to ${REMOTE}/${BRANCH}…"
REMOTE_URL="$(git -C "$REPO_ROOT" remote get-url "$REMOTE")"
git push "$REMOTE_URL" "${BRANCH}-deploy:${BRANCH}" --force

# ── Cleanup ───────────────────────────────────────────────────────────────────
cd "$REPO_ROOT"
git worktree remove "$WORKTREE" --force 2>/dev/null || true
git branch -D "${BRANCH}-deploy"  2>/dev/null || true
[ "$CLEAN_DIST" != "$DIST_DIR" ] && rm -rf "$CLEAN_DIST"

success "Deployed to ${REMOTE}/${BRANCH} ✓"
echo ""
echo -e "  ${GREEN}Live URL:${NC} $(git remote get-url "$REMOTE" | sed 's|git@github.ibm.com:|https://pages.github.ibm.com/|;s|\.git$|/|;s|github.ibm.com/|pages.github.ibm.com/|' || echo '(check your Pages settings)')"
echo ""
