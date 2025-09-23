/**
 * @fileoverview Shared schema for the transcript_yt tool.
 */

/**
 * The schema for the transcript_yt tool.
 * @type {import('@modelcontextprotocol/sdk').Tool}
 */
export const transcriptYtSchema = {
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
}