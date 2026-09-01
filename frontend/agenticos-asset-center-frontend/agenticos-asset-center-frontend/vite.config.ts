/// <reference types="vitest" />
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 华为浏览器的部分旧 Chromium 内核不支持 CSS Cascade Layers 和媒体查询
 * 范围语法，会忽略整个 @layer，并让 Tailwind 的 md:/lg: 响应式规则失效。
 *
 * Tailwind 已按 theme → base → components → utilities 的顺序生成规则，展开
 * layer 后仍能保持相同的覆盖顺序，同时兼容不认识 @layer 的浏览器。
 */
const flattenCascadeLayers = {
  postcssPlugin: 'tailwind-legacy-browser-compat',
  Once(root: {
    walkAtRules: (name: string, callback: (rule: {
      nodes?: unknown[]
      params?: string
      remove: () => void
      replaceWith: (...nodes: unknown[]) => void
    }) => void) => void
  }) {
    root.walkAtRules('layer', (rule) => {
      if (!rule.nodes) {
        rule.remove()
        return
      }
      rule.replaceWith(...rule.nodes)
    })
    root.walkAtRules('media', (rule) => {
      if (!rule.params) return
      // Tailwind 4 开发模式输出 `(width >= 64rem)`；旧 Chromium 只支持 min-width。
      rule.params = rule.params.replace(
        /\(width\s*>=\s*([^)]+)\)/g,
        '(min-width: $1)',
      )
    })
  },
}

const __dirname = path.resolve()
const webEnvPath = path.resolve(__dirname, 'web.env')

// 本地企微联调 HTTPS 证书（可选，不影响其他开发者）
const LOCAL_KEY = path.resolve(__dirname, 'localhost-key.pem')
const LOCAL_CERT = path.resolve(__dirname, 'localhost.pem')
const localHttps = fs.existsSync(LOCAL_KEY) && fs.existsSync(LOCAL_CERT)
  ? { key: fs.readFileSync(LOCAL_KEY), cert: fs.readFileSync(LOCAL_CERT) }
  : undefined

if (fs.existsSync(webEnvPath)) {
  const content = fs.readFileSync(webEnvPath, 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').trim()
    process.env[key.trim()] = value
  }
}

export default defineConfig({
  css: {
    postcss: {
      plugins: [flattenCascadeLayers],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['ai.dfjx.com', 'ai.seaboxdata.com', 'office.dfjx.com', 'localhost'],
    ...(localHttps ? { https: localHttps } : {}),
    proxy: {
      '/api': {
        target: 'http://localhost:8643',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        ws: true,
      },
      '/v1': {
        target: 'http://localhost:8643',
        changeOrigin: true,
        secure: false,
      },
      '/wecom': {
        target: 'http://localhost:8643',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        wecom: path.resolve(__dirname, 'wecom.html'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'zustand'],
          'echarts-vendor': ['echarts', 'echarts-for-react'],
          'markdown-vendor': ['react-markdown'],
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          'other-vendor': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
    // e2e 目录为 Playwright spec，需从 vitest 单测中排除
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
