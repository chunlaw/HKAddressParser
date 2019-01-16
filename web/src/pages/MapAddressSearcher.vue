<template>
  <v-content>
    <v-navigation-drawer clipped fixed v-model="drawer" width="600" permanent app>
      <v-alert v-model="hasError" type="error">{{ this.errorMessage }}</v-alert>
      <v-container fluid>
        <v-layout row>
          <v-flex pa-0>
            <h1 class="teal--text">我哋幫你拆解難搞地址</h1>

            <h3>
              輸入香港地址，我們幫你 <span class="amber lighten-4 red--text px-1">地址轉座標</span> 、 <span class="amber lighten-4 red--text px-1">中英翻譯地址</span> 、 <span class="amber lighten-4 red--text px-1">統一地址格式</span>
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
          self.setSelectedFeature(0);
        }
      );
      // Auto open first result, TODO: Turn first result's marker to selectedPin
      // this.setSelectedFeature(index)
    },
    onFeatureSelected: function(feature) {
      if (feature !== null) {
        const index = feature.properties.index;
        this.setSelectedFeature(index);
      } else {
        this.selectedFeature = null;
      }
    },
    setSelectedFeature: function(index) {
        const address = this.results[index][0];
        this.selectedFeature = address;
        this.selectedFeature.searchAddress = this.addressesToSearch[index];
        // HACK: create a filter option that all fields are enabled
        this.filterOptions = this.selectedFeature.components("chi").map(component => ({
          key: component.key,
          value: component.translatedLabel,
          enabled: true,
        }));
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