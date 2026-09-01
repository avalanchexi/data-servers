/**
 * 资产中心 — 资产总览（对标 DataWorks 治理工作台 / DataLeap 治理门户）
 * 页签：全景大屏 / 治理驾驶舱 / 治理排行榜 / 治理中心
 * 入口：资产360（单对象 360 视图抽屉）
 */
import { lazy, Suspense, useState } from 'react'
import { LayoutDashboard, Gauge, Trophy, AlertTriangle, ScanSearch } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Button, Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'
import Asset360Drawer from './Asset360Drawer'

const PanoramaTab = lazy(() => import('./tabs/PanoramaTab'))
const CockpitTab = lazy(() => import('./tabs/CockpitTab'))
const RankingTab = lazy(() => import('./tabs/RankingTab'))
const ProblemTab = lazy(() => import('./tabs/ProblemTab'))

type TabId = 'panorama' | 'cockpit' | 'ranking' | 'problem'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'panorama', label: '全景大屏', icon: LayoutDashboard },
  { key: 'cockpit', label: '治理驾驶舱', icon: Gauge },
  { key: 'ranking', label: '治理排行榜', icon: Trophy },
  { key: 'problem', label: '治理中心', icon: AlertTriangle },
]

export default function OverviewPage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('panorama')
  const [asset360Open, setAsset360Open] = useState(false)

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* 防 Chrome GPU 崩溃（错误代码 5）：圆角 Card + overflow:hidden + 内部图表
          Canvas 会触发合成崩溃（crbug.com/1313302）；overflow: clip 不创建滚动容器，
          切断圆角 mask 与子层 Canvas 的合成触发链，Canvas 侧另有 .gpu-safe-chart */}
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-clip">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <LayoutDashboard size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>资产总览</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                存储量/表数/资产数全景视图，治理健康分与治理中心（对标 DataWorks 治理工作台）。
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setAsset360Open(true)} className="ml-auto" ro>
              <ScanSearch size={15} /> 资产360
            </Button>
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
              {tab.key === 'panorama' && <PanoramaTab />}
              {tab.key === 'cockpit' && <CockpitTab />}
              {tab.key === 'ranking' && <RankingTab />}
              {tab.key === 'problem' && <ProblemTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
      <Asset360Drawer open={asset360Open} onClose={() => setAsset360Open(false)} />
    </div>
  )
}
