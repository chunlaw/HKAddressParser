module.exports = {
  presets: [
    '@vue/app'
  ],
  // To allow commonjs module.exports and require syntax work probably
  // Seems vue-cli 3.0.3 onwards there will be error if not specify this
  // https://github.com/vuejs/vue-cli/issues/2675
  sourceType: 'unambiguous'
}
