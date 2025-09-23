import { transcriptYt } from '../tool/transcriptYt.js'
import { transcriptSchema } from '../lib/transcriptSchema.js'

/**
 * Registers the transcript_yt MCP tool on the provided MCP server instance.
 * @param server MCP server with registerTool support.
 * @returns Void.
 */
export function registerTranscriptTool(server) {
  server.registerTool({
    name: 'transcript_yt',
    description: 'Fetches YouTube transcript segments from a video URL for LLM consumption.',
    inputSchema: transcriptSchema
  }, async (args = {}) => {
    const videoUrl = String(args.videoUrl || '')
    const preferredLanguages = Array.isArray(args.preferredLanguages) ? args.preferredLanguages : undefined
    return transcriptYt({ videoUrl, preferredLanguages })
  })
}
