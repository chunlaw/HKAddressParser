import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import router from './../route'

const GA_TRACKING_ID = process.env.VUE_APP_GA_TRACKING_ID;

if (GA_TRACKING_ID) {
  Vue.use(VueAnalytics, {
    id: process.env.VUE_APP_GA_TRACKING_ID,
    router,
    debug: {
      enabled: process.env.VUE_APP_GA_DEBUG || false,
    }
  })
}
