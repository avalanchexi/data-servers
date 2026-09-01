import { ReactNode } from 'react';
import { Database, Search, MessageSquare, Settings, AlertCircle, Folder } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'database' | 'search' | 'message' | 'settings' | 'error' | 'folder';
  title: string;
  description?: string;
  action?: ReactNode;
}

const iconMap = {
  database: Database,
  search: Search,
  message: MessageSquare,
  settings: Settings,
  error: AlertCircle,
  folder: Folder
};

export function EmptyState({
  icon = 'database',
  title,
  description,
  action
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
        style={{ backgroundColor: 'var(--color-card-elevated)' }}
      >
        <Icon size={32} style={{ color: 'var(--color-primary)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-center mb-6 max-w-md" style={{ color: 'var(--color-text-tertiary)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
