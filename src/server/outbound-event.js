export function buildOutboundEvent(event, connectionId, payload = {}, requestId) {
  const base = { ...payload, connectionId }
  if (requestId !== undefined && requestId !== null) base.requestId = requestId
  return { event, data: JSON.stringify(base) }
}
