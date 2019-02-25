"use strict";

var _SCORE_SCHEME;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * To parse the address from OGCIO. this file should be compatible with node.js and js running in browser
 *
 */
var _require = require('../utils/constants'),
    region = _require.region,
    dcDistrict = _require.dcDistrict;

var CONFIDENT_ALL_MATCH = 1.0;
var CONFIDENT_MULTIPLIER_NAME_ONLY = 0.5;
var CONFIDENT_MULTIPLIER_PARTIAL_MATCH = 0.7;
var CONFIDENT_MULTIPLIER_OPPOSITE_STREET = 0.75;
var CONFIDENT_MULTIPLIER_FULL_STREET_MATCH = 1.5;
var CONFIDENT_REVERSE_MATCH = 0.9;
var OGCIO_KEY_BLOCK = 'Block';
var OGCIO_KEY_PHASE = 'Phase';
var OGCIO_KEY_ESTATE = 'Estate';
var OGCIO_KEY_VILLAGE = 'Village';
var OGCIO_KEY_STREET = 'Street';
var OGCIO_KEY_REGION = 'Region';
var OGCIO_KEY_BUILDING_NAME = 'BuildingName';
var SCORE_SCHEME = (_SCORE_SCHEME = {}, _defineProperty(_SCORE_SCHEME, OGCIO_KEY_BUILDING_NAME, 50), _defineProperty(_SCORE_SCHEME, OGCIO_KEY_VILLAGE, 40), _defineProperty(_SCORE_SCHEME, OGCIO_KEY_ESTATE, 40), _defineProperty(_SCORE_SCHEME, OGCIO_KEY_STREET, 40), _defineProperty(_SCORE_SCHEME, OGCIO_KEY_REGION, 20), _defineProperty(_SCORE_SCHEME, OGCIO_KEY_PHASE, 20), _defineProperty(_SCORE_SCHEME, OGCIO_KEY_BLOCK, 20), _SCORE_SCHEME);
var SCORE_PER_MATCHED_CHAR = 0.1; // priority in asscending order

var elementPriority = [OGCIO_KEY_BUILDING_NAME, OGCIO_KEY_BLOCK, OGCIO_KEY_PHASE, OGCIO_KEY_ESTATE, OGCIO_KEY_VILLAGE, OGCIO_KEY_STREET, OGCIO_KEY_REGION];
var log = console.log; // eslint-disable-line

var Match = function Match(confident, matchedKey, matchedWords) {
  _classCallCheck(this, Match);

  this.confident = confident;
  this.matchedKey = matchedKey; // array of words that matched

  this.matchedWords = matchedWords;
};

function removeFloor(address) {
  var addr = address.replace(/([0-9A-z\-\s]+[樓層]|[0-9A-z號\-\s]+[舖鋪]|地[下庫]|平台).*/g, '');
  return addr;
}

function dcDistrictMapping(val, isChinese) {
  for (var district in dcDistrict) {
    if (district === val) {
      return isChinese ? dcDistrict[district].chi : dcDistrict[district].eng;
    }
  }

  return isChinese ? dcDistrict.invalid.chi : dcDistrict.invalid.eng;
}

function regionMapping(val) {
  for (var reg in region) {
    if (reg === val) {
      return region[reg].eng;
    }
  }
}
/**
 * Return the percentage of how much do the laterString match the first one
 * @param {*} string
 * @param {*} stringToSearch
 */


function findPartialMatch(string, stringToSearch) {
  var match = {
    matchPercentage: 0,
    matchedWord: null
  }; // some exceptional case if the word from OGCIO contains directly the search address, we consider it as a full match

  if (stringToSearch.indexOf(string) >= 0) {
    match.matchPercentage = 0.9;
    match.matchedWord = string;
  } else {
    masterLoop: for (var i = 0; i < stringToSearch.length; i++) {
      for (var end = stringToSearch.length; end > i; end--) {
        var substring = stringToSearch.substring(i, end);

        if (string.includes(substring)) {
          match.matchPercentage = substring.length * 1.0 / stringToSearch.length;
          match.matchedWord = substring;
          break masterLoop;
        }
      }
    }
  }

  return match;
}
/**
 * Remove the top level "Eng"/"Chi" prefix of the addresses
 * @param {*} data
 */


