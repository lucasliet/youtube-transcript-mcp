import { logRemote } from './logging.js'

export function handleEventStream(req, res, registry) {
  if (!registry.canAccept()) {
    res.writeHead(429, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: 'server_busy', message: 'max clients reached' }))
    return
  }
  const session = registry.create(res)
  if (!session) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ code: 'server_busy', message: 'unable to create session' }))
    return
  }
  session.start()
  const cleanup = () => {
    registry.delete(session.connectionId)
  }
  req.on('close', cleanup)
  req.on('error', (err) => {
    logRemote('other_error', err?.message || 'stream_error')
    cleanup()
  })
}
