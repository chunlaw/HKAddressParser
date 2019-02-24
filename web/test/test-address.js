const { expect } = require('chai');
import * as turf from "@turf/turf"
import Address from './../src/lib/models/address';


const RAD = Math.PI / 180.0;
const KILO_MULTIPLIER = 1.609344 * 60 * 1.1515 * 180/Math.PI;

// Create a TestAddress class for testing
class TestAddress extends Address {

  constructor({lat, lng}) {
    super();
    this.lat = lat;
    this.lng = lng;
  }

  coordinate() {
    return {
      lat: this.lat,
      lng: this.lng,
    }
  }

  distanceToRaw(address) {
    let coordinate = this.coordinate();
    const lat1 = coordinate.lat;
    const lng1 = coordinate.lng;

    coordinate = address.coordinate();
    const lat2 = coordinate.lat;
    const lng2 = coordinate.lng;

    if ((lat1 === lat2) && (lng1 === lng2)) {
      return 0;
    }
    else {
      const radlat1 = RAD * lat1;
      const radlat2 = RAD * lat2;
      const theta = lng1 - lng2;
      const radtheta = RAD * theta;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      dist = Math.min(1, dist);
      dist = Math.acos(dist);
      return dist * KILO_MULTIPLIER;
    }
  }

  distanceToTurf(address) {
    const cord1 = turf.point([this.coordinate().lng, this.coordinate().lat]);
    const cord2 = turf.point([address.coordinate().lng, address.coordinate().lat]);

    return turf.distance(cord1, cord2, {units: 'kilometers'});
  }
}

describe('address', () => {
  // calculating the distance using
    // http://www.meridianoutpost.com/resources/etools/calculators/calculator-latitude-longitude-distance.php?
  const testCases = [
    // pointA, pointB, distance, percision
    [{ lat: 0, lng: 0}, { lat: 0, lng: 0}, 0, 0],
    [{ lat: 32.9697, lng: -96.80322}, { lat: 29.46786, lng: -98.53506}, 422.74 , 0.1],
    [{ lat: 12.4344, lng: 0.333333}, { lat: 12.444, lng: -24.555555},2701.42 , 1],
  ];

  it('should return the distance of the two address', async function() {
    for (const testCase of testCases) {
      const addressA = new TestAddress(testCase[0]);
      const addressB = new TestAddress(testCase[1]);
      expect(addressA.distanceToTurf(addressB)).to.be.closeTo(testCase[2], testCase[3]);
    }

    for (const testCase of testCases) {
      const addressA = new TestAddress(testCase[0]);
      const addressB = new TestAddress(testCase[1]);
      expect(addressA.distanceToRaw(addressB)).to.be.closeTo(testCase[2], testCase[3]);
    }
  });

  function randomPoint() {
    return {
      lat: -80 + Math.random()* 160,
      lng: -80 + Math.random()* 160
    }
  }

  it('should has the fatest performance', async function() {

    let lap = 100000;
    let turfTimeElaspsed = process.hrtime();
    while (lap --) {
      for (const testCase of testCases) {

        const addressA = new TestAddress(randomPoint());
        const addressB = new TestAddress(randomPoint());
        addressA.distanceToTurf(addressB);
      }
    }
    turfTimeElaspsed = process.hrtime(turfTimeElaspsed);


    lap = 100000;
    let rawTimeElaspsed = process.hrtime();
    while (lap --) {
      for (const testCase of testCases) {
        const addressA = new TestAddress(randomPoint());
        const addressB = new TestAddress(randomPoint());
        addressA.distanceToRaw(addressB);
      }
    }
    rawTimeElaspsed = process.hrtime(rawTimeElaspsed);

    // turf performance should be
    expect(turfTimeElaspsed[1]).to.be.lt(rawTimeElaspsed[1]);


  });
});
