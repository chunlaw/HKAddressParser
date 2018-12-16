<template>
    <vl-map
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      data-projection="EPSG:4326"
      style="height: 400px"
    >
      <vl-view :zoom.sync="zoom" :center.sync="center" :rotation.sync="rotation"></vl-view>

      <vl-layer-tile id="osm">
        <vl-source-osm></vl-source-osm>
      </vl-layer-tile>

      <!-- overlay marker with animation -->
      <vl-feature id="marker" ref="marker" :properties="{ start: Date.now(), duration: 2500 }">
        <template slot-scope="feature">
          <vl-geom-point :coordinates="center"></vl-geom-point>
          <vl-style-box>
            <vl-style-icon
              :src="images.pin"
              :scale="0.5"
              :anchor="[0.1, 0.95]"
              :size="[128, 128]"
            ></vl-style-icon>
          </vl-style-box>
        </template>
      </vl-feature>
    </vl-map>
</template>

<script>
export default {
  props: {
    bestMatch: {
      status: Object,
      geo: Array,
      chi: Object,
      eng: Object,
      matches: Array
    }
  },
  computed: {
    center: {
      get: function() {
        return this.bestMatch != null
          ? [
              Number(this.bestMatch["geo"][0]["Longitude"]),
              Number(this.bestMatch["geo"][0]["Latitude"])
            ]
          : [114.160147, 22.35201];
      },
      set: function() {
        // do nothing
      }
    },
    zoom: {
      get: function() {
        return this.bestMatch != null ? 16 : 10;
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