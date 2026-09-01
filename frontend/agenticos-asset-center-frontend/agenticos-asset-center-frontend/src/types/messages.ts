// 消息类型枚举
export type MessageType = 'announcement' | 'task' | 'alert' | 'direct'

// 消息接口
export interface Message {
  id: string
  type: MessageType
  title: string
  content: string
  sender_id: string | null
  sender_name: string | null
  receiver_id: string
  is_read: boolean
  read_at: string | null
  read_count: number
  total_count: number
  expire_at: string | null
  is_pinned: boolean
  can_revoke: boolean
  template_id: string | null
  business_type: string | null
  business_key: string | null
  action_url: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// 消息响应
export interface MessageResponse {
  data: Message
}

// 消息列表响应
export interface MessageListResponse {
  items: Message[]
  total: number
  page: number
  page_size: number
}

// 消息计数响应
export interface MessageCountResponse {
  total: number
  unread: number
}

// 创建消息请求
export interface CreateMessageRequest {
  type: MessageType
  title: string
  content: string
  receiver_id: string
  sender_name?: string | null
  expire_at?: string | null
  is_pinned?: boolean
  can_revoke?: boolean
  template_id?: string | null
  business_type?: string | null
  business_key?: string | null
  action_url?: string | null
  metadata?: Record<string, unknown> | null
}

// 消息类型配置
export interface MessageTypeConfig {
  icon: string
  iconBgColor: string
  iconColor: string
  labelBgColor: string
  labelColor: string
  label: string
}

// 消息类型映射
export const MESSAGE_TYPE_CONFIG: Record<MessageType, MessageTypeConfig> = {
  announcement: {
    icon: 'Megaphone',
    iconBgColor: 'rgba(22, 93, 255, 0.1)',
    iconColor: 'rgb(22, 93, 255)',
    labelBgColor: 'rgba(22, 93, 255, 0.1)',
    labelColor: 'rgb(22, 93, 255)',
    label: '系统公告',
  },
  task: {
    icon: 'ClipboardList',
    iconBgColor: 'rgba(0, 168, 112, 0.1)',
    iconColor: 'rgb(0, 168, 112)',
    labelBgColor: 'rgba(0, 168, 112, 0.1)',
    labelColor: 'rgb(0, 168, 112)',
    label: '任务通知',
  },
  alert: {
    icon: 'AlertTriangle',
    iconBgColor: 'rgba(245, 63, 63, 0.1)',
    iconColor: 'rgb(245, 63, 63)',
    labelBgColor: 'rgba(245, 63, 63, 0.1)',
    labelColor: 'rgb(245, 63, 63)',
    label: '安全告警',
  },
  direct: {
    icon: 'Mail',
    iconBgColor: 'rgba(139, 92, 246, 0.1)',
    iconColor: 'rgb(139, 92, 246)',
    labelBgColor: 'rgba(139, 92, 246, 0.1)',
    labelColor: 'rgb(139, 92, 246)',
    label: '定向消息',
  },
}

// ==================== 消息模板 ====================

export interface MessageTemplate {
  id: string
  name: string
  code: string
  type: MessageType
  title_template: string
  content_template: string
  variables: Record<string, string> | null
  is_builtin: boolean
  description: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface MessageTemplateListResponse {
  items: MessageTemplate[]
  total: number
  page: number
  page_size: number
}

export interface CreateMessageTemplateRequest {
  name: string
  code: string
  type: MessageType
  title_template: string
  content_template: string
  variables?: Record<string, string> | null
  description?: string | null
}

export interface UpdateMessageTemplateRequest {
  name?: string | null
  type?: MessageType | null
  title_template?: string | null
  content_template?: string | null
  variables?: Record<string, string> | null
  description?: string | null
  enabled?: boolean | null
}
