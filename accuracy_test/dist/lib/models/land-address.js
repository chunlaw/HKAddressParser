"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _address = _interopRequireDefault(require("./address"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var LandAddress =
/*#__PURE__*/
function (_Address) {
  _inherits(LandAddress, _Address);

  function LandAddress(landRecord) {
    var _this;

    _classCallCheck(this, LandAddress);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(LandAddress).call(this));
    _this.record = landRecord;
    return _this;
  }
  /**
   * Return the detailed components of the parsed address
   * each element should be in form of
   * {
   *    translatedLabel:
   *    key:
   *    translatedValue:
   * }
   */


  _createClass(LandAddress, [{
    key: "components",
    value: function components(lang) {
      if (lang === _address.default.LANG_EN) {
        return [{
          translatedValue: this.record.nameEN,
          key: name,
          translatedLabel: "Name"
        }];
      } else if (lang === _address.default.LANG_ZH) {
        return [{
          translatedValue: this.record.nameZH,
          key: name,
          translatedLabel: "Name"
        }];
      }
    }
  }, {
    key: "fullAddress",
    value: function fullAddress(lang) {
      if (lang === _address.default.LANG_EN) {
        return this.record.addressEN;
      } else if (lang === _address.default.LANG_ZH) {
        return this.record.addressZH;
      }
    }
  }, {
    key: "coordinate",
    value: function coordinate() {
      return {
        lat: this.record.lat,
        lng: this.record.lng
      };
    }
  }, {
    key: "coordinates",
    value: function coordinates() {
      return [{
        lat: this.record.lat,
        lng: this.record.lng
      }];
    } // In the future it can be multiple source

  }, {
    key: "dataSource",
    value: function dataSource() {
      return '地政總署';
    }
    /**
     * Return a normalized confident level from 0 - 10
     */

  }, {
    key: "confidence",
    value: function confidence() {
      return 0;
    }
  }]);

  return LandAddress;
}(_address.default);

exports.default = LandAddress;
_address.default.LANG_EN = 'eng';
_address.default.LANG_ZH = 'chi';