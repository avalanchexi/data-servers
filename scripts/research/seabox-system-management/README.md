# Seabox 系统管理数据明细采集

这是一个低频、单浏览器、顺序执行的 Playwright 采集脚本。它只覆盖“系统管理”模块，重点保存数据明细，而不是重新爬取整站。

## 采集范围

- 8 个二级入口：系统监控、系统配置、权限管理、消息管理、安全合规、风险监管、系统审计、反馈回测。
- 33 个已知页内标签；运行时还会发现并采集新增的可见标签。
- 表格列、可见行、分页信息、筛选条件、表单字段、描述列表、状态值和可见键值对。
- 对完整明细页面，先把分页尺寸调整为页面提供的最大值，再顺序读取；每个页面/标签累计最多保存 300 条数据，下一页禁用、数据重复或达到上限即停止。
- 最多 4 个只读“查看 / 详情 / 预览”入口对应的弹窗、抽屉或详情页。
- 同源 XHR/fetch JSON 响应的脱敏副本，用于补充 DOM 中未渲染的字段、总数和枚举。
- 页面与详情截图、控件结构、图标和主要计算样式。

权限、用户、组织、角色、消息、日志、审计、反馈、事件、预警、处置和任务类页面采用“结构采样”：只保存字段、列名、筛选项、分页信息和最多 3 条脱敏示例；不翻页、不打开行详情、不保存 API 响应正文。其他系统配置类页面继续使用完整明细模式。

不会点击新建、编辑、删除、保存、提交、发布、执行、启停、审批、导入导出等操作。PUT、PATCH、DELETE 和疑似写入语义的 POST 请求会被阻断。表格翻页是唯一的批量读取交互，仍按人工节奏逐页进行。

## 运行

1. 先确保当前网络可以访问内网；不要在脚本或终端中填写账号密码。
2. 在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\research\seabox-system-management\run-capture.ps1
```

3. 脚本会打开可见 Chromium。请在浏览器里手工完成登录。
4. 识别到登录后的“系统管理”页面后，脚本倒计时并自动开始。
5. 完成后查看新的独立目录 `output/playwright/seabox-system-management-detail-audit/<运行时间>/`。

这个路径与此前的 `output/playwright/seabox-system-management/` 分开，不会覆盖或混入上一轮结果。

仅验证配置、不打开浏览器：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\research\seabox-system-management\run-capture.ps1 -DryRun
```

如不希望保存脱敏 API JSON：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\research\seabox-system-management\run-capture.ps1 -NoApiBodies
```

如需降低读取量，可限制为每个状态只读 3 页：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\research\seabox-system-management\run-capture.ps1 -MaxTablePages 3
```

默认最多累计 300 条，也可以进一步降低：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\research\seabox-system-management\run-capture.ps1 -MaxRecords 100
```

## 输出

- `manifest.json`：运行参数、覆盖情况、错误和安全事件。
- `coverage-report.json`：机器可读的页面遗漏与证据完整性检查。
- `coverage-report.md`：人工可读的覆盖结论，标记“完整”或“需要复查”。
- `states/*.json`：每个页面/标签的数据明细。
- `details/*.json`：只读详情弹窗、抽屉或详情页的数据明细。
- `screenshots/*.png`：页面和详情截图。
- `network/network-details.jsonl`：脱敏后的同源 JSON 响应。
- `system-management-data-report.md`：便于人工研究和后续复刻的总报告。

覆盖审计会交叉检查：41 个已知基线状态、当前账号可见的左侧菜单、运行时发现的标签和系统管理路由、空白/加载失败页面、证据文件是否生成，以及分页是否因安全上限而截断。权限未授予而完全不可见的页面无法由浏览器自动推断，报告会明确限定结论为“当前登录账号可见范围”。

输出可能仍包含内部业务信息，因此目录已加入 `.gitignore`，不要直接提交或外发。
