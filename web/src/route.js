import Vue from 'vue'
import Router from 'vue-router'
import BatchAddressSearcher from './pages/BatchAddressSearcher'

Vue.use(Router)
export default new Router({
  routes: [
    {
      path: '/',
      name: 'search',
      component: BatchAddressSearcher
    }
  ]
})