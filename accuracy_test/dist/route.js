"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _vue = _interopRequireDefault(require("vue"));

var _vueRouter = _interopRequireDefault(require("vue-router"));

var _MapAddressSearcher = _interopRequireDefault(require("./pages/MapAddressSearcher"));

var _TableAddressSearcher = _interopRequireDefault(require("./pages/TableAddressSearcher"));

var _About = _interopRequireDefault(require("./pages/About"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_vue.default.use(_vueRouter.default);

var _default = new _vueRouter.default({
  routes: [{
    path: '/',
    name: 'search_map',
    component: _MapAddressSearcher.default
  }, {
    path: '/table',
    name: 'search_table',
    component: _TableAddressSearcher.default
  }, {
    path: '/about',
    name: 'about',
    component: _About.default
  }]
});

exports.default = _default;