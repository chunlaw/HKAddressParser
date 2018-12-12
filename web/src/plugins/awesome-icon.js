import Vue from 'vue'

/* Pick one way between the 2 following ways */

// only import the icons you use to reduce bundle size
import 'vue-awesome/icons'
// import 'vue-awesome/icons/circle'

import Icon from 'vue-awesome/components/Icon'
Vue.component('v-awicon', Icon);

