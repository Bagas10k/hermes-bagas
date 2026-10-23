# Linux installation from the GitHub clone

This fork is developed Linux-first. The first verification target is Ubuntu/Debian on x86_64.

## Install

The repository is private, so authenticate GitHub on the machine first. Then run:

```bash
git clone git@github.com:Bagas10k/hermes-bagas.git
cd hermes-bagas
./install.sh
```

The root installer deliberately uses the clone's `origin` as the update source. A default clone follows `main`; another checked-out branch or an explicit `--branch` remains on that branch. Dependency and product setup are delegated to Hermes' existing pinned installer.

After installation:

```bash
source ~/.bashrc  # or: source ~/.zshrc
hermes --tui
```

## Development branch

The stable install path uses `main`. To test the in-progress observable TUI without changing the stable branch:

```bash
git switch feat/opencode-tui
./install.sh --skip-setup
```

Do not use the feature branch for an unattended production gateway until its release gate is green.

## Platform contract

| Platform | Status for this fork |
| --- | --- |
| Ubuntu/Debian x86_64 | Primary target; release verification required |
| Linux ARM64 | Architecture retained by upstream; not yet verified for this fork |
| Other glibc/musl Linux | Best effort until a clean-host test passes |
| WSL2 | Expected to follow Linux; not yet verified for this fork |
| macOS | Upstream path retained; not yet verified for this fork |
| Native Windows | Upstream PowerShell path retained; not yet verified for this fork |
| Termux | Not supported by this clone installer; use the upstream APT packaging path |

A platform becomes supported by this fork only after a clean install, `hermes doctor`, TUI launch, and smoke test pass on that platform.

## Isolation and rollback

To test without replacing an existing Hermes profile:

```bash
HERMES_HOME="$HOME/.hermes-bagas-test" \
HERMES_INSTALL_DIR="$HOME/.local/share/hermes-bagas-test" \
./install.sh --non-interactive --skip-browser --skip-computer-use
```

Delete those two test directories to roll back the isolated test. Never copy `.env`, `auth.json`, session databases, or an existing profile into the repository.
