import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import {
  IconActivity, IconAdjustments, IconAlertTriangle, IconApi, IconArrowUpRight,
  IconBell, IconBook2, IconBox, IconBrain, IconBriefcase, IconChartBar,
  IconChevronDown, IconChevronRight, IconCircleCheck, IconClock, IconDatabase,
  IconDots, IconDownload, IconEye, IconFileAnalytics, IconFileText, IconFilter,
  IconFolders, IconGauge, IconLayoutGrid, IconListDetails, IconMenu2, IconMessage,
  IconMoon, IconNetwork, IconPaperclip, IconPlus, IconRefresh, IconRobot,
  IconSearch, IconSend, IconSettings, IconShieldCheck, IconSparkles, IconSun,
  IconTable, IconTopologyStar3, IconUsers, IconX,
} from '@tabler/icons-react';
import { navGroups, pages } from './generated/pages.js';

const GROUP_ICONS = {
  智能体: IconRobot,
  能力中心: IconBrain,
  OA: IconFileText,
  数据中心: IconDatabase,
  资产中心: IconLayoutGrid,
  知识中心: IconBook2,
  系统管理: IconSettings,
};

const PAGE_ICONS = [IconLayoutGrid, IconDatabase, IconTable, IconBox, IconFolders, IconNetwork, IconApi, IconShieldCheck];

