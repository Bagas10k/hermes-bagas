import { Box, Text } from '@hermes/ink'
import React, { memo } from 'react'

import { compactPreview } from '../lib/text.js'
import type { Theme } from '../theme.js'
import type { ActiveTool } from '../types.js'

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
