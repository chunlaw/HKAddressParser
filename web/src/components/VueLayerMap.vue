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

      <vl-feature v-for="marker in markers" >
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
export default {
  props: {
    markers: {
      status: Object,
      geo: Array,
      chi: Object,
      eng: Object,
      matches: Array
    }
  },
  data() {
    return {
      rotation: 0,
      images: {
        pin: require('../assets/pin.png')
      },
      center: [114.160147, 22.35201],
      zoom: 11
    };
  },
  watch: { 
    markers: function(newVal, oldVal) {
      if(newVal[0]) {
        this.center = [Number(newVal[0].lng), Number(newVal[0].lat)];
        this.zoom = 18;
      }
    }
  }
};
</script>