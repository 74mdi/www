import { execSync } from 'node:child_process'

// OpenNext's bundling stage is not reliable on native Windows.
if (process.platform === 'win32') {
  console.log('[postbuild] Skipping OpenNext build on Windows.')
  process.exit(0)
}

console.log('[postbuild] Building OpenNext bundle (skip Next.js rebuild)...')
execSync('pnpm opennextjs-cloudflare build --skipNextBuild', {
  stdio: 'inherit',
})
