/**
 * 资产中心 — 资产目录（对标 Dataphin 资产清单 + 用户资产运营要求）
 * 页签：资产盘点 / 目录浏览 / Catalog 管理 / 权属管理 / 价值评估 / 资产运营 / 使用统计
 */
import { lazy, Suspense } from 'react'
import { FolderTree, ClipboardList, LayoutGrid, Database, Shield, Coins, TrendingUp } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'

const InventoryTab = lazy(() => import('./tabs/InventoryTab'))
const BrowseTab = lazy(() => import('./tabs/BrowseTab'))
const CatalogManageTab = lazy(() => import('./tabs/CatalogManageTab'))
const OwnershipTab = lazy(() => import('./tabs/OwnershipTab'))
const ValuationTab = lazy(() => import('./tabs/ValuationTab'))
const OperationTab = lazy(() => import('./tabs/OperationTab'))
const UsageStatsTab = lazy(() => import('./tabs/UsageStatsTab'))

type TabId = 'inventory' | 'browse' | 'catalog' | 'ownership' | 'valuation' | 'operation' | 'usage'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'inventory', label: '资产盘点', icon: ClipboardList },
  { key: 'browse', label: '目录浏览', icon: LayoutGrid },
  { key: 'catalog', label: 'Catalog 管理', icon: Database },
  { key: 'ownership', label: '权属管理', icon: Shield },
  { key: 'valuation', label: '价值评估', icon: Coins },
  { key: 'operation', label: '资产运营', icon: TrendingUp },
  { key: 'usage', label: '使用统计', icon: TrendingUp },
]

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('inventory')

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <FolderTree size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>资产目录</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                盘点→编目→上架→定价→授权→交易→使用统计全链闭环；Catalog 命名空间管理与业务目录树维护。
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
              {tab.key === 'inventory' && <InventoryTab />}
              {tab.key === 'browse' && <BrowseTab />}
              {tab.key === 'catalog' && <CatalogManageTab />}
              {tab.key === 'ownership' && <OwnershipTab />}
              {tab.key === 'valuation' && <ValuationTab />}
              {tab.key === 'operation' && <OperationTab />}
              {tab.key === 'usage' && <UsageStatsTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
    </div>
  )
}
