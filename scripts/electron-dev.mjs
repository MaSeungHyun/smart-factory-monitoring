import { spawn } from 'node:child_process'
import { once } from 'node:events'

import electron from 'electron'
import { createServer } from 'vite'

const server = await createServer({ server: { host: '127.0.0.1', open: false } })

try {
  await server.listen()
  const devUrl = server.resolvedUrls?.local[0]
  if (!devUrl) throw new Error('Vite did not start a local dev server')

  const child = spawn(electron, ['.', ...process.argv.slice(2)], {
    env: { ...process.env, MONITOR_DEV_URL: devUrl },
    stdio: 'inherit',
  })
  const stop = () => child.kill()
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  try {
    const [code] = await once(child, 'exit')
    process.exitCode = code ?? 0
  } finally {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
  }
} finally {
  await server.close()
}
