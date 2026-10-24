import { PassThrough } from 'node:stream'

import { renderSync } from '@hermes/ink'
import React from 'react'
import stripAnsi from 'strip-ansi'
import { describe, expect, it } from 'vitest'

import { LiveWorkspacePanel, type LiveWorkspacePanelProps } from '../components/liveWorkspacePanel.js'
import { DEFAULT_THEME } from '../theme.js'

describe('LiveWorkspacePanel (OpenCode style side panel)', () => {
  it('renders status, active tools, targets, and subagent state properly on wide layout', () => {
    const props: LiveWorkspacePanelProps = {
      cols: 36,
      status: 'running…',
      activeTool: {
        id: 'tool-1',
        name: 'patch',
        context: 'src/components/appLayout.tsx',
        verboseArgs: '{"path": "src/components/appLayout.tsx"}',
        startedAt: Date.now() - 5000
      },
      lastCommand: 'npm run test',
      lastExitCode: 0,
      subagentsCount: 2,
      t: DEFAULT_THEME
    }

    const stdout = Object.assign(new PassThrough(), { columns: 36, rows: 24 })
    const frames: string[] = []
    stdout.on('data', chunk => {
      frames.push(chunk.toString())
    })

    const view = renderSync(<LiveWorkspacePanel {...props} />, {
      stdout: stdout as unknown as NodeJS.WriteStream,
      stdin: new PassThrough() as unknown as NodeJS.ReadStream
    })

    const output = stripAnsi(frames.join('\n'))

    expect(output).toContain('WORKSPACE')
    expect(output).toContain('patch')
    expect(output).toContain('src/components/appLayout.tsx')
    expect(output).toContain('npm run test')
    expect(output).toContain('exit 0')
    expect(output).toContain('2 live')

    view.unmount()
    view.cleanup()
  })
})
