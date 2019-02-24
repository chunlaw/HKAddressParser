import { point, distance } from '@turf/turf';
import proj4 from 'proj4';
import Stream from 'stream';
import http from 'http';
import Url from 'url';
import https from 'https';
import zlib from 'zlib';

const region = {
  HK: {
    eng: "Hong Kong",
    chi: "香港"
  },
  KLN: {
    eng: "Kowloon",
    chi: "九龍"
  },
  NT: {
    eng: "New Territories",
    chi: "新界"
  }
};

const dcDistrict = {
  invalid: {
    eng: "Invalid District Name",
    chi: "無效地區"
  },
  CW: {
    eng: "Central and Western District",
    chi: "中西區"
  },
  EST: {
    eng: "Eastern District",
    chi: "東區"
  },
  ILD: {
    eng: "Islands District",
    chi: "離島區"
  },
  KLC: {
    eng: "Kowloon City District",
    chi: "九龍城區"
  },
  KC: {
    eng: "Kwai Tsing District",
    chi: "葵青區"
  },
  KT: {
    eng: "Kwun Tong District",
    chi: "觀塘區"
  },
  NTH: {
    eng: "North District",
    chi: "北區"
  },
  SK: {
    eng: "Sai Kung District",
    chi: "西貢區"
  },
  ST: {
    eng: "Sha Tin Distric",
    chi: "沙田區"
  },
  SSP: {
    eng: "Sham Shui Po District",
    chi: "深水埗區"
  },
  STH: {
    eng: "Southern District",
    chi: "南區"
  },
  TP: {
    eng: "Tai Po District",
    chi: "大埔區"
  },
  TW: {
    eng: "Tsuen Wan District",
    chi: "荃灣區"
  },
  TM: {
    eng: "Tuen Mun District",
    chi: "屯門區"
  },
  WC: {
    eng: "Wan Chai District",
    chi: "灣仔區"
  },
  WTS: {
    eng: "Wong Tai Sin District",
    chi: "黃大仙區"
  },
  YTM: {
    eng: "Yau Tsim Mong District",
    chi: "油尖旺區"
  },
  YL: {
    eng: "Yuen Long District",
    chi: "元朗區"
  }
};

// MUST use common js style to let address-parse "require" work normally
var constants = {
  region,
  dcDistrict
};
var constants_1 = constants.region;
var constants_2 = constants.dcDistrict;

/**
 * To parse the address from OGCIO. this file should be compatible with node.js and js running in browser
 *
 */

const CONFIDENT_ALL_MATCH = 1.0;
const CONFIDENT_MULTIPLIER_NAME_ONLY = 0.5;
const CONFIDENT_MULTIPLIER_PARTIAL_MATCH = 0.7;
const CONFIDENT_MULTIPLIER_OPPOSITE_STREET = 0.75;
const CONFIDENT_MULTIPLIER_FULL_STREET_MATCH = 1.5;

const OGCIO_KEY_BLOCK = "Block";
const OGCIO_KEY_PHASE = "Phase";
const OGCIO_KEY_ESTATE = "Estate";
const OGCIO_KEY_VILLAGE = "Village";
const OGCIO_KEY_STREET = "Street";
const OGCIO_KEY_REGION = "Region";
const OGCIO_KEY_BUILDING_NAME = "BuildingName";

const SCORE_SCHEME = {
    [OGCIO_KEY_BUILDING_NAME]: 50,
    [OGCIO_KEY_VILLAGE]: 40,
    [OGCIO_KEY_ESTATE]: 40,
    [OGCIO_KEY_STREET]: 40,
    [OGCIO_KEY_REGION]: 20,
    [OGCIO_KEY_PHASE]: 20,
    [OGCIO_KEY_BLOCK]: 20,
};

// priority in asscending order
const elementPriority = [
    OGCIO_KEY_BUILDING_NAME,
    OGCIO_KEY_BLOCK,
    OGCIO_KEY_PHASE,
    OGCIO_KEY_ESTATE,
    OGCIO_KEY_VILLAGE,
    OGCIO_KEY_STREET,
    OGCIO_KEY_REGION
];

const log = console.log; // eslint-disable-line

class Match {
    constructor(confident, matchedKey, matchedWords) {
        this.confident = confident;
        this.matchedKey = matchedKey;
        // array of words that matched
        this.matchedWords = matchedWords;
    }
}




function removeFloor(address) {
    return address.replace(/([0-9A-z\-\s]+[樓層]|[0-9A-z號\-\s]+[舖鋪]|地[下庫]|平台).*/g, '');
}


function dcDistrictMapping(val, isChinese) {
    for (const district in constants_2) {
        if (district === val) {
            return isChinese ? constants_2[district].chi : constants_2[district].eng;
        }
    }
    return isChinese ? constants_2.invalid.chi : constants_2.invalid.eng;
}

function regionMapping(val) {
    for (const reg in constants_1) {
        if (reg === val) {
            return constants_1[reg].eng;
        }
    }
}


/**
 * Return the percentage of how much do the laterString match the first one
 * @param {*} string
 * @param {*} stringToSearch
 */
