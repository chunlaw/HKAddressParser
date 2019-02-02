const Promise = require('bluebird');
require('isomorphic-fetch');
const { expect } = require('chai');
const fs = require('fs');
import * as sinon from 'sinon';
import { searchAddressFromLand } from './../src/lib/address-resolver';

describe('address-parser', () => {
  const testCases = {};
  before(() => {
    const filenames = fs.readdirSync('./test/testcases');
    filenames.forEach((filename) => {
      const data = JSON.parse(fs.readFileSync(`./test/testcases/${filename}`).toString());
      testCases[data.query] = data;
    });

    const fetch = sinon.stub(global, 'fetch');
    fetch.callsFake((url) => {
      for (const address of Object.keys(testCases)) {
        if (url.indexOf(encodeURI(address)) >= 0) {
            return testCases[address].data;
        }
      }
    })
  });

  it('should return a list of land result', async () => {

    const address = '紅磡都會道6號國際都會5樓3號行人天橋大堂入口';
    const searchResult = await searchAddressFromLand(address);
    expect(searchResult).to.be.a('array');
    expect(searchResult.length).to.be.gte(0);
  });
});
