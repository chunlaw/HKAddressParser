/**
 * To parse the address from OGCIO. this file should be compatible with node.js and js running in browser
 *
 */

const { dcDistrict } = require('../utils/constants');

const CONFIDENT_ALL_MATCH = 1.0;
const CONFIDENT_MATCH_NAME = 0.5;
const CONFIDENT_NOT_FOUND = 0.0;

const OGCIO_KEY_BLOCK = 'Block';
const OGCIO_KEY_PHASE = 'Phase';
const OGCIO_KEY_ESTATE = 'Estate';
const OGCIO_KEY_VILLAGE = 'Village';
const OGCIO_KEY_STREET = 'Street';
const OGCIO_KEY_REGION = 'Region';
const OGCIO_KEY_BUILDING_NAME = 'BuildingName';

const SCORE_SCHEME = {
  [OGCIO_KEY_BUILDING_NAME]: 100,  
  [OGCIO_KEY_VILLAGE]: 50,
  [OGCIO_KEY_ESTATE]: 50,
  [OGCIO_KEY_STREET]: 50,
  [OGCIO_KEY_REGION]: 20,
  [OGCIO_KEY_PHASE]: 20,
  [OGCIO_KEY_BLOCK]: 20,
};

// priority in asscending order 
const elementPriority = [OGCIO_KEY_BUILDING_NAME, OGCIO_KEY_BLOCK, OGCIO_KEY_PHASE, OGCIO_KEY_ESTATE, OGCIO_KEY_VILLAGE
  , OGCIO_KEY_STREET, OGCIO_KEY_REGION];

const log = console.log; // eslint-disable-line

class Match {
  constructor(confident, matchedKey) {
    this.confident = confident;
    this.matchedKey = matchedKey;
  }
}




function removeFloor(address) {
  const addr = address.replace(/([0-9A-z\-\s]+[樓層]|[0-9A-z號\-\s]+[舖鋪]|地[下庫]|平台).*/g, '');
  return addr;
}


function dcDistrictMapping(val, isChinese) {
  for (const district in dcDistrict) {
    if (district === val) {
      return isChinese ? dcDistrict[district].chi : dcDistrict[district].eng;
    }
  }
  return isChinese ? dcDistrict.invalid.chi : dcDistrict.invalid.eng;
}


/**
 * Remove the top level "Eng"/"Chi" prefix of the addresses
 * @param {*} data 
 */
function eliminateLangKeys(data) {
  const result = {};
  for (const key of Object.keys(data)) {
    const refinedKey = key.replace(/(^Chi|^Eng)/,'');
    result[refinedKey] = data[key];
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
    if (num >= from && num <= to && ((num % 2 == 1) == isOdd)) {
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

function searchSimilarityForStreetOrVillage(type, address, BuildingNoFrom, BuildingNoTo) {
  const sim = new Match(CONFIDENT_ALL_MATCH, type)
  // total match of the streetname
  if (BuildingNoFrom) {
    const from = parseInt(BuildingNoFrom, 10);
    const to = BuildingNoTo ? parseInt(BuildingNoTo, 10) : from;
    const isOdd = parseInt(BuildingNoFrom, 10) % 2 == 1;
    if (from === to) {
      if (!tryToMatchAnyNumber(address, from)) {
        sim.confident = CONFIDENT_MATCH_NAME;
      }
    } else {
      if (!tryToMatchRangeOfNumber(address, from, to, isOdd)) {
        sim.confident = CONFIDENT_MATCH_NAME;
      }
    }
  }
  return sim;
}

function searchOccuranceForBlock(address, { BlockDescriptor, BlockNo, BuildingName}) {
  if (address.includes(BuildingName)) {
    const match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BLOCK);
    if (BlockNo) {
      if (!tryToMatchAnyNumber(address, parseInt(BlockNo, 10))) {
        match.confident = CONFIDENT_MATCH_NAME;
      }
    }
    return match;
  }
  return null;
}

function searchOccuranceForPhase(address, { PhaseNo, PhaseName}) {
  if (address.includes(PhaseName)) {
    const match = new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_PHASE);
    if (PhaseNo) {
      if (!tryToMatchAnyNumber(address, parseInt(PhaseNo, 10))) {
        match.confident = CONFIDENT_MATCH_NAME;
      }
    }
    return match;
  }
  return null;
}

function searchOccuranceForEstate(address, { EstateName }) {
  if (address.includes(EstateName)) {
    return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_ESTATE);
  }
  return null;
}

function searchOccuranceForRegion(address, region) {
  if (address.includes(region)) {
    return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_REGION);
  }
  return null;
}