function findPartialMatch(string, stringToSearch) {
    const match = {
        matchPercentage: 0,
        matchedWord: null
    };

    // some exceptional case if the word from OGCIO contains directly the search address, we consider it as a full match
    if (stringToSearch.indexOf(string) >= 0) {
        match.matchPercentage = 0.9;
        match.matchedWord = string;
    } else {
        masterLoop:
            for (let i = 0; i < stringToSearch.length; i ++) {
                for (let end = stringToSearch.length; end > i; end --) {
                    const substring = stringToSearch.substring(i, end);
                    if (string.includes(substring)) {
                        match.matchPercentage = (substring.length * 1.0 / stringToSearch.length);
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
    const result = {};
    for (const key of Object.keys(data)) {
        const refinedKey = key.replace(/(^Chi|^Eng)/,'');
        // eliminate with recursion
        if (typeof(data[key]) === "object") {
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
    return responseFromOGCIO.SuggestedAddress.map(record => ({
        chi: eliminateLangKeys(record.Address.PremisesAddress.ChiPremisesAddress),
        eng: eliminateLangKeys(record.Address.PremisesAddress.EngPremisesAddress),
        geo: record.Address.PremisesAddress.GeospatialInformation,
    }));
}

function tryToMatchAnyNumber(address, number) {
    const matches = address.match(/\d+/g);
    if (matches === null) {
        return false;
    }

    for (const match of matches) {
        const num = parseInt(match, 10);
        if (num === number) {
            return true;
        }
    }
    return false;
}

function tryToMatchRangeOfNumber(address, from, to, isOdd) {
    const matches = address.match(/\d+/g);
    if (matches === null) {
        return false;
    }

    for (const match of matches) {
        const num = parseInt(match, 10);
        if (num >= from && num <= to && ((num % 2 === 1) === isOdd)) {
            return true;
        }
    }
    return false;
}

function isChinese(s) {
    return /[^\u0000-\u00ff]/.test(s);
}

function splitValueForSpaceIfChinese(value) {
    if (isChinese(value) && /\s/.test(value)) {
        const tokens = value.split(/\s/);
        // we need the last element only
        return tokens[tokens.length - 1];
    }
    return value;
}


function matchAllMatchedWords(address, matchedWords) {
    return matchedWords.map(word => address.includes(word)).reduce((p,c) => p && c, true);
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

    let longestMatchScore = 0;
    let longestMatch = [];
    for (const match of matches) {
        if (matchAllMatchedWords(address, match.matchedWords)) {
            let subAddress = address;
            match.matchedWords.forEach(word => subAddress = subAddress.replace(word, ''));
            const localLongestMatch = findMaximumNonOverlappingMatches(subAddress, matches.filter(m => m.matchedKey !== match.matchedKey));
            localLongestMatch.push(match);
            const score = calculateScoreFromMatches(localLongestMatch);
            if (score > longestMatchScore) {
                longestMatchScore = score;
                longestMatch = localLongestMatch;
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
    let score = 0;
    for (const match of matches) {
        score += SCORE_SCHEME[match.matchedKey] * match.confident;
    }
    return score;
}

function searchSimilarityForStreetOrVillage(type, address, addressToSearch, BuildingNoFrom, BuildingNoTo) {
    const sim = new Match(0, type, []);
    if (address.includes(addressToSearch)) {
        sim.confident = CONFIDENT_ALL_MATCH;
        sim.matchedWords.push(addressToSearch);
    } else {
        const { matchPercentage, matchedWord } = findPartialMatch(address, addressToSearch);
        if (matchPercentage > 0) {
            sim.confident = modifyConfidentByPartialMatchPercentage(CONFIDENT_ALL_MATCH, matchPercentage);
            sim.matchedWords.push(matchedWord);
        }
    }
    // total match of the streetname
    if (BuildingNoFrom) {
        const from = parseInt(BuildingNoFrom, 10);
        const to = BuildingNoTo ? parseInt(BuildingNoTo, 10) : from;
        const isOdd = parseInt(BuildingNoFrom, 10) % 2 === 1;
        // If the street name and also the street no. is matched. we should give it a very high score
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

function searchOccuranceForBlock(address, { BlockDescriptor, BlockNo}) {
    if (address.includes(BlockNo + BlockDescriptor)) {
        const match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BLOCK, [BlockNo, BlockDescriptor]);
        if (BlockNo) {
            if (!tryToMatchAnyNumber(address, parseInt(BlockNo, 10))) {
                match.confident = CONFIDENT_MULTIPLIER_NAME_ONLY;
            }
        }
        return match;
    }
    return null;
}

function searchOccuranceForPhase(address, { PhaseNo, PhaseName}) {
    if (address.includes(PhaseName + PhaseNo)) {
        const match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_PHASE, [PhaseNo, PhaseName]);
        if (PhaseNo) {
            if (!tryToMatchAnyNumber(address, parseInt(PhaseNo, 10))) {
                match.confident = CONFIDENT_MULTIPLIER_NAME_ONLY;
            }
        }
        return match;
    }
    return null;
}

function searchOccuranceForEstate(address, { EstateName }) {
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
        const { matchPercentage, matchedWord } = findPartialMatch(address, buildingName);
        if (matchPercentage > 0) {
            const match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BUILDING_NAME, [matchedWord]);
            match.confident = modifyConfidentByPartialMatchPercentage(match.confident, matchPercentage);
            return match;
        }
    }
    return null;
}

function searchOccuranceForStreet(address, {StreetName, BuildingNoFrom, BuildingNoTo}) {
    const streetsToTest = splitValueForSpaceIfChinese(StreetName);
    return searchSimilarityForStreetOrVillage(OGCIO_KEY_STREET, address, streetsToTest, BuildingNoFrom, BuildingNoTo);
}

function searchOccuranceForVillage(address, {VillageName, BuildingNoFrom, BuildingNoTo}) {
    const streetsToTest = splitValueForSpaceIfChinese(VillageName);
    return searchSimilarityForStreetOrVillage(OGCIO_KEY_VILLAGE, address, streetsToTest, BuildingNoFrom, BuildingNoTo);
}

/**
 * Take a
 */
function searchOccurance(address, ogcioRecordElementKey, ogcioRecordElement) {
    switch (ogcioRecordElementKey) {
        case OGCIO_KEY_STREET:  return searchOccuranceForStreet(address, ogcioRecordElement); break;
        case OGCIO_KEY_VILLAGE: return searchOccuranceForVillage(address, ogcioRecordElement); break;
        case OGCIO_KEY_BLOCK:   return searchOccuranceForBlock(address, ogcioRecordElement); break;
        case OGCIO_KEY_PHASE:   return searchOccuranceForPhase(address, ogcioRecordElement); break;
        case OGCIO_KEY_ESTATE:  return searchOccuranceForEstate(address, ogcioRecordElement); break;
        case OGCIO_KEY_REGION:  return searchOccuranceForRegion(address, ogcioRecordElement); break;
        case OGCIO_KEY_BUILDING_NAME:   return searchOccuranceForBuildingName(address, ogcioRecordElement); break;
    }
    return null;
}

function findMatchFromOGCIORecord(address, ogcioRecord) {
    const matches = [];

    // First we look up everything that exists in that address
    for (const key of elementPriority) {
        if (ogcioRecord.chi[key] !== undefined && isChinese(address)) {
            //
            const occurance = searchOccurance(address, key, ogcioRecord.chi[key]);

            if (occurance === null) {
                continue;
            }
            matches.push(occurance);
        }

        if (ogcioRecord.eng[key] !== undefined && !isChinese(address)) {
            const occurance = searchOccurance(address, key, ogcioRecord.eng[key]);
            if (occurance === null) {
                continue;
            }
            matches.push(occurance);
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
    for (let record of normalizedOGCIOResult) {
        const matches = findMatchFromOGCIORecord(address, record);
        record.score = calculateScoreFromMatches(matches);
        record.matches = matches;
        // Also tranform the district code to name directly
        record = transformDistrict(record);
    }

    normalizedOGCIOResult = normalizedOGCIOResult.sort((a, b) => {
        return b.score - a.score;
    });
    return (normalizedOGCIOResult.slice(0, 200));
}


/**
 * Standalone version of address parsing.
 * @param {*} address
 * @param {*} responseFromOGCIO Raw json response from ogcio
 */
function searchResult(address, responseFromOGCIO) {
    const normalizedAddress = removeFloor(address).toUpperCase();
    const normalizedOGCIOResult = normalizeResponse(responseFromOGCIO);
    return parseAddress(normalizedAddress, normalizedOGCIOResult);
}

var ogcioParser = {
    searchResult,
    calculateScoreFromMatches
};

class Address {
  constructor() {
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
  components(lang) {
    return [];
  }

  componentLabelForKey(key, lang) {
    const component = this.components(lang).find(component => component.key === key);
    return component === undefined ? '' : component.translatedLabel;
  }

  componentValueForKey(key, lang) {
    const component = this.components(lang).find(component => component.key === key);
    return component === undefined ? '' : component.translatedValue;
  }

  fullAddress(lang) {
    return null;
  }

  coordinate() {
    return {
      lat: 0,
      lng: 0,
    }
  }

  coordinates() {
    return [];
  }

  // In the future it can be multiple source
  dataSource() {
    return null;
  }

  /**
   * Return a normalized confident level from 0 - 10
   */
  confidence() {
    return 0;
  }

  distanceTo(address) {
    const cord1 = point([this.coordinate().lng, this.coordinate().lat]);
    const cord2 = point([address.coordinate().lng, address.coordinate().lat]);

    return distance(cord1, cord2, {units: 'kilometers'});
  }
}

Address.LANG_EN = 'eng';
Address.LANG_ZH = 'chi';

/**
 * Some helper functions for showing OGCIO address result
 * definations:
 * https://www.als.ogcio.gov.hk/docs/Data_Dictionary_for_ALS_EN.pdf
 */

const OGCIO_KEY_BLOCK$1 = 'Block';
const OGCIO_KEY_PHASE$1 = 'Phase';
const OGCIO_KEY_ESTATE$1 = 'Estate';
const OGCIO_KEY_VILLAGE$1 = 'Village';
const OGCIO_KEY_REGION$1 = 'Region';
const OGCIO_KEY_STREET$1 = 'Street';
const OGCIO_KEY_DISTRICT = 'District';
const OGCIO_KEY_BUILDING_NAME$1 = 'BuildingName';

const keys = {
  eng: {
    // level 1 keys
    [OGCIO_KEY_BLOCK$1]: 'Block',
    [OGCIO_KEY_PHASE$1]: 'Phase',
    [OGCIO_KEY_ESTATE$1]: 'Estate',
    [OGCIO_KEY_VILLAGE$1]: 'Village',
    [OGCIO_KEY_REGION$1]: 'Region',
    [OGCIO_KEY_DISTRICT]: 'District',
    [OGCIO_KEY_STREET$1]: 'Street',
    [OGCIO_KEY_BUILDING_NAME$1]: 'Building Name',
    // level 2 keys
    [`${OGCIO_KEY_DISTRICT}.DcDistrict`]: '區議會分區',
    [`${OGCIO_KEY_STREET$1}.StreetName`]: 'Street Name',
    [`${OGCIO_KEY_STREET$1}.BuildingNoFrom`]: 'Street No. From',
    [`${OGCIO_KEY_STREET$1}.BuildingNoTo`]: 'Street No. To',
    [`${OGCIO_KEY_ESTATE$1}.EstateName`]: 'Estate Name',

  },
  chi: {
    // level 1 keys
    [OGCIO_KEY_BLOCK$1]: '座數',
    [OGCIO_KEY_PHASE$1]: '期數',
    [OGCIO_KEY_ESTATE$1]: '屋邨',
    [OGCIO_KEY_VILLAGE$1]: '鄉村',
    [OGCIO_KEY_REGION$1]: '區域',
    [OGCIO_KEY_DISTRICT]: '地區',
    [OGCIO_KEY_STREET$1]: '街道',
    [OGCIO_KEY_BUILDING_NAME$1]: '大廈名稱',
    // level 2 keys
    [`${OGCIO_KEY_DISTRICT}.DcDistrict`]: '區議會分區',
    [`${OGCIO_KEY_STREET$1}.StreetName`]: '街道',
    [`${OGCIO_KEY_STREET$1}.BuildingNoFrom`]: '街號',
    [`${OGCIO_KEY_STREET$1}.BuildingNoTo`]: '街號',
    [`${OGCIO_KEY_ESTATE$1}.EstateName`]: '屋邨',
  }
};


function safeFieldValue(obj, key) {
  return obj && obj[key] ? obj[key]: '';
}

function textForKey(key, lang) {
  return keys[lang]
    ? (keys[lang][key]
      ? keys[lang][key]
      : key)
    : key;
}


function engBuildingNumberFromField(field) {
  if (!field || (!field.BuildingNoFrom && !field.BuildingNoTo)) {
    return '';
  }
  if (field.BuildingNoFrom && field.BuildingNoTo) {
    return `${field.BuildingNoFrom}-${field.BuildingNoTo}`;
  } else {
    return `${field.BuildingNoTo ? field.BuildingNoTo : field.BuildingNoFrom}`;
  }
}


function chineseBuildingNumberFromField(field) {
  if (!field || (!field.BuildingNoFrom && !field.BuildingNoTo)) {
    return '';
  }
  if (field.BuildingNoFrom && field.BuildingNoTo) {
    return `${field.BuildingNoFrom}至${field.BuildingNoTo}號`;
  } else {
    return `${field.BuildingNoTo ? field.BuildingNoTo : field.BuildingNoFrom}號`;
  }
}

function prettyPrintBlock(blockObj, lang) {
  if (lang === 'chi') {
    return `${blockObj.BlockNo}${blockObj.BlockDescriptor}`;
  } else if (lang === 'eng') {
    return `${blockObj.BlockDescriptor}${blockObj.BlockNo}`;
  }
}

function prettyPrintEstate(estateObj, lang) {
  let estateName = estateObj.EstateName;
  const phase = estateObj[OGCIO_KEY_PHASE$1];
  if (lang === 'chi') {
    if (phase) {
      estateName = `${estateName}${safeFieldValue(estateObj[OGCIO_KEY_PHASE$1], 'PhaseNo')}${safeFieldValue(estateObj[OGCIO_KEY_PHASE$1], 'PhaseName')}`;
    }

  } else if (lang === 'eng') {
    if (phase) {
      estateName = `${safeFieldValue(estateObj[OGCIO_KEY_PHASE$1], 'PhaseName')}${safeFieldValue(estateObj[OGCIO_KEY_PHASE$1], 'PhaseNo')},${estateName}`;
    }
  }
  return estateName;
}

function prettyPrintStreet(streetObj, lang) {
  if (lang === 'chi') {
    return `${safeFieldValue(streetObj, 'StreetName')}${chineseBuildingNumberFromField(streetObj)}`;
  } else if (lang === 'eng') {
    return `${engBuildingNumberFromField(streetObj)} ${safeFieldValue(streetObj, 'StreetName')}`;
  }
}

function textForValue(record, key, lang) {

  if (!record[lang]) {
    return '';
  }

  if (typeof(record[lang][key]) === 'string') {
    return record[lang][key];
  }

  if (key === OGCIO_KEY_ESTATE$1) {
    return prettyPrintEstate(record[lang][key], lang);
  } else if (key === OGCIO_KEY_BLOCK$1) {
    return prettyPrintBlock(record[lang][key], lang);
  } else if (key === OGCIO_KEY_STREET$1) {
    return prettyPrintStreet(record[lang][key], lang);
  }

  return Object.values(record[lang][key]).join();
}




/**
 * Format the chinese address from the given result set
 * @param {*} result
 */
function fullChineseAddressFromResult (result) {
  const { Street, Block, Phase, Estate, Village } = result;
  const region = safeFieldValue(result, 'Region');
  const streetName = safeFieldValue(Street, 'StreetName');
  const streetNumber = chineseBuildingNumberFromField(Street);
  const villageName = safeFieldValue(Village, 'VillageName');
  const villageNumber = chineseBuildingNumberFromField(Village);
  const buildingName = safeFieldValue(result, 'BuildingName');

  return `${region}${villageName}${villageNumber}${streetName}${streetNumber}${buildingName}`.trim();
}

/**
 * Format the english address from the given result set
 * @param {*} result
 */
function fullEnglishAddressFromResult (result) {
  const { Street, Block, Phase, Estate, Village } = result;
  const region = safeFieldValue(result, 'Region');
  const streetName = safeFieldValue(Street, 'StreetName');
  const streetNumber = engBuildingNumberFromField(Street);
  const villageName = safeFieldValue(Village, 'VillageName');
  const villageNumber = engBuildingNumberFromField(Village);
  const buildingName = safeFieldValue(result, 'BuildingName');
  return [buildingName,`${streetNumber} ${streetName}`,`${villageNumber} ${villageName}`,region].filter(token => token.match(/\S/)).join(', ');

}


var ogcioHelper = {
  topLevelKeys: () => Object.keys(keys.chi).map((key) => ({ key, value: keys.chi[key] })).filter(key => !key.key.includes('.')),
  textForKey,
  textForValue,
  fullEnglishAddressFromResult,
  fullChineseAddressFromResult
};

class OGCIOAddress extends Address {
    constructor(ogcioRecord) {
        super();
        this.record = ogcioRecord;
        this.flattenedComponents = null;
    }

    components(lang) {
        if (this.flattenedComponents === null) {
            this.flattenedComponents = this.flattenComponents();
        }
        if (lang === Address.LANG_EN) {
            return this.flattenedComponents['eng'];
        } else {
            return this.flattenedComponents['chi'];
        }
    }

    flattenComponents() {
        const flattenedComponents = {
            [Address.LANG_EN]: [],
            [Address.LANG_ZH]: [],
        };
        const langs = [Address.LANG_ZH, Address.LANG_EN];
        for (const lang of langs) {
            for (const key of Object.keys(this.record[lang])) {
                flattenedComponents[lang].push({
                    key,
                    translatedLabel: ogcioHelper.textForKey(key, lang),
                    translatedValue: ogcioHelper.textForValue(this.record, key, lang),
                });
            }
        }

        return flattenedComponents;
    }

    fullAddress(lang) {
        if (lang === Address.LANG_EN) {
            return ogcioHelper.fullEnglishAddressFromResult(this.record['eng']);
        } else {
            return ogcioHelper.fullChineseAddressFromResult(this.record['chi']);
        }
    }

    coordinate() {
        const geo = {
            lat: 0,
            lng: 0,
        };
        if (this.record.geo !== undefined && this.record.geo.length > 0) {
            geo.lat = this.record.geo[0].Latitude;
            geo.lng = this.record.geo[0].Longitude;
        }
        return geo;
    }

    coordinates() {
        if (this.record.geo !== undefined && this.record.geo.length > 0) {
            return this.record.geo.map(geo => ({
                lat: geo.Latitude,
                lng: geo.Longitude
            }));
        }
        return [];
    }

    // In the future it can be multiple source
    dataSource() {
        return '資科辦';
    }

    confidence() {
        return Math.min(
            4,
            (this.record.matches
                    .filter(match => match.matchedKey === key)
                    .map(match => match.confident)
                    .reduce((p, c) => c, 0) *
                5) |
            0
        );
    }
}

class LandAddress extends Address{
  constructor(landRecord) {
    super();
    this.record = landRecord;
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
  components(lang) {
    if (lang === Address.LANG_EN) {
      return [{
        translatedValue: this.record.nameEN,
        key: name,
        translatedLabel: "Name"
      }];
    } else if (lang === Address.LANG_ZH) {
      return [{
        translatedValue: this.record.nameZH,
        key: name,
        translatedLabel: "Name"
      }];
    }
  }

  fullAddress(lang) {
    if (lang === Address.LANG_EN) {
      return this.record.addressEN;
    } else if (lang === Address.LANG_ZH) {
      return this.record.addressZH;
    }
  }

  coordinate() {
    return {
      lat: this.record.lat,
      lng: this.record.lng,
    }
  }

  coordinates() {
    return [{
      lat: this.record.lat,
      lng: this.record.lng,
    }];
  }

  // In the future it can be multiple source
  dataSource() {
    return '地政總署';
  }

  /**
   * Return a normalized confident level from 0 - 10
   */
  confidence() {
    return 0;
  }
}

const createAddress = function (type, record) {
    switch (type) {
        case "ogcio": return new OGCIOAddress(record);
        case "land" : return new LandAddress(record);
        default:      return new Address(record);
    }
};

proj4.defs([
    [
      "EPSG:2326",
      "+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs"],
    [
      "EPSG:4326",
      "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
    ]
  ]);

var ProjConvertor = {
    projTransform: (fromProjection, toProjection, coordinates) => {
        return proj4(proj4(fromProjection), proj4(toProjection), coordinates)
    }
};

const normalizeString = (str) => {
  return str.replace(/,/g, ' ')
};

const sortLandResult = (searchString, landResults) => {
  const normalizeSearchString = normalizeString(searchString);
  const container = landResults.map(
    landAddress => ({
      landAddress,
      lcs: Math.max(
        lcs(normalizeSearchString, normalizeString(landAddress.fullAddress('chi'))),
        lcs(normalizeSearchString, normalizeString(landAddress.fullAddress('eng')))
        ),
    })
  );

  container.sort( (a, b) => b.lcs - a.lcs);

  return container.map(c => c.landAddress);
};

const lcs = (str1, str2) => {
  const m = str1.length + 1;
  const n = str2.length + 1;

  const lcsTable = new Array(m);
  for (let i = 0; i < m; i++) {
    lcsTable[i] = new Array(n);
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (i === 0 || j === 0) {
        lcsTable[i][j] = 0;
      } else if (str1[i] === str2[j]) {
        lcsTable[i][j] = 1 + lcsTable[i - 1][j - 1];
      } else {
        lcsTable[i][j] = Math.max(lcsTable[i - 1][j], lcsTable[i][j - 1]);
      }
    }
  }
  return lcsTable[m - 1][n - 1];


};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n.default || n;
}

// Based on https://github.com/tmpvar/jsdom/blob/aa85b2abf07766ff7bf5c1f6daafb3726f2f2db5/lib/jsdom/living/blob.js
// (MIT licensed)

const BUFFER = Symbol('buffer');
const TYPE = Symbol('type');

class Blob {
	constructor() {
		this[TYPE] = '';

		const blobParts = arguments[0];
		const options = arguments[1];

		const buffers = [];

		if (blobParts) {
			const a = blobParts;
			const length = Number(a.length);
			for (let i = 0; i < length; i++) {
				const element = a[i];
				let buffer;
				if (element instanceof Buffer) {
					buffer = element;
				} else if (ArrayBuffer.isView(element)) {
					buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
				} else if (element instanceof ArrayBuffer) {
					buffer = Buffer.from(element);
				} else if (element instanceof Blob) {
					buffer = element[BUFFER];
				} else {
					buffer = Buffer.from(typeof element === 'string' ? element : String(element));
				}
				buffers.push(buffer);
			}
		}

		this[BUFFER] = Buffer.concat(buffers);

		let type = options && options.type !== undefined && String(options.type).toLowerCase();
		if (type && !/[^\u0020-\u007E]/.test(type)) {
			this[TYPE] = type;
		}
	}
	get size() {
		return this[BUFFER].length;
	}
	get type() {
		return this[TYPE];
	}
	slice() {
		const size = this.size;

		const start = arguments[0];
		const end = arguments[1];
		let relativeStart, relativeEnd;
		if (start === undefined) {
			relativeStart = 0;
		} else if (start < 0) {
			relativeStart = Math.max(size + start, 0);
		} else {
			relativeStart = Math.min(start, size);
		}
		if (end === undefined) {
			relativeEnd = size;
		} else if (end < 0) {
			relativeEnd = Math.max(size + end, 0);
		} else {
			relativeEnd = Math.min(end, size);
		}
		const span = Math.max(relativeEnd - relativeStart, 0);

		const buffer = this[BUFFER];
		const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
		const blob = new Blob([], { type: arguments[2] });
		blob[BUFFER] = slicedBuffer;
		return blob;
	}
}

Object.defineProperties(Blob.prototype, {
	size: { enumerable: true },
	type: { enumerable: true },
	slice: { enumerable: true }
});

Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
	value: 'Blob',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * fetch-error.js
 *
 * FetchError interface for operational errors
 */

/**
 * Create FetchError instance
 *
 * @param   String      message      Error message for human
 * @param   String      type         Error type for machine
 * @param   String      systemError  For Node.js system error
 * @return  FetchError
 */
function FetchError(message, type, systemError) {
  Error.call(this, message);

  this.message = message;
  this.type = type;

  // when err.type is `system`, err.code contains system error code
  if (systemError) {
    this.code = this.errno = systemError.code;
  }

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;
FetchError.prototype.name = 'FetchError';

let convert;
try {
	convert = require('encoding').convert;
} catch (e) {}

const INTERNALS = Symbol('Body internals');

// fix an issue where "PassThrough" isn't a named export for node <10
const PassThrough = Stream.PassThrough;

/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
function Body(body) {
	var _this = this;

	var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
	    _ref$size = _ref.size;

	let size = _ref$size === undefined ? 0 : _ref$size;
	var _ref$timeout = _ref.timeout;
	let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

	if (body == null) {
		// body is undefined or null
		body = null;
	} else if (typeof body === 'string') ; else if (isURLSearchParams(body)) ; else if (body instanceof Blob) ; else if (Buffer.isBuffer(body)) ; else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') ; else if (ArrayBuffer.isView(body)) ; else if (body instanceof Stream) ; else {
		// none of the above
		// coerce to string
		body = String(body);
	}
	this[INTERNALS] = {
		body,
		disturbed: false,
		error: null
	};
	this.size = size;
	this.timeout = timeout;

	if (body instanceof Stream) {
		body.on('error', function (err) {
			const error = err.name === 'AbortError' ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, 'system', err);
			_this[INTERNALS].error = error;
		});
	}
}

Body.prototype = {
	get body() {
		return this[INTERNALS].body;
	},

	get bodyUsed() {
		return this[INTERNALS].disturbed;
	},

	/**
  * Decode response as ArrayBuffer
  *
  * @return  Promise
  */
	arrayBuffer() {
		return consumeBody.call(this).then(function (buf) {
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		});
	},

	/**
  * Return raw response as Blob
  *
  * @return Promise
  */
	blob() {
		let ct = this.headers && this.headers.get('content-type') || '';
		return consumeBody.call(this).then(function (buf) {
			return Object.assign(
			// Prevent copying
			new Blob([], {
				type: ct.toLowerCase()
			}), {
				[BUFFER]: buf
			});
		});
	},

	/**
  * Decode response as json
  *
  * @return  Promise
  */
	json() {
		var _this2 = this;

		return consumeBody.call(this).then(function (buffer) {
			try {
				return JSON.parse(buffer.toString());
			} catch (err) {
				return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, 'invalid-json'));
			}
		});
	},

	/**
  * Decode response as text
  *
  * @return  Promise
  */
	text() {
		return consumeBody.call(this).then(function (buffer) {
			return buffer.toString();
		});
	},

	/**
  * Decode response as buffer (non-spec api)
  *
  * @return  Promise
  */
	buffer() {
		return consumeBody.call(this);
	},

	/**
  * Decode response as text, while automatically detecting the encoding and
  * trying to decode to UTF-8 (non-spec api)
  *
  * @return  Promise
  */
	textConverted() {
		var _this3 = this;

		return consumeBody.call(this).then(function (buffer) {
			return convertBody(buffer, _this3.headers);
		});
	}

};

// In browsers, all properties are enumerable.
Object.defineProperties(Body.prototype, {
	body: { enumerable: true },
	bodyUsed: { enumerable: true },
	arrayBuffer: { enumerable: true },
	blob: { enumerable: true },
	json: { enumerable: true },
	text: { enumerable: true }
});

Body.mixIn = function (proto) {
	for (const name of Object.getOwnPropertyNames(Body.prototype)) {
		// istanbul ignore else: future proof
		if (!(name in proto)) {
			const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
			Object.defineProperty(proto, name, desc);
		}
	}
};

/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return  Promise
 */
function consumeBody() {
	var _this4 = this;

	if (this[INTERNALS].disturbed) {
		return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
	}

	this[INTERNALS].disturbed = true;

	if (this[INTERNALS].error) {
		return Body.Promise.reject(this[INTERNALS].error);
	}

	// body is null
	if (this.body === null) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is string
	if (typeof this.body === 'string') {
		return Body.Promise.resolve(Buffer.from(this.body));
	}

	// body is blob
	if (this.body instanceof Blob) {
		return Body.Promise.resolve(this.body[BUFFER]);
	}

	// body is buffer
	if (Buffer.isBuffer(this.body)) {
		return Body.Promise.resolve(this.body);
	}

	// body is ArrayBuffer
	if (Object.prototype.toString.call(this.body) === '[object ArrayBuffer]') {
		return Body.Promise.resolve(Buffer.from(this.body));
	}

	// body is ArrayBufferView
	if (ArrayBuffer.isView(this.body)) {
		return Body.Promise.resolve(Buffer.from(this.body.buffer, this.body.byteOffset, this.body.byteLength));
	}

	// istanbul ignore if: should never happen
	if (!(this.body instanceof Stream)) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is stream
	// get ready to actually consume the body
	let accum = [];
	let accumBytes = 0;
	let abort = false;

	return new Body.Promise(function (resolve, reject) {
		let resTimeout;

		// allow timeout on slow response body
		if (_this4.timeout) {
			resTimeout = setTimeout(function () {
				abort = true;
				reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, 'body-timeout'));
			}, _this4.timeout);
		}

		// handle stream errors
		_this4.body.on('error', function (err) {
			if (err.name === 'AbortError') {
				// if the request was aborted, reject with this Error
				abort = true;
				reject(err);
			} else {
				// other errors, such as incorrect content-encoding
				reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, 'system', err));
			}
		});

		_this4.body.on('data', function (chunk) {
			if (abort || chunk === null) {
				return;
			}

			if (_this4.size && accumBytes + chunk.length > _this4.size) {
				abort = true;
				reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, 'max-size'));
				return;
			}

			accumBytes += chunk.length;
			accum.push(chunk);
		});

		_this4.body.on('end', function () {
			if (abort) {
				return;
			}

			clearTimeout(resTimeout);

			try {
				resolve(Buffer.concat(accum));
			} catch (err) {
				// handle streams that have accumulated too much data (issue #414)
				reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, 'system', err));
			}
		});
	});
}

