# 清点原型设计规范 Skill 的最小来源闭包

Type: research
Status: resolved
Parent: ../map.md
Blocked by: none

## Question

只读审计 `/mnt/c/Users/何峰/Desktop/Design system`，确定一个面向 AI HTML 原型设计的仓库级 Skill 最少需要吸收哪些规则、参考资料、tokens 或模板；区分必须复制、应提炼重写、仅在特定场景需要和应完全排除的内容，并列出示例、Logo、文案和代码中的第三方品牌风险。研究结果写入 `docs/research/enterprise-prototype-design-skill-source-audit.md`，所有判断指向一手源文件。

## Answer

现有设计系统的 `SKILL.md` 不能单独复制：其直接读取闭包包含 `readme.md`、`styles.css` 与 tokens、组件 catalog 与 23 份组件 prompt、React UI Kit 以及来源说明，继续沿依赖会把 React、特定组件库和 Vite 构建环境带入当前仓库，不符合“指导 AI 生成 HTML 原型”的目标。

采用“品牌中立、HTML-first、渐进披露”的最小闭包：重新编写入口 `SKILL.md`，把字体与视觉基础、内容、布局与栅格、组件模式、页面模式、交互与可访问性提炼为按需 references；只有内容边界确认需要机器直接复用时，才加入经过去品牌命名的 CSS tokens。完整组件实现、React UI Kit、展示站点、构建依赖、审计材料、上游快照和 Logo 全部排除。

候选源文件中未发现字节、火山、ByteDance 或 Volcengine 等文字，但第三方设计系统名称广泛存在于现有入口和说明中；登录页、导航、HTML title/meta 与 `assets/logo.svg` 还直接展示品牌，因此只能提炼其信息架构和规则，不能复制品牌展示。

完整报告保存在研究分支 `research/enterprise-prototype-skill-source-audit` 的提交 `3b9311bf18d299d9acce227cefb1418eae0f0749`，路径为 `docs/research/enterprise-prototype-design-skill-source-audit.md`。

## Comments

- 2026-08-27：研究在隔离 worktree 中完成，主工作树未切换分支；一次性提交使用临时作者身份，没有修改 Git 用户配置。
