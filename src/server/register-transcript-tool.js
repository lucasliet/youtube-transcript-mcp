import { transcriptYt } from '../tool/transcriptYt.js'

/**
 * Registers the transcript_yt MCP tool on the provided MCP server instance.
 * @param server MCP server with registerTool support.
 * @returns Void.
 */
export function registerTranscriptTool(server) {
  server.registerTool({
    name: 'transcript_yt',
    description: 'Fetches YouTube transcript segments from a video URL for LLM consumption.',
    inputSchema: {
      type: 'object',
      properties: {
        videoUrl: { type: 'string', description: 'Full YouTube video URL.' },
        preferredLanguages: {
          type: 'array',
          items: { type: 'string' },
          description: "Optional ordered language codes preference, e.g., ['pt-BR','en']."
        }
      },
      required: ['videoUrl'],
      additionalProperties: false
    }
  }, async (args = {}) => {
    const videoUrl = String(args.videoUrl || '')
    const preferredLanguages = Array.isArray(args.preferredLanguages) ? args.preferredLanguages : undefined
    return transcriptYt({ videoUrl, preferredLanguages })
  })
}