/**
 * Detect buffer encoding and convert to target encoding
 * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
 *
 * @param   Buffer  buffer    Incoming buffer
 * @param   String  encoding  Target encoding
 * @return  String
 */
function convertBody(buffer, headers) {
	if (typeof convert !== 'function') {
		throw new Error('The package `encoding` must be installed to use the textConverted() function');
	}

	const ct = headers.get('content-type');
	let charset = 'utf-8';
	let res, str;

	// header
	if (ct) {
		res = /charset=([^;]*)/i.exec(ct);
	}

	// no charset in content type, peek at response body for at most 1024 bytes
	str = buffer.slice(0, 1024).toString();

	// html5
	if (!res && str) {
		res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
	}

	// html4
	if (!res && str) {
		res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);

		if (res) {
			res = /charset=(.*)/i.exec(res.pop());
		}
	}

	// xml
	if (!res && str) {
		res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
	}

	// found charset
	if (res) {
		charset = res.pop();

		// prevent decode issues when sites use incorrect encoding
		// ref: https://hsivonen.fi/encoding-menu/
		if (charset === 'gb2312' || charset === 'gbk') {
			charset = 'gb18030';
		}
	}

	// turn raw buffers into a single utf-8 buffer
	return convert(buffer, 'UTF-8', charset).toString();
}

