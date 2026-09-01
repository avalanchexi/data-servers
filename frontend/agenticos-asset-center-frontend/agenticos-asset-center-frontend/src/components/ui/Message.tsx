/**
 * 全局消息提示组件（Toast）—— 系统唯一的公共实现，请勿重复造轮子！
 *
 * 使用场景：操作成功/失败/信息的全局浮层反馈（如"保存成功"、"删除失败"）。
 * 从 `@/components/ui`（即 `web/src/components/ui/index.ts`）导入使用：
 *
 *   import { Message } from '@/components/ui'
 *
 *   Message.success('操作成功')                          // 绿色，3 秒自动消失
 *   Message.error('操作失败')                            // 红色，3 秒自动消失
 *   Message.error(extractApiErrorMessage(e, '兜底文案'))  // 展示后端返回的报错信息
 *   Message.warning('注意')
 *   Message.info('提示')
 *
 * 常用参数（对象形式）：
 *   Message.error({ message: 'xx', duration: 0, showClose: true })  // duration=0 不自动消失，配合 showClose 手动关闭
 *   Message.success({ message: 'xx', center: true })                // 居中展示
 *
 * 与 InlineAlert 的分工（务必区分）：
 *   - Message：全局浮层 toast，用于"操作结果"反馈（提交/删除/启停等动作的成败）—— 本组件
 *   - InlineAlert：页面内嵌提示条，用于"表单字段级就地校验错误"（如 UserManagementPage 校验"字段不能为空"）
 *
 * 错误信息提取：优先用 `web/src/api/errors.ts` 的 `extractApiErrorMessage(err, fallback)`，
 * 它能取到后端返回的 `response.data.detail`，避免只显示 axios 通用错误文案。
 */
import { ReactNode, isValidElement, memo, useCallback, useEffect, useState, type NamedExoticComponent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export type MessageType = 'info' | 'success' | 'warning' | 'error';

export interface MessageProps {
  type?: MessageType;
  message?: ReactNode;
  children?: ReactNode;
  duration?: number;
  showClose?: boolean;
  center?: boolean;
  className?: string;
  onClose?: () => void;
}

type MessageOptions = Omit<MessageProps, 'children'> | ReactNode;

interface MessageHandler {
  close: () => void;
}

interface InternalMessage extends MessageProps {
  id: number;
}

type MessageComponent = NamedExoticComponent<MessageProps> & {
  open: (options: MessageOptions) => MessageHandler;
  info: (options: MessageOptions) => MessageHandler;
  success: (options: MessageOptions) => MessageHandler;
  warning: (options: MessageOptions) => MessageHandler;
  error: (options: MessageOptions) => MessageHandler;
  closeAll: () => void;
};

const DEFAULT_DURATION = 3000;

const messageConfig = {
  info: {
    icon: Info,
    color: 'var(--color-info)',
    background: 'var(--color-info-light)',
    border: 'color-mix(in srgb, var(--color-info) 24%, transparent)',
  },
  success: {
    icon: CheckCircle2,
    color: 'var(--color-success)',
    background: 'var(--color-success-light)',
    border: 'color-mix(in srgb, var(--color-success) 24%, transparent)',
  },
  warning: {
    icon: AlertTriangle,
    color: 'var(--color-warning)',
    background: 'var(--color-warning-light)',
    border: 'color-mix(in srgb, var(--color-warning) 26%, transparent)',
  },
  error: {
    icon: AlertCircle,
    color: 'var(--color-error)',
    background: 'var(--color-error-light)',
    border: 'color-mix(in srgb, var(--color-error) 26%, transparent)',
  },
} satisfies Record<MessageType, {
  icon: typeof Info;
  color: string;
  background: string;
  border: string;
}>;

let seed = 0;
let root: Root | null = null;
let messages: InternalMessage[] = [];
const listeners = new Set<(items: InternalMessage[]) => void>();

function emitMessages() {
  const next = [...messages];
  listeners.forEach((listener) => listener(next));
}

function ensureMessageRoot() {
  if (typeof document === 'undefined' || root) return;

  const container = document.createElement('div');
  container.setAttribute('data-ui-message-root', '');
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(<MessageHost />);
}

function isMessageOptionsObject(options: MessageOptions): options is Omit<MessageProps, 'children'> {
  return Boolean(
    options &&
    typeof options === 'object' &&
    !Array.isArray(options) &&
    !isValidElement(options) &&
    (
      'message' in options ||
      'type' in options ||
      'duration' in options ||
      'showClose' in options ||
      'center' in options ||
      'className' in options ||
      'onClose' in options
    )
  );
}

function normalizeOptions(options: MessageOptions, type?: MessageType): MessageProps {
  if (!isMessageOptionsObject(options)) {
    return { type: type ?? 'info', message: options };
  }

  return { ...options, type: type ?? options.type ?? 'info' };
}

function isEmptyContent(content: ReactNode) {
  return content === null || content === undefined || content === false;
}

function closeMessage(id: number) {
  const target = messages.find((item) => item.id === id);
  if (!target) return;

  messages = messages.filter((item) => item.id !== id);
  target.onClose?.();
  emitMessages();
}

function openMessage(options: MessageOptions, type?: MessageType): MessageHandler {
  const normalized = normalizeOptions(options, type);
  const id = seed + 1;
  seed = id;
  messages = [
    ...messages,
    {
      duration: DEFAULT_DURATION,
      showClose: false,
      ...normalized,
      id,
    },
  ];
  ensureMessageRoot();
  emitMessages();

  return {
    close: () => closeMessage(id),
  };
}

function closeAllMessages() {
  const current = messages;
  messages = [];
  current.forEach((item) => item.onClose?.());
  emitMessages();
}

function MessageHost() {
  const [items, setItems] = useState<InternalMessage[]>(messages);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-5 z-[9999] flex flex-col items-center gap-3 px-4">
      {items.map((item) => (
        <MessageItem
          key={item.id}
          item={item}
        />
      ))}
    </div>
  );
}

