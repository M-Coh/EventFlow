export function createAppUrls(env = {}, origin = 'http://localhost:5173') {
  const apiUrl = (env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const keycloakUrl = new URL(env.VITE_KEYCLOAK_URL || 'http://localhost:8081', origin)

  return {
    apiUrl,
    keycloakUrl: keycloakUrl.href.replace(/\/+$/, ''),
    keycloakRealm: env.VITE_KEYCLOAK_REALM || 'EventFlow',
    keycloakClientId: env.VITE_KEYCLOAK_CLIENT_ID || 'eventflow-frontend'
  }
}

export function publicEventsUrl(apiUrl, { search, categoryId, date } = {}) {
  const params = new URLSearchParams()

  if (search?.trim()) params.set('search', search.trim())
  if (categoryId) params.set('categoryId', categoryId)
  if (date) params.set('date', date)

  const query = params.toString()
  return `${apiUrl}/api/events${query ? `?${query}` : ''}`
}
