<template>
  <v-content>
    <v-navigation-drawer clipped fixed v-model="drawer" width="600" permanent app>
      <v-alert v-model="hasError" type="error">{{ this.errorMessage }}</v-alert>
      <v-container fluid>
        <v-layout row>
          <v-flex pa-0>
            <h1 class="teal--text">我哋幫你解決難搞地址</h1>
            <h3>
              輸入中英文香港地址，我們幫你解析成
              <span class="amber lighten-4 red--text px-1">地區</span>、
              <span class="amber lighten-4 red--text px-1">街道門牌</span>、
              <span class="amber lighten-4 red--text px-1">大廈</span>、
              <span class="amber lighten-4 red--text px-1">坐標</span>，連
              <span class="amber lighten-4 red--text px-1">區議會選區</span>都有
            </h3>
            <br>
          </v-flex>
        </v-layout>
        <v-layout row>
          <v-flex pa-0>
            <v-form ref="form" class="form" @submit.prevent="submit">
              <v-textarea
                outline
                name="input-7-1"
                label="請輸入地址（每行一個地址）"
                value
                v-model="addressString"
              ></v-textarea>
              <v-btn @click="submit" dark class="teal">拆地址</v-btn>
              <template v-if="addressesToSearch.length > 0">
                <v-progress-linear
                  background-color="lime"
                  color="success"
                  :value="(results.length * 100 / addressesToSearch.length)"
                ></v-progress-linear>
                <ResultCard
                  v-if="selectedFeature !== null"
                  :result="selectedFeature"
                  :rank="rank"
                  :searchAddress="selectedFeature.searchAddress"
                  :filterOptions="filterOptions"
                />
              </template>
            </v-form>
          </v-flex>
        </v-layout>
      </v-container>
    </v-navigation-drawer>
    <VueLayerMap
      :markers="markers"
      v-on:featureSelected="onFeatureSelected"
      :filterOptions="filterOptions"
    />
  </v-content>
</template>

<script>
import AddressResolver from "./../lib/address-resolver";
import asyncLib from "async";
import asyncify from "async/asyncify";
import dclookup from "./../utils/dclookup";
import ogcioHelper from "./../utils/ogcio-helper";
import SearchFilter from "./../components/SearchFilter";
import VueLayerMap from "./../components/VueLayerMap";
import ResultCard from "./../components/ResultCard";
import { trackBatchSearch, trackBatchSearchResult } from "./../utils/ga-helper";
const SEARCH_LIMIT = 200;

export default {
  components: {
    SearchFilter,
    VueLayerMap,
    ResultCard
  },
  data: () => ({
    drawer: true,
    addressString: "",
    addressesToSearch: [],
    errorMessage: null,
    count: 200,
    results: [],
    filterOptions: [],
    selectedFeature: null,
    rank: 0 // best match always returns 0
  }),
  computed: {
    hasError: function() {
      return this.errorMessage !== null;
    },
    // Get the markers from every single result
    // add the index to prevent the vuelayer clone the address and type cast it to an object
    markers: function() {
      return this.results.map((records, index) => {
        const address = records[0];
        address.index = index;
        return address;
      });
    }
  },
  methods: {
    submit: async function submit() {
      // Clear up the alert box first
      this.errorMessage = null;
      this.results = [];
      if (this.addressString.length === 0) {
        this.errorMessage = "請輸入地址";
        return;
      }
      this.addressesToSearch = this.addressString.split("\n");
      trackBatchSearch(this, this.addressesToSearch);
      const self = this;
      asyncLib.eachOfLimit(
        this.addressesToSearch,
        10,
        // binding this for setting the results during the process
        asyncify(searchSingleResult.bind(this)),
        function(err) {
          // reset the selected markers
          // self.selectedMarkers = [];
        }
      );
    },
    onFeatureSelected: function(feature) {
      if (feature !== null) {
        const index = feature.properties.index;
        this.selectedFeature = this.results[index][0];
        this.selectedFeature.searchAddress = this.addressesToSearch[index];
      } else {
        this.selectedFeature = null;
      }
    }
  }
};

async function searchSingleResult(address, key) {
  // //const res = await fetch('http://localhost:8081/search/' + this.address);

  const records = await AddressResolver.queryAddress(address);

  this.$set(this.results, key, records);
  if (records && records.length > 0) {
    const result = records[0];
    // ! cant do the batch result here as it will exceeds the rate of GA
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/limits-quotas
    // trackBatchSearchResult(this, address, result.score | 0);
  }
  return records;
}
</script>

<style>
/*
    When the ResultCard is expanded, the height of the map will be changed and getSelectedFeature would fail for unknown reasons.
    TEMP FIX: Make .pa-2 like the aside tag
  */
.pa-2 {
  height: 100%;
  max-height: calc(100% - 64px); /* the height of header is 64px*/
  transform: translateX(0px);
  width: 600px;
  overflow-y: auto;
  position: fixed;
  overflow-x: hidden;
}
</style>