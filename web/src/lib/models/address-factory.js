import OGCIOAddress from './ogcio-adress';
import Address from './address';
import LandAddress from './land-address';

export const createAddress = function (type, record) {
  switch (type) {
    case 'ogcio': return new OGCIOAddress(record);
    case 'land' : return new LandAddress(record);
    default:      return new Address(record);
  }

}