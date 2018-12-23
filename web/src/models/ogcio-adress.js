import Address from './address';
import ogcioHelper from "./../utils/ogcio-helper.js";

class OGCIOAddress extends Address {
  constructor(ogcioRecord) {
    this.record = ogcioRecord;
  }

  getDetails(lang) {
    if (lang === Address.LANG_EN) {
      return record['eng'];
    } else {
      return record['chi'];
    }
  }

  getAddress(lang) {
    if (lang === Address.LANG_EN) {
      return ogcioHelper.fullChineseAddressFromResult(record['eng']);
    } else {
      return ogcioHelper.fullChineseAddressFromResult(record['chi']);
    }
  }

  getCoordinate() {
    return {
      lat: 0,
      lng: 0,
    }
  }

  getCoordinates() {
    return [];
  }
}