/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */
function isURLSearchParams(obj) {
	// Duck-typing as a necessary condition.
	if (typeof obj !== 'object' || typeof obj.append !== 'function' || typeof obj.delete !== 'function' || typeof obj.get !== 'function' || typeof obj.getAll !== 'function' || typeof obj.has !== 'function' || typeof obj.set !== 'function') {
		return false;
	}

	// Brand-checking and more duck-typing as optional condition.
	return obj.constructor.name === 'URLSearchParams' || Object.prototype.toString.call(obj) === '[object URLSearchParams]' || typeof obj.sort === 'function';
}

/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed  instance  Response or Request instance
 * @return  Mixed
 */
function clone(instance) {
	let p1, p2;
	let body = instance.body;

	// don't allow cloning a used body
	if (instance.bodyUsed) {
		throw new Error('cannot clone body after it is used');
	}

	// check that body is a stream and not form-data object
	// note: we can't clone the form-data object without having it as a dependency
	if (body instanceof Stream && typeof body.getBoundary !== 'function') {
		// tee instance body
		p1 = new PassThrough();
		p2 = new PassThrough();
		body.pipe(p1);
		body.pipe(p2);
		// set instance body to teed body and return the other teed body
		instance[INTERNALS].body = p1;
		body = p2;
	}

	return body;
}

