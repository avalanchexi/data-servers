# 保存设计组件并接入原型 Skill

Type: task
Status: needs-info

## 任务

按 [规格](../spec.md) 归档指定 Figma 文件的实际组件资源，验证后接入项目 Skill。

## 基线

2026-08-27 独立只读检索：现有 Skill 共 9 个文件（8 个 Markdown、1 个 CSS）；只有组件行为规范与源码提炼 tokens，没有 Figma 变体记录、SVG 资产或组件节点 ID。

## Comments

- 2026-08-27：Figma `get_metadata` 成功返回 13 个顶层页面，包括基础样式及 Button、Icon、Typography、Divider、Layout、Image、Tag、Tooltip、Message、Breadcrumb、PageHeader。
- 2026-08-27：只读 `JSON_REST_V1` 导出尝试返回 `JSON_REST_V1 export format is not supported in this context`；尚未产生组件文件。
- 2026-08-27：下一次导出调用返回 Starter 计划 MCP 调用额度耗尽；`whoami` 确认当前连接为 Starter / Full。停止重复调用导出接口，检查网页的官方 `File > Save local copy` 功能。
- 2026-08-27：浏览器找到了用户已打开的同一文件；页面 DOM 读取超时，按浏览器恢复指引重连后可见 DOM 读取仍超时。停止浏览器操作，没有修改设计或触发下载。

## 当前结果与恢复条件

尚未保存任何组件，现有 Skill 未修改。需要用户通过 Figma 主菜单 `File > Save local copy` 下载 `.fig` 并提供项目内路径，或提供已授权导出的组件 SVG/JSON 包；收到后先检查实际可读取内容，再继续归档与接入。`.fig` 是源文件备份，不能单凭其存在宣称 AI 可直接复用全部组件。

官方导出说明：<https://help.figma.com/hc/en-us/articles/8403626871063-Save-a-local-copy-of-files>。文件所有者禁止复制或导出时停止，不绕过限制。

## 已读取的页面目录

以下仅为 MCP 返回的页面元数据，不是组件或变体清单。

| 页面 | 页面 ID |
| --- | --- |
| Arco | 8253:44145 |
| 基础样式 | 0:1 |
| Button 按钮 | 115962:128337 |
| Icon 图标 | 8096:45435 |
| Typography 排版 | 115963:125903 |
| Divider 分割线 | 115964:125905 |
| Layout 布局 | 115964:125907 |
| Image 图片 | 115964:125917 |
| Tag 标签 | 115965:125923 |
| Tooltip 文字气泡 | 115965:125925 |
| Message 全局提示 | 115965:125949 |
| Breadcrumb 面包屑 | 115965:125946 |
| PageHeader 页头 | 115965:125958 |
