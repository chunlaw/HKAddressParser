<template>
    <div id="map-area"></div>
</template>


<script>
import proj4 from "proj4";

import Map from "ol/Map";
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import TileGrid from 'ol/tilegrid/TileGrid'
import layerVector from 'ol/layer/Vector';
import sourceVector from 'ol/source/Vector';
import TopoJSON from 'ol/format/TopoJSON';
import olFeature from 'ol/Feature';
import olPoint from 'ol/geom/Point';
import * as olControl from 'ol/control';
import * as olInteraction from 'ol/interaction';
import * as olStyle from 'ol/style';
import olCircleStyle from 'ol/style/Circle';
import XYZ from 'ol/source/XYZ';
import * as proj from "ol/proj";
import * as olProj4 from "ol/proj/proj4";
import OSM from 'ol/source/OSM';

import dcAreaJSON from '../utils/HKDistrictArea.json';

var arcgisUrl = "https://js.arcgis.com/3.20/";

//ref:
// https://blog.tiger-workshop.com/hk1980-grid-to-wgs84/
// https://epsg.io/2326   (click Export PROJ4 to get string)
proj4.defs("ESRI:102140","+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +units=m +no_defs");
proj4.defs("EPSG:2326"  ,"+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs");
proj4.defs("EPSG:4326"  ,"+proj=longlat +datum=WGS84 +no_defs");

olProj4.register(proj4);