/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param   Mixed  instance  Response or Request instance
 */
function extractContentType(instance) {
	const body = instance.body;

	// istanbul ignore if: Currently, because of a guard in Request, body
	// can never be null. Included here for completeness.

	if (body === null) {
		// body is null
		return null;
	} else if (typeof body === 'string') {
		// body is string
		return 'text/plain;charset=UTF-8';
	} else if (isURLSearchParams(body)) {
		// body is a URLSearchParams
		return 'application/x-www-form-urlencoded;charset=UTF-8';
	} else if (body instanceof Blob) {
		// body is blob
		return body.type || null;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return null;
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		return null;
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		return null;
	} else if (typeof body.getBoundary === 'function') {
		// detect form data input from form-data module
		return `multipart/form-data;boundary=${body.getBoundary()}`;
	} else {
		// body is stream
		// can't really do much about this
		return null;
	}
}

/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param   Body    instance   Instance of Body
 * @return  Number?            Number of bytes, or null if not possible
 */
function getTotalBytes(instance) {
	const body = instance.body;

	// istanbul ignore if: included for completion

	if (body === null) {
		// body is null
		return 0;
	} else if (typeof body === 'string') {
		// body is string
		return Buffer.byteLength(body);
	} else if (isURLSearchParams(body)) {
		// body is URLSearchParams
		return Buffer.byteLength(String(body));
	} else if (body instanceof Blob) {
		// body is blob
		return body.size;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return body.length;
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		return body.byteLength;
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		return body.byteLength;
	} else if (body && typeof body.getLengthSync === 'function') {
		// detect form data input from form-data module
		if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
		body.hasKnownLength && body.hasKnownLength()) {
			// 2.x
			return body.getLengthSync();
		}
		return null;
	} else {
		// body is stream
		// can't really do much about this
		return null;
	}
}

/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param   Body    instance   Instance of Body
 * @return  Void
 */
function writeToStream(dest, instance) {
	const body = instance.body;


	if (body === null) {
		// body is null
		dest.end();
	} else if (typeof body === 'string') {
		// body is string
		dest.write(body);
		dest.end();
	} else if (isURLSearchParams(body)) {
		// body is URLSearchParams
		dest.write(Buffer.from(String(body)));
		dest.end();
	} else if (body instanceof Blob) {
		// body is blob
		dest.write(body[BUFFER]);
		dest.end();
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		dest.write(body);
		dest.end();
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		dest.write(Buffer.from(body));
		dest.end();
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		dest.write(Buffer.from(body.buffer, body.byteOffset, body.byteLength));
		dest.end();
	} else {
		// body is stream
		body.pipe(dest);
	}
}

// expose Promise
Body.Promise = global.Promise;

/**
 * headers.js
 *
 * Headers class offers convenient helpers
 */

const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

function validateName(name) {
	name = `${name}`;
	if (invalidTokenRegex.test(name)) {
		throw new TypeError(`${name} is not a legal HTTP header name`);
	}
}

function validateValue(value) {
	value = `${value}`;
	if (invalidHeaderCharRegex.test(value)) {
		throw new TypeError(`${value} is not a legal HTTP header value`);
	}
}

/**
 * Find the key in the map object given a header name.
 *
 * Returns undefined if not found.
 *
 * @param   String  name  Header name
 * @return  String|Undefined
 */
function find(map, name) {
	name = name.toLowerCase();
	for (const key in map) {
		if (key.toLowerCase() === name) {
			return key;
		}
	}
	return undefined;
}

