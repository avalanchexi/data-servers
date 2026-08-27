# 验证 Skill 行为与品牌安全

Type: task
Status: resolved
Parent: ../map.md
Blocked by: 06

## Question

验证原型设计规范 Skill 的结构、自动触发、显式调用、参考资料路由和代表性 HTML 输出；检查字体、标题、布局、栅格、组件状态、响应式、键盘操作与可访问性规则是否实际生效，并扫描生成示例和原型，确保不存在第三方 Logo、品牌名称、品牌宣传文字、个人绝对路径或未批准的源文件。

## Answer

最终仓库 Skill 通过结构、路由、品牌安全、静态输出和桌面浏览器行为验证；验证中发现的三个规则一致性问题已修正。

### 发现与调用

- 当前仓库 Skill 已出现在会话可用 Skill 清单中，来源为 `.agents/skills/enterprise-prototype-design/SKILL.md`，说明仓库级自动发现生效。
- frontmatter `name` 为稳定名称 `enterprise-prototype-design`，model-facing `description` 覆盖桌面 Web HTML 原型和明确要求的 React 原型，并排除生产前端、组件库开发与普通文档。
- 未设置 `disable-model-invocation` 或显式调用限制，因此保留自动触发和 `$enterprise-prototype-design` 显式调用；`AGENTS.md` 同时提供简短项目入口。

### 结构与路由

- `quick_validate.py` 返回 `Skill is valid!`。
- 文件闭包严格为一个 `SKILL.md`、一个 `assets/design-tokens.css`、六份设计规则和一份内部来源说明，共 9 个文件；没有软链接、README、示例、脚本、构建依赖或 `openai.yaml`。
- `SKILL.md` 中所有按需链接均可解析；所有 reference 使用的 `--ds-*` 均在 `design-tokens.css` 中声明。
- 普通 reference 已改为引用语义 tokens，不再维护第二份字号、圆角、动效、控件和布局数值表；`--ds-desktop-min` 补入 tokens，桌面下限也只有一个机器事实来源。

### 品牌与来源隔离

- 代表性 HTML 未发现字节、火山、ByteDance、Volcengine、Arco、Figma、Logo、图片或 SVG 引用、远程 URL、emoji、Windows/WSL 个人路径。
- Skill 普通入口与设计规则未引入个人路径或被排除的源目录；第三方仓库名、固定提交和用户指定链接只保留在 `references/provenance.md`。
- Skill 目录没有复制 React 组件、UI Kit、展示站、源 README、依赖锁文件或个人桌面目录。

### 设计与浏览器行为

- 修正三个未纳入 tokens 的状态前景色：success、warning、danger 分别达到 `5.22:1`、`5.37:1`、`4.76:1` 对比度；代表性 HTML 不再包含 tokens 之外的十六进制颜色。
- HTML 使用单一 `h1`，正文/模块/页面标题分别计算为 14/16/24px；顶部导航 60px、侧栏 220px、页面边距 24px、12 栏栅格均按 tokens 生效。
- 1440×900、1280×800 和 1200×800 桌面视口均无页面级横向溢出；控制台无错误，网络记录只有本地 HTML。
- Tabs、筛选、空状态、重置、分页、弹窗校验、创建草稿和状态消息均可操作。原型已保留额外键盘行为，但按用户最新要求，完整 Tab 顺序、焦点陷阱、焦点归还和纯键盘走查不再是默认验收项。
- 移除了输入控件覆盖全局焦点轮廓的 `outline: none`；当前焦点轮廓计算为 2px solid primary。该基础反馈保留，但不扩大为强制的完整键盘流程。
- `prefers-reduced-motion` 是唯一媒体查询；未加入移动端、平板或触控适配。

修正后的原型证据位于隔离分支 `prototype/enterprise-prototype-design`，固定提交为 `ec017d67e8410bc48a9b8ca244e6e754b43a49a5`。第 08 工单可以据此进行多人协作就绪确认。

## Comments

- 2026-08-27：开始验证最终仓库 Skill；验证对象包括仓库发现与调用入口、文件与引用边界、固定原型提交 `3f576e7` 的离线 HTML，以及品牌与个人路径隔离。
- 2026-08-27：用户将优先级调整为原型设计质量优先；完整 Tab 顺序、焦点陷阱、焦点归还和纯键盘路径不再属于默认验收，只保留基础语义、可见焦点和控件关联。
- 2026-08-27：验证修正了状态前景色游离于 tokens、reference 维护第二份精确数值、输入焦点轮廓被局部样式覆盖三个问题；修正后静态与浏览器检查均通过。
