"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _eng, _chi;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Some helper functions for showing OGCIO address result
 * definations:
 * https://www.als.ogcio.gov.hk/docs/Data_Dictionary_for_ALS_EN.pdf
 */
var OGCIO_KEY_BLOCK = 'Block';
var OGCIO_KEY_PHASE = 'Phase';
var OGCIO_KEY_ESTATE = 'Estate';
var OGCIO_KEY_VILLAGE = 'Village';
var OGCIO_KEY_REGION = 'Region';
var OGCIO_KEY_STREET = 'Street';
var OGCIO_KEY_DISTRICT = 'District';
var OGCIO_KEY_LOT = 'Lot';
var OGCIO_KEY_STRUCTURED_LOT = 'StructuredLot';
var OGCIO_KEY_BUILDING_NAME = 'BuildingName';
var keys = {
  eng: (_eng = {}, _defineProperty(_eng, OGCIO_KEY_BLOCK, 'Block'), _defineProperty(_eng, OGCIO_KEY_PHASE, 'Phase'), _defineProperty(_eng, OGCIO_KEY_ESTATE, 'Estate'), _defineProperty(_eng, OGCIO_KEY_VILLAGE, 'Village'), _defineProperty(_eng, OGCIO_KEY_REGION, 'Region'), _defineProperty(_eng, OGCIO_KEY_DISTRICT, 'District'), _defineProperty(_eng, OGCIO_KEY_STREET, 'Street'), _defineProperty(_eng, OGCIO_KEY_BUILDING_NAME, 'Building Name'), _defineProperty(_eng, "".concat(OGCIO_KEY_DISTRICT, ".DcDistrict"), '區議會分區'), _defineProperty(_eng, "".concat(OGCIO_KEY_STREET, ".StreetName"), 'Street Name'), _defineProperty(_eng, "".concat(OGCIO_KEY_STREET, ".BuildingNoFrom"), 'Street No. From'), _defineProperty(_eng, "".concat(OGCIO_KEY_STREET, ".BuildingNoTo"), 'Street No. To'), _defineProperty(_eng, "".concat(OGCIO_KEY_ESTATE, ".EstateName"), 'Estate Name'), _eng),
  chi: (_chi = {}, _defineProperty(_chi, OGCIO_KEY_BLOCK, '座數'), _defineProperty(_chi, OGCIO_KEY_PHASE, '期數'), _defineProperty(_chi, OGCIO_KEY_ESTATE, '屋邨'), _defineProperty(_chi, OGCIO_KEY_VILLAGE, '鄉村'), _defineProperty(_chi, OGCIO_KEY_REGION, '區域'), _defineProperty(_chi, OGCIO_KEY_DISTRICT, '地區'), _defineProperty(_chi, OGCIO_KEY_STREET, '街道'), _defineProperty(_chi, OGCIO_KEY_BUILDING_NAME, '大廈名稱'), _defineProperty(_chi, "".concat(OGCIO_KEY_DISTRICT, ".DcDistrict"), '區議會分區'), _defineProperty(_chi, "".concat(OGCIO_KEY_STREET, ".StreetName"), '街道'), _defineProperty(_chi, "".concat(OGCIO_KEY_STREET, ".BuildingNoFrom"), '街號'), _defineProperty(_chi, "".concat(OGCIO_KEY_STREET, ".BuildingNoTo"), '街號'), _defineProperty(_chi, "".concat(OGCIO_KEY_ESTATE, ".EstateName"), '屋邨'), _chi)
};

function safeFieldValue(obj, key) {
  return obj && obj[key] ? obj[key] : '';
}

function textForKey(key, lang) {
  return keys[lang] ? keys[lang][key] ? keys[lang][key] : key : key;
}

function engBuildingNumberFromField(field) {
  if (!field || !field.BuildingNoFrom && !field.BuildingNoTo) {
    return '';
  }

  if (field.BuildingNoFrom && field.BuildingNoTo) {
    return "".concat(field.BuildingNoFrom, "-").concat(field.BuildingNoTo);
  } else {
    return "".concat(field.BuildingNoTo ? field.BuildingNoTo : field.BuildingNoFrom);
  }
}

function chineseBuildingNumberFromField(field) {
  if (!field || !field.BuildingNoFrom && !field.BuildingNoTo) {
    return '';
  }

  if (field.BuildingNoFrom && field.BuildingNoTo) {
    return "".concat(field.BuildingNoFrom, "\u81F3").concat(field.BuildingNoTo, "\u865F");
  } else {
    return "".concat(field.BuildingNoTo ? field.BuildingNoTo : field.BuildingNoFrom, "\u865F");
  }
}

