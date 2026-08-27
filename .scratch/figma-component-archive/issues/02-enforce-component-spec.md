# 原型设计遵循组件规范

Type: task
Status: resolved

## 请求与范围

用户要求修改 `enterprise-prototype-design`，使设计原型时遵循组件规范。本工单仅调整 Skill 的读取、实现和验收要求，不依赖第 01 工单的组件归档完成，不下载组件、不修改业务文档或生产代码。

## 验收

- 普通 HTML 原型与明确要求的 React 原型均遵循组件规范。
- 组件模式成为设计前必读内容，按实际组件选取对应章节。
- 实现与验收检查组件结构、尺寸、tokens、适用状态和交互；保留离线、桌面、品牌中立及键盘需求边界。
- 来源链接与实际本地资产分开表述，缺少 Figma 导出不阻塞已有规范的使用。
- Skill 结构、引用、代表性行为和独立复核通过；不自动提交其他未提交内容。

## Comments

- 2026-08-27：开始处理；当前入口仅在表单、表格、弹窗或复杂状态时提示读取组件模式，且明确遵循官方组件规范的输出契约仅针对 React，需要覆盖普通 HTML 原型。
- 2026-08-27：修改前独立探针确认，只有页头、按钮、导航和状态标签的简单 HTML 不必读取组件模式；HTML 与 React 的官方规范要求不够对称。
- 2026-08-27：完成入口、组件模式与来源说明的定向调整；简单 HTML 和无本地 Figma 导出两个独立场景探针通过。首次复核发现来源说明中原有“只交付 HTML”与显式 React 例外冲突，已修正为默认 HTML、明确要求时 React。

## 验证证据

- `python -X utf8 <skill-creator>/scripts/quick_validate.py .agents/skills/enterprise-prototype-design`：`Skill is valid!`。
- 11 处本地 Markdown 引用均能解析；普通规则无来源品牌、来源网址或个人路径；CSS tokens 文件仍只有一个。
- `git diff --check -- .agents/skills/enterprise-prototype-design .scratch/figma-component-archive`：通过，仅有 Git 行尾转换提示。
- 既有代表性 HTML（`.tmp/enterprise-prototype-design-skill-prototype-worktree/prototypes/enterprise-prototype-design/data-services-prototype.html`）：品牌、远程依赖与个人路径扫描通过，内联 JavaScript 语法通过。
- 对既有 HTML 的 `validateCreateForm` 执行 4 个函数级用例：空字段、空白名称、缺少业务域、有效输入均通过，并验证字段错误文案与 `aria-invalid`。使用元素测试替身，未验证浏览器渲染或事件绑定。
- 浏览器安全策略阻止了 `file://` 测试页打开；停止该动作并恢复视口，没有使用替代路径绕过。本轮不声称浏览器交互或视觉验收通过。

## Answer

已完成用户要求的 Skill 规则修改：所有原型均先读取组件通用规范，HTML 与 React 共用组件规范及本地 tokens，并在交付前逐组件核对。独立复核修正交付边界冲突后最终为 `PASS`。本轮只修改 3 个正式 Skill 文件并记录本工单；没有修改业务文档、CSS tokens 或原型文件，没有提交 Git。

第 01 工单的 Figma 实际资产归档仍为 `needs-info`，不作为本轮规则修改的完成条件。结构、引用、来源隔离、规则应用与函数级验证已完成；浏览器渲染和交互未在本轮重新验证。
