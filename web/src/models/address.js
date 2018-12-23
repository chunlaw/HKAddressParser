export default class Address {
  constructor() {
  }

  getDetails(lang) {
    return {};
  }

  getAddress(lang) {
    return null;
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

Address.LANG_EN = 'eng';
Address.LANG_ZH = 'chi';

