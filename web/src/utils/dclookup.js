import * as turf from "@turf/turf"
import dcdata from "./../utils/dcdata-2015";

const dcArea = turf.featureCollection(dcdata.features);

export default {
  /**
   * Return the district and subdistrict name
   */
  dcNameFromCoordinates (lat, lng) {
    const point = turf.point([lng, lat]);


    for (const feature of dcArea.features) {
      if (turf.booleanPointInPolygon(point, turf.polygon(feature.geometry.coordinates))) {
        return {
          code: feature.properties.CACODE,
          cname: feature.properties.CNAME,
          ename: feature.properties.ENAME,
          district: feature.properties.DISTRICT_T,
          csubdistrict: feature.properties.SUBDISTIRCT_T,
          esubdistrict: feature.properties.SUBDISTIRCT_E,
        }
      }
    }
    return {
      code: 'unknown',
      cname: 'unknown',
      ename: 'unknown',
      district: 'unknown',
      csubdistrict: 'unknown',
      esubdistrict: 'unknown',
    }

  }
}