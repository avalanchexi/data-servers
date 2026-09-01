/**
 * 资产中心 — 数据安全（对标 DataWorks 数据保护伞 / DataLeap 数据安全）
 * 页签：分类分级 / 脱敏策略 / 行列权限 / 审计日志 / 风险识别 / 备案评估 / 红队测试
 */
import { lazy, Suspense } from 'react'
import { ShieldCheck, Tags, EyeOff, KeyRound, ScrollText, AlertTriangle, Gavel, Crosshair } from 'lucide-react'
import { useUrlTab } from '../../../../hooks/useUrlTab'
import { Card, Tabs } from '../../../../components/ui'
import type { TabItem } from '../../../../components/ui'
import TabFallback from '../TabFallback'

const ClassificationTab = lazy(() => import('./tabs/ClassificationTab'))
const MaskPolicyTab = lazy(() => import('./tabs/MaskPolicyTab'))
const AclTab = lazy(() => import('./tabs/AclTab'))
const AuditLogTab = lazy(() => import('./tabs/AuditLogTab'))
const RiskScanTab = lazy(() => import('./tabs/RiskScanTab'))
const EvalComplianceTab = lazy(() => import('./tabs/EvalComplianceTab'))
const RedTeamTab = lazy(() => import('./tabs/RedTeamTab'))

type TabId = 'classification' | 'mask' | 'acl' | 'audit' | 'risk' | 'eval' | 'redteam'

const TABS: Array<TabItem & { key: TabId }> = [
  { key: 'classification', label: '分类分级', icon: Tags },
  { key: 'mask', label: '脱敏策略', icon: EyeOff },
  { key: 'acl', label: '行列权限', icon: KeyRound },
  { key: 'audit', label: '审计日志', icon: ScrollText },
  { key: 'risk', label: '风险识别', icon: AlertTriangle },
  { key: 'eval', label: '备案评估', icon: Gavel },
  { key: 'redteam', label: '红队测试', icon: Crosshair },
]

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useUrlTab<TabId>('classification')

  return (
    <div className="h-full min-h-0 overflow-hidden p-5" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Card padding="none" className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-5 py-5 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
            >
              <ShieldCheck size={19} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>数据安全</h2>
              <p className="mt-1 text-sm leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
                分类分级（JR/T 0197-2020 五级）、静态/动态脱敏、行列权限、审计与风险识别。
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
              {tab.key === 'classification' && <ClassificationTab />}
              {tab.key === 'mask' && <MaskPolicyTab />}
              {tab.key === 'acl' && <AclTab />}
              {tab.key === 'audit' && <AuditLogTab />}
              {tab.key === 'risk' && <RiskScanTab />}
              {tab.key === 'eval' && <EvalComplianceTab />}
              {tab.key === 'redteam' && <RedTeamTab />}
            </Suspense>
          )}
        </Tabs>
      </Card>
    </div>
  )
}
