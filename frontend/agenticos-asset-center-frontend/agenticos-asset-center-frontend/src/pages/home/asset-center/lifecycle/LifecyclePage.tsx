/**
 * 资产中心 — 数据生命周期（对标 DataWorks 表生命周期管理）
 * 页签：分层策略 / 归档管理 / 退役管理 / 执行记录
 */
import { lazy, Suspense } from 'react'
import { Archive, Layers, LogOut, History } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'

const TierPolicyTab = lazy(() => import('./tabs/TierPolicyTab'))
const ArchiveTab = lazy(() => import('./tabs/ArchiveTab'))
const RetireTab = lazy(() => import('./tabs/RetireTab'))
const ExecutionLogTab = lazy(() => import('./tabs/ExecutionLogTab'))

type TabId = 'tier' | 'archive' | 'retire' | 'execution'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'tier', label: '分层策略', icon: Layers },
  { key: 'archive', label: '归档管理', icon: Archive },
  { key: 'retire', label: '退役管理', icon: LogOut },
  { key: 'execution', label: '执行记录', icon: History },
]

export default function LifecyclePage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('tier')

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Archive size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>数据生命周期</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                冷热分层、归档与退役审批流、执行全量留痕（认证可追溯证据）。
              </p>
            </div>
          </div>
        </div>

        <Tabs
          items={TABS}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabId)}
          className="min-h-0 flex-1"
          listClassName="shrink-0 gap-6 px-5 sm:px-6"
          panelClassName="min-h-0 flex-1 overflow-auto p-4 sm:p-6"
        >
          {(tab) => (
            <Suspense fallback={<TabFallback />}>
              {tab.key === 'tier' && <TierPolicyTab />}
              {tab.key === 'archive' && <ArchiveTab />}
              {tab.key === 'retire' && <RetireTab />}
              {tab.key === 'execution' && <ExecutionLogTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
    </div>
  )
}
