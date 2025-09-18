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
    version: '0.1.0'
  }, {
    capabilities: { tools: {} }
  })
  registerTranscriptTool(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

async function startRemoteMode(config) {
  const server = await startSdkRemoteServer({
    port: config.port,
    host: config.host,
    cors: config.cors,
    heartbeatIntervalMs: config.heartbeatIntervalMs,
    requestTimeoutMs: config.requestTimeoutMs,
    maxClients: config.maxClients
  })
  const shutdown = async () => {
    await server.close()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
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
