import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    {
        ignores: [
            'dist',
            'node_modules',
            'src-tauri/target',
            'src-tauri/gen',
            'playwright-report',
            'test-results',
            'coverage',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            'react-refresh': reactRefresh,
        },
        rules: {
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        files: ['src/templates/**/*.tsx'],
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
    {
        files: ['scripts/**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    }
)
