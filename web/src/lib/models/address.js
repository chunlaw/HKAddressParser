export default class Address {
  constructor() {
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
    return [];
  }

  componentLabelForKey(key, lang) {
    return '';
  }

  componentValueForKey(key, lang) {
    return '';
  }

  fullAddress(lang) {
    return null;
  }

  coordinate() {
    return {
      lat: 0,
      lng: 0,
    }
  }

  coordinates() {
    return [];
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

