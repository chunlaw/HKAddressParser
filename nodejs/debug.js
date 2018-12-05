const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

const addressParser = require('../web/src/lib/address-parser');

if (process.argv.length < 2) {
  process.exit(1);
}

const address = process.argv[2];
const n = 100;
const URL = 'https://www.als.ogcio.gov.hk/lookup';


request.getAsync(URL, {
  headers: {
    Accept: 'application/json'
  },
  qs: {
    q: address,
    n
  },
  json: {}
}).then(res => {
  return addressParser.searchResult(address, res.body);
}).then( results => {
  results.forEach((result, index) => {
    if (index < 5) {
      console.log("================================================")
      console.log(JSON.stringify(result.chi, null ,2));
      console.log(`score: ${result.score}`);
      for (const match of result.matches) {
        console.log(`    -----------------------`);
        console.log(`    key: ${match.matchedKey}`);
        console.log(`    matched: ${match.matchedWords}`);
        console.log(`    score: ${addressParser.calculateScoreFromMatches([match])}`);
        
      }
      console.log("================================================")
      console.log("")
      console.log("")
    }
    
  })
  

}).catch(error => {
  console.log(error.stack);
})

