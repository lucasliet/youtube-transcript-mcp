/**
 * Builds a streamable event payload with optional request correlation metadata.
 * @param event The event name emitted to the client.
 * @param connectionId Stream connection identifier assigned by the registry.
 * @param payload Optional base payload to include in the event body.
 * @param requestId Optional request correlation identifier.
 * @returns A structured event ready for transport delivery.
 */
export function buildOutboundEvent(event, connectionId, payload, requestId) {
  const basePayload = payload ?? {}
  const base = { ...basePayload, connectionId }
  if (requestId !== undefined && requestId !== null) base.requestId = requestId
  return { event, data: JSON.stringify(base) }
}
