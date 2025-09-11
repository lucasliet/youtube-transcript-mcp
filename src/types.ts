export type TranscriptSegment = {
  text: string
  startInMs: number
  duration: number
}

export type VideoTranscriptRequest = {
  videoUrl: string
  preferredLanguages?: string[]
}

