function levelToString(level) {
  switch (level) {
    case 1:
      return '街名'
    case 2:
      return '大廈名/村名'
    case 3:
      return '街道名稱'
    case 0:
    default: return '?'
  }
}

const SORTING_PRORITY_CHI = ['Region', 'DcDistrict', 'VillageName', 'StreetName', 'BuildingNoFrom', 'BuildingNoTo', 'EstateName', 'BlockNo', 'BlockDescriptor', 'BuildingName'];
const SORTING_PRORITY_ENG = [];

function getSortingPriorityForField(lang, field) {
  const priorityArray = lang === 'EN' ? SORTING_PRORITY_ENG : SORTING_PRORITY_CHI;
  for (let i = 0; i < priorityArray.length; i += 1) {
    const fieldName = priorityArray[i];
    if (field.indexOf(fieldName) >= 0) return i;
  }
  console.error(`unknown field : ${field}`);
  return -1;
}

/**
 * Adding the street no prefix and also filter out unwanted fields
 * @param {*} addressTokens
 */
function concatChineseAddress(addressTokens) {
  const addresses = [];
  for (let i = 0; i < addressTokens.length; i += 1) {
    const { field, value } = addressTokens[i];
    if (field === 'DcDistrict') {
      // not showing in address
      continue;
    }

    if (field === 'BuildingNoFrom') {
      addresses.push(value);
      if (i < addressTokens.length - 1 && // avoid array out of bound
        addressTokens[i + 1].field === 'BuildingNoTo') {
        addresses.push('至');
      } else {
        addresses.push('號');
      }
      continue;
    }

    if (field === 'BuildingNoTo') {
      addresses.push(value);
      addresses.push('號');
      continue;
    }

    addresses.push(value);
  }
  return addresses.join('');
}

/**
 * Format the chinese address from the given result set
 * @param {*} result
 */
function fullChineseAddressFromResult(result) {
  const addressFields = [];
  for (const key of Object.keys(result)) {
    addressFields.push(key);
  }
  addressFields.sort((field1, field2) => getSortingPriorityForField('CHI', field1) -
    getSortingPriorityForField('CHI', field2));

  return concatChineseAddress(addressFields.map(field => ({ field, value: result[field] })));
}

export default {
  levelToString,
  fullChineseAddressFromResult
}
