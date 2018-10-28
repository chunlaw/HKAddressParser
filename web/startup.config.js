module.exports = {
  apps: [
    {
      name: 'HKAdressParser',
      script: './node_modules/http-server/bin/http-server',
      args: 'dist -p3000',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
