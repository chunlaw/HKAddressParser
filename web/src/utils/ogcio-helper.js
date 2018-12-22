const OGCIO_KEY_BLOCK = 'Block';
const OGCIO_KEY_PHASE = 'Phase';
const OGCIO_KEY_ESTATE = 'Estate';
const OGCIO_KEY_VILLAGE = 'Village';
const OGCIO_KEY_REGION = 'Region';
const OGCIO_KEY_STREET = 'Street';
const OGCIO_KEY_DISTRICT = 'District';
const OGCIO_KEY_LOT = 'Lot';
const OGCIO_KEY_STRUCTURED_LOT = 'StructuredLot';
const OGCIO_KEY_BUILDING_NAME = 'BuildingName';

const keys = {
  eng: {
    // level 1 keys
    [OGCIO_KEY_BLOCK]: 'Block',
    [OGCIO_KEY_PHASE]: 'Phase',
    [OGCIO_KEY_ESTATE]: 'Estate',
    [OGCIO_KEY_VILLAGE]: 'Village',
    [OGCIO_KEY_REGION]: 'Region',
    [OGCIO_KEY_DISTRICT]: 'District',
    [OGCIO_KEY_STREET]: 'Street',
    [OGCIO_KEY_BUILDING_NAME]: 'Building Name',
    // level 2 keys
    [`${OGCIO_KEY_DISTRICT}.DcDistrict`]: '區議會分區',
    [`${OGCIO_KEY_STREET}.StreetName`]: 'Street Name',
    [`${OGCIO_KEY_STREET}.BuildingNoFrom`]: 'Street No. From',
    [`${OGCIO_KEY_STREET}.BuildingNoTo`]: 'Street No. To',
    [`${OGCIO_KEY_ESTATE}.EstateName`]: 'Estate Name',

  },
  chi: {
    // level 1 keys
    [OGCIO_KEY_BLOCK]: '座數',
    [OGCIO_KEY_PHASE]: '期數',
    [OGCIO_KEY_ESTATE]: '屋邨',
    [OGCIO_KEY_VILLAGE]: '鄉村',
    [OGCIO_KEY_REGION]: '區域',
    [OGCIO_KEY_DISTRICT]: '地區',
    [OGCIO_KEY_STREET]: '街道',
    [OGCIO_KEY_BUILDING_NAME]: '大廈名稱',
    // level 2 keys
    [`${OGCIO_KEY_DISTRICT}.DcDistrict`]: '區議會分區',
    [`${OGCIO_KEY_STREET}.StreetName`]: '街道',
    [`${OGCIO_KEY_STREET}.BuildingNoFrom`]: '街號',
    [`${OGCIO_KEY_STREET}.BuildingNoTo`]: '街號',
    [`${OGCIO_KEY_ESTATE}.EstateName`]: '屋邨',
  }
}

function textForKey(key, lang) {
  return keys[lang]
    ? (keys[lang][key]
      ? keys[lang][key]
      : key)
    : key;
}

function textForValue(record, key, lang) {

  if (!record[lang]) {
    return '';
  }

  if (typeof(record[lang][key]) === 'string') {
    return record[lang][key];
  }
  
  const obj = Object.values(record[lang][key]);
  let val = obj[0] || '';

  if(obj[1]) {
    console.log(obj)
    if(obj[1].PhaseName) {
      val = val + (val == '' ? '' : ', ') + obj[1].PhaseName;
    } else {
      val = val + (val == '' ? '' : ', ') + obj[1];
    }
  }

  return val;
}



function safeFieldValue(obj, key) {
  return obj && obj[key] ? obj[key]: '';
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


export default {
  topLevelKeys: () => Object.keys(keys.chi).map((key) => ({ key, value: keys.chi[key] })).filter(key => !key.key.includes('.')),
  textForKey,
  textForValue,
  fullEnglishAddressFromResult,
  fullChineseAddressFromResult
}