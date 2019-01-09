
import ogcioParser from './ogcio-parser';
import * as AddressFactory from './models/address-factory';
import proj4 from 'proj4';
import ProjConvertor from '../utils/proj-convertor';

const OGCIO_RECORD_COUNT = 200;
const NEAR_THRESHOLD = 0.03; // 30 metre

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

    const landRecords = [];
    for (const data of landsData) {
      let wgsLng, wgslat;
      [wgsLng, wgslat] = ProjConvertor.projTransform('EPSG:2326', 'EPSG:4326', [data.x, data.y]);
      data.lat = Number.parseFloat(wgslat).toFixed(4)
      data.lng = Number.parseFloat(wgsLng).toFixed(4)
      landRecords.push(AddressFactory.createAddress('land', data));
    }
    const sortedResults = [];
    const sortedOgcioRecords = (await ogcioParser.searchResult(address, ogcioData)).map(record => AddressFactory.createAddress('ogcio', record));
    // P.S. Result source (OGCIO/Land Department) should be displayed to user
    // this.results['source'] = ...
    console.log('OGCIO Best match: ' + sortedOgcioRecords[0].fullAddress('chi'));

    // 1. Best Case: Land result and ogcio return the same address
    if (sortedOgcioRecords[0].distanceTo(landRecords[0]) < NEAR_THRESHOLD) {
      console.log('1. Best Case: Land result and ogcio return the same address');
      return sortedOgcioRecords;
    }

    // 2. best result from OGCIO is not the land result but somehow within the 200 records and we would find it out
    // Do 200 * n coordinates calculation
    console.log('2. best result from OGCIO is not the land result but somehow within the 200 records and we would find it out');
    console.log('Distance shorter than ' + NEAR_THRESHOLD + ' km');
    sortedOgcioRecords.forEach(ogcioRecord => {
      if (ogcioRecord.distanceTo(landRecords[0]) < NEAR_THRESHOLD) {
        sortedResults.push(ogcioRecord);
        console.log(ogcioRecord.distanceTo(landRecords[0]) + ' | ' + ogcioRecord.fullAddress('chi'))
      }
    });

    if (sortedResults.length > 0) {
      return sortedResults;
    }


    // 3. ogcio not found but there is land result. We use the record then.
    console.log('3. ogcio not found but there is land result.');
    return landRecords;
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


  }
}