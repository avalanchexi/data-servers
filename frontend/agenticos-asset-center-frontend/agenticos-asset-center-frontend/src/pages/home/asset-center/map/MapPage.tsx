/**
 * 资产中心 — 数据地图（对标 DataWorks 数据地图 / DataLeap 数据地图）
 * 页签：数据检索 / 采集任务 / 血缘分析 / 数据架构 / 我的数据
 * （类目管理已迁移至资产目录页「Catalog 管理」页签）
 */
import { lazy, Suspense } from 'react'
import { Map, Search, DownloadCloud, Share2, Star, Layers } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'

const SearchTab = lazy(() => import('./tabs/SearchTab'))
const CollectTaskTab = lazy(() => import('./tabs/CollectTaskTab'))
const LineageTab = lazy(() => import('./tabs/LineageTab'))
const ArchitectureTab = lazy(() => import('./tabs/ArchitectureTab'))
const MyDataTab = lazy(() => import('./tabs/MyDataTab'))

type TabId = 'search' | 'collect' | 'lineage' | 'architecture' | 'mydata'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'search', label: '数据检索', icon: Search },
  { key: 'collect', label: '采集任务', icon: DownloadCloud },
  { key: 'lineage', label: '血缘分析', icon: Share2 },
  { key: 'architecture', label: '数据架构', icon: Layers },
  { key: 'mydata', label: '我的数据', icon: Star },
]

export default function MapPage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('search')

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Map size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>数据地图</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                全局统一检索（跨 PG/SeaboxSQL/Hive/HDFS）、元数据采集、表级/字段级血缘、数据架构与我的数据。
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
              {tab.key === 'search' && <SearchTab />}
              {tab.key === 'collect' && <CollectTaskTab />}
              {tab.key === 'lineage' && <LineageTab />}
              {tab.key === 'architecture' && <ArchitectureTab />}
              {tab.key === 'mydata' && <MyDataTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
    </div>
  )
}
