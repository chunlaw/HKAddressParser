/**
 * To parse the address from OGCIO. this file should be compatible with node.js and js running in browser
 *
 */

const log = console.log;

function removeFloor(address) {
  const addr = address.replace(/([0-9A-z\-\s]+[樓層]|[0-9A-z號\-\s]+[舖鋪]|地[下庫]|平台).*/g, '');
  return addr;
}

function flattenJson(data, isChinese) {
  const result = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
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
        result[key] = val;
      }
    }
  }
  return result;
}

function normalizeResponse(responseFromOGCIO) {
  return responseFromOGCIO.SuggestedAddress.map((record) => {
    return {
      chi: flattenJson(record.Address.PremisesAddress.ChiPremisesAddress, true),
      eng: flattenJson(record.Address.PremisesAddress.EngPremisesAddress, false),
      geo: flattenJson(record.Address.PremisesAddress.GeospatialInformation, false),
    };
  });
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
  log(`Going to look up ${address}`);
  for (const record of resultHash) {
    const searchParsedResult = search(address, record);
    const matchStatus = {
      level: -1,
      charlen: 0
    };
    for (const { key, val } of searchParsedResult) {
      if (keyMatch(key, 'StreetName')) {
        matchStatus.level = 1;
        matchStatus.charlen += val.length;
      } else if (keyMatch(key, 'BuildingNoFrom') && matchStatus.level === 1) {
        matchStatus.level = 3;
        matchStatus.charlen += val.length;
      } else if (keyMatch(key, 'BuildingName') || keyMatch(key, 'VillageName') || keyMatch(key, 'EstateName')) {
        matchStatus.charlen += val.length;
        if (matchStatus.level === -1) {
          matchStatus.level = 2;
        }
      } else if (keyMatch(key, 'BlockDescriptor')) {
        matchStatus.charlen += val.length;
      }
    }

    record.status = matchStatus;
  }

  resultHash = resultHash.sort((a, b) => {
    return a.status.level !== b.status.level
      ? b.status.level - a.status.level
      : b.status.charlen - a.status.charlen;
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
module.exports = {
  searchResult
};
