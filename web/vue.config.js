module.exports = {
  // For CI building the static webs on the baseUrl for the repo (HKAddressParser as example)
  publicPath: process.env.BASE_URL === undefined ? '/' : process.env.BASE_URL,
  chainWebpack: (config) => {
    config.module.rules.delete('eslint')
  },
  transpileDependencies: [
    /\bvue-awesome\b/
  ]
}
