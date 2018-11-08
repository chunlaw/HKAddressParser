<template>
    <div id="map-area"></div>
</template>





<script>
// following instrution from blogpost
// http://alan9uo.iteye.com/blog/2393171
import esriLoader from "esri-loader";
import proj4 from "proj4";

var arcgisUrl = "https://js.arcgis.com/3.20/";
var tmpmap = 0;

//ref:
// https://blog.tiger-workshop.com/hk1980-grid-to-wgs84/
// https://epsg.io/2326   (click Export PROJ4 to get string)
proj4.defs("ESRI:102140","+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +units=m +no_defs");
proj4.defs("EPSG:2326"  ,"+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.1785555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs");
proj4.defs("EPSG:4326"  ,"+proj=longlat +datum=WGS84 +no_defs");

export default{
    data: function(){
        return {
            map : 0
        }
    },

    mounted(){    
        this.createMap();  
    },

    methods: {  
        createMap: function () {  
      
            esriLoader.loadModules(
                [  
                    "dojo/dom",
                    "esri/tasks/locator",
                    "esri/dijit/Search",
                    "esri/symbols/PictureMarkerSymbol",
                    "esri/InfoTemplate",
                    "esri/layers/ArcGISTiledMapServiceLayer",
                    "esri/SpatialReference",
                    "esri/geometry/Point",
                    "esri/dijit/Popup",
                    "esri/dijit/PopupTemplate",
                    "esri/layers/FeatureLayer",
                    "esri/map",
                    "esri/dijit/Scalebar",
                    "dijit/layout/BorderContainer",
                    "dijit/layout/ContentPane",
                    "dijit/TitlePane",
                    "dijit/form/CheckBox",
                    'dojo/_base/json',
                    "dojo/domReady!"
                ],
                {
                    url: arcgisUrl
                }
            ).then((
                [
                    dom, Locator, Search, PictureMarkerSymbol, InfoTemplate,
                    ArcGISTiledMapServiceLayer, SpatialReference, Point,
                    Popup,
                    PopupTemplate,
                    FeatureLayer, Map, 
                    Scalebar
                ]) => {
                    // here we follow 
                    // https://api.portal.hkmapservice.gov.hk/js-samples-demo

                    //var apikey = 'f4d3e21d4fc14954a1d5930d4dde3809' //landsd.azure-api.net starter key
                    var apikey = '584b2fa686f14ba283874318b3b8d6b0' //api.hkmapservice.gov.hk starter key

                    var bLayer = new ArcGISTiledMapServiceLayer(
                            'https://api.hkmapservice.gov.hk/ags/map/basemap/HK80?key=' + apikey, 
                            {
                                showAttribution: true
                            }
                        );

                    var bLabelLayer = new ArcGISTiledMapServiceLayer(
                            'https://api.hkmapservice.gov.hk/ags/map/label-tc/HK80?key=' + apikey
                        );

                    var _map = new Map("map-area", 
                    {
                        //center: new Point(823100,831200, new SpatialReference({ wkid: 2326 })),
                        center: new Point(823100,831200, new SpatialReference({ wkid: 102140 })),
                        showAttribution: true,
                        zoom: 11,
                        minZoom: 10,
                        maxZoom: 19
                    });

                    this.map = [];


                    _map.addLayer(bLayer);
                    _map.addLayer(bLabelLayer);

                    tmpmap = _map;
                    //console.log("asdf", this.map);
                })  
        },
        
        gotoLatLng: function(lat, lng){
            esriLoader.loadModules(
                [  
                    "dojo/dom",
                    "esri/tasks/locator",
                    "esri/dijit/Search",
                    "esri/symbols/PictureMarkerSymbol",
                    "esri/InfoTemplate",
                    "esri/layers/ArcGISTiledMapServiceLayer",
                    "esri/SpatialReference",
                    "esri/geometry/Point",
                    "esri/dijit/Popup",
                    "esri/dijit/PopupTemplate",
                    "esri/layers/FeatureLayer",
                    "esri/map",
                    "esri/dijit/Scalebar",
                    "dijit/layout/BorderContainer",
                    "dijit/layout/ContentPane",
                    "dijit/TitlePane",
                    "dijit/form/CheckBox",
                    'dojo/_base/json',
                    "dojo/domReady!"
                ],
                {
                    url: arcgisUrl
                }
            ).then((
                [
                    dom, Locator, Search, 
                    PictureMarkerSymbol, 
                    InfoTemplate,
                    ArcGISTiledMapServiceLayer, 
                    SpatialReference, Point,
                    
                ]) => {
                    var result = proj4('EPSG:4326', 'EPSG:2326', [lng,lat]);
                    
                    // console.log([lat,lng])
                    // console.log(result)

                    //TODO: add a pin on the map at the location
                    tmpmap.centerAndZoom(new Point(result[0],result[1], new SpatialReference({ wkid: 102140 })), 19);
                    //tmpmap.centerAt(new Point(114.15,22.29));
                    
                })
        }
    } 
};  



</script>

<style scoped>
@import url('https://js.arcgis.com/3.20/esri/css/esri.css');               
@import url('https://js.arcgis.com/3.20/dijit/themes/nihilo/nihilo.css');

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
