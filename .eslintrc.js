module.exports = {
  "extends": "airbnb-base",
  "rules": {
    "indent": ["error", 2, { "SwitchCase": 1 }],
    'no-restricted-syntax': [
      'error',
      'LabeledStatement',
      'WithStatement',
    ],
    'no-bitwise': 0,
    'no-await-in-loop': 0,
    'max-len': 0,
    'no-plusplus': 0,
    'camelcase': 0,
    'no-continue': 0,
    'no-underscore-dangle': 0,
    'comma-dangle': [
      'error',
      'only-multiline',
      {
        "functions": "never"
      }],
    'no-param-reassign': 0,
    "no-unused-expressions": 0,
    "chai-friendly/no-unused-expressions": 2
  },
  "plugins": [
    "import", "chai-friendly", "mocha"
  ],
  "env": {
    "node": true,
    "mocha": true
  }
};