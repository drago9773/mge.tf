import globals from 'globals';
import pluginJs from '@eslint/js';


export default [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  {
    rules: {
      'space-before-function-paren': ['error', {
        'anonymous': 'never',
        'named': 'never',
        'asyncArrow': 'always'
      }],
      'quotes': ['error', 'single', { 'avoidEscape': true }],
    },
  },
];