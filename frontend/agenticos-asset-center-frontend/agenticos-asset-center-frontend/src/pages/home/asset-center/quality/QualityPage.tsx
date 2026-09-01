/**
 * 资产中心 — 数据质量（对标 WeData 六维 56 模板 / DataWorks 质量闭环）
 * 页签：规则模板库 / 监控任务 / 校验记录 / 质量评分 / 问题工单 / 质量报告
 */
import { lazy, Suspense } from 'react'
import { BadgeCheck, Library, Activity, ListChecks, Gauge, Wrench, FileText } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'

const RuleTemplateTab = lazy(() => import('./tabs/RuleTemplateTab'))
const MonitorTaskTab = lazy(() => import('./tabs/MonitorTaskTab'))
const CheckResultTab = lazy(() => import('./tabs/CheckResultTab'))
const QualityScoreTab = lazy(() => import('./tabs/QualityScoreTab'))
const IssueTicketTab = lazy(() => import('./tabs/IssueTicketTab'))
const QualityReportTab = lazy(() => import('./tabs/QualityReportTab'))

type TabId = 'template' | 'monitor' | 'result' | 'score' | 'ticket' | 'report'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'template', label: '规则模板库', icon: Library },
  { key: 'monitor', label: '监控任务', icon: Activity },
  { key: 'result', label: '校验记录', icon: ListChecks },
  { key: 'score', label: '质量评分', icon: Gauge },
  { key: 'ticket', label: '问题工单', icon: Wrench },
  { key: 'report', label: '质量报告', icon: FileText },
]

export default function QualityPage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('template')

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <BadgeCheck size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>数据质量</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                六维规则（GB/T 36344-2018）模板库、旁路监控、六维加权评分、工单闭环与质量报告。
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
              {tab.key === 'template' && <RuleTemplateTab />}
              {tab.key === 'monitor' && <MonitorTaskTab />}
              {tab.key === 'result' && <CheckResultTab />}
              {tab.key === 'score' && <QualityScoreTab />}
              {tab.key === 'ticket' && <IssueTicketTab />}
              {tab.key === 'report' && <QualityReportTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
    </div>
  )
}
