import { PassThrough } from 'node:stream'

import { renderSync } from '@hermes/ink'
import React from 'react'
import stripAnsi from 'strip-ansi'
import { describe, expect, it } from 'vitest'

import type { ProcessRow } from '../app/processRoster.js'
import { deriveWorkspace, LiveWorkspacePanel, type LiveWorkspacePanelProps } from '../components/liveWorkspacePanel.js'
import { DEFAULT_THEME } from '../theme.js'
import type { ActiveTool, SubagentProgress } from '../types.js'

const paint = (node: React.ReactElement): string => {
  const stdout = Object.assign(new PassThrough(), { columns: 40, rows: 30 })
  const frames: string[] = []
  stdout.on('data', (chunk: Buffer) => {
    frames.push(chunk.toString())
  })

  const view = renderSync(node, {
    patchConsole: false,
    stdin: new PassThrough() as unknown as NodeJS.ReadStream,
    stdout: stdout as unknown as NodeJS.WriteStream
  })

  const frame = stripAnsi(frames.join(''))
  view.unmount()
  view.cleanup()

  return frame
}

const tool = (id: string, name: string, context?: string): ActiveTool => ({ context, id, name })

const subagent = (id: string, status: SubagentProgress['status']): SubagentProgress => ({
  depth: 0,
  goal: `task ${id}`,
  id,
  index: 0,
  notes: [],
  parentId: null,
  status,
  taskCount: 1,
  thinking: [],
  toolCount: 0,
  tools: []
})

const processRow = (over: Partial<ProcessRow>): ProcessRow => ({
  command: 'npm run test',
  detail: 'exit 0 · 3s ago',
  elapsedSeconds: 12,
  exitCode: 0,
  id: 'proc-1',
  sinceExitSeconds: 3,
  status: 'done',
  ...over
})

describe('LiveWorkspacePanel (OpenCode style side panel)', () => {
  it('renders status, active tools, targets, and subagent state properly on wide layout', () => {
    const props: LiveWorkspacePanelProps = {
      activeTool: tool('tool-1', 'patch', 'src/components/appLayout.tsx'),
      cols: 36,
      lastCommand: 'npm run test',
      lastExitCode: 0,
      status: 'running…',
      subagentsCount: 2,
      t: DEFAULT_THEME
    }

    const frame = paint(<LiveWorkspacePanel {...props} />)

    expect(frame).toContain('WORKSPACE')
    expect(frame).toContain('patch')
    expect(frame).toContain('src/components/appLayout.tsx')
    expect(frame).toContain('npm run test')
    expect(frame).toContain('exit 0')
    expect(frame).toContain('2 live')
  })

  it('derives the newest tool, the newest finished process, and only live subagents', () => {
    const state = deriveWorkspace({
      processes: [
        processRow({ command: 'npm run build', exitCode: 0, id: 'p-1', status: 'done' }),
        processRow({ command: 'npm run test', exitCode: 1, id: 'p-2', status: 'failed' })
      ],
      subagents: [subagent('s-1', 'running'), subagent('s-2', 'completed'), subagent('s-3', 'queued')],
      tools: [tool('t-1', 'read_file', 'src/app.tsx'), tool('t-2', 'patch', 'src/appLayout.tsx')]
    })

    expect(state.activeTool?.name).toBe('patch')
    expect(state.activeTool?.context).toBe('src/appLayout.tsx')
    expect(state.lastCommand).toBe('npm run test')
    expect(state.lastExitCode).toBe(1)
    expect(state.subagentsCount).toBe(2)
  })

  it('keeps the panel idle and exit-code-free when there is no work yet', () => {
    const state = deriveWorkspace({ processes: [], subagents: [], tools: [] })

    expect(state.activeTool).toBeNull()
    expect(state.lastCommand).toBeNull()
    expect(state.lastExitCode).toBeNull()
    expect(state.subagentsCount).toBe(0)
  })

  it('reports no exit code while the newest process is still running', () => {
    const state = deriveWorkspace({
      processes: [processRow({ exitCode: null, id: 'p-run', sinceExitSeconds: 0, status: 'running' })],
      subagents: [],
      tools: []
    })

    expect(state.lastCommand).toBe('npm run test')
    expect(state.lastExitCode).toBeNull()
  })
})