const MAP = Symbol('map');
class Headers {
	/**
  * Headers class
  *
  * @param   Object  headers  Response headers
  * @return  Void
  */
	constructor() {
		let init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

		this[MAP] = Object.create(null);

		if (init instanceof Headers) {
			const rawHeaders = init.raw();
			const headerNames = Object.keys(rawHeaders);

			for (const headerName of headerNames) {
				for (const value of rawHeaders[headerName]) {
					this.append(headerName, value);
				}
			}

			return;
		}

		// We don't worry about converting prop to ByteString here as append()
		// will handle it.
		if (init == null) ; else if (typeof init === 'object') {
			const method = init[Symbol.iterator];
			if (method != null) {
				if (typeof method !== 'function') {
					throw new TypeError('Header pairs must be iterable');
				}

				// sequence<sequence<ByteString>>
				// Note: per spec we have to first exhaust the lists then process them
				const pairs = [];
				for (const pair of init) {
					if (typeof pair !== 'object' || typeof pair[Symbol.iterator] !== 'function') {
						throw new TypeError('Each header pair must be iterable');
					}
					pairs.push(Array.from(pair));
				}

				for (const pair of pairs) {
					if (pair.length !== 2) {
						throw new TypeError('Each header pair must be a name/value tuple');
					}
					this.append(pair[0], pair[1]);
				}
			} else {
				// record<ByteString, ByteString>
				for (const key of Object.keys(init)) {
					const value = init[key];
					this.append(key, value);
				}
			}
		} else {
			throw new TypeError('Provided initializer must be an object');
		}
	}

	/**
  * Return combined header value given name
  *
  * @param   String  name  Header name
  * @return  Mixed
  */
	get(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key === undefined) {
			return null;
		}

		return this[MAP][key].join(', ');
	}

	/**
  * Iterate over all headers
  *
  * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
  * @param   Boolean   thisArg   `this` context for callback function
  * @return  Void
  */
	forEach(callback) {
		let thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

		let pairs = getHeaders(this);
		let i = 0;
		while (i < pairs.length) {
			var _pairs$i = pairs[i];
			const name = _pairs$i[0],
			      value = _pairs$i[1];

			callback.call(thisArg, value, name, this);
			pairs = getHeaders(this);
			i++;
		}
	}

	/**
  * Overwrite header values given name
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	set(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		this[MAP][key !== undefined ? key : name] = [value];
	}

	/**
  * Append a value onto existing header
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	append(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			this[MAP][key].push(value);
		} else {
			this[MAP][name] = [value];
		}
	}

	/**
  * Check for header name existence
  *
  * @param   String   name  Header name
  * @return  Boolean
  */
	has(name) {
		name = `${name}`;
		validateName(name);
		return find(this[MAP], name) !== undefined;
	}

	/**
  * Delete all header values given name
  *
  * @param   String  name  Header name
  * @return  Void
  */
	delete(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			delete this[MAP][key];
		}
	}

	/**
  * Return raw headers (non-spec api)
  *
  * @return  Object
  */
	raw() {
		return this[MAP];
	}

	/**
  * Get an iterator on keys.
  *
  * @return  Iterator
  */
	keys() {
		return createHeadersIterator(this, 'key');
	}

	/**
  * Get an iterator on values.
  *
  * @return  Iterator
  */
	values() {
		return createHeadersIterator(this, 'value');
	}

	/**
  * Get an iterator on entries.
  *
  * This is the default iterator of the Headers object.
  *
  * @return  Iterator
  */
	[Symbol.iterator]() {
		return createHeadersIterator(this, 'key+value');
	}
}
Headers.prototype.entries = Headers.prototype[Symbol.iterator];

Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
	value: 'Headers',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Headers.prototype, {
	get: { enumerable: true },
	forEach: { enumerable: true },
	set: { enumerable: true },
	append: { enumerable: true },
	has: { enumerable: true },
	delete: { enumerable: true },
	keys: { enumerable: true },
	values: { enumerable: true },
	entries: { enumerable: true }
});

function getHeaders(headers) {
	let kind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'key+value';

	const keys = Object.keys(headers[MAP]).sort();
	return keys.map(kind === 'key' ? function (k) {
		return k.toLowerCase();
	} : kind === 'value' ? function (k) {
		return headers[MAP][k].join(', ');
	} : function (k) {
		return [k.toLowerCase(), headers[MAP][k].join(', ')];
	});
}

const INTERNAL = Symbol('internal');

function createHeadersIterator(target, kind) {
	const iterator = Object.create(HeadersIteratorPrototype);
	iterator[INTERNAL] = {
		target,
		kind,
		index: 0
	};
	return iterator;
}

const HeadersIteratorPrototype = Object.setPrototypeOf({
	next() {
		// istanbul ignore if
		if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
			throw new TypeError('Value of `this` is not a HeadersIterator');
		}

		var _INTERNAL = this[INTERNAL];
		const target = _INTERNAL.target,
		      kind = _INTERNAL.kind,
		      index = _INTERNAL.index;

		const values = getHeaders(target, kind);
		const len = values.length;
		if (index >= len) {
			return {
				value: undefined,
				done: true
			};
		}

		this[INTERNAL].index = index + 1;

		return {
			value: values[index],
			done: false
		};
	}
}, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));

Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
	value: 'HeadersIterator',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * Export the Headers object in a form that Node.js can consume.
 *
 * @param   Headers  headers
 * @return  Object
 */
function exportNodeCompatibleHeaders(headers) {
	const obj = Object.assign({ __proto__: null }, headers[MAP]);

	// http.request() only supports string as Host header. This hack makes
	// specifying custom Host header possible.
	const hostHeaderKey = find(headers[MAP], 'Host');
	if (hostHeaderKey !== undefined) {
		obj[hostHeaderKey] = obj[hostHeaderKey][0];
	}

	return obj;
}

/**
 * Create a Headers object from an object of headers, ignoring those that do
 * not conform to HTTP grammar productions.
 *
 * @param   Object  obj  Object of headers
 * @return  Headers
 */
function createHeadersLenient(obj) {
	const headers = new Headers();
	for (const name of Object.keys(obj)) {
		if (invalidTokenRegex.test(name)) {
			continue;
		}
		if (Array.isArray(obj[name])) {
			for (const val of obj[name]) {
				if (invalidHeaderCharRegex.test(val)) {
					continue;
				}
				if (headers[MAP][name] === undefined) {
					headers[MAP][name] = [val];
				} else {
					headers[MAP][name].push(val);
				}
			}
		} else if (!invalidHeaderCharRegex.test(obj[name])) {
			headers[MAP][name] = [obj[name]];
		}
	}
	return headers;
}

const INTERNALS$1 = Symbol('Response internals');

// fix an issue where "STATUS_CODES" aren't a named export for node <10
const STATUS_CODES = http.STATUS_CODES;

/**
 * Response class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Response {
	constructor() {
		let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		Body.call(this, body, opts);

		const status = opts.status || 200;

		this[INTERNALS$1] = {
			url: opts.url,
			status,
			statusText: opts.statusText || STATUS_CODES[status],
			headers: new Headers(opts.headers)
		};
	}

	get url() {
		return this[INTERNALS$1].url;
	}

	get status() {
		return this[INTERNALS$1].status;
	}

	/**
  * Convenience property representing if the request ended normally
  */
	get ok() {
		return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
	}

	get statusText() {
		return this[INTERNALS$1].statusText;
	}

	get headers() {
		return this[INTERNALS$1].headers;
	}

	/**
  * Clone this response
  *
  * @return  Response
  */
	clone() {
		return new Response(clone(this), {
			url: this.url,
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
			ok: this.ok
		});
	}
}

Body.mixIn(Response.prototype);

Object.defineProperties(Response.prototype, {
	url: { enumerable: true },
	status: { enumerable: true },
	ok: { enumerable: true },
	statusText: { enumerable: true },
	headers: { enumerable: true },
	clone: { enumerable: true }
});

Object.defineProperty(Response.prototype, Symbol.toStringTag, {
	value: 'Response',
	writable: false,
	enumerable: false,
	configurable: true
});

const INTERNALS$2 = Symbol('Request internals');

// fix an issue where "format", "parse" aren't a named export for node <10
const parse_url = Url.parse;
const format_url = Url.format;

const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;

/**
 * Check if a value is an instance of Request.
 *
 * @param   Mixed   input
 * @return  Boolean
 */
function isRequest(input) {
	return typeof input === 'object' && typeof input[INTERNALS$2] === 'object';
}

function isAbortSignal(signal) {
	const proto = signal && typeof signal === 'object' && Object.getPrototypeOf(signal);
	return !!(proto && proto.constructor.name === 'AbortSignal');
}

