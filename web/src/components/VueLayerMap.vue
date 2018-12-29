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

      <vl-feature v-for="marker in markers">
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
import Address from './../lib/models/address';
export default {
  props: {
    markers: Address
  },
  computed: {
    center: {
      get: function() {
        return [114.160147, 22.35201];
      },
      set: function() {
        // do nothing
      }
    },
    zoom: {
      get: function() {
        return 11;
      },
      set: function() {
        // do nothing
      }
    }
  },
  data() {
    return {
      rotation: 0,
      images: {
        pin: require('../assets/pin.png')
      }
    };
  }
};
</script>