export function App() {
  const pageId = document.body.dataset.pageId || '042';
  const page = pages.find((entry) => entry.id === pageId) || pages[0];
  const [expandedGroups, setExpandedGroups] = useState(() => new Set([page.group]));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleGroup = (name) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className={dark ? 'app theme-dark' : 'app'}>
      <Header
        onMenu={() => setSidebarOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onNotifications={() => setNotificationsOpen((value) => !value)}
        onTheme={() => setDark((value) => !value)}
        dark={dark}
        notificationsOpen={notificationsOpen}
      />
      <div className="workspace">
        <Sidebar
          page={page}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
        />
        <main className="main-stage">
          <div className="page-surface">
            <PageHeader page={page} />
            <PageTabs page={page} />
            <PageContent page={page} />
          </div>
        </main>
      </div>
      {sidebarOpen && <button className="mobile-backdrop" aria-label="关闭导航" onClick={() => setSidebarOpen(false)} />}
      {searchOpen && <CommandPalette currentPage={page} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function Header({ onMenu, onSearch, onNotifications, onTheme, dark, notificationsOpen }) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <button className="mobile-menu" onClick={onMenu} aria-label="打开导航"><IconMenu2 size={20} /></button>
        <img className="brand-logo" src="./brand-logo.png" alt="东方金信" />
        <span className="brand-name">东方金信</span>
      </div>
      <div className="topbar-actions">
        <button className="global-search" onClick={onSearch}><IconSearch size={18} /><span>搜索菜单...</span><kbd>⌘K</kbd></button>
        <div className="notification-anchor">
          <button className="icon-button" onClick={onNotifications} aria-label="通知"><IconBell size={19} /><span className="notification-dot">3</span></button>
          {notificationsOpen && <NotificationPanel />}
        </div>
        <button className="icon-button" onClick={onTheme} aria-label="切换主题">{dark ? <IconSun size={20} /> : <IconMoon size={20} />}</button>
        <button className="profile-button"><img src="./simulation-avatar.png" alt="模拟用户头像" /><span>李明</span></button>
      </div>
    </header>
  );
}

function NotificationPanel() {
  return (
    <div className="notification-panel popover">
      <div className="popover-title"><strong>消息通知</strong><button>全部已读</button></div>
      {[
        ['数据质量评估已完成', '客户主题域通过最新一轮规则校验', '刚刚'],
        ['服务申请待处理', '客户画像 API 有 2 条新申请', '18 分钟前'],
        ['同步任务执行成功', 'CRM 增量同步已写入 12,480 条记录', '1 小时前'],
      ].map(([title, detail, time]) => (
        <div className="notification-item" key={title}><span className="notification-symbol"><IconCircleCheck size={17} /></span><div><strong>{title}</strong><p>{detail}</p><time>{time}</time></div></div>
      ))}
    </div>
  );
}

function Sidebar({ page, open, onClose, expandedGroups, onToggleGroup }) {
  return (
    <aside className={open ? 'sidebar is-open' : 'sidebar'}>
      <div className="mobile-sidebar-head"><span>功能导航</span><button onClick={onClose} aria-label="关闭导航"><IconX size={20} /></button></div>
      <nav className="sidebar-scroll" aria-label="主导航">
        {navGroups.map((group) => {
          const GroupIcon = GROUP_ICONS[group.name] || IconBriefcase;
          const expanded = expandedGroups.has(group.name);
          const activeGroup = page.group === group.name;
          return (
            <section className={activeGroup ? 'nav-group active-group' : 'nav-group'} key={group.name}>
              <button className="nav-group-button" onClick={() => onToggleGroup(group.name)} aria-expanded={expanded}>
                <span className="nav-group-label"><GroupIcon size={19} stroke={1.8} /><span>{group.name}</span></span>
                <IconChevronDown className={expanded ? 'chevron expanded' : 'chevron'} size={16} />
              </button>
              {expanded && (
                <div className="nav-children">
                  {group.items.map((item, itemIndex) => {
                    const ItemIcon = PAGE_ICONS[itemIndex % PAGE_ICONS.length];
                    const active = page.route === item.route;
                    return <a className={active ? 'nav-child active' : 'nav-child'} href={`./${item.filename}`} key={item.name}><ItemIcon size={17} stroke={1.8} /><span>{item.name}</span></a>;
                  })}
                </div>
              )}
            </section>
          );
        })}
      </nav>
      <div className="prototype-mark"><span>离线仿真原型</span><small>142 个采集页面</small></div>
    </aside>
  );
}

function PageHeader({ page }) {
  const HeaderIcon = page.route === '/#/home/asset-overview' ? IconLayoutGrid : pageIcon(page.type);
  return (
    <div className="page-heading">
      <div className="page-icon"><HeaderIcon size={23} stroke={1.8} /></div>
      <div className="page-title-copy"><div className="breadcrumb"><span>{page.group}</span><IconChevronRight size={13} /><span>{page.item}</span></div><h1>{page.title}</h1><p>{page.subtitle}</p></div>
    </div>
  );
}

function PageTabs({ page }) {
  if (!page.tabs || page.tabs.length <= 1) return null;
  return (
    <nav className="page-tabs" aria-label="页内标签">
      {page.tabs.map((tab, index) => {
        const TabIcon = PAGE_ICONS[index % PAGE_ICONS.length];
        const active = tab.id === page.id || (!page.tab && index === 0);
        return <a className={active ? 'page-tab active' : 'page-tab'} href={`./${tab.filename}`} key={tab.id}><TabIcon size={17} stroke={1.8} /><span>{tab.label}</span></a>;
      })}
    </nav>
  );
}

function PageContent({ page }) {
  if (page.route === '/#/home/asset-overview') return <AssetOverview page={page} />;
  if (page.type === 'dashboard') return <DashboardPage page={page} />;
  if (page.type === 'graph') return <GraphPage page={page} />;
  if (page.type === 'settings') return <SettingsPage page={page} />;
  if (page.type === 'operations') return <OperationsPage page={page} />;
  if (page.type === 'catalog') return <CatalogPage page={page} />;
  if (page.type === 'chat') return <ChatPage />;
  return <ListPage page={page} />;
}

function AssetOverview({ page }) {
  const activeTab = page.tab || page.tabs?.[0]?.label || '全景大屏';
  const metrics = [['存储量', '8.42 TB', '+12.4%', IconBox], ['数据表数', '12,846', '+326', IconTable], ['数据源数', '28', '运行正常', IconDatabase], ['资产数', '36,590', '+8.7%', IconTopologyStar3]];
  return (
    <div className="content-area">
      <div className="metric-grid">{metrics.map(([label, value, delta, MetricIcon]) => <article className="metric-card" key={label}><div className="metric-label"><MetricIcon size={17} /><span>{label}</span></div><div className="metric-value">{value}</div><div className="metric-delta positive">{delta}</div></article>)}</div>
      <div className="section-title-row"><div><h2>{activeTab === '全景大屏' ? '三视图' : activeTab}</h2><p>资产规模、治理状态与业务域分布</p></div><SegmentedControl /></div>
      <div className="dashboard-grid"><Panel title="资产增长趋势" meta="近 30 天"><Chart type="line" seed={Number(page.id)} /></Panel><Panel title="业务域资产分布" meta="共 8 个业务域"><Chart type="bar" seed={Number(page.id) + 7} /></Panel><Panel title="治理健康度" meta="较上月 +3.6"><GaugeScore value={86} /></Panel></div>
      <RecentTable page={page} />
    </div>
  );
}

function DashboardPage({ page }) {
  const seed = Number(page.id);
  const metrics = metricSet(page, seed);
  return <div className="content-area"><div className="metric-grid compact">{metrics.map((metric, index) => { const MetricIcon = PAGE_ICONS[index % PAGE_ICONS.length]; return <article className="metric-card" key={metric.label}><div className="metric-label"><MetricIcon size={17} /><span>{metric.label}</span></div><div className="metric-value">{metric.value}</div><div className={metric.positive ? 'metric-delta positive' : 'metric-delta'}>{metric.delta}</div></article>; })}</div><div className="dashboard-grid two-column"><Panel title={`${page.title}趋势`} meta="过去 7 天"><Chart type="line" seed={seed} /></Panel><Panel title="状态分布" meta="实时"><Chart type="bar" seed={seed + 11} /></Panel></div><RecentTable page={page} /></div>;
}

function ListPage({ page }) {
  return <div className="content-area"><Toolbar title={`${page.title}列表`} /><DataTable page={page} /></div>;
}

function CatalogPage({ page }) {
  const cards = mockCatalog(page);
  return <div className="content-area"><Toolbar title={page.tab || `${page.title}目录`} /><div className="catalog-grid">{cards.map((item, index) => { const CardIcon = PAGE_ICONS[index % PAGE_ICONS.length]; return <article className="catalog-card" key={item.name}><div className="catalog-card-head"><span className="catalog-icon"><CardIcon size={21} /></span><StatusBadge status={item.status} /></div><h3>{item.name}</h3><p>{item.description}</p><div className="catalog-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="catalog-card-foot"><span>{item.owner}</span><button>查看详情 <IconArrowUpRight size={15} /></button></div></article>; })}</div></div>;
}

function GraphPage({ page }) {
  return <div className="content-area graph-layout"><div className="graph-toolbar"><div className="inline-search"><IconSearch size={16} /><input aria-label="搜索节点" placeholder="搜索数据表、字段或业务对象" /></div><button className="secondary-button"><IconFilter size={16} />筛选</button><button className="secondary-button"><IconRefresh size={16} />重置视图</button></div><div className="graph-workspace"><div className="graph-canvas"><Chart type="graph" seed={Number(page.id)} /></div><aside className="graph-inspector"><div className="inspector-head"><span className="page-icon small"><IconDatabase size={18} /></span><div><strong>customer_profile</strong><p>客户主题 · ADS</p></div></div><DescriptionList /><button className="primary-button full">查看资产详情</button></aside></div></div>;
}

function SettingsPage({ page }) {
  const [saved, setSaved] = useState(false);
  return <div className="content-area settings-layout"><aside className="settings-menu">{['基础配置', '运行策略', '权限范围', '告警与审计'].map((item, index) => <button className={index === 0 ? 'active' : ''} key={item}><PageIcon index={index} />{item}<IconChevronRight size={15} /></button>)}</aside><section className="settings-panel"><div className="settings-panel-head"><div><h2>{page.tab || page.title}</h2><p>配置仅用于本地仿真演示，不会提交到任何服务。</p></div><StatusBadge status="已启用" /></div><div className="form-grid"><Field label="显示名称"><input defaultValue={`${page.title}默认配置`} /></Field><Field label="所属业务域"><select defaultValue="客户运营"><option>客户运营</option><option>风险管理</option><option>数据治理</option></select></Field><Field label="责任人"><input defaultValue="数据平台主管" /></Field><Field label="生效范围"><select defaultValue="当前租户"><option>当前租户</option><option>指定业务域</option></select></Field><Field className="span-2" label="说明"><textarea defaultValue="用于演示系统配置页面的字段密度、层级关系和交互状态。" /></Field></div><div className="switch-list"><ToggleRow title="启用自动检查" detail="保存前执行完整性与冲突校验" defaultChecked /><ToggleRow title="记录操作审计" detail="保留配置变更的模拟审计记录" defaultChecked /><ToggleRow title="异常时阻止生效" detail="检测到高风险项时保持当前版本" /></div><div className="form-actions"><button className="secondary-button">取消</button><button className="primary-button" onClick={() => setSaved(true)}><IconCircleCheck size={16} />保存配置</button></div>{saved && <div className="toast success"><IconCircleCheck size={18} /><span>仿真配置已保存到当前浏览器会话</span></div>}</section></div>;
}

function OperationsPage({ page }) {
  const [status, setStatus] = useState('全部状态');
  return <div className="content-area"><div className="operations-summary"><article><span className="summary-icon warning"><IconClock size={20} /></span><div><strong>12</strong><span>待处理</span></div></article><article><span className="summary-icon success"><IconCircleCheck size={20} /></span><div><strong>286</strong><span>本月已完成</span></div></article><article><span className="summary-icon primary"><IconActivity size={20} /></span><div><strong>98.6%</strong><span>按时完成率</span></div></article></div><div className="toolbar"><div><h2>{page.tab || page.title}</h2><p>统一查看任务状态、处理记录和风险提示</p></div><div className="toolbar-actions"><select value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>待处理</option><option>已完成</option><option>已驳回</option></select><button className="secondary-button"><IconDownload size={16} />导出模拟数据</button></div></div><DataTable page={page} statusFilter={status} /></div>;
}

function ChatPage() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: '你好，我是通用智能体。你可以询问数据资产、服务运行或治理状态。' }, { role: 'user', text: '帮我汇总本周数据质量情况。' }, { role: 'assistant', text: '本周共执行 326 条质量规则，整体通过率 96.8%。客户主题域有 3 项异常需要关注。' }]);
  const [draft, setDraft] = useState('');
  const send = () => { if (!draft.trim()) return; setMessages((current) => [...current, { role: 'user', text: draft.trim() }, { role: 'assistant', text: '这是仿真回复：已根据当前页面数据生成分析摘要。' }]); setDraft(''); };
  return <div className="chat-shell"><aside className="thread-list"><button className="primary-button full"><IconPlus size={16} />新建任务</button>{['资产质量周报', 'API 调用趋势分析', '知识库更新检查', '风险事件汇总'].map((item, index) => <button className={index === 0 ? 'thread active' : 'thread'} key={item}><IconMessage size={17} /><span>{item}</span><IconDots size={15} /></button>)}</aside><section className="conversation"><div className="conversation-head"><div><strong>资产质量周报</strong><span>通用智能体 · 仿真会话</span></div><button className="icon-button"><IconDots size={18} /></button></div><div className="messages">{messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}><span className="message-avatar">{message.role === 'assistant' ? <IconSparkles size={17} /> : <IconUsers size={17} />}</span><p>{message.text}</p></div>)}</div><div className="composer"><button aria-label="添加附件"><IconPaperclip size={19} /></button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="输入消息，按 Enter 发送" /><button className="send-button" onClick={send} aria-label="发送"><IconSend size={18} /></button></div></section></div>;
}