/**
 * Request class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */
class Request {
	constructor(input) {
		let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		let parsedURL;

		// normalize input
		if (!isRequest(input)) {
			if (input && input.href) {
				// in order to support Node.js' Url objects; though WHATWG's URL objects
				// will fall into this branch also (since their `toString()` will return
				// `href` property anyway)
				parsedURL = parse_url(input.href);
			} else {
				// coerce input to a string before attempting to parse
				parsedURL = parse_url(`${input}`);
			}
			input = {};
		} else {
			parsedURL = parse_url(input.url);
		}

		let method = init.method || input.method || 'GET';
		method = method.toUpperCase();

		if ((init.body != null || isRequest(input) && input.body !== null) && (method === 'GET' || method === 'HEAD')) {
			throw new TypeError('Request with GET/HEAD method cannot have body');
		}

		let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;

		Body.call(this, inputBody, {
			timeout: init.timeout || input.timeout || 0,
			size: init.size || input.size || 0
		});

		const headers = new Headers(init.headers || input.headers || {});

		if (init.body != null) {
			const contentType = extractContentType(this);
			if (contentType !== null && !headers.has('Content-Type')) {
				headers.append('Content-Type', contentType);
			}
		}

		let signal = isRequest(input) ? input.signal : null;
		if ('signal' in init) signal = init.signal;

		if (signal != null && !isAbortSignal(signal)) {
			throw new TypeError('Expected signal to be an instanceof AbortSignal');
		}

		this[INTERNALS$2] = {
			method,
			redirect: init.redirect || input.redirect || 'follow',
			headers,
			parsedURL,
			signal
		};

		// node-fetch-only options
		this.follow = init.follow !== undefined ? init.follow : input.follow !== undefined ? input.follow : 20;
		this.compress = init.compress !== undefined ? init.compress : input.compress !== undefined ? input.compress : true;
		this.counter = init.counter || input.counter || 0;
		this.agent = init.agent || input.agent;
	}

	get method() {
		return this[INTERNALS$2].method;
	}

	get url() {
		return format_url(this[INTERNALS$2].parsedURL);
	}

	get headers() {
		return this[INTERNALS$2].headers;
	}

	get redirect() {
		return this[INTERNALS$2].redirect;
	}

	get signal() {
		return this[INTERNALS$2].signal;
	}

	/**
  * Clone this request
  *
  * @return  Request
  */
	clone() {
		return new Request(this);
	}
}

Body.mixIn(Request.prototype);

Object.defineProperty(Request.prototype, Symbol.toStringTag, {
	value: 'Request',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Request.prototype, {
	method: { enumerable: true },
	url: { enumerable: true },
	headers: { enumerable: true },
	redirect: { enumerable: true },
	clone: { enumerable: true },
	signal: { enumerable: true }
});

/**
 * Convert a Request to Node.js http request options.
 *
 * @param   Request  A Request instance
 * @return  Object   The options object to be passed to http.request
 */
function getNodeRequestOptions(request) {
	const parsedURL = request[INTERNALS$2].parsedURL;
	const headers = new Headers(request[INTERNALS$2].headers);

	// fetch step 1.3
	if (!headers.has('Accept')) {
		headers.set('Accept', '*/*');
	}

	// Basic fetch
	if (!parsedURL.protocol || !parsedURL.hostname) {
		throw new TypeError('Only absolute URLs are supported');
	}

	if (!/^https?:$/.test(parsedURL.protocol)) {
		throw new TypeError('Only HTTP(S) protocols are supported');
	}

	if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
		throw new Error('Cancellation of streamed requests with AbortSignal is not supported in node < 8');
	}

	// HTTP-network-or-cache fetch steps 2.4-2.7
	let contentLengthValue = null;
	if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
		contentLengthValue = '0';
	}
	if (request.body != null) {
		const totalBytes = getTotalBytes(request);
		if (typeof totalBytes === 'number') {
			contentLengthValue = String(totalBytes);
		}
	}
	if (contentLengthValue) {
		headers.set('Content-Length', contentLengthValue);
	}

	// HTTP-network-or-cache fetch step 2.11
	if (!headers.has('User-Agent')) {
		headers.set('User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)');
	}

	// HTTP-network-or-cache fetch step 2.15
	if (request.compress && !headers.has('Accept-Encoding')) {
		headers.set('Accept-Encoding', 'gzip,deflate');
	}

	if (!headers.has('Connection') && !request.agent) {
		headers.set('Connection', 'close');
	}

	// HTTP-network fetch step 4.2
	// chunked encoding is handled by Node.js

	return Object.assign({}, parsedURL, {
		method: request.method,
		headers: exportNodeCompatibleHeaders(headers),
		agent: request.agent
	});
}

/**
 * abort-error.js
 *
 * AbortError interface for cancelled requests
 */

/**
 * Create AbortError instance
 *
 * @param   String      message      Error message for human
 * @return  AbortError
 */
