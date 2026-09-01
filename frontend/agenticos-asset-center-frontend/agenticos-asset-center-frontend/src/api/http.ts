import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { setupAuthInterceptor } from './interceptor'

export interface CreateHttpOptions extends AxiosRequestConfig {
  baseURL: string
  timeout?: number
  withCredentials?: boolean
  withAuthInterceptor?: boolean
}

const DEFAULT_TIMEOUT = 30000

export const createHttp = (options: CreateHttpOptions): AxiosInstance => {
  const {
    baseURL,
    timeout = DEFAULT_TIMEOUT,
    withCredentials = true,
    withAuthInterceptor = true,
    ...rest
  } = options

  const instance = axios.create({
    baseURL,
    timeout,
    withCredentials,
    ...rest,
  })

  if (withAuthInterceptor) {
    setupAuthInterceptor(instance)
  }

  return instance
}