function searchOccuranceForBuildingName(address, buildingName) {
  if (address.includes(buildingName)) {
    return new Match(CONFIDENT_ALL_MATCH, OGCIO_KEY_BUILDING_NAME);
  }
  return null;
}

function searchOccuranceForStreet(address, {StreetName, BuildingNoFrom, BuildingNoTo}) {
  const streetsToTest = splitValueForSpaceIfChinese(StreetName);  
  if (address.includes(streetsToTest)) {
    return searchSimilarityForStreetOrVillage(OGCIO_KEY_STREET, address, BuildingNoFrom, BuildingNoTo);
  } else {
    const matchPercentage = address.partialMatch(address, StreetName);
    if (matchPercentage > 0) {
      const match = searchSimilarityForStreetOrVillage(OGCIO_KEY_VILLAGE, address, BuildingNoFrom, BuildingNoTo);
      match.confident *= matchPercentage;      
    }
  }

  return null;
}

/**
 * Return the percentage of how much do the laterString match the first one
 * @param {*} string 
 * @param {*} stringToSearch 
 */
function partialMatch(string, stringToSearch) {
  for (let i = 0; i < stringToSearch.length; i ++) {
    for (let end = stringToSearch.length; end > i; end ++) {
      const substring = stringToSearch.substring(i, end);
      if (string.includes(substring)) {
        return (substring.length * 1.0 / stringToSearch.length)
      }
    }    
  }
  return 0;
}
function searchOccuranceForVillage(address, {VillageName, BuildingNoFrom, BuildingNoTo}) {
  const streetsToTest = splitValueForSpaceIfChinese(VillageName);  
  if (address.includes(streetsToTest)) {
    return searchSimilarityForStreetOrVillage(OGCIO_KEY_VILLAGE, address, BuildingNoFrom, BuildingNoTo);
  } else {
    const matchPercentage = address.partialMatch(address, VillageName);
    if (matchPercentage > 0) {
      const match = searchSimilarityForStreetOrVillage(OGCIO_KEY_VILLAGE, address, BuildingNoFrom, BuildingNoTo);
      match.confident *= matchPercentage;      
    }
  }
  return null;
}

/**
 * Take a 
 */
function searchOccurance(address, ogcioRecordElementKey, ogcioRecordElement) {
  switch (ogcioRecordElementKey) {
    case 'Street':  return searchOccuranceForStreet(address, ogcioRecordElement); break;
    case 'Village': return searchOccuranceForVillage(address, ogcioRecordElement); break;
    case 'Block':   return searchOccuranceForBlock(address, ogcioRecordElement); break;
    case 'Phase':   return searchOccuranceForPhase(address, ogcioRecordElement); break;
    case 'Estate':  return searchOccuranceForEstate(address, ogcioRecordElement); break;
    case 'Region':  return searchOccuranceForRegion(address, ogcioRecordElement); break;
    case OGCIO_KEY_BUILDING_NAME:   return searchOccuranceForBuildingName(address, ogcioRecordElement); break;
  }
  return null;
}

function calculateScoreFromMatches(matches) {
  let score = 0;
  for (const match of matches) {
    score += SCORE_SCHEME[match.matchedKey] * match.confident;
  }
  return score;
}

function findMatchFromOGCIORecord(address, ogcioRecord) {
  const matchedPhrase = [];

  // First we look up everything that exists in that address
  for (const key of elementPriority) {
    if (ogcioRecord.chi[key] !== undefined) {
      // 
      const occurance = searchOccurance(address, key, ogcioRecord.chi[key]);
      
      if (occurance === null) {
        continue;
      }
      matchedPhrase.push(occurance);
    } else if (ogcioRecord.eng[key] !== undefined) {
      const occurance = searchOccurance(address, key, ogcioRecord.eng[key]);
      if (occurance === null) {
        continue;
      }
      matchedPhrase.push(occurance);
    }
  }
  return matchedPhrase;
}

function keyMatch(key, keyName) {
  if (key.indexOf(keyName) >= 0) {
    return true;
  }
  return false;
}

function parseAddress(address, normalizedOGCIOResult) {
  for (const record of normalizedOGCIOResult) {
    const matches = findMatchFromOGCIORecord(address, record);
    record.score = calculateScoreFromMatches(matches);
    record.matches = matches;
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
async function searchResult(address, responseFromOGCIO) {
  const normalizedAddress = removeFloor(address);
  const normalizedOGCIOResult = normalizeResponse(responseFromOGCIO);
  return parseAddress(normalizedAddress, normalizedOGCIOResult);
}

// node.js exports
module.exports = { searchResult };