function prettyPrintBlock(blockObj, lang) {
  if (lang === 'chi') {
    return "".concat(blockObj.BlockNo).concat(blockObj.BlockDescriptor);
  } else if (lang === 'eng') {
    return "".concat(blockObj.BlockDescriptor).concat(blockObj.BlockNo);
  }
}

function prettyPrintEstate(estateObj, lang) {
  var estateName = estateObj.EstateName;
  var phase = estateObj[OGCIO_KEY_PHASE];

  if (lang === 'chi') {
    if (phase) {
      estateName = "".concat(estateName).concat(safeFieldValue(estateObj[OGCIO_KEY_PHASE], 'PhaseNo')).concat(safeFieldValue(estateObj[OGCIO_KEY_PHASE], 'PhaseName'));
    }
  } else if (lang === 'eng') {
    if (phase) {
      estateName = "".concat(safeFieldValue(estateObj[OGCIO_KEY_PHASE], 'PhaseName')).concat(safeFieldValue(estateObj[OGCIO_KEY_PHASE], 'PhaseNo'), ",").concat(estateName);
    }
  }

  return estateName;
}

function prettyPrintStreet(streetObj, lang) {
  if (lang === 'chi') {
    return "".concat(safeFieldValue(streetObj, 'StreetName')).concat(chineseBuildingNumberFromField(streetObj));
  } else if (lang === 'eng') {
    return "".concat(engBuildingNumberFromField(streetObj), " ").concat(safeFieldValue(streetObj, 'StreetName'));
  }
}

function textForValue(record, key, lang) {
  if (!record[lang]) {
    return '';
  }

  if (typeof record[lang][key] === 'string') {
    return record[lang][key];
  }

  if (key === OGCIO_KEY_ESTATE) {
    return prettyPrintEstate(record[lang][key], lang);
  } else if (key === OGCIO_KEY_BLOCK) {
    return prettyPrintBlock(record[lang][key], lang);
  } else if (key === OGCIO_KEY_STREET) {
    return prettyPrintStreet(record[lang][key], lang);
  }

  return Object.values(record[lang][key]).join();
}
/**
 * Format the chinese address from the given result set
 * @param {*} result
 */


function fullChineseAddressFromResult(result) {
  var Street = result.Street,
      Block = result.Block,
      Phase = result.Phase,
      Estate = result.Estate,
      Village = result.Village;
  var region = safeFieldValue(result, 'Region');
  var streetName = safeFieldValue(Street, 'StreetName');
  var streetNumber = chineseBuildingNumberFromField(Street);
  var villageName = safeFieldValue(Village, 'VillageName');
  var villageNumber = chineseBuildingNumberFromField(Village);
  var buildingName = safeFieldValue(result, 'BuildingName');
  return "".concat(region).concat(villageName).concat(villageNumber).concat(streetName).concat(streetNumber).concat(buildingName).trim();
}
/**
 * Format the english address from the given result set
 * @param {*} result
 */


function fullEnglishAddressFromResult(result) {
  var Street = result.Street,
      Block = result.Block,
      Phase = result.Phase,
      Estate = result.Estate,
      Village = result.Village;
  var region = safeFieldValue(result, 'Region');
  var streetName = safeFieldValue(Street, 'StreetName');
  var streetNumber = engBuildingNumberFromField(Street);
  var villageName = safeFieldValue(Village, 'VillageName');
  var villageNumber = engBuildingNumberFromField(Village);
  var buildingName = safeFieldValue(result, 'BuildingName');
  return [buildingName, "".concat(streetNumber, " ").concat(streetName), "".concat(villageNumber, " ").concat(villageName), region].filter(function (token) {
    return token.match(/\S/);
  }).join(', ');
}

var _default = {
  topLevelKeys: function topLevelKeys() {
    return Object.keys(keys.chi).map(function (key) {
      return {
        key: key,
        value: keys.chi[key]
      };
    }).filter(function (key) {
      return !key.key.includes('.');
    });
  },
  textForKey: textForKey,
  textForValue: textForValue,
  fullEnglishAddressFromResult: fullEnglishAddressFromResult,
  fullChineseAddressFromResult: fullChineseAddressFromResult
};
exports.default = _default;