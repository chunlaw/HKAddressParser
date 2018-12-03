import Vue from 'vue'
import './plugins/vuetify'
import './plugins/analytics'
import router from './route'
import App from './App.vue'
import JsonExcel from 'vue-json-excel'

Vue.config.productionTip = false
Vue.component('downloadExcel', JsonExcel)

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
