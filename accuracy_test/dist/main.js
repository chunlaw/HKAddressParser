"use strict";

var _vue = _interopRequireDefault(require("vue"));

require("./plugins/vuetify");

require("./plugins/analytics");

require("./plugins/awesome-icon");

var _route = _interopRequireDefault(require("./route"));

var _App = _interopRequireDefault(require("./App.vue"));

var _vueJsonExcel = _interopRequireDefault(require("vue-json-excel"));

var _vuelayers = _interopRequireDefault(require("vuelayers"));

require("vuelayers/lib/style.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_vue.default.config.productionTip = false;

_vue.default.component('downloadExcel', _vueJsonExcel.default);

_vue.default.use(_vuelayers.default);

new _vue.default({
  render: function render(h) {
    return h(_App.default);
  },
  router: _route.default
}).$mount('#app');