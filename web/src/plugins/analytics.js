import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import router from './../route'

Vue.use(VueAnalytics, {
  id: process.env.VUE_APP_GA_TRACKING_ID || '',
  router,
  debug: {
    enabled: process.env.VUE_APP_GA_DEBUG || false,
  }
})