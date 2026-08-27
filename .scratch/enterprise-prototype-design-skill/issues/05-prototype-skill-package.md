# 验证原型设计规范 Skill 的内容组织

Type: prototype
Status: resolved
Parent: ../map.md
Blocked by: 02, 03, 04

## Question

用一个低成本 Skill 粗稿和一份代表性的品牌中立 HTML 原型，验证入口说明、按需参考资料、tokens 或模板之间的路由是否清楚，AI 是否能够在不过度加载上下文的前提下正确应用字体、标题、布局、栅格、组件、交互和可访问性规范，以及多人维护时是否能找到每条规则的唯一位置。

## Answer

原型验证通过，采用“入口只做流程与路由，规则在唯一参考文件中，精确数值只在 tokens 中维护”的内容组织。

### 路由结论

- `SKILL.md` 只包含触发范围、读取顺序、输出契约、硬约束和交付检查。
- `foundations.md` 与 `layout-and-grid.md` 是每次设计必读；文案、组件和页面模式按任务需要读取；`interaction-and-accessibility.md` 在实现交互或交付前读取。
- `provenance.md` 只在维护、核对来源，或任务明确要求 React/Figma 时读取。HTML 仍是默认原型格式；React 原型遵循用户指定的官方规范链接，Figma 社区文件只作为组件视觉与变体参考库。
- `assets/design-tokens.css` 是颜色、字号、间距、圆角、阴影、控件尺寸和桌面布局数值的唯一位置；参考文件只解释何时、为什么使用这些值。
- 来源品牌名称和链接只存在于内部来源说明中，不进入生成界面；生成界面不得包含第三方 Logo、品牌文字、宣传内容、远程资源或个人路径。

### 原型产物

- 隔离分支：`prototype/enterprise-prototype-design`
- 固定提交：`3f576e7572fe790d695af42c593408cf96919827`
- Skill 粗稿：`.agents/skills/enterprise-prototype-design/`
- 代表性页面：`prototypes/enterprise-prototype-design/data-services-prototype.html`

代表性页面是离线自包含的桌面数据服务列表，落实了系统字体栈、单一 `h1`、12 列栅格、1440px 内容基线、24px 页面边距、16px 栅格间距、概览卡、Tabs、筛选、表格、状态标签、分页、空状态、创建弹窗、字段错误、状态消息和减少动效。筛选、重置、分页、Tabs 键盘切换、创建草稿、弹窗焦点环、Esc 关闭和焦点归还均可运行。

### 验证结论

- Skill 结构校验通过，Git whitespace 与内联 JavaScript 语法检查通过。
- 1440×900 视觉检查通过；1280×800 桌面视口没有页面级横向溢出，宽表格仍受自身容器约束。
- 浏览器控制台无错误，网络记录只有本地 HTML，没有远程请求。
- 品牌与路径扫描未在 Skill 入口、普通参考文件或 HTML 中发现第三方品牌词、远程 URL、Logo 引用或个人绝对路径；技术来源只保留在 `provenance.md`。
- 浏览器环境未安装中文字体，因此验证截图中的中文字形回退为方框；目标文件已提供 Windows、macOS 和常见中文 Linux 系统字体栈，不通过远程字体解决该环境问题。

后续正式验证采用三层检查：Skill 包结构校验；品牌词、远程资源、个人路径、关键 tokens 和桌面媒体查询的静态检查；代表性 HTML 的浏览器行为、控制台、键盘焦点和桌面溢出检查。无需引入截图像素对比或移动端测试。

## Comments

- 2026-08-27：用户补充确认，React 场景按 `https://arco.design/docs/spec/link` 执行，`https://www.figma.com/community/file/1053233047330321743/arco-design-system` 作为组件库参考；来源信息不得进入用户界面的品牌展示。
- 2026-08-27：按用户“不询问、采用已确认建议继续”的指示，以静态检查和浏览器行为证据完成原型验收。
