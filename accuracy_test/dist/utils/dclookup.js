"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var turf = _interopRequireWildcard(require("@turf/turf"));

var _dcdata = _interopRequireDefault(require("./../utils/dcdata-2015"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var dcArea = turf.featureCollection(_dcdata.default.features);
var _default = {
  /**
   * Return the district and subdistrict name
   */
  dcNameFromCoordinates: function dcNameFromCoordinates(lat, lng) {
    var point = turf.point([lng, lat]);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = dcArea.features[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var feature = _step.value;

        if (turf.booleanPointInPolygon(point, turf.polygon(feature.geometry.coordinates))) {
          return {
            code: feature.properties.CACODE,
            cname: feature.properties.CNAME,
            ename: feature.properties.ENAME,
            district: feature.properties.DISTRICT_T,
            csubdistrict: feature.properties.SUBDISTIRCT_T,
            esubdistrict: feature.properties.SUBDISTIRCT_E
          };
        }

        ;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return {
      code: 'unknown',
      cname: 'unknown',
      ename: 'unknown',
      district: 'unknown',
      csubdistrict: 'unknown',
      esubdistrict: 'unknown'
    };
  }
};
exports.default = _default;