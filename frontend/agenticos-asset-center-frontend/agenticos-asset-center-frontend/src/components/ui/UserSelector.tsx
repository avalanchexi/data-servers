import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';
import { useWriteBlocked } from '../../permission/writeScope';
import { listUsers, type UserListQuery } from '../../api/users';
import type { AuthUserResponse, UserListResponse } from '../../api/auth';

const EMPTY_IDS: string[] = [];
const EMPTY_USERS: AuthUserResponse[] = [];

interface UserSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
  placeholder?: string;
  pageSize?: number;
  preloadedUsers?: AuthUserResponse[];
  /** 自定义用户查询接口（默认 /v1/admin/users，邮箱可能被脱敏） */
  fetchUsers?: (params: UserListQuery) => Promise<UserListResponse>;
  /** 最大可选用户数，默认无限制 */
  maxSelect?: number;
  /** 只读豁免：该组件为读操作，页面只读时不被拦截 */
  ro?: boolean;
}

export function UserSelector({
  selectedIds,
  onChange,
  excludeIds = EMPTY_IDS,
  placeholder = '搜索用户...',
  pageSize = 20,
  preloadedUsers = EMPTY_USERS,
  fetchUsers,
  maxSelect,
  ro,
}: UserSelectorProps) {
  const blocked = useWriteBlocked() && !ro;
  const [users, setUsers] = useState<AuthUserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');  // 输入框显示值
  const [search, setSearch] = useState('');           // 已提交的搜索关键字
  const [loading, setLoading] = useState(false);
  const selectedUsersCache = useRef<Map<string, AuthUserResponse>>(new Map());

  const loadUsers = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const data = await (fetchUsers ?? listUsers)({ page: p, page_size: pageSize, search: s || undefined });
      const items = data.items || [];
      setUsers(items);
      setTotal(data.total);
      for (const u of items) {
        selectedUsersCache.current.set(u.id, u);
      }
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize, fetchUsers]);

  useEffect(() => {
    for (const u of preloadedUsers) {
      selectedUsersCache.current.set(u.id, u);
    }
  }, [preloadedUsers]);

  // 仅在 page 或已提交的 search 变化时加载
  useEffect(() => {
    loadUsers(page, search);
  }, [page, search, loadUsers]);

  // 回车触发搜索
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearch(searchText);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleUser = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      // 达到最大可选数时，不允许再选
      if (maxSelect !== undefined && selectedIds.length >= maxSelect) return;
      // 缓存当前选中的用户信息
      const user = users.find((u) => u.id === userId);
      if (user) {
        selectedUsersCache.current.set(userId, user);
      }
      onChange([...selectedIds, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onChange(selectedIds.filter((id) => id !== userId));
  };

  const getUserDisplayName = (user: AuthUserResponse) => {
    return user.cn_name || user.display_name || user.username;
  };

  const filteredUsers = users.filter((u) => !excludeIds.includes(u.id));

  return (
    <div className="space-y-3" data-ro={ro || undefined}>
      {/* 搜索框 — 回车触发搜索 */}
      <Input
        value={searchText}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ro={ro}
        prefix={<Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
      />

      {/* 已选标签 */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const user = selectedUsersCache.current.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                {user ? getUserDisplayName(user) : id}
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => removeUser(id)}
                  className="hover:opacity-70"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* 用户列表 */}
      <div
        className="border rounded-xl overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{
                borderColor: 'var(--color-border)',
                borderTopColor: 'var(--color-primary)',
              }}
            />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {search ? '未找到匹配的用户' : '暂无用户'}
          </div>
        ) : (
          <div className="max-h-[260px] overflow-auto">
            {filteredUsers.map((user) => {
              const isSelected = selectedIds.includes(user.id);
              const displayName = getUserDisplayName(user);
              return (
                <label
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--color-card-elevated)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={blocked}
                    onChange={() => toggleUser(user.id)}
                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {displayName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {user.username}
                      </span>
                      {user.email && (
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {user.email}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 分页 — 始终渲染占位，避免搜索时高度跳变导致弹框闪动 */}
      <div className="flex items-center justify-between" style={{ minHeight: '28px' }}>
        {total > pageSize ? (
          <>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              共 {total} 个用户
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 text-xs rounded-md transition-colors disabled:opacity-40"
                style={{
                  color: page <= 1 ? 'var(--color-text-tertiary)' : 'var(--color-text)',
                }}
              >
                上一页
              </button>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 text-xs rounded-md transition-colors disabled:opacity-40"
                style={{
                  color: page >= totalPages ? 'var(--color-text-tertiary)' : 'var(--color-text)',
                }}
              >
                下一页
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
