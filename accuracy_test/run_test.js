require("@babel/polyfill");
require('es6-promise').polyfill();
require('isomorphic-fetch');
const md5 = require('md5');

const addressResolver = require('./dist/lib/address-resolver');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');

if (process.argv.length < 2) {
  console.log('{}');
}


const address = process.argv[2];
const n = 100;
const URL = 'https://www.als.ogcio.gov.hk/lookup';


function cacheFilePathForUrl(url) {
  // Base64 would return '/' but we do not want for paths
  return path.join('.cache', md5(url));
}

function saveToCache(url, json) {
  if (!fs.existsSync('.cache')){
    fs.mkdirSync('.cache');
  }
  const filePath = cacheFilePathForUrl(url);
  fs.writeFileSync(filePath, JSON.stringify(json));
}

function loadFromCache(url) {
  const filePath = cacheFilePathForUrl(url);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath).toString();
}

// Replace the fetch function
const nodeFetch = global.fetch;
global.fetch = function (...args) {
  const url = args[0];

  // try to load the cached files
  const cache = loadFromCache(url);
  if (cache) {
    return new Promise((resolve) => {
      resolve({
        json: () => JSON.parse(cache)
      });
    });
  } else {
    // Hook the function
    const fn = new Promise((resolve, reject) => {
      nodeFetch(...args).then(res => {
        // Overwrite the json()
        res.json().then(json => {
          saveToCache(url, json);
          res.json = () => json;
          resolve(res);
        })

      })
    });
    return fn;
  }
}

addressResolver.default.queryAddress(address).then(results => {
  const result = results[0];
  const obj = {
    eng: result.fullAddress('eng'),
    chi: result.fullAddress('chi'),
    geo: result.coordinates().map(coord => ({Latitude: coord.lat + '', Longitude: coord.lng + ''}))
  };
  console.log(JSON.stringify(obj));
}).catch(error => {
   console.log(error.stack);
  console.log('{}');
})


// const result = request.getAsync(URL, {
//   headers: {
//     Accept: 'application/json'
//   },
//   qs: {
//     q: address,
//     n
//   },
//   json: {}
// }).then(res => {
//   return addressParser.searchResult(address, res.body);
// }).then( results => {
//   const result = results[0]
//   const output = {
//     chi: result.chi,
//     eng: result.eng,
//     geo: result.geo
//   };
//   console.log(JSON.stringify(output));

// })
