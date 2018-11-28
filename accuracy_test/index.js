// Idea:
// We need to have two independent script that print out the lat/lng (also the formatted result?) in the stdout

const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
const csv = require('fast-csv');
const fs = require('fs');
const { spawn } = require('child_process');
const async = require('async');

 /**
  * Helper function to calcualte the distance of two given coordinates
  * @description
  * @param {*} lat1
  * @param {*} lon1
  * @param {*} lat2
  * @param {*} lon2
  * @returns
  */
 function calcDistance(lat1, lon1, lat2, lon2) {
   var R = 6371; // km
   var dLat = toRad(lat2-lat1);
   var dLon = toRad(lon2-lon1);
   var lat1 = toRad(lat1);
   var lat2 = toRad(lat2);

   var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
     Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
   var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
   var d = R * c;
   return d;
 }

 // Converts numeric degrees to radians
 function toRad(Value) {
     return Value * Math.PI / 180;
 }



async function readTestCases(filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const testCases = [];
    csv.fromStream(stream).on('data' , data => {
      testCases.push(data);      
    }).on('end', () => {
      resolve(testCases.slice(1, testCases.length));
    });
  })
}

function checkResult(result, expectedLat, expectedLng) {
  const THRESHOLD = 0.1;
  if (!result.geo) {
    return false;
  }

  if (Array.isArray(result.geo)) {
    for ({Latitude, Longitude} of result.geo) {
      if (calcDistance(Latitude, Longitude, expectedLat, expectedLng) < THRESHOLD) {
        return true;
      }
    }
  } else {
    const {Latitude, Longitude} = result.geo;
    if (calcDistance(Latitude, Longitude, expectedLat, expectedLng) < THRESHOLD) {
      return true;
    }
  }

  return false;
}


async function runTest(program, file, address) {
  return new Promise((resolve, reject) => {
    const ls = spawn(program, [file, address]);
    let result = '';
    ls.stdout.on('data', (data) => {
      result += data;
    });
  
    ls.stderr.on('data', (data) => {
      reject(data);
    });
  
    ls.on('close', (code) => {
      
      try {
        const json = JSON.parse(result);        
        resolve(json);
      } catch (error) {
        console.error(error);
        console.error(`Error when searching: ${result}`);
        reject(error);
      }
    });
  })
  
}


async function main() {
  const allTestData = await readTestCases('./data/testcases_ogcio_searchable.csv');
  const result = {
    total: 0,
    py_success: 0,
    js_success: 0,
    py_failed: [],
    js_failed: [],
  }

  async.eachOfLimit(allTestData, 50, async (testData) => {
    result.total += 1;
    try {
      const [address, lat, lng] = testData;
      const pyResult = await runTest('python3', 'run_test.py', address);
      const jsResult = await runTest('node', 'run_test.js', address);
      if (checkResult(pyResult, lat, lng)) {
        result.py_success += 1;
      } else {
        result.py_failed.push(address);
      }

      if (checkResult(jsResult, lat, lng)) {
        result.js_success += 1;
      } else {
        result.js_failed.push(address);
      }
      if (result.total % 10 === 0) {
        console.log(`${result.total} tests executed ..`);
      }
    } catch (error) {
      console.error(`Error when running ${testData}`);
      console.error(error);
    }
  }, // callback
  () => {
    // TODO: write the result to somewhere
    console.log(result);
  })
}

main().then().catch();