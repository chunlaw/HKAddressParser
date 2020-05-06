"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAddress = void 0;

var _address = _interopRequireDefault(require("./address"));

var _ogcioAddress = _interopRequireDefault(require("./ogcio-address"));

var _landAddress = _interopRequireDefault(require("./land-address"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createAddress = function createAddress(type, record) {
  switch (type) {
    case 'ogcio':
      return new _ogcioAddress.default(record);

    case 'land':
      return new _landAddress.default(record);

    default:
      return new _address.default(record);
  }
};

exports.createAddress = createAddress;