function AbortError(message) {
  Error.call(this, message);

  this.type = 'aborted';
  this.message = message;

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

AbortError.prototype = Object.create(Error.prototype);
AbortError.prototype.constructor = AbortError;
AbortError.prototype.name = 'AbortError';

// fix an issue where "PassThrough", "resolve" aren't a named export for node <10
const PassThrough$1 = Stream.PassThrough;
const resolve_url = Url.resolve;

/**
 * Fetch function
 *
 * @param   Mixed    url   Absolute url or Request instance
 * @param   Object   opts  Fetch options
 * @return  Promise
 */
function fetch$1(url, opts) {

	// allow custom promise
	if (!fetch$1.Promise) {
		throw new Error('native promise missing, set fetch.Promise to your favorite alternative');
	}

	Body.Promise = fetch$1.Promise;

	// wrap http.request into fetch
	return new fetch$1.Promise(function (resolve, reject) {
		// build request object
		const request = new Request(url, opts);
		const options = getNodeRequestOptions(request);

		const send = (options.protocol === 'https:' ? https : http).request;
		const signal = request.signal;

		let response = null;

		const abort = function abort() {
			let error = new AbortError('The user aborted a request.');
			reject(error);
			if (request.body && request.body instanceof Stream.Readable) {
				request.body.destroy(error);
			}
			if (!response || !response.body) return;
			response.body.emit('error', error);
		};

		if (signal && signal.aborted) {
			abort();
			return;
		}

		const abortAndFinalize = function abortAndFinalize() {
			abort();
			finalize();
		};

		// send request
		const req = send(options);
		let reqTimeout;

		if (signal) {
			signal.addEventListener('abort', abortAndFinalize);
		}

		function finalize() {
			req.abort();
			if (signal) signal.removeEventListener('abort', abortAndFinalize);
			clearTimeout(reqTimeout);
		}

		if (request.timeout) {
			req.once('socket', function (socket) {
				reqTimeout = setTimeout(function () {
					reject(new FetchError(`network timeout at: ${request.url}`, 'request-timeout'));
					finalize();
				}, request.timeout);
			});
		}

		req.on('error', function (err) {
			reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
			finalize();
		});

		req.on('response', function (res) {
			clearTimeout(reqTimeout);

			const headers = createHeadersLenient(res.headers);

			// HTTP fetch step 5
			if (fetch$1.isRedirect(res.statusCode)) {
				// HTTP fetch step 5.2
				const location = headers.get('Location');

				// HTTP fetch step 5.3
				const locationURL = location === null ? null : resolve_url(request.url, location);

				// HTTP fetch step 5.5
				switch (request.redirect) {
					case 'error':
						reject(new FetchError(`redirect mode is set to error: ${request.url}`, 'no-redirect'));
						finalize();
						return;
					case 'manual':
						// node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
						if (locationURL !== null) {
							// handle corrupted header
							try {
								headers.set('Location', locationURL);
							} catch (err) {
								// istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
								reject(err);
							}
						}
						break;
					case 'follow':
						// HTTP-redirect fetch step 2
						if (locationURL === null) {
							break;
						}

						// HTTP-redirect fetch step 5
						if (request.counter >= request.follow) {
							reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 6 (counter increment)
						// Create a new Request object.
						const requestOpts = {
							headers: new Headers(request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: request.body,
							signal: request.signal
						};

						// HTTP-redirect fetch step 9
						if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
							reject(new FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 11
						if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === 'POST') {
							requestOpts.method = 'GET';
							requestOpts.body = undefined;
							requestOpts.headers.delete('content-length');
						}

						// HTTP-redirect fetch step 15
						resolve(fetch$1(new Request(locationURL, requestOpts)));
						finalize();
						return;
				}
			}

			// prepare response
			res.once('end', function () {
				if (signal) signal.removeEventListener('abort', abortAndFinalize);
			});
			let body = res.pipe(new PassThrough$1());

			const response_options = {
				url: request.url,
				status: res.statusCode,
				statusText: res.statusMessage,
				headers: headers,
				size: request.size,
				timeout: request.timeout
			};

			// HTTP-network fetch step 12.1.1.3
			const codings = headers.get('Content-Encoding');

			// HTTP-network fetch step 12.1.1.4: handle content codings

			// in following scenarios we ignore compression support
			// 1. compression support is disabled
			// 2. HEAD request
			// 3. no Content-Encoding header
			// 4. no content response (204)
			// 5. content not modified response (304)
			if (!request.compress || request.method === 'HEAD' || codings === null || res.statusCode === 204 || res.statusCode === 304) {
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// For Node v6+
			// Be less strict when decoding compressed responses, since sometimes
			// servers send slightly invalid responses that are still accepted
			// by common browsers.
			// Always using Z_SYNC_FLUSH is what cURL does.
			const zlibOptions = {
				flush: zlib.Z_SYNC_FLUSH,
				finishFlush: zlib.Z_SYNC_FLUSH
			};

			// for gzip
			if (codings == 'gzip' || codings == 'x-gzip') {
				body = body.pipe(zlib.createGunzip(zlibOptions));
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// for deflate
			if (codings == 'deflate' || codings == 'x-deflate') {
				// handle the infamous raw deflate response from old servers
				// a hack for old IIS and Apache servers
				const raw = res.pipe(new PassThrough$1());
				raw.once('data', function (chunk) {
					// see http://stackoverflow.com/questions/37519828
					if ((chunk[0] & 0x0F) === 0x08) {
						body = body.pipe(zlib.createInflate());
					} else {
						body = body.pipe(zlib.createInflateRaw());
					}
					response = new Response(body, response_options);
					resolve(response);
				});
				return;
			}

			// otherwise, use response as-is
			response = new Response(body, response_options);
			resolve(response);
		});

		writeToStream(req, request);
	});
}
/**
 * Redirect code matching
 *
 * @param   Number   code  Status code
 * @return  Boolean
 */
fetch$1.isRedirect = function (code) {
	return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
};

// expose Promise
fetch$1.Promise = global.Promise;

var lib = /*#__PURE__*/Object.freeze({
  default: fetch$1,
  Headers: Headers,
  Request: Request,
  Response: Response,
  FetchError: FetchError
});

var nodeFetch = getCjsExportFromNamespace(lib);

var nodePonyfill = createCommonjsModule(function (module, exports) {
var realFetch = nodeFetch.default || nodeFetch;

var fetch = function (url, options) {
  // Support schemaless URIs on the server for parity with the browser.
  // Ex: //github.com/ -> https://github.com/
  if (/^\/\//.test(url)) {
    url = 'https:' + url;
  }
  return realFetch.call(this, url, options)
};

module.exports = exports = fetch;
exports.fetch = fetch;
exports.Headers = nodeFetch.Headers;
exports.Request = nodeFetch.Request;
exports.Response = nodeFetch.Response;

// Needed for TypeScript consumers without esModuleInterop.
exports.default = fetch;
});
var nodePonyfill_1 = nodePonyfill.fetch;
var nodePonyfill_2 = nodePonyfill.Headers;
var nodePonyfill_3 = nodePonyfill.Request;
var nodePonyfill_4 = nodePonyfill.Response;

var fetch$2 = nodePonyfill.fetch.bind({});

fetch$2.polyfill = true;

if (!commonjsGlobal.fetch) {
  commonjsGlobal.fetch = fetch$2;
  commonjsGlobal.Response = nodePonyfill.Response;
  commonjsGlobal.Headers = nodePonyfill.Headers;
  commonjsGlobal.Request = nodePonyfill.Request;
}

const OGCIO_RECORD_COUNT = 200;
const NEAR_THRESHOLD = 0.05; // 50 metre

/**
 *
 * @param {string} address
 * @returns Promise<Address[]>
 */
async function searchAddressWithOGCIO (address) {
    let results = [];
    try {
        const ogcioURL = `https://www.als.ogcio.gov.hk/lookup?q=${encodeURI(address)}&n=${OGCIO_RECORD_COUNT}`;
        const ogcioRes = await fetch(ogcioURL, {
            method: "GET",
            mode: "cors",
            headers: {
                "Accept": "application/json",
                "Accept-Language": "en,zh-Hant",
                "Accept-Encoding": "gzip",
            }
        });
        const ogcioData = await ogcioRes.json();
        results = (ogcioParser.searchResult(address, ogcioData)).map(record => createAddress("ogcio", record));
    } catch (err) {
        console.error(err);
        return Promise.reject(err);
    }
    return Promise.resolve(results);
}

async function searchAddressFromLand (address) {
    const landsURL = `https://geodata.gov.hk/gs/api/v1.0.0/locationSearch?q=${encodeURI(address)}`;
    const landsRes = await fetch(landsURL, {
        method: "GET",
        mode: "cors",
    });
    const landRecords = [];

    try {
        const landsData = await landsRes.json();
        for (const data of landsData) {
            let wgsLng, wgslat;
            [wgsLng, wgslat] = ProjConvertor.projTransform("EPSG:2326", "EPSG:4326", [data.x, data.y]);
            data.lat = Number.parseFloat(wgslat).toFixed(4);
            data.lng = Number.parseFloat(wgsLng).toFixed(4);
            landRecords.push(createAddress("land", data));
        }
    } catch (error) {
        // Some error on the lands data.
        // console.error(error.message);
        // console.error(error.stack);
        console.error(err);
        return Promise.reject(err);
    }

    return sortLandResult(address, landRecords);
}

var resolver = {
    queryAddress: async (address) => {
        // Fetch result from OGCIO
        let sortedOgcioRecords = await searchAddressWithOGCIO(address);
        const landRecords = await searchAddressFromLand(address);

        const sortedResults = [];

        // console.log(sortedOgcioRecords.map(rec => ({address: rec.fullAddress("chi"), score: rec.record.score})));
        // P.S. Result source (OGCIO/Land Department) should be displayed to user
        // this.results["source"] = ...


        // If the land record have any exception
        if (landRecords.length === 0) {
            return sortedOgcioRecords;
        }

        // 1. Best Case: Top OGCIO result appears in land result(s)
        // We compared with the first in land result but some cases that sometime the most accurate result does not appear at top
        // so we should search among the whole list
        for (const landResult of landRecords) {
            if (sortedOgcioRecords[0].distanceTo(landResult) < NEAR_THRESHOLD) {
                // console.log("1. Best Case: Land result and ogcio return the same address");
                return sortedOgcioRecords;
            }
        }


        // 2. best result from OGCIO does not appears in the land results
        // so we pick the first land result as our destination and search all the OGCIO results and see if some result is within the NEAR_DISTANCE
        // and sort them with distance to the first land result


        sortedOgcioRecords.forEach(ogcioRecord => {
            const distance$$1 = ogcioRecord.distanceTo(landRecords[0]);
            if (ogcioRecord.distanceTo(landRecords[0]) < NEAR_THRESHOLD) {
                // add the distance for sorting the array
                ogcioRecord.distance = distance$$1;
                sortedResults.push(ogcioRecord);
                // console.log(ogcioRecord.distanceTo(landRecords[0]) + " | " + ogcioRecord.fullAddress("chi"))
            }
        });

        // console.log("2. first land result appears in ogcio result")
        // Return the sorted array by distnace to first land result
        if (sortedResults.length > 0) {
            return sortedResults.sort((a, b) => a.distance - b.distance);
        }

        // 3. ogcio not found but there is land result. We try to search again from ogcio using the land result
        // #89
        const assumedLandResult = landRecords[0];
        const fullAddressToSearch = landRecords[0].fullAddress("chi");
        if (fullAddressToSearch !== '') {
            sortedOgcioRecords = await searchAddressWithOGCIO(fullAddressToSearch);
            if (sortedOgcioRecords[0].distanceTo(assumedLandResult) < NEAR_THRESHOLD) {
                // 3.1 second round result is the nearest result
                return sortedOgcioRecords;
            }

            // QUESTION: shall we loop through the ogcio records again?
        }

        return landRecords;
    }
};

function parse (address) {
	return resolver.queryAddress(address);
}

export default parse;
