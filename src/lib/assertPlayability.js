/**
 * Validates the playability status extracted from the YouTube player response.
 * @param playabilityStatus The playabilityStatus object from player response.
 * @returns Void when OK; throws for known unplayable states.
 */
export function assertPlayability(playabilityStatus) {
  const status = playabilityStatus?.status
  if (!status || status === 'OK') return
  const reason = playabilityStatus?.reason || ''
  if (status === 'LOGIN_REQUIRED') {
    if (reason.includes('not a bot')) throw new Error('request_blocked')
    if (reason.includes('inappropriate')) throw new Error('age_restricted')
  }
  if (status === 'ERROR' && reason.includes('unavailable')) throw new Error('video_unavailable')
  throw new Error('video_unplayable')
}
