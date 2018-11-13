const { dcDistrict } = require('./constants');

/**
 * To parse the address from OGCIO. this file should be compatible with node.js and js running in browser
 *
 */

const log = console.log; // eslint-disable-line

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


function flattenJson(data, isChinese) {
  const result = {};
  for (const key of Object.keys(data)) {
    let val = data[key];
    if (typeof (val) === 'object') {
      Object.assign(result, flattenJson(val, isChinese));
    } else if (typeof (val) === 'string') {
      if (isChinese
        && (key === 'StreetName'
          || key === 'VillageName'
          || key === 'EstateName')
        && val.indexOf(' ') >= 0) {
        const tokens = val.split(' ');
        for (let i = 0; i < tokens.length; i++) {
          result[key + (i + 1)] = tokens[i];
        }
      } else {
        if (key === 'DcDistrict') {
          val = dcDistrictMapping(val, isChinese);
        }
        result[key] = val;
      }
    }
  }
  return result;
}

function normalizeResponse(responseFromOGCIO) {
  return responseFromOGCIO.SuggestedAddress.map(record => ({
    chi: flattenJson(record.Address.PremisesAddress.ChiPremisesAddress, true),
    eng: flattenJson(record.Address.PremisesAddress.EngPremisesAddress, false),
    geo: flattenJson(record.Address.PremisesAddress.GeospatialInformation, false),
  }));
}

function searchPhrase(str, searchPhrases) {
  const obj = searchPhrases.chi; // Only for chinese now
  for (const key of Object.keys(obj)) {
    if (str === obj[key]) {
      return {
        key,
        val: obj[key]
      };
    }
  }
  return null;
}

function search(address, searchRecord) {
  const results = [];
  let start = 0;
  let end = 0;
  while (start < address.length) {
    end = address.length;
    let str;
    while (start < end) {
      str = address.substring(start, end);
      const match = searchPhrase(str, searchRecord);
      if (match !== null) {
        results.push(match);
        break;
      }
      end -= 1;
    }
    if (end === start) {
      if (results.length > 0 && results[results.length - 1].key === '?') {
        //
        results.push({
          key: '?',
          val: address.substring(start, address.length)
        });
      } else {
        results.push({
          key: '?',
          val: address.substring(start, address.length)
        });
      }
    }
    start += str.length;
  }
  return results;
}

function keyMatch(key, keyName) {
  if (key.indexOf(keyName) >= 0) {
    return true;
  }
  return false;
}

function parseAddress(address, resultHash) {
  for (const record of resultHash) {
    const searchParsedResult = search(address, record);
    const matchScore = {
      level: -1,
      charlen: 0
    };
    const matches = [];
    for (const { key, val } of searchParsedResult) {
      if (keyMatch(key, 'StreetName')) {
        matchScore.level = 1;
        matchScore.charlen += val.length;
        matches.push('StreetName');
      } else if (keyMatch(key, 'BuildingNoFrom') && matchScore.level === 1) {
        matchScore.level = 3;
        matchScore.charlen += val.length;
        matches.push('BuildingNoFrom');
      } else if (keyMatch(key, 'BuildingName') || keyMatch(key, 'VillageName') || keyMatch(key, 'EstateName')) {
        matchScore.charlen += val.length;
        if (matchScore.level === -1) {
          matchScore.level = 2;
        }
        // remove the digit at the end
        matches.push(key.replace(/\d+$/g, ''));
      } else if (keyMatch(key, 'BlockDescriptor')) {
        matchScore.charlen += val.length;
        matches.push('BlockDescriptor');
      }
    }

    record.score = matchScore;
    record.matches = matches;
  }

  resultHash = resultHash.sort((a, b) => {
    const level = a.score.level !== b.score.level
      ? b.score.level - a.score.level
      : b.score.charlen - a.score.charlen;
    return level;
  });
  return (resultHash.slice(0, 200));
}


/**
 * Standalone version of address parsing.
 * @param {*} address
 * @param {*} responseFromOGCIO Raw json response from ogcio
 */
async function searchResult(address, responseFromOGCIO) {
  const normalizedAddress = removeFloor(address);
  const result = normalizeResponse(responseFromOGCIO);
  return parseAddress(normalizedAddress, result);
}

// node.js exports
module.exports = { searchResult };
