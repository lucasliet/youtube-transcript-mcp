/**
 * Builds an outbound event object for SSE.
 * @param {string} event The event name.
 * @param {string} connectionId The connection ID.
 * @param {object} payload The event payload.
 * @param {string|null} requestId The request ID.
 * @returns {object} The outbound event object.
 */
export function buildOutboundEvent(event, connectionId, payload = {}, requestId) {
  const base = { ...payload, connectionId }
  if (requestId !== undefined && requestId !== null) base.requestId = requestId
  return { event, data: JSON.stringify(base) }
}