"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _address = _interopRequireDefault(require("./address"));

var _ogcioHelper = _interopRequireDefault(require("../../utils/ogcio-helper.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var OGCIOAddress =
/*#__PURE__*/
function (_Address) {
  _inherits(OGCIOAddress, _Address);

  function OGCIOAddress(ogcioRecord) {
    var _this;

    _classCallCheck(this, OGCIOAddress);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(OGCIOAddress).call(this));
    _this.record = ogcioRecord;
    _this.flattenedComponents = null;
    return _this;
  }

  _createClass(OGCIOAddress, [{
    key: "components",
    value: function components(lang) {
      if (this.flattenedComponents === null) {
        this.flattenedComponents = this.flattenComponents();
      }

      if (lang === _address.default.LANG_EN) {
        return this.flattenedComponents['eng'];
      } else {
        return this.flattenedComponents['chi'];
      }
    }
  }, {
    key: "flattenComponents",
    value: function flattenComponents() {
      var _flattenedComponents;

      var flattenedComponents = (_flattenedComponents = {}, _defineProperty(_flattenedComponents, _address.default.LANG_EN, []), _defineProperty(_flattenedComponents, _address.default.LANG_ZH, []), _flattenedComponents);
      var langs = [_address.default.LANG_ZH, _address.default.LANG_EN];

      for (var _i = 0; _i < langs.length; _i++) {
        var lang = langs[_i];

        var _arr = Object.keys(this.record[lang]);

        for (var _i2 = 0; _i2 < _arr.length; _i2++) {
          var _key = _arr[_i2];
          flattenedComponents[lang].push({
            key: _key,
            translatedLabel: _ogcioHelper.default.textForKey(_key, lang),
            translatedValue: _ogcioHelper.default.textForValue(this.record, _key, lang)
          });
        }
      }

      return flattenedComponents;
    }
  }, {
    key: "fullAddress",
    value: function fullAddress(lang) {
      if (lang === _address.default.LANG_EN) {
        return _ogcioHelper.default.fullEnglishAddressFromResult(this.record['eng']);
      } else {
        return _ogcioHelper.default.fullChineseAddressFromResult(this.record['chi']);
      }
    }
  }, {
    key: "coordinate",
    value: function coordinate() {
      var geo = {
        lat: 0,
        lng: 0
      };

      if (this.record.geo !== undefined && this.record.geo.length > 0) {
        geo.lat = this.record.geo[0].Latitude;
        geo.lng = this.record.geo[0].Longitude;
      }

      return geo;
    }
  }, {
    key: "coordinates",
    value: function coordinates() {
      if (this.record.geo !== undefined && this.record.geo.length > 0) {
        return this.record.geo.map(function (geo) {
          return {
            lat: geo.Latitude,
            lng: geo.Longitude
          };
        });
      }

      return [];
    } // In the future it can be multiple source

  }, {
    key: "dataSource",
    value: function dataSource() {
      return '資科辦';
    }
  }, {
    key: "confidence",
    value: function confidence() {
      return Math.min(4, this.record.matches.filter(function (match) {
        return match.matchedKey === key;
      }).map(function (match) {
        return match.confident;
      }).reduce(function (p, c) {
        return c;
      }, 0) * 5 | 0);
    }
  }]);

  return OGCIOAddress;
}(_address.default);

exports.default = OGCIOAddress;