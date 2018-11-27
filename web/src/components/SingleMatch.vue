<template>
  <v-expansion-panel focusable>
    <v-expansion-panel-content :disabled="disableContent" :value="rank === 0">
      <div slot="header">
        <v-chip
          text-color="black"
          disabled
          small
        >{{ `Rank ${rank + 1}` }} {{ (rank === 0)? ' - Best Match!' : ''}}</v-chip>
        <h2>{{ fullChineseAddressFromResult(result.chi) }}</h2>
        <span
          class="text-xs-right grey--text"
        >{{ result.geo.Latitude + ", " + result.geo.Longitude }}</span>
      </div>
      <v-card class="ma-4 pa-3">
        <v-list dense subheader>
          <v-list-tile>
            <v-list-tile-content>選區</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ district.cname }}</v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
        </v-list>

        <v-list
          dense
          subheader
          v-for="(value, key, index) in result.chi"
          :key="index"
          :class="(isMatch(key)? ' matched': '')"
          v-if="filterOptions[massageKey(key)]"
        >
          <v-list-tile>
            <v-list-tile-content>{{ key }}</v-list-tile-content>
            <v-list-tile-content class="align-end">{{ value }}</v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
        </v-list>
      </v-card>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
import utils from "./../utils";
import dclookup from "./../utils/dclookup.js";
export default {
  props: {
    rank: Number,
    result: {
      status: Object,
      geo: Object,
      chi: Object,
      eng: Object,
      matches: Array
    },
    filterOptions: {
      region: Boolean,
      dcDistrict: Boolean,
      buildingNoFrom: Boolean,
      buildingName: Boolean,
      streetName: Boolean
    }
  },
  data: () => ({
    disableContent: false
  }),
  mounted: function () {
    this.disableExpansionPanelContent();
  },
  computed: {
    district: function () {
      return dclookup.dcNameFromCoordinates(this.result.geo.Latitude, this.result.geo.Longitude)
    }
  },
  methods: {
    levelToString: utils.levelToString,
    fullChineseAddressFromResult: utils.fullChineseAddressFromResult,
    isMatch: function (key) {
      return this.result.matches.indexOf(key) >= 0;
    },
    massageKey: function (key) {
      return key.charAt(0).toLowerCase() + key.slice(1);
    },
    disableExpansionPanelContent: function () {
      const filterOptions = this.filterOptions;
      if(Object.keys(filterOptions).every((key) => !filterOptions[key])) {
          this.disableContent = true;
      }
    }
  }
};
</script>

<style>
.matched {
  color: red !important;
  font-weight: bolder;
}
</style>
