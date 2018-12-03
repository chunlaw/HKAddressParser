const addressParser = require('./../web/src/lib/address-parser');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

if (process.argv.length < 2) {
  console.log('{}');
}

const address = process.argv[2];
const n = 100;
const URL = 'https://www.als.ogcio.gov.hk/lookup';


const result = request.getAsync(URL, {
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
  const result = results[0]
  const output = {
    chi: result.chi,
    eng: result.eng,
    geo: result.geo
  };
  console.log(JSON.stringify(output));

}).catch(error => {
  // console.log(error.stack);
  console.log('{}');
})

