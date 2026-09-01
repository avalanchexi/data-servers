/**
 * 资产中心 — 治理评估（DCMM 认证抓手，对标 L4 量化管理级举证）
 * 页签：指标台账 / 自评估 / 证据库 / 制度库 / 战略目标 / 治理组织 / 九域看板
 */
import { lazy, Suspense } from 'react'
import { Award, ListChecks, ClipboardCheck, FolderKanban, BookOpen, LayoutDashboard, Target, Network } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'

const IndicatorTab = lazy(() => import('./tabs/IndicatorTab'))
const SelfAssessTab = lazy(() => import('./tabs/SelfAssessTab'))
const EvidenceTab = lazy(() => import('./tabs/EvidenceTab'))
const InstitutionTab = lazy(() => import('./tabs/InstitutionTab'))
const StrategyTab = lazy(() => import('./tabs/StrategyTab'))
const GovernanceTab = lazy(() => import('./tabs/GovernanceTab'))
const DomainDashboardTab = lazy(() => import('./tabs/DomainDashboardTab'))

type TabId = 'indicator' | 'assess' | 'evidence' | 'institution' | 'strategy' | 'governance' | 'dashboard'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'indicator', label: '指标台账', icon: ListChecks },
  { key: 'assess', label: '自评估', icon: ClipboardCheck },
  { key: 'evidence', label: '证据库', icon: FolderKanban },
  { key: 'institution', label: '制度库', icon: BookOpen },
  { key: 'strategy', label: '战略目标', icon: Target },
  { key: 'governance', label: '治理组织', icon: Network },
  { key: 'dashboard', label: '九域看板', icon: LayoutDashboard },
]

export default function DcmmPage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('indicator')

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* 防 Chrome GPU 崩溃（错误代码 5）：圆角 Card + overflow:hidden + 九域看板
          Canvas 雷达图会触发合成崩溃（crbug.com/1313302）；overflow: clip 不创建
          滚动容器，切断圆角 mask 与子层 Canvas 的合成触发链，Canvas 侧另有 .gpu-safe-chart */}
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-clip">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <Award size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>治理评估</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                DCMM 九域 486 指标台账、自评估四档打分、证据库自动抓取运行态指标、制度库、战略目标与治理组织台账、九域看板（L4 举证核心）。
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
              {tab.key === 'indicator' && <IndicatorTab />}
              {tab.key === 'assess' && <SelfAssessTab />}
              {tab.key === 'evidence' && <EvidenceTab />}
              {tab.key === 'institution' && <InstitutionTab />}
              {tab.key === 'strategy' && <StrategyTab />}
              {tab.key === 'governance' && <GovernanceTab />}
              {tab.key === 'dashboard' && <DomainDashboardTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
    </div>
  )
}
