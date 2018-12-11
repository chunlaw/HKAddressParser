<template>
  <v-expansion-panel focusable>
    <v-expansion-panel-content :disabled="disableContent" :value="rank === 0">
      <div slot="header">
        <v-chip
          text-color="black"
          disabled
          small
        >{{ `Rank ${rank + 1}` }} {{ (rank === 0)? ' - Best Match!' : ''}}</v-chip>
        <h2>
          {{ fullChineseAddressFromResult(result.chi) }}
          <br>
          {{fullEnglishAddressFromResult(result.eng)}}
        </h2>
        <span
          class="text-xs-right grey--text"
        >{{ result.geo[0].Latitude + ", " + result.geo[0].Longitude }}</span>
      </div>
      <v-card class="ma-4 pa-3">
        <v-list dense subheader>
          <v-list-tile>
            <v-list-tile-content>Sub District<br>地區</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ district.esubdistrict }}<br>{{ district.csubdistrict }}</v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
          <v-list-tile>
            <v-list-tile-content>District Council Constituency Area<br>區議會選區</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ district.ename }}<br>{{ district.cname }}</v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
        </v-list>

        <v-list
          dense
          subheader
          v-for="key in filteredKeys"
          :key="key"
          :class="`match_level_${getConfidentLevel(key)}`"
        >
          <v-list-tile>
            <v-list-tile-content>{{ textForKey(key, 'eng') }}<br/>{{ textForKey(key, 'chi') }}</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ textForValue(result, key, 'eng') }}<br/>{{ textForValue(result, key, 'chi') }}</v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
        </v-list>
      </v-card>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
import dclookup from "./../utils/dclookup.js";
import ogcioHelper from "./../utils/ogcio-helper.js";
export default {
  props: {
    rank: Number,
    result: {
      status: Object,
      geo: Array,
      chi: Object,
      eng: Object,
      matches: Array
    },
    filterOptions: Array
  },
  data: () => ({
    disableContent: false,
    filteredKeys: [],
    localFilterOptions: []
  }),
  mounted: function() {
    this.localFilterOptions = this.filterOptions;
    this.filteredKeys = this.getFilteredKeys();
    this.disableExpansionPanelContent();
    this.$root.$on("filterUpdate", options => {
      this.localFilterOptions = options;
      this.filteredKeys = this.getFilteredKeys();
      this.$forceUpdate();
    });
  },
  computed: {
    district: function() {
      return dclookup.dcNameFromCoordinates(
        this.result.geo[0].Latitude,
        this.result.geo[0].Longitude
      );
    }
  },
  methods: {
    textForKey: ogcioHelper.textForKey,
    textForValue: ogcioHelper.textForValue,
    fullChineseAddressFromResult: ogcioHelper.fullChineseAddressFromResult,
    fullEnglishAddressFromResult: ogcioHelper.fullEnglishAddressFromResult,
    // To a confident level of 0-4
    getConfidentLevel: function(key) {
      return Math.min(
        4,
        (this.result.matches
          .filter(match => match.matchedKey === key)
          .map(match => match.confident)
          .reduce((p, c) => c, 0) *
          5) |
          0
      );
    },
    getFilteredKeys: function() {
      return (this.filteredKeys = this.localFilterOptions
        .filter(opt => opt.enabled && this.result.chi[opt.key] !== undefined)
        .map(opt => opt.key));
    },
    disableExpansionPanelContent: function() {
      const opts = this.localFilterOptions;
      if (Object.keys(opts).every(key => !opts[key].enabled)) {
        this.disableContent = true;
      }
    }
  }
};
</script>

<style>
.match_level_1 {
  color: rgb(255, 144, 144) !important;
  font-weight: bolder;
}

.match_level_2 {
  color: rgb(231, 141, 141) !important;
}

.match_level_3 {
  color: rgb(248, 87, 87) !important;
}

.match_level_4 {
  color: red !important;
  font-weight: bolder;
}

.align-end {
  text-align: right;
  white-space: pre;
}
</style>
