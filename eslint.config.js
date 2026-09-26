// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

const NON_DETERMINISTIC_MESSAGE =
  'packages/rules phải thuần và tất định (PLAN.md mục 6.1): không dùng nguồn ngẫu nhiên hoặc đồng hồ hệ thống. RNG luôn nhận từ seed.';

export default defineConfig([
  globalIgnores(['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/release/**']),

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Bot và GameSession (M4): cũng phải tất định (PLAN 9.1: "tất định theo seed" để replay tái hiện được; 6.1: một
  // GameSession chạy ở Worker lẫn server). Thời gian chỉ đi qua `Clock` được tiêm vào; ngẫu nhiên chỉ qua RNG có seed.
  {
    files: ['packages/bot/src/**/*.ts', 'packages/protocol/src/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: NON_DETERMINISTIC_MESSAGE },
        { object: 'Date', property: 'now', message: NON_DETERMINISTIC_MESSAGE },
        { object: 'performance', property: 'now', message: NON_DETERMINISTIC_MESSAGE },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'localStorage', 'fetch', 'WebSocket', 'setTimeout', 'setInterval', 'requestAnimationFrame'].map((name) => ({
          name,
          message: 'bot/GameSession không chạm DOM, mạng hay timer toàn cục; thời gian đi qua Clock được tiêm vào (PLAN 6.1).',
        })),
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: NON_DETERMINISTIC_MESSAGE },
        { selector: "CallExpression[callee.name='Date']", message: NON_DETERMINISTIC_MESSAGE },
      ],
    },
  },

  // Engine luật: thuần, tất định, không DOM / mạng / đồng hồ hệ thống / Math.random.
  {
    files: ['packages/rules/src/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: NON_DETERMINISTIC_MESSAGE },
        { object: 'Date', property: 'now', message: NON_DETERMINISTIC_MESSAGE },
        { object: 'performance', property: 'now', message: NON_DETERMINISTIC_MESSAGE },
        { object: 'crypto', property: 'getRandomValues', message: NON_DETERMINISTIC_MESSAGE },
        { object: 'crypto', property: 'randomUUID', message: NON_DETERMINISTIC_MESSAGE },
      ],
      'no-restricted-globals': [
        'error',
        ...[
          'window',
          'document',
          'navigator',
          'localStorage',
          'sessionStorage',
          'fetch',
          'WebSocket',
          'XMLHttpRequest',
          'process',
          'require',
          'Buffer',
          'setTimeout',
          'setInterval',
          'requestAnimationFrame',
        ].map((name) => ({
          name,
          message: 'packages/rules không được chạm DOM, mạng, timer hay môi trường Node (PLAN.md mục 6.1).',
        })),
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: NON_DETERMINISTIC_MESSAGE },
        { selector: "CallExpression[callee.name='Date']", message: NON_DETERMINISTIC_MESSAGE },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', 'fs', 'path', 'http', 'https', 'net', 'crypto', 'os', 'ws', 'three', 'electron'],
              message: 'packages/rules không được import module Node, mạng, đồ họa hay Electron.',
            },
            {
              group: ['@hexwar/*'],
              message: 'packages/rules là tầng thấp nhất, không phụ thuộc package khác trong repo.',
            },
          ],
        },
      ],
    },
  },
]);