function Toolbar({ title }) {
  return <div className="toolbar"><div><h2>{title}</h2><p>共 48 条模拟记录，数据更新于刚刚</p></div><div className="toolbar-actions"><div className="inline-search"><IconSearch size={16} /><input placeholder="搜索名称或负责人" /></div><button className="secondary-button"><IconFilter size={16} />筛选</button><button className="primary-button"><IconPlus size={16} />新建</button></div></div>;
}

function DataTable({ page, statusFilter = '全部状态' }) {
  const rows = mockRows(page).filter((row) => statusFilter === '全部状态' || row.status === statusFilter);
  return <div className="table-card"><table><thead><tr><th><input type="checkbox" aria-label="全选" /></th><th>名称</th><th>类型</th><th>所属业务域</th><th>负责人</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><input type="checkbox" aria-label={`选择 ${row.name}`} /></td><td><div className="table-name"><span className="table-icon"><IconDatabase size={16} /></span><div><strong>{row.name}</strong><small>{row.id}</small></div></div></td><td>{row.kind}</td><td>{row.domain}</td><td>{row.owner}</td><td><StatusBadge status={row.status} /></td><td>{row.updated}</td><td><button className="row-action"><IconEye size={16} />查看</button><button className="more-button" aria-label="更多"><IconDots size={17} /></button></td></tr>)}</tbody></table><div className="pagination"><span>共 {rows.length * 6} 条</span><div><button disabled>上一页</button><button className="active">1</button><button>2</button><button>3</button><button>下一页</button></div></div></div>;
}

