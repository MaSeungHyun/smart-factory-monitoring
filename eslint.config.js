import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // r3f: three.js 객체(scene, renderer, 버퍼)는 프레임마다 직접 바꾸는 것이 정상이다
    files: ['src/features/scene/**/*.tsx', 'src/features/boxes/**/*.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
])
