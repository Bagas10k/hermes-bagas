#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
UPSTREAM_INSTALLER="$ROOT/scripts/install.sh"

if [ ! -x "$UPSTREAM_INSTALLER" ]; then
    printf 'installer not found or not executable: %s\n' "$UPSTREAM_INSTALLER" >&2
    exit 1
fi

if [ -z "${HERMES_REPO_URL:-}" ]; then
    HERMES_REPO_URL="$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)"
fi

if [ -z "${HERMES_REPO_URL:-}" ]; then
    printf 'cannot determine the fork remote; set HERMES_REPO_URL explicitly\n' >&2
    exit 1
fi

export HERMES_REPO_URL
export HERMES_INSTALL_CHANNEL="${HERMES_INSTALL_CHANNEL:-main}"
export HERMES_INSTALL_DIR="${HERMES_INSTALL_DIR:-$ROOT}"

has_branch=false
for arg in "$@"; do
    case "$arg" in
        --branch|-Branch) has_branch=true ;;
    esac
done

if [ "$has_branch" = false ]; then
    branch="$(git -C "$ROOT" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
    if [ -n "$branch" ]; then
        set -- --branch "$branch" "$@"
    fi
fi

exec "$UPSTREAM_INSTALLER" "$@"
