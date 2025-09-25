import { transcriptToolMetadata, transcriptYt } from '../tool/transcriptYt.js'

/**
 * Registers the transcript_yt MCP tool on the provided MCP server instance.
 * @param server MCP server with registerTool support.
 * @param toolImpl Implementation function used to resolve transcripts.
 * @returns Void.
 */
export function registerTranscriptTool(server, toolImpl = transcriptYt) {
  server.registerTool(transcriptToolMetadata, async (args = {}) => {
    const videoUrl = String(args.videoUrl || '')
    const preferredLanguages = Array.isArray(args.preferredLanguages) ? args.preferredLanguages : undefined
    return toolImpl({ videoUrl, preferredLanguages })
  })
}
