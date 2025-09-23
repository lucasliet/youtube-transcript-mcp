import { transcriptYt } from '../tool/transcriptYt.js'
import { transcriptYtSchema } from '../lib/toolSchema.js'

/**
 * Registers the transcript_yt MCP tool on the provided MCP server instance.
 * @param server MCP server with registerTool support.
 * @returns Void.
 */
export function registerTranscriptTool(server) {
  server.registerTool(transcriptYtSchema, async (args = {}) => {
    const videoUrl = String(args.videoUrl || '')
    const preferredLanguages = Array.isArray(args.preferredLanguages) ? args.preferredLanguages : undefined
    return transcriptYt({ videoUrl, preferredLanguages })
  })
}
