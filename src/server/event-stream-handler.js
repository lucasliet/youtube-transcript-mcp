import { logRemote } from './logging.js'

export function handleEventStream(req, res, registry) {
  const session = registry.create(res)
  if (!session) {
    res.writeHead(429, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: 'server_busy', message: 'max clients reached' }))
    return
  }
  session.start()
  const cleanup = () => {
    registry.delete(session.connectionId)
  }
  req.once('close', cleanup)
  req.once('error', (err) => {
    logRemote('other_error', err?.message || 'stream_error')
    cleanup()
  })
}
