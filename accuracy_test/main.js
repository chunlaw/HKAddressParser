#!/usr/bin/env node
// Idea:
// We need to have two independent script that print out the lat/lng (also the formatted result?) in the stdout
const program = require('commander');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));
const csv = require('fast-csv');
const fs = require('fs');
const { spawn } = require('child_process');
const async = require('async');
const moment = require('moment');


// default logger
const { log, error } = console;

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
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    csv.fromStream(stream).on('data', data => {
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
    for ({ Latitude, Longitude } of result.geo) {
      if (calcDistance(Latitude, Longitude, expectedLat, expectedLng) < THRESHOLD) {
        return true;
      }
    }
  } else {
    const { Latitude, Longitude } = result.geo;
    if (calcDistance(Latitude, Longitude, expectedLat, expectedLng) < THRESHOLD) {
      return true;
    }
  }

  return false;
}


/**
 * @description Spawn a single process to run
 * @param {*} program
 * @param {*} file
 * @param {*} address
 * @returns
 */
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
        console.error(`Error when searching: ${address}`);
        reject(error);
      }
    });
  })

}


async function main({ mode = 3, limit = Infinity, outputFile = './result.json', tag}) {
  return new Promise(async (resolve, reject) => {
    const startTime = moment();
    const allTestData = await readTestCases('./data/testcases_ogcio_searchable.csv');
    const result = {
      total: 0
    }


    result.date = moment().format('YYYY-MM-DD hh:mm:ss');
    if (typeof(tag) === 'string' && tag.length > 0) {
      result.tag = tag;
    }
    if (mode & 2) {
      result.py_success = 0;
      result.py_failed = [];
    }

    if (mode & 1) {
      result.js_success = 0;
      result.js_failed = [];
    }

    async.eachOfLimit(allTestData.slice(0, limit), 50, async (testData) => {
      result.total += 1;
      try {
        const [address, lat, lng] = testData;
        if (mode & 2) {
          const pyResult = await runTest('python3', 'run_test.py', address);
          if (checkResult(pyResult, lat, lng)) {
            result.py_success += 1;
          } else {
            result.py_failed.push(address);
          }
        }

        if (mode & 1) {
          const jsResult = await runTest('node', 'run_test.js', address);
          if (checkResult(jsResult, lat, lng)) {
            result.js_success += 1;
          } else {
            result.js_failed.push(address);
          }
        }
      } catch (error) {
        error(`Error when running ${testData}`);
        error(error);
      }
    }, // callback
      () => {
        log(`Finished! Total ${result.total} tests executed .`);
        const timeElapsed = moment().diff(startTime, 'ms');
        log(`Time elapsed: ${timeElapsed}ms`);
        // Write to file
        if (mode & 2) {
          result.py_success_rate = `${result.py_success / result.total}`;
        }
        if (mode & 1) {
          result.js_success_rate = `${result.js_success / result.total}`;
        }

        fs.appendFileSync(outputFile, JSON.stringify(result) + '\n');
        log(result);
        resolve();
      })
  });

}






/**
 * Termination process
 */
function end() {
  process.exit(1);
}


program
  .version('0.1.0');

/**
 * Simple mathematic calcuation
 */
program
  .description('Run the test cases')
  .option('-o, --output [file]', 'Output the test result to the file')
  .option('-l, --limit [n]', 'Limit the number of test cases to run')
  .option('-p, --python', 'Running only the python test')
  .option('-j, --js', 'Running only the javascript test')
  .option('-t, --tag [tag]', 'Save the tag with the result')
  .parse(process.argv);


const outputFile = program.output || './results.json';
const ciOutputFile = program.ci || null;
const tag = program.tag;

// bitwise flag: | python | node |
const mode = !program.python | !program.js << 1;
const limit = program.limit || Infinity;

// When both python and js flag is up
if (mode === 0) {
  program.outputHelp();
  end();
}

main({ mode, limit, outputFile, ciOutputFile, tag })
  .then((end) => {
    log('Done');
  })
  .catch((err) => {
    error(err);
    end();
  });

