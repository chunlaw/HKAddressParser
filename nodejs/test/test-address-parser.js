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

  describe('searchResult', async () => {

    it('should eliminate all the Chi/Eng keys of the ogcio result', () => {
      const { result } = testCases[0];
      const addressToTest = result.SuggestedAddress[0].Address;
      const eliminateLangKeys = getFunc('eliminateLangKeys');
      const chi = eliminateLangKeys(addressToTest.PremisesAddress.ChiPremisesAddress);
      const eng = eliminateLangKeys(addressToTest.PremisesAddress.EngPremisesAddress);
      for (const key of Object.keys(chi)) {
        expect(key.indexOf('Chi')).to.be.eq(-1);
      }
      for (const key of Object.keys(eng)) {
        expect(key.indexOf('Eng')).to.be.eq(-1);
      }      
    })

    it('should match number from a sting', () => {
      const tryToMatchAnyNumber = getFunc('tryToMatchAnyNumber');
      const address = "馬頭圍道123號33樓B座";
      let result = tryToMatchAnyNumber(address, 123);
      expect(result).to.be.true;
      result = tryToMatchAnyNumber(address, 33);
      expect(result).to.be.true;

      result = tryToMatchAnyNumber(address, 1234);
      expect(result).to.be.false;
    })


    it('should match number within the range ', () => {
      const tryToMatchRangeOfNumber = getFunc('tryToMatchRangeOfNumber');
      const address = "馬頭圍道123號33樓B座";
      let result = tryToMatchRangeOfNumber(address, 123, 125, true);
      expect(result).to.be.true;
      result = tryToMatchRangeOfNumber(address, 29, 50, true);
      expect(result).to.be.true;

      result = tryToMatchRangeOfNumber(address, 29, 50, false);
      expect(result).to.be.false;

      result = tryToMatchRangeOfNumber(address, 1, 9, true);
      expect(result).to.be.false;
    })


    it('should return the search result', async () => {
      const searchResultFunc = getFunc('searchResult');
      const { address, result } = testCases[0];
      const parsedResults = await searchResultFunc(address, result);
      expect(parsedResults).to.be.not.null;
      expect(parsedResults).to.be.a('array');
      for (const parsedResult of parsedResults) {
        expect(parsedResult.chi).to.be.a('object');
        expect(parsedResult.eng).to.be.a('object');
        expect(parsedResult.geo).to.be.a('array');
        expect(parsedResult.matches).to.be.a('array');
        expect(parsedResult.score).to.be.a('number');
      }      
    });

    it('should find the longest match without overlapping', async () => {
      const findMaximumNonOverlappingMatches = getFunc('findMaximumNonOverlappingMatches');
      const addressToTest = '香港中環皇后大道中80號H QUEEN\'S 23樓';
      const matches = [{
        matchedKey: 'Street',
        matchedWords: ['皇后大道中'],
        confident: 1
      },{
        matchedKey: 'Building',
        matchedWords: ['皇后大道中'],
        confident: 1
      }];

      const maximumMatches = findMaximumNonOverlappingMatches(addressToTest, matches);
      expect(maximumMatches.length).to.be.eq(1);
    });
    
  });
});
