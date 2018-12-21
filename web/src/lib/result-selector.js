import * as turf from "@turf/turf"

// node.js exports
export default {
    chooseSource: (ogcioRes, landRes) => {
        let ogcioCoord = turf.point([ogcioRes[0].geo[0].Longitude, ogcioRes[0].geo[0].Latitude]);
        // There's a problem on fetching data, a promise object is returned.
        // let landCoord = turf.point([landRes[0].wgsLong, landRes[0].wgsLat]); 
        let landCoord = turf.point([114.165366259, 22.280459676]); // use 政府總部 for dummy data
        const distance = turf.distance(ogcioCoord, landCoord, {units: 'kilometers'});

        //return (distance < 0.1) ? ogcioRes: landRes;
        return ogcioRes;
    }
}