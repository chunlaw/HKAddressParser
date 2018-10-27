const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
const rewire = require('rewire');

function getFunc(name) {
  return rewire('./../src/address-parser').__get__(name);
}
const { expect } = require('chai');

describe('address-parser', () => {
  it('should parse the response from ogcio and return a list of results', async () => {
    const address = '銅鑼灣謝斐道488號';
    const n = 100;
    const URL = 'https://www.als.ogcio.gov.hk/lookup';
    const result = await request.getAsync(URL, {
      headers: {
        Accept: 'application/json'
      },
      qs: {
        q: address,
        n
      },
      json: {}
    });

    const searchResult = await getFunc('searchResult')(address, result.body);
    expect(searchResult).to.be.not.null;
    expect(searchResult.length).to.be.not.null;
  });
});
