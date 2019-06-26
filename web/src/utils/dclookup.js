import * as turf from "@turf/turf"
import dcdata15 from "./../utils/dcdata-2015";
import dcdata19 from "./../utils/dcdata-2019";

const dcArea = turf.featureCollection(dcdata15.features);

const dcSettings = [
  {
    year: '2015',
    polygon: 'polygon',
    data: dcdata15
  },
  {
    year: '2019',
    polygon: 'multiPolygon',
    data: dcdata19
  }
]

const dcAreas = dcSettings.map(dc => {
  return {
    ...dc,
    geojson: turf.featureCollection(dc.data.features)
  }
})
export default {
  /**
   * Return the district and subdistrict name
   */
  dcNameFromCoordinates (lat, lng) {
    const result = {}
    const point = turf.point([lng, lat])

    dcAreas.forEach(dcArea => {
      for (const feature of dcArea.geojson.features) {
        const turfFeature = dcArea.polygon === 'polygon' ? turf.polygon(feature.geometry.coordinates) : turf.multiPolygon(feature.geometry.coordinates)
        // console.log(turfFeature)
        if (turf.booleanPointInPolygon(point, turfFeature)) {
          result[dcArea.year] = {
            code: feature.properties.CACODE,
            cname: feature.properties.CNAME,
            ename: feature.properties.ENAME,
            district: feature.properties.DISTRICT_T,
            csubdistrict: feature.properties.SUBDISTIRCT_T,
            esubdistrict: feature.properties.SUBDISTIRCT_E,
          }
        }
      }
    })

    return result
  }
}