import js from '@eslint/js'
import tseslint from 'typescript-eslint'

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  localStorage: 'readonly',
  URL: 'readonly',
  Blob: 'readonly',
  performance: 'readonly',
  structuredClone: 'readonly',
  HTMLCanvasElement: 'readonly',
  CanvasRenderingContext2D: 'readonly',
  React: 'readonly',
}

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      globals: browserGlobals,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // `interface X extends Omit<Y, 'z'> {}` is a deliberate, readable alias.
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'out/**'] },
)
