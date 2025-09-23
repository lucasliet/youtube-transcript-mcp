#!/usr/bin/env node
import { transcriptYt } from './tool/transcriptYt.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { parseCliConfig } from './server/config.js'
import { startSdkRemoteServer } from './server/remote-server.js'
import { McpServer } from './server/mcp-server.js'
import { registerTranscriptTool } from './server/register-transcript-tool.js'

/**
 * CLI/MCP entrypoint. If --videoUrl is provided, runs a one-off fetch and prints JSON.
 * Otherwise, starts an MCP server over stdio exposing the transcript_yt tool.
 */
async function main() {
  const args = parseArgs(process.argv.slice(2))
  const config = parseCliConfig(args)
  if (config.mode === 'remote') {
    if (args.videoUrl) {
      console.error('[warn] Ignoring --videoUrl because mode=remote')
    }
    await startRemoteMode(config)
    return
  }
  if (args.videoUrl) {
    const preferredLanguages = args.preferredLanguages ? String(args.preferredLanguages).split(',').map((s) => s.trim()).filter(Boolean) : undefined
    const res = await transcriptYt({ videoUrl: String(args.videoUrl), preferredLanguages })
    process.stdout.write(JSON.stringify(res))
    return
  }
  await startMcpServer()
}

/**
 * Starts an MCP server over stdio with the transcript_yt tool.
 */
async function startMcpServer() {
  const server = new McpServer({
    name: 'youtube-transcript-mcp',
    version: '2.0.2'
  }, {
    capabilities: { tools: {} }
  })
  registerTranscriptTool(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

/**
 * Inicia o modo remoto do MCP com a configuração fornecida.
 * @param {{ port?: number, host?: string, cors?: string|string[]|boolean, heartbeatIntervalMs?: number, requestTimeoutMs?: number, maxClients?: number }} config
 * @returns {Promise<void>}
 */
async function startRemoteMode(config) {
  const server = await startSdkRemoteServer({
    port: config.port,
    host: config.host,
    cors: config.cors,
    heartbeatIntervalMs: config.heartbeatIntervalMs,
    requestTimeoutMs: config.requestTimeoutMs,
    maxClients: config.maxClients
  })
  let shuttingDown = false
  const shutdown = async () => {
    if (shuttingDown) return
    shuttingDown = true
    try {
      await server.close()
    } catch (error) {
      console.error('[error] Failed to close remote server:', error)
    } finally {
      process.exitCode = 0
      setTimeout(() => process.exit(0), 2000).unref()
    }
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

/**
 * Parses CLI arguments into a key/value object.
 * @param argv The argv slice (excluding node and script).
 * @returns A map of parsed flags.
 */
function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const n = argv[i + 1]
      if (n && !n.startsWith('--')) {
        out[k] = n
        i++
      } else {
        out[k] = 'true'
      }
    }
  }
  return out
}

main().catch(() => { process.exitCode = 1 })
