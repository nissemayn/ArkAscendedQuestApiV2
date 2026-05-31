import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()
const distDir = join(projectRoot, 'dist')
const contentSrc = join(projectRoot, 'content')
const contentDest = join(distDir, 'content')
const exampleConfigSrc = join(projectRoot, 'example.config.json')
const exampleConfigDest = join(distDir, 'example.config.json')
const startBatPath = join(distDir, 'start.bat')

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

if (existsSync(contentSrc)) {
  cpSync(contentSrc, contentDest, { recursive: true })
  console.log('Copied content/ → dist/content/')
} else {
  console.warn('Warning: content/ directory not found, skipping copy.')
}

cpSync(exampleConfigSrc, exampleConfigDest)
console.log('Copied example.config.json → dist/example.config.json')

const startBatContent = [
  '@echo off',
  'title Ark Ascended Quest API',
  'if not exist "config.json" (',
  '  echo Missing config.json',
  '  echo Copy example.config.json to config.json and configure it.',
  '  pause',
  '  exit /b 1',
  ')',
  'node src\\index.js',
  'pause'
].join('\r\n') + '\r\n'

writeFileSync(startBatPath, startBatContent, 'utf8')
console.log('Created start.bat in project root')

console.log('Build complete. To deploy:')
console.log('  1. Copy dist/ to your server')
console.log('  2. Copy dist/example.config.json → dist/config.json and fill in your values')
console.log('  3. Run: node src/index.js  (from inside dist/)')
