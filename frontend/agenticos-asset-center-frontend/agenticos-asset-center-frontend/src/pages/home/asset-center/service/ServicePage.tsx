/**
 * 资产中心 — 数据服务（对标 Dataphin 数据服务 / WeData 数据服务）
 * 页签：服务注册 / API 商城 / 授权管理 / 调用统计 / 外部数据台账
 */
import { lazy, Suspense } from 'react'
import { Server, Store, ShieldCheck, BarChart3, Database } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'

const ServiceRegistryTab = lazy(() => import('./tabs/ServiceRegistryTab'))
const ApiMarketTab = lazy(() => import('./tabs/ApiMarketTab'))
const AuthManageTab = lazy(() => import('./tabs/AuthManageTab'))
const CallStatsTab = lazy(() => import('./tabs/CallStatsTab'))
const ExternalDataTab = lazy(() => import('./tabs/ExternalDataTab'))

type TabId = 'registry' | 'market' | 'auth' | 'stats' | 'external'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'registry', label: '服务注册', icon: Server },
  { key: 'market', label: 'API 商城', icon: Store },
  { key: 'auth', label: '授权管理', icon: ShieldCheck },
  { key: 'stats', label: '调用统计', icon: BarChart3 },
  { key: 'external', label: '外部数据台账', icon: Database },
]

export default function ServicePage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('registry')

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Server size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>数据服务</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                dataset/semantic_model 封装为参数化 SQL 服务，MCP 发布、商城审批、调用统计与外部数据台账。
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
              {tab.key === 'registry' && <ServiceRegistryTab />}
              {tab.key === 'market' && <ApiMarketTab />}
              {tab.key === 'auth' && <AuthManageTab />}
              {tab.key === 'stats' && <CallStatsTab />}
              {tab.key === 'external' && <ExternalDataTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
    </div>
  )
}
