"""End-to-end PTY acceptance test for OpenCode-style live workspace panel.

Verifies that on a wide terminal (cols >= 110) running ``hermes --tui``,
the LiveWorkspacePanel renders on the live terminal screen alongside the
transcript, showing the WORKSPACE label. Narrow terminals (<110) do not show it.

ENVIRONMENT REQUIREMENT: this harness needs a working local gateway bootstrap
(``gateway_bootstrap.py`` reachable from the PTY child's interpreter). On hosts
where that fails, BOTH this test and upstream's own
``test_terminal_transcript_pty.py`` time out at ``wait_ready()`` ("the UI to
take the terminal (raw mode)") -- that is a harness/environment limitation, not
a regression in the panel. Component-level coverage lives in
``ui-tui/src/__tests__/liveWorkspacePanel.test.tsx`` and does not need a gateway.
"""

import sys
from pathlib import Path

import pytest

from tests.e2e.core.terminal._pty import PtyHermes
from tests.fakes.fake_llm_provider import FakeLLMServer, Text

pytestmark = [
    pytest.mark.skipif(not sys.platform.startswith("linux"), reason="real PTY + /proc session scan"),
    pytest.mark.live_system_guard_bypass,
]

REPO_ROOT = Path(__file__).resolve().parents[4]


@pytest.mark.skipif(
    not (REPO_ROOT / "ui-tui" / "dist" / "entry.js").exists(),
    reason="ui-tui/dist/entry.js must be built before running TUI PTY tests",
)
def test_live_workspace_panel_renders_on_wide_tui_terminal(tmp_path_factory) -> None:
    sandbox = Path(tmp_path_factory.mktemp("hermes_tui_wide", numbered=True))
    script = [Text("Hello from fake LLM")]
    with FakeLLMServer(script, aux=lambda _req: Text("title")) as llm:
        term = PtyHermes(sandbox, ["--tui", "--yolo"], llm, rows=30, cols=120)
        try:
            term.wait_ready()
            # On cols=120 (>=110 threshold), the side panel must be visible.
            term.wait_for_text("WORKSPACE", timeout=30.0)
            assert term.count("WORKSPACE") >= 1
            lines = term.lines()
            workspace_lines = [l for l in lines if "WORKSPACE" in l]
            assert workspace_lines, f"WORKSPACE not found in rendered lines: {lines}"
        finally:
            term.close()


@pytest.mark.skipif(
    not (REPO_ROOT / "ui-tui" / "dist" / "entry.js").exists(),
    reason="ui-tui/dist/entry.js must be built before running TUI PTY tests",
)
def test_live_workspace_panel_hidden_on_narrow_terminal(tmp_path_factory) -> None:
    sandbox = Path(tmp_path_factory.mktemp("hermes_tui_narrow", numbered=True))
    script = [Text("Hello from fake LLM")]
    with FakeLLMServer(script, aux=lambda _req: Text("title")) as llm:
        # cols=90 is below the 110 threshold
        term = PtyHermes(sandbox, ["--tui", "--yolo"], llm, rows=30, cols=90)
        try:
            term.wait_ready()
            # Wait for greeting to ensure initial render is complete
            term.wait_for_text("hermes", timeout=30.0)
            # WORKSPACE must NOT be rendered on a narrow terminal
            assert term.count("WORKSPACE") == 0
        finally:
            term.close()
