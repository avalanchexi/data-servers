# AgenticOS 资产中心前端源码包

本包从 Data Agentic OS 前端中导出“资产中心”业务域，保留原项目目录结构，便于直接合并回 React + Vite 项目。

## 包含内容

- `src/pages/home/asset-center/`：资产中心 9 个一级页面及全部页签、测试
- `src/components/asset/`：资产中心专用组件
- `src/components/ui/`：页面实际依赖的项目共享 UI 组件库
- `src/api/`：前端 API 客户端（核心为 `asset.ts`，同时保留关联 API）
- `src/hooks/`、`src/store/`、`src/permission/`：页面依赖的 Hooks、认证状态和读写权限逻辑
- `src/themes/themes.css`、`src/index.css`：主题变量和全局样式
- `src/components/cards/chartTheme.ts`：资产图表依赖的主题适配
- `package.json`、`pnpm-lock.yaml`、TypeScript/Vite 配置：原项目依赖与构建配置
- `API_REQUIREMENTS.md`：需要后端提供的接口域、用途和对接约定，不含后端实现

## 一级页面

| 页面 | 组件 | 页面标识 |
| --- | --- | --- |
| 资产总览 | `overview/OverviewPage.tsx` | `asset-overview` |
| 数据地图 | `map/MapPage.tsx` | `asset-map` |
| 资产目录 | `catalog/CatalogPage.tsx` | `asset-catalog` |
| 数据标准 | `standard/StandardPage.tsx` | `asset-standard` |
| 数据质量 | `quality/QualityPage.tsx` | `asset-quality` |
| 数据安全 | `security/SecurityPage.tsx` | `asset-security` |
| 生命周期 | `lifecycle/LifecyclePage.tsx` | `asset-lifecycle` |
| 数据服务 | `service/ServicePage.tsx` | `asset-service` |
| 治理评估 | `dcmm/DcmmPage.tsx` | `asset-dcmm` |

## 接入要点

1. 将 `src/` 下的目录按原路径合并到目标项目，不要只复制页面文件。
2. 安装 `package.json` 中的依赖，至少需要 React、React Router、Axios、Zustand、Tailwind CSS、Lucide、ECharts、React Markdown 和 Remark GFM。
3. 在应用入口导入 `src/index.css`，主题变量依赖 `src/themes/themes.css`。
4. 路由层按上表懒加载 9 个页面组件；原项目通过页面标识而非 URL 路由选择页面。
5. API 默认沿用原项目的 Axios 客户端与认证拦截器；接入其他系统时，需要调整 `src/api/http.ts` 和接口基地址。
6. 写操作受 `src/permission/writeScope.tsx` 控制，目标系统若没有相同权限模型，需要保留兼容 Provider 或适配该文件。

生产源码可使用 `pnpm exec tsc -p tsconfig.export.json` 做类型检查。测试文件沿用原项目的 Vitest 全局配置，迁移后应接入目标项目的测试初始化文件。

## 原项目环境

- React 19
- TypeScript 5.6
- Vite 5
- Tailwind CSS 4
- pnpm

本包只包含前端源码，不包含资产中心后端接口实现、数据库迁移和运行数据。