export default{
    data: function(){
        return {
            //map : {}
        }
    },

    mounted(){    
        this.createMap();  
    },

    methods: {  
        createMap: function () {  
            var extent = [795233.5770899998, 794267.8361200001, 872991.5360700004, 853188.3580900002];

            var projection = proj.get('EPSG:2326');
            
            // Mainly follow:
            // https://jsfiddle.net/landsapi/e17gogd9/?utm_source=website&utm_medium=embed&utm_campaign=e17gogd9
            
            var hkorigin = [-4786700.0, 8353100.0];
                        
            var resolutions = [156543.03392800014 , 78271.51696399994,
                            39135.75848200009  , 19567.87924099992,
                            9783.93962049996   , 4891.96981024998,
                            2445.98490512499   , 1222.992452562495,
                            611.4962262813797  ,  305.74811314055756,
                            152.87405657041106 , 76.43702828507324, 
                            38.21851414253662  , 19.10925707126831, 
                            9.554628535634155  , 4.77731426794937,
                            2.388657133974685  , 1.1943285668550503, 
                            0.5971642835598172 , 0.29858214164761665, 
                            0.14929107082380833
                                    ];

            var scales =    [5.91657527591555E8, 2.95828763795777E8,
                            1.47914381897889E8, 7.3957190948944E7,
                            3.6978595474472E7 , 1.8489297737236E7,
                            9244648.868618    , 4622324.434309,
                            2311162.217155    , 1155581.108577,
                            577790.554289     , 288895.277144,
                            144447.638572     , 72223.819286,
                            36111.909643      , 18055.954822,
                            9027.977411		 , 4513.988705,
                            2256.994353		 , 1128.497176, 
                            564.248588
                                        ];
                    
            var tileGrid = new TileGrid({
                                extent: extent,
                                origin: hkorigin,
                                //scales: scales,
                                resolutions: resolutions,
                                tileSize: 256
                                });

            function styleFuncLabels(feature, resolution) {
					var name = null;
					
					if (feature.get('ENGLISHNAME') !== undefined )
					{
						name = feature.get('ENGLISHNAME');
						var chi_name = feature.get('CHINESENAME');
						name = name + '\n' + chi_name;
            
					} else {
						name = feature.get('C_AREA') 
						var en_name = feature.get('E_AREA');
						name = name  + '\n' + en_name;
           
					}
					
					if (resolution > 20) 
					    name = "";
                  
                  const textFillStyle = new olStyle.Fill({	color: 'white' })	
                  const font = '12px sans-serif';

				  var nameElement = new olStyle.Style({
					text: new olStyle.Text({
					  text: name,
					  textAlign: 'center',
					  textBaseline: 'center',
					  font: font,
					  weight: 'Blod',
					  fill: textFillStyle,
					  stroke: new olStyle.Stroke({color: 'black', width: 3}),
					}),
					fill: new olStyle.Fill({
					  color: 'rgba(255,100,50,0)' //'#ADD8E6',
					}),
					stroke: new olStyle.Stroke({
					  color: 'rgba(255,100,50,0.3)', //'#880000',
					  width: 1
					})
				  })
				return nameElement
            }
            var tpj = new TopoJSON({defaultDataProjection: 'EPSG:2326'});
            var dcAreaFeatures = tpj.readFeatures( dcAreaJSON);
            var vectorDcBounds = new layerVector({
                        source: new sourceVector({
                            features : dcAreaFeatures,
                            overlaps: true
                        }),
                        style: styleFuncLabels
                        //minResolution: 100,
                        //maxResolution: 4000
            });


            var poiMarker = new olFeature({
                    geometry: new olPoint( [ 835734.814750178, 817851.4540029846 ])                    
            });
            
            // var poiStyle = new olStyle.Style({
            //                     image: new olCircleStyle({
            //                             radius: 7,
            //                             fill: new olStyle.Fill({color: 'black'}),
            //                             stroke: new olStyle.Stroke({
            //                                 color: 'white', width: 2
            //                             })
            //                     })
            //                 });
            
            var poiStyle = new olStyle.Style({
                image: new olStyle.Icon(/** @type {module:ol/style/Icon~Options} */ ({
                    anchor: [0.5, 1.0],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                    src: '/map_pin.png',  //FIXME: bad practice: using static asset under folder /public 
                    scale: 0.25
                }))
            });

            poiMarker.setStyle(poiStyle);
            this.poiMarker = poiMarker;

            var vectorPOI = new layerVector({
                                source: new sourceVector({
                                    features: [poiMarker],
                                    overlaps: true
                                })
                            });

            var apikey = '?????????' //api.hkmapservice.gov.hk starter key

            var map = new Map({
                        
                        interactions: olInteraction.defaults().extend([
                            new olInteraction.DragRotateAndZoom()
                        ]),

                        target: 'map-area',

                        layers: [
                            new TileLayer({
                            source: new OSM()
                            }),

                            // new TileLayer({                                
                            // source: 	new XYZ({
                            //     // attributions: attributions,
                            //     projection: projection,
                            //     tileGrid: 	tileGrid,
                            //     url: 		'https://api.hkmapservice.gov.hk/osm/xyz/basemap/HK80/2016/tile/{z}/{x}/{y}.png?key=' + apikey
                            // })
                            // }),
                            
                            // new TileLayer({
                            // source: 	new XYZ({
                            //     projection: projection,
                            //     tileGrid: 	tileGrid,
                            //     url: 		'https://api.hkmapservice.gov.hk/osm/xyz/label-tc/HK80/2016/tile/{z}/{x}/{y}.png?key=' + apikey
                            // }),
                            // //minResolution:0.2,
                            // //maxResolution:5
                            // }),

                            vectorPOI,
                            vectorDcBounds
                            
                        ],

                        view: new View({
                            zoom: 11,
                            projection: projection,
                            center: [839517.12, 817045.33], //ol.proj.fromLonLat([114.20847, 22.29227]), 
                            minZoom: 10,
                            maxZoom: 19
                        })
                    });

            this.map = map;

            
        },
        
        gotoLatLng: function(lat, lng){
            const result = proj.fromLonLat([lng,lat], 'EPSG:2326');
                    
            
            //TODO: add a pin on the map at the location
            
            this.map.getView().animate({center: result, zoom: 18});
            console.log(result);
            this.poiMarker.setGeometry(new olPoint(result));
            //this.map.centerAt(new Point(114.15,22.29));
                    
            
        }
    } 
};  

</script>

<style scoped>
@import url("https://openlayers.org/en/v5.3.0/css/ol.css");

#map-area {
    margin: 2;
    padding: 2;
}

.logo-med {
    width: 46px !important;
    height: 22px !important;
    background-image: url(https://js.arcgis.com/3.20/esri/images/map/logo-sm.png) !important;
}

</style>
