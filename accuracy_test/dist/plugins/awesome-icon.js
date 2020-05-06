"use strict";

var _vue = _interopRequireDefault(require("vue"));

require("vue-awesome/icons");

var _Icon = _interopRequireDefault(require("vue-awesome/components/Icon"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* Pick one way between the 2 following ways */
// only import the icons you use to reduce bundle size
// import 'vue-awesome/icons/circle'
_vue.default.component('v-awicon', _Icon.default);