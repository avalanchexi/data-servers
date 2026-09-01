import { apiClient } from './core'
import type {
  Message,
  MessageListResponse,
  MessageCountResponse,
  CreateMessageRequest,
  MessageType,
  MessageTemplate,
  MessageTemplateListResponse,
  CreateMessageTemplateRequest,
  UpdateMessageTemplateRequest,
} from '../types/messages'

// ==================== 用户消息接口 ====================

export interface MessageListQuery {
  page?: number
  page_size?: number
  type?: MessageType
  is_read?: boolean
}

export const listMessages = async (params: MessageListQuery = {}): Promise<MessageListResponse> => {
  const response = await apiClient.get<MessageListResponse>('/v1/messages', { params })
  return response.data
}

export const getMessage = async (messageId: string): Promise<Message> => {
  const response = await apiClient.get<Message>(`/v1/messages/${messageId}`)
  return response.data
}

export const getMessageCount = async (): Promise<MessageCountResponse> => {
  const response = await apiClient.get<MessageCountResponse>('/v1/messages/count')
  return response.data
}

export const markMessageRead = async (messageId: string): Promise<Message> => {
  const response = await apiClient.put<Message>(`/v1/messages/${messageId}/read`)
  return response.data
}

export const markAllRead = async (): Promise<{ message: string; count: number }> => {
  const response = await apiClient.put<{ message: string; count: number }>('/v1/messages/read-all')
  return response.data
}

export const deleteMessage = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/v1/messages/${messageId}`)
}

// ==================== 管理员消息接口 ====================

export interface AdminMessageListQuery {
  page?: number
  page_size?: number
  type?: MessageType
  search?: string
  receiver_id?: string
  start_date?: string
  end_date?: string
}

export const createMessage = async (data: CreateMessageRequest): Promise<Message> => {
  const response = await apiClient.post<Message>('/v1/admin/messages', data)
  return response.data
}

export const listMessagesAdmin = async (params: AdminMessageListQuery = {}): Promise<MessageListResponse> => {
  const response = await apiClient.get<MessageListResponse>('/v1/admin/messages', { params })
  return response.data
}

export const deleteMessageAdmin = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/v1/admin/messages/${messageId}`)
}

// ==================== 消息模板接口 ====================

export const listTemplates = async (params: { page?: number; page_size?: number; type?: MessageType } = {}): Promise<MessageTemplateListResponse> => {
  const response = await apiClient.get<MessageTemplateListResponse>('/v1/admin/messages/templates', { params })
  return response.data
}

export const getTemplate = async (templateId: string): Promise<MessageTemplate> => {
  const response = await apiClient.get<MessageTemplate>(`/v1/admin/messages/templates/${templateId}`)
  return response.data
}

export const createTemplate = async (data: CreateMessageTemplateRequest): Promise<MessageTemplate> => {
  const response = await apiClient.post<MessageTemplate>('/v1/admin/messages/templates', data)
  return response.data
}

export const updateTemplate = async (templateId: string, data: UpdateMessageTemplateRequest): Promise<MessageTemplate> => {
  const response = await apiClient.put<MessageTemplate>(`/v1/admin/messages/templates/${templateId}`, data)
  return response.data
}

export const deleteTemplate = async (templateId: string): Promise<void> => {
  await apiClient.delete(`/v1/admin/messages/templates/${templateId}`)
}

export const seedTemplates = async (): Promise<{ message: string; count: number }> => {
  const response = await apiClient.post<{ message: string; count: number }>('/v1/admin/messages/templates/seed')
  return response.data
}