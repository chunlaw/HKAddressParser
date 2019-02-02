const Promise = require('bluebird');
require('isomorphic-fetch');
const { expect } = require('chai');

import AddressResolver from './../src/lib/address-resolver';

describe('address-parser', () => {
  it('should parse the response from ogcio and return a list of results', async () => {
    const address = '銅鑼灣謝斐道488號';


    const searchResult = await AddressResolver.queryAddress(address);
    expect(searchResult).to.be.not.null;
    expect(searchResult.length).to.be.not.null;
  });
});
