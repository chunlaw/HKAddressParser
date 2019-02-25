"use strict";

var _vue = _interopRequireDefault(require("vue"));

var _vueAnalytics = _interopRequireDefault(require("vue-analytics"));

var _route = _interopRequireDefault(require("./../route"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GA_TRACKING_ID = process.env.VUE_APP_GA_TRACKING_ID;

if (GA_TRACKING_ID) {
  _vue.default.use(_vueAnalytics.default, {
    id: process.env.VUE_APP_GA_TRACKING_ID,
    router: _route.default,
    debug: {
      enabled: process.env.VUE_APP_GA_DEBUG || false
    }
  });
}