/**
 * 资产中心 — 数据标准（对标 DataLeap 数据标准模块 / WeData 配置中心）
 * 页签：标准集 / 标准代码 / 命名词典 / 落标映射 / 贯标统计
 */
import { lazy, Suspense } from 'react'
import { Ruler, ListTree, Hash, Type, Link2, BarChart3 } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'

const StandardSetTab = lazy(() => import('./tabs/StandardSetTab'))
const StandardCodeTab = lazy(() => import('./tabs/StandardCodeTab'))
const NamingDictTab = lazy(() => import('./tabs/NamingDictTab'))
const MappingTab = lazy(() => import('./tabs/MappingTab'))
const CoverageTab = lazy(() => import('./tabs/CoverageTab'))

type TabId = 'set' | 'code' | 'naming' | 'mapping' | 'coverage'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'set', label: '标准集', icon: ListTree },
  { key: 'code', label: '标准代码', icon: Hash },
  { key: 'naming', label: '命名词典', icon: Type },
  { key: 'mapping', label: '落标映射', icon: Link2 },
  { key: 'coverage', label: '贯标统计', icon: BarChart3 },
]

export default function StandardPage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('set')

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Ruler size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>数据标准</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                五类标准（业务术语/数据元/主数据/参考数据/指标数据）、标准代码、命名词典、落标映射与落标率统计。
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
              {tab.key === 'set' && <StandardSetTab />}
              {tab.key === 'code' && <StandardCodeTab />}
              {tab.key === 'naming' && <NamingDictTab />}
              {tab.key === 'mapping' && <MappingTab />}
              {tab.key === 'coverage' && <CoverageTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
    </div>
  )
}
