// Converts numeric degrees to radians
function toRad(Value) {
  return Value * Math.PI / 180;
}

/**
 * Helper function to calcualte the distance of two given coordinates
 * @description
 * @param {*} lat1
 * @param {*} lon1
 * @param {*} lat2
 * @param {*} lon2
 * @returns
 */
function calcDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}



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
    const component = this.components(lang).find(component => component.key === key);
    return component === undefined ? '' : component.translatedLabel;
  }

  componentValueForKey(key, lang) {
    const component = this.components(lang).find(component => component.key === key);
    return component === undefined ? '' : component.translatedValue;
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

  distanceTo(address) {
    const cord1 = this.coordinate();
    const cord2 = address.coordinate();

    return calcDistance(cord1.lat, cord1.lng, cord2.lat, cord1.lng);
  }
}

Address.LANG_EN = 'eng';
Address.LANG_ZH = 'chi';

