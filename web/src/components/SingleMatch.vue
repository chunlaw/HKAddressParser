<template>
  <v-expansion-panel-content :disabled="disableContent" :value="rank === 0">
    <div slot="header">
      <h3 class="headline mb-0">{{ fullChineseAddressFromResult(result.chi) }}</h3>
      <span class="pt-2">{{ rank === 0 ? 'BEST MATCH!' : `Rank #${rank + 1}` }}</span>
      <v-chip
        color="primary"
        text-color="white"
        disabled
        small
      >{{ result.score }}</v-chip><br>
      <span class="pt-2 grey--text">{{ result.geo.Latitude + "," + result.geo.Longitude }}</span>
    </div>
    <v-card>
      <v-card-title primary-title>
        <v-container grid-list-md text-xs-left>
            <v-layout row wrap class="row-odd">
                <v-flex class="field-title" xs4>選區</v-flex>
                <v-flex xs8>{{ district.cname }}</v-flex>
            </v-layout>
            <v-layout row wrap v-for="(value, key, index) in result.chi" :key="index"
                :class="(index % 2 === 0 ? 'row-even': 'row-odd') + (isMatch(key)? ' matched': '')"
                v-if="filterOptions[massageKey(key)]"
            >
              <v-flex class="field-title" xs4>{{ key }}</v-flex>
              <v-flex xs8>{{ value }}</v-flex>
            </v-layout>
        </v-container>

        <!-- <span class="grey--text">{{ 'Match: ' + levelToString(result.status.level) }}</span> -->
      </v-card-title>
      <br>
    </v-card>
  </v-expansion-panel-content>
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
.form {
  width: 80%;
}

.field-title {
  border-right: 1px solid;
}

.row-odd {
  background-color: #ffffff;
}

.row-even {
  background-color: #cdffff;
}

.matched {
  color: red;
  font-weight: bolder;
}
</style>
