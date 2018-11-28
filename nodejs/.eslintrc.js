module.exports = {
  "env": {
      "node": true,
      "mocha": true
  },
  "extends": ["airbnb-base", 'eslint:recommended'],
  "rules": {
      'no-restricted-syntax': [
          'error',
          'LabeledStatement',
          'WithStatement',
      ],
      'no-bitwise' : 0,
      'no-await-in-loop' : 0,
      'max-len': 0,
      'no-plusplus' :0,
      'camelcase' :0,
      'no-continue' : 0,
      'comma-dangle': [
          'error',
          'only-multiline',
          {
              "functions": "never"
          }],
      'no-param-reassign': 0,
      // For mocha
      "mocha/no-exclusive-tests": "error",
      // For chai
      "no-unused-expressions": 0,
      "chai-friendly/no-unused-expressions": 2
  },
  "plugins": [
      "import", "mocha", "chai-friendly", "node"
  ],


};