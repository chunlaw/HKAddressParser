import OGCIOAddress from './ogcio-adress';

export const createAddress = function (record) {
  return new OGCIOAddress(record);
}