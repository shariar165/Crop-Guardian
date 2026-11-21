import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // An expression-bodied effect returns its value, and React calls that as the cleanup.
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.name=/^use(Layout|Insertion)?Effect$/] > ArrowFunctionExpression[body.type!='BlockStatement']",
        message: 'Give effects a block body: an implicit return becomes the cleanup.',
      }],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig
