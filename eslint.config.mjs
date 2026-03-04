import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'SIFTLI/**', '**/SIFTLI/**'],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@next/next/no-assign-module-variable': 'warn',
    },
  },
]

export default config
