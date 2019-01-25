import Vue from 'vue'
import Router from 'vue-router'
import MapAddressSearcher from './pages/MapAddressSearcher'
import TableAddressSearcher from './pages/TableAddressSearcher'
import About from './pages/About'

Vue.use(Router)
export default new Router({
  routes: [
    {
      path: '/',
      name: 'search_map',
      component: MapAddressSearcher
    },
    {
      path: '/table',
      name: 'search_table',
      component: TableAddressSearcher
    },
    {
      path: '/about',
      name: 'about',
      component: About
    }
  ]
})