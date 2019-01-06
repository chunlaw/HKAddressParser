import Vue from 'vue'
import Router from 'vue-router'
import AddressSearcher from './pages/AddressSearcher'
import BatchAddressSearcher from './pages/BatchAddressSearcher'

Vue.use(Router)
export default new Router({
  routes: [
    {
      path: '/',
      name: 'search',
      component: AddressSearcher
    },
    {
      path: '/batch',
      name: 'search_batch',
      component: BatchAddressSearcher
    }
  ]
})