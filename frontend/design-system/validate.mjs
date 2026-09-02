import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const root = resolve(process.cwd(), 'frontend/design-system')
const requiredFiles = [
  'README.md',
  'tokens.css',
  'foundations.md',
  'components.md',
  'patterns.md',
  'migration.md',
  'ai-guide.md',
  'evidence-index.md',
  'example.html',
]

const failures = []

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) failures.push(`missing ${file}`)
}

if (failures.length === 0) {
  const tokensSource = readFileSync(resolve(root, 'tokens.css'), 'utf8')
  const exampleSource = readFileSync(resolve(root, 'example.html'), 'utf8')
  const migrationSource = readFileSync(resolve(root, 'migration.md'), 'utf8')
  const aiGuideSource = readFileSync(resolve(root, 'ai-guide.md'), 'utf8')
  const skillSource = readFileSync(resolve(process.cwd(), '.agents/skills/agenticos-design-system/SKILL.md'), 'utf8')
  const tokenNames = [...tokensSource.matchAll(/^\s*(--[a-z0-9-]+):/gim)].map((match) => match[1])
  const tokenSet = new Set(tokenNames)
  const requiredTokens = [
    '--font-sans',
    '--color-bg',
    '--color-card',
    '--color-primary',
    '--color-text',
    '--color-border',
    '--space-5',
    '--radius-xl',
    '--shell-topbar-height',
    '--shell-sidebar-width',
    '--shell-page-inset',
  ]

  for (const token of requiredTokens) {
    if (!tokenSet.has(token)) failures.push(`missing required token ${token}`)
  }

  for (const token of tokenSet) {
    if (tokenNames.filter((name) => name === token).length > 1) failures.push(`duplicate token ${token}`)
  }

  const exampleReferences = [...exampleSource.matchAll(/var\((--[a-z0-9-]+)(?:,\s*[^)]+)?\)/gim)].map((match) => match[1])
  for (const token of new Set(exampleReferences)) {
    if (!tokenSet.has(token)) failures.push(`example references undefined token ${token}`)
  }

  const implementationRoot = resolve(
    process.cwd(),
    'frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src'
  )

  if (existsSync(implementationRoot)) {
    const collectFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) return collectFiles(path)
      return /\.(css|ts|tsx)$/.test(entry.name) ? [path] : []
    })

    for (const file of collectFiles(implementationRoot)) {
      const source = readFileSync(file, 'utf8')
      const references = [...source.matchAll(/var\((--[a-z0-9-]+)(?:,\s*[^)]+)?\)/gim)].map((match) => match[1])
      for (const token of new Set(references)) {
        if (!tokenSet.has(token)) {
          failures.push(`reference source uses undefined canonical token ${token}`)
        }
      }
    }
  }

  if (!exampleSource.includes('tokens.css')) failures.push('example does not link tokens.css')
  if (!exampleSource.includes('role="tabpanel"')) failures.push('example tabs do not expose tabpanel semantics')
  for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
    if (!exampleSource.includes(`event.key === '${key}'`)) failures.push(`example tabs do not handle ${key}`)
  }
  if (exampleSource.includes('--ds-')) failures.push('example depends on retired --ds-* tokens')
  if (/#[0-9a-f]{3,8}\b/i.test(exampleSource)) failures.push('example contains a page-local hex color')
  if (skillSource.includes('[TODO')) failures.push('skill contains unfinished scaffold text')
  if (!skillSource.includes('frontend/design-system')) failures.push('skill does not point to the canonical design system')
  if (!skillSource.includes('evidence-index.md')) failures.push('skill does not point to the evidence index')
  if (!skillSource.includes('migration.md')) failures.push('skill does not route migration tasks')
  if (!aiGuideSource.includes('./migration.md')) failures.push('AI guide does not route to the migration process')
  for (const gate of ['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4']) {
    if (!migrationSource.includes(gate)) failures.push('migration process is missing ' + gate)
  }
}

if (failures.length > 0) {
  console.error('AgenticOS design system validation failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('AgenticOS design system validation passed.')
