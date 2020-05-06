"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ogcioParser = _interopRequireDefault(require("./ogcio-parser"));

var AddressFactory = _interopRequireWildcard(require("./models/address-factory"));

var _proj = _interopRequireDefault(require("proj4"));

var _projConvertor = _interopRequireDefault(require("../utils/proj-convertor"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var OGCIO_RECORD_COUNT = 200;
var NEAR_THRESHOLD = 0.05; // 50 metre

/**
 *
 * @param {string} address
 * @returns Promise<Address[]>
 */

var searchAddressWithOGCIO =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(address) {
    var results, ogcioURL, ogcioRes, ogcioData;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            results = [];
            _context.prev = 1;
            ogcioURL = "https://www.als.ogcio.gov.hk/lookup?q=".concat(encodeURI(address), "&n=").concat(OGCIO_RECORD_COUNT);
            _context.next = 5;
            return fetch(ogcioURL, {
              headers: {
                "Accept": "application/json",
                "Accept-Language": "en,zh-Hant",
                "Accept-Encoding": "gzip"
              }
            });

          case 5:
            ogcioRes = _context.sent;
            _context.next = 8;
            return ogcioRes.json();

          case 8:
            ogcioData = _context.sent;
            results = _ogcioParser.default.searchResult(address, ogcioData).map(function (record) {
              return AddressFactory.createAddress('ogcio', record);
            });
            _context.next = 15;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context["catch"](1);
            console.error(_context.t0);

          case 15:
            return _context.abrupt("return", Promise.resolve(results));

          case 17:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[1, 12]]);
  }));

  return function searchAddressWithOGCIO(_x) {
    return _ref.apply(this, arguments);
  };
}();

var _default = {
  queryAddress: function () {
    var _queryAddress = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(address) {
      var sortedOgcioRecords, landsURL, landsRes, landRecords, landsData, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, data, wgsLng, wgslat, _ProjConvertor$projTr, _ProjConvertor$projTr2, sortedResults, _i2, landResult, assumedLandResult, fullAddressToSearch;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return searchAddressWithOGCIO(address);

            case 2:
              sortedOgcioRecords = _context2.sent;
              // Fetch result from GeoData Portal of Land Department
              landsURL = "https://geodata.gov.hk/gs/api/v1.0.0/locationSearch?q=".concat(encodeURI(address));
              _context2.next = 6;
              return fetch(landsURL);

            case 6:
              landsRes = _context2.sent;
              landRecords = [];
              _context2.prev = 8;
              _context2.next = 11;
              return landsRes.json();

            case 11:
              landsData = _context2.sent;
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context2.prev = 15;

              for (_iterator = landsData[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                data = _step.value;
                wgsLng = void 0, wgslat = void 0;
                _ProjConvertor$projTr = _projConvertor.default.projTransform('EPSG:2326', 'EPSG:4326', [data.x, data.y]);
                _ProjConvertor$projTr2 = _slicedToArray(_ProjConvertor$projTr, 2);
                wgsLng = _ProjConvertor$projTr2[0];
                wgslat = _ProjConvertor$projTr2[1];
                data.lat = Number.parseFloat(wgslat).toFixed(4);
                data.lng = Number.parseFloat(wgsLng).toFixed(4);
                landRecords.push(AddressFactory.createAddress('land', data));
              }

              _context2.next = 23;
              break;

            case 19:
              _context2.prev = 19;
              _context2.t0 = _context2["catch"](15);
              _didIteratorError = true;
              _iteratorError = _context2.t0;

            case 23:
              _context2.prev = 23;
              _context2.prev = 24;

              if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
              }

            case 26:
              _context2.prev = 26;

              if (!_didIteratorError) {
                _context2.next = 29;
                break;
              }

              throw _iteratorError;

            case 29:
              return _context2.finish(26);

            case 30:
              return _context2.finish(23);

            case 31:
              _context2.next = 35;
              break;

            case 33:
              _context2.prev = 33;
              _context2.t1 = _context2["catch"](8);

            case 35:
              sortedResults = [];
              return _context2.abrupt("return", sortedOgcioRecords);

            case 39:
              _i2 = 0;

            case 40:
              if (!(_i2 < landRecords.length)) {
                _context2.next = 47;
                break;
              }

              landResult = landRecords[_i2];

              if (!(sortedOgcioRecords[0].distanceTo(landResult) < NEAR_THRESHOLD)) {
                _context2.next = 44;
                break;
              }

              return _context2.abrupt("return", sortedOgcioRecords);

            case 44:
              _i2++;
              _context2.next = 40;
              break;

            case 47:
              // 2. best result from OGCIO does not appears in the land results
              // so we pick the first land result as our destination and search all the OGCIO results and see if some result is within the NEAR_DISTANCE
              // and sort them with distance to the first land result
              sortedOgcioRecords.forEach(function (ogcioRecord) {
                var distance = ogcioRecord.distanceTo(landRecords[0]);

                if (ogcioRecord.distanceTo(landRecords[0]) < NEAR_THRESHOLD) {
                  // add the distance for sorting the array
                  ogcioRecord.distance = distance;
                  sortedResults.push(ogcioRecord); // console.log(ogcioRecord.distanceTo(landRecords[0]) + ' | ' + ogcioRecord.fullAddress('chi'))
                }
              }); // console.log('2. first land result appears in ogcio result')
              // Return the sorted array by distnace to first land result

              if (!(sortedResults.length > 0)) {
                _context2.next = 51;
                break;
              }

              return _context2.abrupt("return", sortedResults.sort(function (a, b) {
                return a.distance - b.distance;
              }));

            case 51:
              // 3. ogcio not found but there is land result. We try to search again from ogcio using the land result
              // #89
              assumedLandResult = landRecords[0];
              fullAddressToSearch = landRecords[0].fullAddress('chi');

              if (!(fullAddressToSearch !== '')) {
                _context2.next = 59;
                break;
              }

              _context2.next = 56;
              return searchAddressWithOGCIO(fullAddressToSearch);

            case 56:
              sortedOgcioRecords = _context2.sent;

              if (!(sortedOgcioRecords[0].distanceTo(assumedLandResult) < NEAR_THRESHOLD)) {
                _context2.next = 59;
                break;
              }

              return _context2.abrupt("return", sortedOgcioRecords);

            case 59:
              return _context2.abrupt("return", landRecords);

            case 60:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[8, 33], [15, 19, 23, 31], [24,, 26, 30]]);
    }));

    function queryAddress(_x2) {
      return _queryAddress.apply(this, arguments);
    }

    return queryAddress;
  }()
};
exports.default = _default;