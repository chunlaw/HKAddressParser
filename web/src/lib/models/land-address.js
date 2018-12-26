import Address from './address';

export default class LandAddress {
  constructor(landRecord) {
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
        translatedValue: landRecord.nameEN,
        key: name,
        translatedLabel: "Name"
      }];
    } else if (lang === Address.LANG_ZH) {
      return [{
        translatedValue: landRecord.nameZH,
        key: name,
        translatedLabel: "Name"
      }];
    }
  }

  fullAddress(lang) {
    if (lang === Address.LANG_EN) {
      return landRecord.addressEN;
    } else if (lang === Address.LANG_ZH) {
      return landRecord.addressZH;
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

  /**
   * Return a normalized confident level from 0 - 10
   */
  confidence() {
    return 0;
  }
}

Address.LANG_EN = 'eng';
Address.LANG_ZH = 'chi';

