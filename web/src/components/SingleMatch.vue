<template>
  <v-expansion-panel focusable>
    <v-expansion-panel-content :disabled="disableContent" :value="rank === 0">
      <div slot="header">
        <v-chip
          text-color="black"
          disabled
          small
        >{{ `Rank ${rank + 1}` }} {{ (rank === 0)? ' - Best Match!' : ''}}</v-chip>
        <h2>{{ fullChineseAddressFromResult(result.chi) }} <br/> {{fullEnglishAddressFromResult(result.eng)}}</h2>
        <span
          class="text-xs-right grey--text"
        >{{ result.geo[0].Latitude + ", " + result.geo[0].Longitude }}</span>
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
          v-if="enabled(key)"
        >
          <v-list-tile>
            <v-list-tile-content> {{ textForKey(key, 'eng') }} <br/> {{ textForKey(key, 'chi') }}</v-list-tile-content>
            <v-list-tile-content class="align-end"> {{ textForValue(result, key, 'eng') }} <br /> {{ textForValue(result, key, 'chi') }} </v-list-tile-content>
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
    disableContent: false
  }),
  mounted: function () {
    this.disableExpansionPanelContent();
    this.$root.$on('filterUpdate', (options) => {
      this.filterOptions = options;
      this.$forceUpdate();
    })
  },
  computed: {
    district: function () {
      return dclookup.dcNameFromCoordinates(this.result.geo[0].Latitude, this.result.geo[0].Longitude)
    }
  },
  methods: {
    textForKey: ogcioHelper.textForKey,
    textForValue: ogcioHelper.textForValue,    
    levelToString: utils.levelToString,
    fullChineseAddressFromResult: ogcioHelper.fullChineseAddressFromResult,
    fullEnglishAddressFromResult: ogcioHelper.fullEnglishAddressFromResult,
    isMatch: function (key) {
      return this.result.matches.indexOf(key) >= 0;
    },
    enabled: function(key) {
      const option = this.filterOptions.find(opt => opt.key === key);
      return option ? option.enabled : true;
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

.align-end {
  text-align: right;
  white-space: pre;
}
</style>