function eliminateLangKeys(data) {
  var result = {};

  var _arr = Object.keys(data);

  for (var _i = 0; _i < _arr.length; _i++) {
    var key = _arr[_i];
    var refinedKey = key.replace(/(^Chi|^Eng)/, ''); // eliminate with recursion

    if (_typeof(data[key]) === 'object') {
      result[refinedKey] = eliminateLangKeys(data[key]);
    } else {
      result[refinedKey] = data[key];
    }
  }

  return result;
}

function normalizeResponse(responseFromOGCIO) {
  // No more flatten json to maintain the orginal data structure
  // https://www.als.ogcio.gov.hk/docs/Data_Dictionary_for_ALS_EN.pdf
  return responseFromOGCIO.SuggestedAddress.map(function (record) {
    return {
      chi: eliminateLangKeys(record.Address.PremisesAddress.ChiPremisesAddress),
      eng: eliminateLangKeys(record.Address.PremisesAddress.EngPremisesAddress),
      geo: record.Address.PremisesAddress.GeospatialInformation
    };
  });
}

function tryToMatchAnyNumber(address, number) {
        
  console.log(address)
  var matches = address.match(/\d+/g);

  if (matches === null) {
    return false;
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = matches[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var match = _step.value;
      var num = parseInt(match, 10);

      if (num === number) {
        return true;
      }
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

  return false;
}

function tryToMatchRangeOfNumber(address, from, to, isOdd) {
  var matches = address.match(/\d+/g);

  if (matches === null) {
    return false;
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = matches[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var match = _step2.value;
      var num = parseInt(match, 10);

      if (num >= from && num <= to && num % 2 == 1 == isOdd) {
        return true;
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return false;
}

function isChinese(s) {
  return /[^\u0000-\u00ff]/.test(s);
}

function splitValueForSpaceIfChinese(value) {
  if (isChinese(value) && /\s/.test(value)) {
    var tokens = value.split(/\s/); // we need the last element only

    return tokens[tokens.length - 1];
  }

  return value;
}

function matchAllMatchedWords(address, matchedWords) {
  return matchedWords.map(function (word) {
    return address.includes(word);
  }).reduce(function (p, c) {
    return p && c;
  }, true);
}
/**
 * Find the longest set of matches that has highest score and not overlapping
 * @param {*} address
 * @param {*} matches
 */


function findMaximumNonOverlappingMatches(address, matches) {
  if (matches.length === 1) {
    if (matches[0].matchedWord !== null && matchAllMatchedWords(address, matches[0].matchedWords)) {
      return matches;
    }

    return [];
  }

  var longestMatchScore = 0;
  var longestMatch = [];
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    var _loop = function _loop() {
      var match = _step3.value;

      if (matchAllMatchedWords(address, match.matchedWords)) {
        var subAddress = address;
        match.matchedWords.forEach(function (word) {
          return subAddress = subAddress.replace(word, '');
        });
        var localLongestMatch = findMaximumNonOverlappingMatches(subAddress, matches.filter(function (m) {
          return m.matchedKey !== match.matchedKey;
        }));
        localLongestMatch.push(match);
        var score = calculateScoreFromMatches(localLongestMatch);

        if (score > longestMatchScore) {
          longestMatchScore = score;
          longestMatch = localLongestMatch;
        }
      }
    };

    for (var _iterator3 = matches[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      _loop();
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return longestMatch;
}
/**
 * To calcutate the final confident with partical match
 * @param {*} confident
 * @param {*} matchPercentage
 */


function modifyConfidentByPartialMatchPercentage(confident, matchPercentage) {
  return confident * matchPercentage * matchPercentage * CONFIDENT_MULTIPLIER_PARTIAL_MATCH;
}

function calculateScoreFromMatches(matches) {
  var score = 0;
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = matches[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var match = _step4.value;
      score += SCORE_SCHEME[match.matchedKey] * match.confident;
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return score;
}

function searchSimilarityForStreetOrVillage(type, address, addressToSearch, BuildingNoFrom, BuildingNoTo) {
  var sim = new Match(0, type, []);

  if (address.includes(addressToSearch)) {
    sim.confident = CONFIDENT_ALL_MATCH;
    sim.matchedWords.push(addressToSearch);
  } else {
    var _findPartialMatch = findPartialMatch(address, addressToSearch),
        matchPercentage = _findPartialMatch.matchPercentage,
        matchedWord = _findPartialMatch.matchedWord;

    if (matchPercentage > 0) {
      sim.confident = modifyConfidentByPartialMatchPercentage(CONFIDENT_ALL_MATCH, matchPercentage);
      sim.matchedWords.push(matchedWord);
    }
  } // total match of the streetname


  if (BuildingNoFrom) {
    var from = parseInt(BuildingNoFrom, 10);
    var to = BuildingNoTo ? parseInt(BuildingNoTo, 10) : from;
    var isOdd = parseInt(BuildingNoFrom, 10) % 2 == 1; // If the street name and also the street no. is matched. we should give it a very high score

    if (from === to) {
      if (!tryToMatchAnyNumber(address, from)) {
        if (tryToMatchRangeOfNumber(address, from, to, !isOdd)) {
          // ratio 1
          sim.confident *= CONFIDENT_MULTIPLIER_OPPOSITE_STREET;
        } else {
          sim.confident *= CONFIDENT_MULTIPLIER_NAME_ONLY;
        }
      } else {
        sim.matchedWords.push(from + '');
        sim.confident *= CONFIDENT_MULTIPLIER_FULL_STREET_MATCH;
      }
    } else {
      if (!tryToMatchRangeOfNumber(address, from, to, isOdd)) {
        // Try to look up at opposite street
        if (tryToMatchRangeOfNumber(address, from, to, !isOdd)) {
          // ratio 1
          sim.confident *= CONFIDENT_MULTIPLIER_OPPOSITE_STREET;
        } else {
          sim.confident *= CONFIDENT_MULTIPLIER_NAME_ONLY;
        }
      } else {
        // TODO: cannot mark the street/village number that we have came across
        sim.confident *= CONFIDENT_MULTIPLIER_FULL_STREET_MATCH;
      }
    }
  } else {
    sim.confident *= CONFIDENT_MULTIPLIER_NAME_ONLY;
  }

  return sim;
}

function searchOccuranceForBlock(address, _ref) {
  var BlockDescriptor = _ref.BlockDescriptor,
      BlockNo = _ref.BlockNo;

  if (address.includes(BlockNo + BlockDescriptor)) {
    var match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BLOCK, [BlockNo, BlockDescriptor]);

    if (BlockNo) {
      if (!tryToMatchAnyNumber(address, parseInt(BlockNo, 10))) {
        match.confident = CONFIDENT_MULTIPLIER_NAME_ONLY;
      }
    }

    return match;
  }

  return null;
}

function searchOccuranceForPhase(address, _ref2) {
  var PhaseNo = _ref2.PhaseNo,
      PhaseName = _ref2.PhaseName;

  if (address.includes(PhaseName + PhaseNo)) {
    var match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_PHASE, [PhaseNo, PhaseName]);

    if (PhaseNo) {
      if (!tryToMatchAnyNumber(address, parseInt(PhaseNo, 10))) {
        match.confident = CONFIDENT_MULTIPLIER_NAME_ONLY;
      }
    }

    return match;
  }

  return null;
}

function searchOccuranceForEstate(address, _ref3) {
  var EstateName = _ref3.EstateName;

  if (address.includes(EstateName)) {
    return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_ESTATE, [EstateName]);
  }

  return null;
}

function searchOccuranceForRegion(address, region) {
  if (address.includes(region)) {
    return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_REGION, [region]);
  }

  return null;
}

function searchOccuranceForBuildingName(address, buildingName) {
  if (address.includes(buildingName)) {
    return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BUILDING_NAME, [buildingName]);
  } else {
    var _findPartialMatch2 = findPartialMatch(address, buildingName),
        matchPercentage = _findPartialMatch2.matchPercentage,
        matchedWord = _findPartialMatch2.matchedWord;

    if (matchPercentage > 0) {
      var match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BUILDING_NAME, [matchedWord]);
      match.confident = modifyConfidentByPartialMatchPercentage(match.confident, matchPercentage);
      return match;
    }
  }

  return null;
}

function searchOccuranceForStreet(address, _ref4) {
  var StreetName = _ref4.StreetName,
      BuildingNoFrom = _ref4.BuildingNoFrom,
      BuildingNoTo = _ref4.BuildingNoTo;
  var streetsToTest = splitValueForSpaceIfChinese(StreetName);
  return searchSimilarityForStreetOrVillage(OGCIO_KEY_STREET, address, streetsToTest, BuildingNoFrom, BuildingNoTo);
}

function searchOccuranceForVillage(address, _ref5) {
  var VillageName = _ref5.VillageName,
      BuildingNoFrom = _ref5.BuildingNoFrom,
      BuildingNoTo = _ref5.BuildingNoTo;
  var streetsToTest = splitValueForSpaceIfChinese(VillageName);
  return searchSimilarityForStreetOrVillage(OGCIO_KEY_VILLAGE, address, streetsToTest, BuildingNoFrom, BuildingNoTo);
}
/**
 * Take a
 */


function searchOccurance(address, ogcioRecordElementKey, ogcioRecordElement) {
  switch (ogcioRecordElementKey) {
    case OGCIO_KEY_STREET:
      return searchOccuranceForStreet(address, ogcioRecordElement);
      break;

    case OGCIO_KEY_VILLAGE:
      return searchOccuranceForVillage(address, ogcioRecordElement);
      break;

    case OGCIO_KEY_BLOCK:
      return searchOccuranceForBlock(address, ogcioRecordElement);
      break;

    case OGCIO_KEY_PHASE:
      return searchOccuranceForPhase(address, ogcioRecordElement);
      break;

    case OGCIO_KEY_ESTATE:
      return searchOccuranceForEstate(address, ogcioRecordElement);
      break;

    case OGCIO_KEY_REGION:
      return searchOccuranceForRegion(address, ogcioRecordElement);
      break;

    case OGCIO_KEY_BUILDING_NAME:
      return searchOccuranceForBuildingName(address, ogcioRecordElement);
      break;
  }

  return null;
}

function findMatchFromOGCIORecord(address, ogcioRecord) {
  var matches = []; // First we look up everything that exists in that address

  for (var _i2 = 0; _i2 < elementPriority.length; _i2++) {
    var key = elementPriority[_i2];

    if (ogcioRecord.chi[key] !== undefined && isChinese(address)) {
      //
      var occurance = searchOccurance(address, key, ogcioRecord.chi[key]);

      if (occurance === null) {
        continue;
      }

      matches.push(occurance);
    }

    if (ogcioRecord.eng[key] !== undefined && !isChinese(address)) {
      var _occurance = searchOccurance(address, key, ogcioRecord.eng[key]);

      if (_occurance === null) {
        continue;
      }

      matches.push(_occurance);
    }
  }

  return findMaximumNonOverlappingMatches(address, matches);
}

function transformDistrict(ogcioRecord) {
  if (ogcioRecord.eng.District) {
    ogcioRecord.eng.District.DcDistrict = dcDistrictMapping(ogcioRecord.eng.District.DcDistrict, false);
  }

  if (ogcioRecord.chi.District) {
    ogcioRecord.chi.District.DcDistrict = dcDistrictMapping(ogcioRecord.chi.District.DcDistrict, true);
  }

  if (ogcioRecord.eng.Region) {
    ogcioRecord.eng.Region = regionMapping(ogcioRecord.eng.Region);
  }

  return ogcioRecord;
}

function parseAddress(address, normalizedOGCIOResult) {
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = normalizedOGCIOResult[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var record = _step5.value;
      var matches = findMatchFromOGCIORecord(address, record);
      record.score = calculateScoreFromMatches(matches);
      record.matches = matches; // Also tranform the district code to name directly

      record = transformDistrict(record);
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  normalizedOGCIOResult = normalizedOGCIOResult.sort(function (a, b) {
    return b.score - a.score;
  });
  return normalizedOGCIOResult.slice(0, 200);
}
/**
 * Standalone version of address parsing.
 * @param {*} address
 * @param {*} responseFromOGCIO Raw json response from ogcio
 */


function searchResult(address, responseFromOGCIO) {
  var normalizedAddress = removeFloor(address).toUpperCase();
  var normalizedOGCIOResult = normalizeResponse(responseFromOGCIO);
  return parseAddress(normalizedAddress, normalizedOGCIOResult);
} // node.js exports


module.exports = {
  searchResult: searchResult,
  calculateScoreFromMatches: calculateScoreFromMatches
};