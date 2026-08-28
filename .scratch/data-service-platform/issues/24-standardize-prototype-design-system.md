# 标准化三份核心原型的设计系统

Type: task
Status: resolved
Parent: ../map.md
Blocked by: 23

## Question

如何在不改变既有业务范围和主要交互的前提下，使 `ai-service-development.html`、`runtime-management.html` 和 `settings-page-prototype.html` 在设计令牌、产品壳层、页面头部、导航层级、状态标签、按钮、表格、弹窗、抽屉与反馈组件上遵循仓库统一的企业原型设计系统？

## Answer

已完成三份原型的设计系统标准化：

1. `ai-service-development.html`、`runtime-management.html` 与 `settings-page-prototype.html` 均完整内联 `.agents/skills/enterprise-prototype-design/assets/design-tokens.css` 的 107 项规范令牌，不覆盖值、不建立平行色板。
2. 产品壳层统一为“数据服务平台／数据服务域”，统一 60px 顶栏、220px 侧栏、产品符号、角色区、页面面包屑、标题与说明层级；角色和当前模块按页面职责保留差异。
3. 页面头部统一底部对齐和 24px 页面边距；按钮、状态标签、表格密度、抽屉宽度、弹窗圆角、关闭按钮和 Toast 位置使用同一组件规格。
4. AI 服务开发页进一步统一摘要卡密度、二级导航活动标记、状态标签和浮层反馈；Grill Me Harness 切换器仍作为原型比较工具保留，不计入产品组件。
5. 运行管理和设置保留既有业务布局与交互，只标准化壳层名称、浮层和反馈样式；运行管理抽屉改为与另外两页一致的无位移动画呈现，避免形成不同的浮层规范。
6. 新增 [`prototypes/tests/prototype-design-system.test.cjs`](../../../prototypes/tests/prototype-design-system.test.cjs)，持续校验完整令牌、共享壳层、页面层级、核心组件规格、零硬编码产品色、零远程依赖和品牌中立。

验收结果：44 项 Node 测试全部通过；在真实 Chromium 的 1200px 与 1440px 有效视口下，三份原型的页面和工作区均无横向溢出。AI 方案 A／B／C、Agent 专属编辑器、数据应用页、创建服务弹窗、运行管理策略抽屉和设置编辑抽屉均已渲染或触发验证。

## Comments

- 2026-08-27：已认领。当前审计确认三份原型的颜色与尺寸令牌大体一致，但产品域名称、组件规格和浮层反馈仍存在分叉；本轮将建立可自动检查的共享基线并完成 1440×900、1200×900 浏览器验收。
- 2026-08-27：标准化完成。设计系统 Skill 直接决定了令牌完整性、品牌中立、桌面壳层、组件尺寸、局部溢出与验证口径；未改变三份原型的业务范围和核心状态语义。
