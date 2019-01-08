<template>
  <v-expansion-panel focusable expand :value="expanded">
    <v-expansion-panel-content :disabled="disableContent">
      <div slot="header">
        <div v-if="isBestMatch" class="btn-container">
          <ButtonTick :enabled="!commented" :onClick="onTickClicked"/>
          <ButtonCross :enabled="!commented" :onClick="onCrossClicked"/>
        </div>
        <v-chip
          text-color="black"
          disabled
          small
        >{{ `Rank ${rank + 1}` }} {{ isBestMatch? ' - Best Match!' : ''}}
        </v-chip>
        <h2>
          <p>{{ result.fullAddress('chi') }}</p>
          <p>{{ result.fullAddress('eng') }}</p>
        </h2>
        <span
          class="text-xs-right grey--text"
        >{{ result.coordinate().lat + ", " + result.coordinate().lng }}</span>
      </div>
      <v-card class="ma-4 pa-3">
        <v-list dense subheader>
          <v-list-tile>
            <v-list-tile-content>Sub District
              <br>地區
            </v-list-tile-content>
            <v-list-tile-content class="align-end">
              <p>{{ district.esubdistrict }}</p>
              <p>{{ district.csubdistrict }}</p>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
          <v-list-tile>
            <v-list-tile-content>District Council Constituency Area
              <br>區議會選區
            </v-list-tile-content>
            <v-list-tile-content class="align-end">
              <p>{{ district.ename }}</p>
              <p>{{ district.cname }}</p>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
        </v-list>
        <v-list
          dense
          subheader
          v-for="key in filteredKeys"
          :key="key"
        >
          <v-list-tile>
            <v-list-tile-content>
              <p>{{ result.componentLabelForKey(key, 'eng') }}</p>
              <p>{{ result.componentLabelForKey(key, 'chi') }}</p>
            </v-list-tile-content>
            <v-list-tile-content class="align-end">
              <p>{{ result.componentValueForKey(key, 'eng') }}</p>
              <p>{{ result.componentValueForKey(key, 'chi') }}</p>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
        </v-list>
      <p>{{ '資料來源： ' + result.dataSource() }}</p>
      </v-card>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
import Address from './../lib/models/address';
import dclookup from "./../utils/dclookup";
import ButtonTick from './ButtonTick';
import ButtonCross from './ButtonCross';
import {
  trackSingleSearchSatisfied
} from "./../utils/ga-helper";
export default {
  components: {
    ButtonTick, ButtonCross
  },
  props: {
    searchAddress: String,
    rank: Number,
    result: Address,
    filterOptions: Array
  },
  data: () => ({
    commented: false,
    disableContent: false,
    filteredKeys: [],
    localFilterOptions: [],
    expanded: [true] // set the default value by the rank. first object should be expanded
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
    //this.expanded = [this.isBestMatch];
  },
  computed: {
    district: function() {
      return dclookup.dcNameFromCoordinates(
        this.result.coordinate().lat,
        this.result.coordinate().lng
      );
    },
    isBestMatch: function () {
      return this.rank === 0;
    }
  },
  methods: {
    tick: function (e) {
      e.stopPropagation();
      console.log('tick');
    },
    getFilteredKeys: function() {
      return (this.filteredKeys = this.localFilterOptions
        .filter(opt => opt.enabled && this.result.componentLabelForKey(opt.key, 'chi') !== '')
        .map(opt => opt.key));
    },
    disableExpansionPanelContent: function() {
      const opts = this.localFilterOptions;
      if (Object.keys(opts).every(key => !opts[key].enabled)) {
        this.disableContent = true;
      }
    },
    onTickClicked: function() {
      this.commented = true;
      trackSingleSearchSatisfied(this, this.searchAddress, true);
    },
    onCrossClicked: function() {
      this.commented = true;
      trackSingleSearchSatisfied(this, this.searchAddress, false);
    },
  }
};
</script>

<style>

.align-end {
  text-align: right;
  white-space: pre;
}

.btn-container {
  position: absolute;
  right: 10px;
}

p {
  margin: 0px;
}
</style>
