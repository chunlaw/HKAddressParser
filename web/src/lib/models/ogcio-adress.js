import Address from './address';
import ogcioHelper from "./../../utils/ogcio-helper.js";

export default class OGCIOAddress extends Address {
  constructor(ogcioRecord) {
    super();
    this.record = ogcioRecord;
    this.flattenedComponents = null;
  }

  components(lang) {
    if (this.flattenedComponents === null) {
      this.flattenedComponents = this.flattenComponents();
    }
    if (lang === Address.LANG_EN) {
      return this.flattenedComponents['eng'];
    } else {
      return this.flattenedComponents['chi'];
    }
  }

  componentLabelFromKey(key, lang) {
    const component = this.components(lang).find(component => component.key === key);
    return component === undefined ? '' : component.translatedLabel;
  }

  componentValueFromKey(key, lang) {
    const component = this.components(lang).find(component => component.key === key);
    return component === undefined ? '' : component.translatedValue;
  }

  flattenComponents() {
    const flattenedComponents = {
      [Address.LANG_EN]: [],
      [Address.LANG_ZH]: [],
    };
    const langs = [Address.LANG_ZH, Address.LANG_EN]
    for (const lang of langs) {
      for (const key of Object.keys(this.record[lang])) {
        flattenedComponents[lang].push({
          key,
          translatedLabel: ogcioHelper.textForKey(key, lang),
          translatedValue: ogcioHelper.textForValue(this.record, key, lang),
        });
      }
    }

    return flattenedComponents;
  }

  fullAddress(lang) {
    if (lang === Address.LANG_EN) {
      return ogcioHelper.fullChineseAddressFromResult(this.record['eng']);
    } else {
      return ogcioHelper.fullChineseAddressFromResult(this.record['chi']);
    }
  }

  coordinate() {
    const geo = {
      lat: 0,
      lng: 0,
    };
    if (this.record.geo !== undefined && this.record.geo.length > 0) {
      geo.lat = this.record.geo[0].Latitude;
      geo.lng = this.record.geo[0].Longitude;
    }
    return geo;
  }

  coordinates() {
    return [];
  }

  confidence() {
    return Math.min(
      4,
      (this.record.matches
        .filter(match => match.matchedKey === key)
        .map(match => match.confident)
        .reduce((p, c) => c, 0) *
        5) |
        0
    );
  }
}