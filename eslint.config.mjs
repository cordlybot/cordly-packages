// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

/**
 * Rules that hold the package boundary, expressed as lint rather than review.
 *
 * The three restricted-import rules below are the load-bearing ones: they are
 * what stops a shared package quietly acquiring the application's problems. A
 * widget that can reach a router is a widget that will eventually name a route,
 * and at that point it is no longer shareable — but nothing about the code will
 * look wrong in a diff.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'artifacts/**',
      'out-tsc/**',
      'coverage/**',
      'node_modules/**',
      'packages/tokens/generated/**',
      'fixtures/**',
      'compat/**',
      // The consumer projects and the browser gates each carry their own
      // dependencies and their own lockfile. Type-aware lint here would need
      // their packages installed into this project, which is the coupling they
      // exist to avoid.
      'e2e/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Angular components are classes by requirement, and several here carry
      // only a selector, a template, and a stylesheet. That is the framework's
      // shape, not a misuse of a class.
      '@typescript-eslint/no-extraneous-class': 'off',
      // `noPropertyAccessFromIndexSignature` is on in tsconfig.json, which
      // *requires* bracket access on an index signature. The two rules
      // contradict each other, and the compiler option is the one that catches a
      // real class of typo.
      '@typescript-eslint/dot-notation': 'off',
      // A number in a template literal is exactly what a diagnostic message
      // wants; `String(n)` around every count reads worse and says less.
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
    },
  },
  {
    // Everything in a package must be reachable from its own public API and
    // must not reach sideways. `@cordly/widgets` may depend on `@cordly/ui`;
    // nothing may depend on an application.
    files: ['packages/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@angular/router', '@angular/router/*'],
              message:
                'Shared packages never resolve a destination. Take an href or emit an event and let the application route.',
            },
            {
              group: ['@angular/common/http', '@angular/common/http/*'],
              message:
                'Shared packages hold no API client. Take a resolved view model as an input.',
            },
            {
              group: ['@ngrx/*', '**/store/*', '**/*.store'],
              message:
                'Shared packages hold no application state. State belongs to the application that owns the domain it describes.',
            },
            {
              group: ['../../../*', '../../../../*'],
              message:
                'A package must not reach outside its own source tree. Depend on a published package instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // Test code legitimately does things production code must not.
    //
    // The two relaxations worth explaining: a spec narrows a `querySelector`
    // result with a cast and then reads it defensively, which the
    // non-nullish rules read as redundant — they are right about the type and
    // wrong about the intent, because the cast is the assumption under test.
    files: ['**/*.spec.ts', 'packages/*/src/testing/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // Accessibility findings are release blockers here, not advice: these are
      // the primitives every Cordly surface is built from, so a warning left in
      // one of them is a warning multiplied by every page that uses it.
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/valid-aria': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
  {
    files: ['tools/**/*.mjs', 'packages/tokens/**/*.mjs'],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
