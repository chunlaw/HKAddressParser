
import ogcioParser from './ogcio-parser';
import * as AddressFactory from './models/address-factory';

const OGCIO_RECORD_COUNT = 200;

export default {
  queryAddress: async (address) => {
  // Fetch result from OGCIO
  const ogcioURL = `https://www.als.ogcio.gov.hk/lookup?q=${address}&n=${OGCIO_RECORD_COUNT}`;

  const ogcioRes = await fetch(ogcioURL, {
    headers: {
      "Accept": "application/json",
      "Accept-Language": "en,zh-Hant",
      "Accept-Encoding": "gzip"
    }
  });
  const ogcioData = await ogcioRes.json();

  // Fetch result from GeoData Portal of Land Department
  const landsURL = `https://geodata.gov.hk/gs/api/v1.0.0/locationSearch?q=${address}`;
  const landsRes = await fetch(landsURL);
  const landsData = await landsRes.json();

  const landResult = await landsData.map(async r => {
    let wgsURL = `http://www.geodetic.gov.hk/transform/v2/?inSys=hkgrid&outSys=wgsgeog&e=${r.x}&n=${r.y}`;
    let wgsRes = await fetch(wgsURL);
    let wgsData = await wgsRes.json();
    return Object.assign(r, wgsData)
  })

  // TODO:
  // in ResultSelector, compare the distance between ogcioData Bestmatch and first result of landResult,
  // Assumption: landResult is more accurate, and cover more location of HK

  // tried and got correct result from landResult :
  // 政府總部
  // 立法會綜合大樓
  // 寶鄉邨
  // 九龍啟德承啟道28號

  // If the distance is larger than certain value (i.e. 0.1km), which means there are discrepancies between 2 APIs
  // ResultSelector will return landResult, coz we assumpe that landResult is more accurate

  // Then the SingleMatch will return one landResult only, instead of 200 results
  // For that particular landResult, only coord, addressZH and nameZH would be shown at this moment
  // (Logic of retriving extra address component (Region, Sub District, DCCA etc) would be implmeneted later)

  const sortedOgcioRecords = await ogcioParser.searchResult(address, ogcioData);

  // P.S. Result source (OGCIO/Land Department) should be displayed to user
  // this.results['source'] = ...
    return sortedOgcioRecords.map(record => AddressFactory.createAddress(record));
  }
}