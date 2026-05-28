import { apiRequest } from './api.js'

export async function listAwards(eventId) {
  if (!eventId) throw new Error('Missing eventId')
  const payload = await apiRequest(`/awards/events/${eventId}`, { method: 'GET' })
  return payload?.data?.awards || []
}

export async function deleteAward(eventId, awardId) {
  if (!eventId || !awardId) throw new Error('Missing identifiers')
  return await apiRequest(`/awards/events/${eventId}/${awardId}`, { method: 'DELETE' })
}
