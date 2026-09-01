import { createHttp } from './http'
import { extractApiErrorMessage } from './errors'
import { normalizeCardData } from './normalize'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
export const API_TOKEN = import.meta.env.VITE_API_TOKEN || ''

export const apiClient = createHttp({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export { extractApiErrorMessage } from './errors'
export { normalizeCardData } from './normalize'
