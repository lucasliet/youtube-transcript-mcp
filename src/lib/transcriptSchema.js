const transcriptSchema = {
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

export { transcriptSchema }
