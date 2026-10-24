import { Box, Text } from '@hermes/ink'
import { useStore } from '@nanostores/react'
import React, { memo, useEffect, useState } from 'react'

import { useAgentRoster } from '../app/agentRoster.js'
import { type ProcessRow, useProcessRows } from '../app/processRoster.js'
import { useTurnSelector } from '../app/turnStore.js'
import { $uiState } from '../app/uiStore.js'
import { compactPreview } from '../lib/text.js'
import type { Theme } from '../theme.js'
import type { ActiveTool, SubagentProgress } from '../types.js'

export interface WorkspaceSnapshot {
  activeTool: ActiveTool | null
  lastCommand: string | null
  lastExitCode: number | null
  subagentsCount: number
}

const LIVE_SUBAGENT_STATUSES: ReadonlySet<string> = new Set(['queued', 'running'])

/**
 * Collapse the raw live sources into the four facts the panel shows.
 * `tools` is the current turn's in-flight list (newest last), `subagents` the
 * spawn roster, and `processes` the background dock rows (running first).
 */
export function deriveWorkspace(input: {
  processes: readonly ProcessRow[]
  subagents: readonly SubagentProgress[]
  tools: readonly ActiveTool[]
}): WorkspaceSnapshot {
  const newestProcess = input.processes.at(-1) ?? null

  return {
    activeTool: input.tools.at(-1) ?? null,
    lastCommand: newestProcess?.command ?? null,
    lastExitCode: newestProcess && newestProcess.status !== 'running' ? newestProcess.exitCode : null,
    subagentsCount: input.subagents.filter(s => LIVE_SUBAGENT_STATUSES.has(s.status)).length
  }
}

export interface LiveWorkspacePanelProps {
  activeTool?: ActiveTool | null
  cols: number
  lastCommand?: string | null
  lastExitCode?: number | null
  status: string
  subagentsCount?: number
  t: Theme
}

export const LiveWorkspacePanel = memo(function LiveWorkspacePanel({
  activeTool,
  cols,
  lastCommand,
  lastExitCode,
  status,
  subagentsCount = 0,
  t
}: LiveWorkspacePanelProps) {
  const contentWidth = Math.max(10, cols - 2)

  return (
    <Box
      borderColor={t.color.border}
      borderStyle="round"
      flexDirection="column"
      paddingX={1}
      width={cols}
    >
      <Box justifyContent="space-between" width={contentWidth}>
        <Text bold color={t.color.accent}>
          WORKSPACE
        </Text>
        <Text color={status === 'ready' ? t.color.statusGood : t.color.statusWarn}>
          {status}
        </Text>
      </Box>

      <Box height={1} />

      <Text bold color={t.color.label}>
        ACTIVE TOOL
      </Text>
      {activeTool ? (
        <Box flexDirection="column">
          <Text color={t.color.text} wrap="truncate-end">
            ⚡ {activeTool.name}
          </Text>
          {activeTool.context ? (
            <Text color={t.color.muted} wrap="truncate-end">
              ↳ {compactPreview(activeTool.context, contentWidth - 4)}
            </Text>
          ) : null}
        </Box>
      ) : (
        <Text color={t.color.muted}>idle</Text>
      )}

      <Box height={1} />

      <Text bold color={t.color.label}>
        LAST COMMAND
      </Text>
      {lastCommand ? (
        <Box flexDirection="column">
          <Text color={t.color.text} wrap="truncate-end">
            $ {compactPreview(lastCommand, contentWidth - 4)}
          </Text>
          {lastExitCode !== undefined && lastExitCode !== null ? (
            <Text color={lastExitCode === 0 ? t.color.statusGood : t.color.statusCritical}>
              exit {lastExitCode}
            </Text>
          ) : null}
        </Box>
      ) : (
        <Text color={t.color.muted}>none</Text>
      )}

      <Box height={1} />

      <Text bold color={t.color.label}>
        SUBAGENTS
      </Text>
      <Text color={subagentsCount > 0 ? t.color.accent : t.color.muted}>
        {subagentsCount > 0 ? `${subagentsCount} live` : 'none'}
      </Text>
    </Box>
  )
})

/** Mounted by AppLayout: owns the live subscriptions so the layout file stays
 *  a one-line integration and this panel re-renders on its own clock only. */
export const LiveWorkspaceSidePanel = memo(function LiveWorkspaceSidePanel({ cols }: { cols: number }) {
  const { status, theme } = useStore($uiState)
  const tools = useTurnSelector(state => state.tools)
  const subagents = useAgentRoster()
  const [now, setNow] = useState(Date.now)
  const processRows = useProcessRows(now)
  const ticking = processRows.length > 0

  useEffect(() => {
    if (!ticking) {
      return
    }

    const timer = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(timer)
  }, [ticking])

  const snapshot = deriveWorkspace({ processes: processRows, subagents, tools })

  return (
    <LiveWorkspacePanel
      activeTool={snapshot.activeTool}
      cols={cols}
      lastCommand={snapshot.lastCommand}
      lastExitCode={snapshot.lastExitCode}
      status={status}
      subagentsCount={snapshot.subagentsCount}
      t={theme}
    />
  )
})