function RecentTable({ page }) { return <section className="recent-section"><div className="section-title-row"><div><h2>最近更新</h2><p>当前范围内最近发生变化的对象</p></div><button className="link-button">查看全部 <IconChevronRight size={15} /></button></div><DataTable page={page} /></section>; }
function Panel({ title, meta, children }) { return <section className="panel"><div className="panel-head"><div><h3>{title}</h3><span>{meta}</span></div><button className="more-button" aria-label="更多"><IconDots size={17} /></button></div><div className="panel-body">{children}</div></section>; }

function Chart({ type, seed }) {
  const ref = useRef(null);
  useEffect(() => { if (!ref.current) return undefined; const chart = echarts.init(ref.current, null, { renderer: 'canvas' }); chart.setOption(chartOption(type, seed)); const observer = new ResizeObserver(() => chart.resize()); observer.observe(ref.current); return () => { observer.disconnect(); chart.dispose(); }; }, [type, seed]);
  return <div className={`chart chart-${type}`} ref={ref} aria-label={`${type} 仿真图表`} />;
}

function GaugeScore({ value }) { return <div className="gauge-score"><div className="gauge-ring" style={{ '--score': `${value * 3.6}deg` }}><div><strong>{value}</strong><span>健康分</span></div></div><div className="gauge-legend"><span><i className="dot success" />完整性 92</span><span><i className="dot primary" />规范性 86</span><span><i className="dot warning" />及时性 79</span></div></div>; }
function DescriptionList() { return <dl className="description-list"><div><dt>对象类型</dt><dd>逻辑表</dd></div><div><dt>所属业务域</dt><dd>客户运营</dd></div><div><dt>数据分层</dt><dd>ADS</dd></div><div><dt>字段数量</dt><dd>42</dd></div><div><dt>质量评分</dt><dd><span className="text-success">96.8</span></dd></div><div><dt>最近更新</dt><dd>5 分钟前</dd></div></dl>; }
function SegmentedControl() { const [active, setActive] = useState('30天'); return <div className="segmented">{['7天', '30天', '90天'].map((item) => <button className={active === item ? 'active' : ''} onClick={() => setActive(item)} key={item}>{item}</button>)}</div>; }
function StatusBadge({ status }) { const tone = /正常|已完成|已启用|运行中|已上线|已通过/.test(status) ? 'success' : /异常|已驳回|失败/.test(status) ? 'danger' : /待|审核|处理中/.test(status) ? 'warning' : 'neutral'; return <span className={`status-badge ${tone}`}><i />{status}</span>; }
function Field({ label, className = '', children }) { return <label className={`field ${className}`}><span>{label}</span>{children}</label>; }
function ToggleRow({ title, detail, defaultChecked = false }) { const [checked, setChecked] = useState(defaultChecked); return <button className="toggle-row" onClick={() => setChecked((value) => !value)}><div><strong>{title}</strong><span>{detail}</span></div><span className={checked ? 'toggle checked' : 'toggle'}><i /></span></button>; }
function PageIcon({ index }) { const Icon = PAGE_ICONS[index % PAGE_ICONS.length]; return <Icon size={17} />; }

