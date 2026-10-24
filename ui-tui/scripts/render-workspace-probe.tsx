import { PassThrough } from 'node:stream'

import { renderSync } from '@hermes/ink'
import React from 'react'
import stripAnsi from 'strip-ansi'

import { LiveWorkspacePanel } from '../src/components/liveWorkspacePanel.js'
import { DEFAULT_THEME } from '../src/theme.js'

const stdout = Object.assign(new PassThrough(), { columns: 40, rows: 30 })
const frames: string[] = []
stdout.on('data', (c: Buffer) => frames.push(c.toString()))

const view = renderSync(
  <LiveWorkspacePanel
    activeTool={{ context: 'src/components/appLayout.tsx', id: 'tool-1', name: 'patch' }}
    cols={40}
    lastCommand="npm run test"
    lastExitCode={0}
    status="running…"
    subagentsCount={2}
    t={DEFAULT_THEME}
  />,
  { patchConsole: false, stdin: new PassThrough() as unknown as NodeJS.ReadStream, stdout: stdout as unknown as NodeJS.WriteStream }
)

setTimeout(() => {
  const joined = stripAnsi(frames.join(''))
  console.log('FRAMES=' + frames.length + ' CHARS=' + joined.length)
  console.log('--- RENDERED ---')
  console.log(joined)
  console.log('--- CHECKS ---')
  for (const token of ['WORKSPACE', 'patch', 'appLayout.tsx', 'npm run test', 'exit 0', '2 live']) {
    console.log(token + ' => ' + (joined.includes(token) ? 'PRESENT' : 'MISSING'))
  }
  view.unmount()
  view.cleanup()
}, 300)