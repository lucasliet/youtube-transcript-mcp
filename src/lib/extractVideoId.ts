/**
 * Extracts a YouTube video ID from a full URL or short link.
 * @param url The YouTube video URL.
 * @returns The 11-character video ID or null when not found.
 */
export function extractVideoId(url: string) {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/)
  return match ? match[1] : null
}