function CommandPalette({ currentPage, onClose }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => pages.filter((page) => !page.tab && `${page.group} ${page.item} ${page.title}`.toLowerCase().includes(query.toLowerCase())).slice(0, 10), [query]);
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-label="搜索菜单"><button className="modal-backdrop" onClick={onClose} aria-label="关闭搜索" /><div className="command-palette"><div className="command-input"><IconSearch size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索菜单、页面或功能..." /><kbd>ESC</kbd></div><div className="command-results"><small>快速访问</small>{results.map((result) => <a className={result.id === currentPage.id ? 'current' : ''} href={`./${result.filename}`} key={result.id}><span className="command-icon"><IconLayoutGrid size={17} /></span><div><strong>{result.item}</strong><span>{result.group}</span></div><IconChevronRight size={16} /></a>)}</div></div></div>;
}

function pageIcon(type) { return ({ dashboard: IconGauge, graph: IconNetwork, settings: IconAdjustments, operations: IconFileAnalytics, catalog: IconFolders, chat: IconRobot, list: IconListDetails })[type] || IconLayoutGrid; }
function metricSet(page, seed) { const value = (offset, min, max) => min + ((seed * 17 + offset * 29) % (max - min)); return [{ label: '总量', value: value(1, 1200, 9800).toLocaleString('zh-CN'), delta: '+8.4%', positive: true }, { label: '运行中', value: value(2, 86, 560).toLocaleString('zh-CN'), delta: '+12', positive: true }, { label: '待处理', value: value(3, 5, 48).toLocaleString('zh-CN'), delta: '需关注', positive: false }, { label: `${page.title}评分`, value: `${value(4, 82, 99)}.2`, delta: '+2.6', positive: true }]; }
function mockRows(page) { const prefixes = ['客户画像', '订单履约', '经营分析', '风险预警', '产品主数据', '供应链协同', '渠道运营', '财务指标']; const kinds = ['数据表', 'API 服务', '主题模型', '治理任务']; const domains = ['客户运营', '交易履约', '风险管理', '数据治理']; const statuses = ['运行中', '已上线', '待审核', '正常', '已完成', '异常']; return prefixes.map((prefix, index) => ({ id: `SIM-${page.id}-${String(index + 1).padStart(3, '0')}`, name: `${prefix}${page.item.includes(prefix) ? '' : ` · ${page.item}`}`, kind: kinds[index % kinds.length], domain: domains[index % domains.length], owner: ['李明', '陈晓', '周宁', '王晨'][index % 4], status: statuses[(index + Number(page.id)) % statuses.length], updated: index < 2 ? `${index + 3} 分钟前` : `2026-08-${String(31 - index).padStart(2, '0')} 14:20` })); }
function mockCatalog(page) { return ['客户经营洞察', '订单实时监控', '统一身份服务', '风险识别模型', '资产质量助手', '指标口径查询', '知识检索服务', '数据同步 Worker'].map((name, index) => ({ name, description: `${page.item}中的仿真产品，用于展示真实页面的信息层级与组件密度。`, tags: [['API', '客户域'], ['数据流', '实时'], ['MCP', '基础能力'], ['模型', '风控'], ['Agent', '治理'], ['Skill', '指标'], ['知识库', '检索'], ['Worker', '异步']][index], owner: ['数据平台组', '客户运营组', '技术中台组'][index % 3], status: ['已上线', '运行中', '待审核'][index % 3] })); }

