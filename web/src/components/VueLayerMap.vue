<template>
    <vl-map
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      data-projection="EPSG:4326"

    >
      <vl-view :zoom.sync="zoom" :center.sync="center" :rotation.sync="rotation"></vl-view>

      <vl-layer-tile id="osm">
        <vl-source-osm></vl-source-osm>
      </vl-layer-tile>

      <!-- interactions -->
      <vl-interaction-select 
      :features.sync="selectedFeature"
      >
      <template slot-scope="select">
        <vl-style-box>
            <vl-style-icon
              :src="images.selectedPin"
              :scale="0.5"
              :anchor="[0.1, 0.5]"
              :size="[128, 128]"
            ></vl-style-icon>
          </vl-style-box>
        </template>
      </vl-interaction-select>
      <!--// interactions -->

      <vl-feature v-for="marker in markers" :properties="marker" >
          <vl-geom-point :coordinates="[Number(marker.lng), Number(marker.lat)]"></vl-geom-point>
          <vl-style-box>
            <vl-style-icon
              :src="images.pin"
              :scale="0.5"
              :anchor="[0.1, 0.5]"
              :size="[128, 128]"
            ></vl-style-icon>
          </vl-style-box>
      </vl-feature>

    </vl-map>
</template>

<script>
import { findPointOnSurface } from 'vuelayers/lib/ol-ext'
import Address from './../lib/models/address';
export default {
  props: {
    markers: Array
  },
  computed: {
    center: function() {
        return [114.160147, 22.35201];
    },
    zoom: function() {
        return 11;
    }
  },
  data() {
    return {
      rotation: 0,
      selectedFeature: [],
      images: {
        pin: require('../assets/pin.png'),
        selectedPin: require('../assets/pin-selected.png')
      }
    };
  },
  methods: {
    pointOnSurface: findPointOnSurface
  }
};
</script>