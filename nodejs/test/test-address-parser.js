const { expect } = require('chai'); //eslint-disable-line
const rewire = require('rewire'); //eslint-disable-line

const app = rewire('./../../web/src/lib/address-parser');
const fs = require('fs');

function getFunc(name) {
  return app.__get__(name);
}

let buffer = [];
function log(content) {
  buffer.push(content);
}

// replace the log function with the buffer for testing
app.__set__('log', log);
app.__set__('end', () => { });

describe('cli', () => {

  const testCases = [];

  before(() => {
    const data = (fs.readFileSync('./test-cases/data.txt')).toString();
    const lines = data.split('\n');
    let address = null;
    for (const line of lines) {
      if (line.length === 0) {
        break;
      }
      if (address === null) {
        address = line;
      } else {
        testCases.push({
          address,
          result: JSON.parse(line)
        });
        address = null;
      }
    }
  })
  // reset the buffer
  function clearBuffer() {
    buffer = [];
  }

  describe('searchResult', () => {
    it('should return the search result', async () => {
      const searchResultFunc = getFunc('searchResult');
      const { address, result } = testCases[0];
      const parsedResult = searchResultFunc(address, result);
      expect(parsedResult).to.be.not.null;
    });


  });
});
