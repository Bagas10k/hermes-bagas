import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_clone_installer_delegates_to_fork_origin(tmp_path: Path) -> None:
    checkout = tmp_path / "checkout"
    scripts = checkout / "scripts"
    scripts.mkdir(parents=True)
    installer = checkout / "install.sh"
    installer.write_bytes((ROOT / "install.sh").read_bytes())
    installer.chmod(0o755)

    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    args_file = tmp_path / "args"
    env_file = tmp_path / "env"

    (fake_bin / "git").write_text(
        "#!/usr/bin/env bash\n"
        "if [ \"$1\" = -C ] && [ \"$3\" = remote ] && [ \"$4\" = get-url ] && [ \"$5\" = origin ]; then\n"
        "  printf '%s\\n' 'git@github.com:Bagas10k/hermes-bagas.git'\n"
        "  exit 0\n"
        "fi\n"
        "if [ \"$1\" = -C ] && [ \"$3\" = symbolic-ref ]; then\n"
        "  printf '%s\\n' 'feat/opencode-tui'\n"
        "  exit 0\n"
        "fi\n"
        "exit 1\n"
    )
    (fake_bin / "git").chmod(0o755)

    upstream = scripts / "install.sh"
    upstream.write_text(
        "#!/usr/bin/env bash\n"
        f"printf '%s\\n' \"$*\" > {args_file!s}\n"
        f"printf '%s\\n' \"$HERMES_REPO_URL|$HERMES_INSTALL_CHANNEL|$HERMES_INSTALL_DIR\" > {env_file!s}\n"
    )
    upstream.chmod(0o755)

    result = subprocess.run(
        [str(installer), "--skip-setup"],
        check=False,
        env={**os.environ, "PATH": f"{fake_bin}:{os.environ['PATH']}"},
        text=True,
        capture_output=True,
    )

    assert result.returncode == 0, result.stderr
    assert args_file.read_text().strip() == "--branch feat/opencode-tui --skip-setup"
    assert env_file.read_text().strip() == f"git@github.com:Bagas10k/hermes-bagas.git|main|{checkout}"


def test_clone_installer_preserves_explicit_branch(tmp_path: Path) -> None:
    checkout = tmp_path / "checkout"
    scripts = checkout / "scripts"
    scripts.mkdir(parents=True)
    installer = checkout / "install.sh"
    installer.write_bytes((ROOT / "install.sh").read_bytes())
    installer.chmod(0o755)

    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    args_file = tmp_path / "args"
    (fake_bin / "git").write_text(
        "#!/usr/bin/env bash\n"
        "if [ \"$1\" = -C ] && [ \"$3\" = remote ]; then\n"
        "  printf '%s\\n' 'git@github.com:Bagas10k/hermes-bagas.git'\n"
        "  exit 0\n"
        "fi\n"
        "exit 1\n"
    )
    (fake_bin / "git").chmod(0o755)
    upstream = scripts / "install.sh"
    upstream.write_text("#!/usr/bin/env bash\nprintf '%s\\n' \"$*\" > " + str(args_file) + "\n")
    upstream.chmod(0o755)

    result = subprocess.run(
        [str(installer), "--branch", "release-test", "--skip-setup"],
        check=False,
        env={**os.environ, "PATH": f"{fake_bin}:{os.environ['PATH']}"},
        text=True,
        capture_output=True,
    )

    assert result.returncode == 0, result.stderr
    assert args_file.read_text().strip() == "--branch release-test --skip-setup"
