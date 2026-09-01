import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import noUnsanitized from 'eslint-plugin-no-unsanitized'
import { writeguardPlugin } from './eslint-rules/writeguard.mjs'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'no-unsanitized': noUnsanitized,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // XSS 门禁：禁止 innerHTML/outerHTML/insertAdjacentHTML 等非安全 sink 写入动态内容
      // （富文本解析用 DOMParser、动态字段拼 HTML 用 utils/escapeHtml 转义）
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      // 原生弹窗门禁：禁止 alert/confirm/prompt（含 window.* 形式），统一使用 ui 组件 Message/ConfirmDialog
      'no-alert': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // 存量 300+ 处属类型风格问题，warn 保留可见性不阻断 CI（新代码应避免）
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // G2：读写分离反转门禁——禁止遗留标记 data-w / perm="write"（存量已清零，直接 error）
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { writeguard: writeguardPlugin },
    rules: {
      'writeguard/no-legacy-markers': 'error',
    },
  }
)
