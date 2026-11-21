import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAppUrls, publicEventsUrl } from '../src/urls.js'

test('local development uses the existing API and Keycloak addresses', () => {
  assert.deepEqual(createAppUrls(), {
    apiUrl: 'http://localhost:3000',
    keycloakUrl: 'http://localhost:8081',
    keycloakRealm: 'EventFlow',
    keycloakClientId: 'eventflow-frontend'
  })
})

test('production can serve both the API and Keycloak on the frontend origin', () => {
  const urls = createAppUrls({ VITE_API_URL: '/', VITE_KEYCLOAK_URL: '/auth' }, 'https://events.example.org')

  assert.equal(urls.apiUrl, '')
  assert.equal(urls.keycloakUrl, 'https://events.example.org/auth')
  assert.equal(publicEventsUrl(urls.apiUrl), '/api/events')
})

test('configured external service URLs have no trailing slash', () => {
  const urls = createAppUrls({
    VITE_API_URL: 'https://api.example.org/',
    VITE_KEYCLOAK_URL: 'https://login.example.org/auth/',
    VITE_KEYCLOAK_REALM: 'Testing',
    VITE_KEYCLOAK_CLIENT_ID: 'testing-frontend'
  })

  assert.deepEqual(urls, {
    apiUrl: 'https://api.example.org',
    keycloakUrl: 'https://login.example.org/auth',
    keycloakRealm: 'Testing',
    keycloakClientId: 'testing-frontend'
  })
})

test('empty filters are omitted from the request', () => {
  assert.equal(publicEventsUrl('', { search: '  ', categoryId: '', date: '' }), '/api/events')
})

test('search text is trimmed and encoded as one parameter', () => {
  const url = publicEventsUrl('', { search: '  Šport & glasba  ' })
  assert.equal(url, '/api/events?search=%C5%A0port+%26+glasba')
})

test('category and date filters are combined', () => {
  const url = publicEventsUrl('https://api.example.org', { categoryId: 2, date: '2027-01-15' })
  assert.equal(url, 'https://api.example.org/api/events?categoryId=2&date=2027-01-15')
})
