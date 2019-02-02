import Address from './address';

export default class LandAddress extends Address{
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
