<template>
  <vl-map :load-tiles-while-animating="true" :load-tiles-while-interacting="true" data-projection="EPSG:4326">
    <vl-view :zoom.sync="zoom" :center.sync="center" :rotation.sync="rotation"></vl-view>

    <vl-layer-tile id="osm">
      <vl-source-osm></vl-source-osm>
    </vl-layer-tile>

    <!-- interactions -->
    <vl-interaction-select :features="selectedFeatures" v-on:update:features="featureUpdated">
      <!-- <template slot-scope="select">
          <vl-overlay class="feature-popup" v-for="feature in select.features" :key="feature.id" :id="feature.id"
                        :position="pointOnSurface(feature.geometry)" :auto-pan="true" :auto-pan-animation="{ duration: 300 }">
          </vl-overlay>
        </template> -->
      </vl-interaction-select>
      <!--// interactions -->

      <vl-feature v-for="(marker, index) in markers" :properties="marker" :key="index">
        <div v-if="marker">
          <vl-geom-point :coordinates="[Number(marker.coordinate().lng), Number(marker.coordinate().lat)]"></vl-geom-point>
          <vl-style-box v-if="isMarkerSelected(marker)">
            <vl-style-icon
              :src="images.selectedPin"
              :scale="0.5"
              :anchor="[0.1, 0.5]"
              :size="[128, 128]"
            ></vl-style-icon>
          </vl-style-box>
          <vl-style-box v-else>
            <vl-style-icon
              :src="images.pin"
              :scale="0.5"
              :anchor="[0.1, 0.5]"
              :size="[128, 128]"
            ></vl-style-icon>
          </vl-style-box>
        </div>
      </vl-feature>
    </vl-map>
</template>

<script>
  import {
    findPointOnSurface
  } from 'vuelayers/lib/ol-ext'
  import Address from './../lib/models/address';
  import ResultCard from "./ResultCard";
  export default {
    components: {
      ResultCard,
    },
    props: {
      markers: Array,
      filterOptions: Array
    },
    data() {
      return {
        selectedFeatures: [],
        center: [114.160147, 22.35201],
        zoom: 11,
        rotation: 0,
        images: {
          pin: require('../assets/pin.png'),
          selectedPin: require('../assets/pin-selected.png')
        }
      };
    },
    methods: {
      pointOnSurface: findPointOnSurface,
      isMarkerSelected: function(marker) {
        if (this.selectedFeatures.length === 0) {
          return false;
        }
        return this.selectedFeatures[0].properties.index === marker.index;
      },
      featureUpdated: function(features) {
        this.$emit('featureSelected', features.length > 0 ? features[0] : null);
        this.selectedFeatures = features;
      }
    },
    // watch: {
    //   markers: function(newVal, oldVal) {
    //     if (newVal[0]) {
    //       this.center = [Number(newVal[0].afterNormalizedResult.lng), Number(newVal[0].afterNormalizedResult.lat)];
    //       this.zoom = 16;
    //     }
    //   }
    // }
  };
</script>

<style>
  .ol-overlay-container {
    width: 100%;
  }
</style>