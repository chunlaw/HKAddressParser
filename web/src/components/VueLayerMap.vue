<template>
  <div>
    <vl-map :load-tiles-while-animating="true" :load-tiles-while-interacting="true"
             data-projection="EPSG:4326" style="height: 400px">
      <vl-view :zoom.sync="zoom" :center.sync="center" :rotation.sync="rotation"></vl-view>



      <vl-layer-tile id="osm">
        <vl-source-osm></vl-source-osm>
      </vl-layer-tile>

      <!-- overlay marker with animation -->
      <vl-feature id="marker" ref="marker" :properties="{ start: Date.now(), duration: 2500 }">
        <template slot-scope="feature">
          <vl-geom-point :coordinates="[114.160147, 22.352010]"></vl-geom-point>
          <vl-style-box>
            <vl-style-icon src="../assets/flag.png" :scale="0.5" :anchor="[0.1, 0.95]" :size="[128, 128]"></vl-style-icon>
          </vl-style-box>
          <!-- overlay binded to feature
          <vl-overlay v-if="feature.geometry" :position="pointOnSurface(feature.geometry)" :offset="[10, 10]">
            <p class="is-light box content">
              Always opened overlay for Feature ID <strong>{{ feature.id }}</strong>
            </p>
          </vl-overlay> -->
        </template>
      </vl-feature>
      <!--// overlay marker -->
    </vl-map>
    <div style="padding: 20px">
      Zoom: {{ zoom }}<br>
      Center: {{ center }}<br>
      Rotation: {{ rotation }}<br>
    </div>
  </div>
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
    data () {
      return { 
        zoom: (this.bestMatch != null) ? 16 : 10,
        center: (this.bestMatch != null) ? [Number(this.bestMatch["geo"][0]['Longitude']), Number(this.bestMatch["geo"][0]['Latitude'])] : [114.160147, 22.352010],
        rotation: 0
      }
    }
  }
</script>