"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var turf = _interopRequireWildcard(require("@turf/turf"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Address =
/*#__PURE__*/
function () {
  function Address() {
    _classCallCheck(this, Address);
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


  _createClass(Address, [{
    key: "components",
    value: function components(lang) {
      return [];
    }
  }, {
    key: "componentLabelForKey",
    value: function componentLabelForKey(key, lang) {
      var component = this.components(lang).find(function (component) {
        return component.key === key;
      });
      return component === undefined ? '' : component.translatedLabel;
    }
  }, {
    key: "componentValueForKey",
    value: function componentValueForKey(key, lang) {
      var component = this.components(lang).find(function (component) {
        return component.key === key;
      });
      return component === undefined ? '' : component.translatedValue;
    }
  }, {
    key: "fullAddress",
    value: function fullAddress(lang) {
      return null;
    }
  }, {
    key: "coordinate",
    value: function coordinate() {
      return {
        lat: 0,
        lng: 0
      };
    }
  }, {
    key: "coordinates",
    value: function coordinates() {
      return [];
    } // In the future it can be multiple source

  }, {
    key: "dataSource",
    value: function dataSource() {
      return null;
    }
    /**
     * Return a normalized confident level from 0 - 10
     */

  }, {
    key: "confidence",
    value: function confidence() {
      return 0;
    }
  }, {
    key: "distanceTo",
    value: function distanceTo(address) {
      var cord1 = turf.point([this.coordinate().lat, this.coordinate().lng]);
      var cord2 = turf.point([address.coordinate().lat, address.coordinate().lng]);
      return turf.distance(cord1, cord2, {
        units: 'kilometers'
      });
    }
  }]);

  return Address;
}();

exports.default = Address;
Address.LANG_EN = 'eng';
Address.LANG_ZH = 'chi';