const MessageItem = memo(function MessageItem({ item }: { item: InternalMessage }) {
  const handleClose = useCallback(() => closeMessage(item.id), [item.id]);

  return (
    <MessageBase
      {...item}
      onClose={handleClose}
    />
  );
});

const MessageBase = memo(function MessageBase({
  type = 'info',
  message,
  children,
  duration = DEFAULT_DURATION,
  showClose = false,
  center = false,
  className,
  onClose,
}: MessageProps) {
  const [visible, setVisible] = useState(true);
  const content = message ?? children;
  const config = messageConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    setVisible(true);
    if (isEmptyContent(content)) {
      onClose?.();
      return undefined;
    }

    if (!duration || duration <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [content, duration, onClose]);

  if (!visible || isEmptyContent(content)) return null;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={clsx(
        'pointer-events-auto flex min-h-11 min-w-[280px] max-w-[min(560px,calc(100vw-2rem))] items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-card)] fade-in-up',
        center && 'justify-center text-center',
        className
      )}
      style={{
        backgroundColor: config.background,
        borderColor: config.border,
        color: config.color,
      }}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-5 text-[var(--color-text)]">
        {content}
      </div>
      {showClose && (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[rgba(0,0,0,0.06)]"
          style={{ color: config.color }}
          title="关闭"
          aria-label="关闭提示"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
});

export const Message = Object.assign(MessageBase, {
  open: (options: MessageOptions) => openMessage(options),
  info: (options: MessageOptions) => openMessage(options, 'info'),
  success: (options: MessageOptions) => openMessage(options, 'success'),
  warning: (options: MessageOptions) => openMessage(options, 'warning'),
  error: (options: MessageOptions) => openMessage(options, 'error'),
  closeAll: closeAllMessages,
}) as MessageComponent;