function chartOption(type, seed) {
  const primary = '#5b6cf0'; const accent = '#8b5cf6'; const cyan = '#06b6d4'; const values = Array.from({ length: 7 }, (_, index) => 34 + ((seed * 13 + index * 17) % 58)); const commonText = { color: '#8b8fa3', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11 };
  if (type === 'graph') { const names = ['客户主题', 'customer_profile', '订单事实', '会员等级', '渠道维表', '消费偏好', '风险标签', '画像 API']; return { tooltip: { show: true }, series: [{ type: 'graph', layout: 'force', roam: true, force: { repulsion: 260, edgeLength: [90, 150] }, label: { show: true, color: '#555b6e', fontSize: 11 }, data: names.map((name, index) => ({ name, symbolSize: index === 1 ? 62 : 38 + ((index * 7) % 18), itemStyle: { color: [primary, accent, cyan, '#10b981'][index % 4], borderColor: '#fff', borderWidth: 3, shadowBlur: 12, shadowColor: 'rgba(91,108,240,.18)' } })), links: names.slice(1).map((name, index) => ({ source: index % 2 ? 'customer_profile' : '客户主题', target: name, lineStyle: { color: '#c8cbe0', width: 1.5 } })), lineStyle: { curveness: 0.08 }, emphasis: { focus: 'adjacency' } }] }; }
  if (type === 'bar') return { grid: { left: 36, right: 14, top: 22, bottom: 28 }, xAxis: { type: 'category', data: ['客户', '交易', '产品', '渠道', '风险', '财务'], axisLabel: commonText, axisLine: { lineStyle: { color: '#e2e4ee' } }, axisTick: { show: false } }, yAxis: { type: 'value', axisLabel: commonText, splitLine: { lineStyle: { color: '#eef0f6' } } }, series: [{ type: 'bar', data: values.slice(0, 6), barWidth: 18, itemStyle: { color: primary, borderRadius: [5, 5, 0, 0] } }] };
  return { grid: { left: 36, right: 14, top: 22, bottom: 28 }, xAxis: { type: 'category', boundaryGap: false, data: ['08-25', '08-26', '08-27', '08-28', '08-29', '08-30', '08-31'], axisLabel: commonText, axisLine: { lineStyle: { color: '#e2e4ee' } }, axisTick: { show: false } }, yAxis: { type: 'value', axisLabel: commonText, splitLine: { lineStyle: { color: '#eef0f6' } } }, series: [{ type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, data: values, lineStyle: { width: 2.5, color: primary }, itemStyle: { color: '#fff', borderColor: primary, borderWidth: 2 }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(91,108,240,.22)' }, { offset: 1, color: 'rgba(91,108,240,.01)' }] } } }] };
}
