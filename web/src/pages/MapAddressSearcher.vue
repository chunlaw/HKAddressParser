<template>
  <v-content>
    <v-navigation-drawer clipped fixed v-model="drawer" width="600" permanent app>
      <v-alert v-model="hasError" type="error">{{ this.errorMessage }}</v-alert>
      <v-container fluid>
        <v-layout row>
          <v-flex pa-0>
            <h1 class="teal--text">我哋幫你拆解難搞地址</h1>
            <p class="intro-text">
              輸入香港地址，我們幫你 <span class="amber lighten-4 red--text px-1">地址轉座標</span> 、 <span class="amber lighten-4 red--text px-1">中英翻譯地址</span> 、 <span class="amber lighten-4 red--text px-1">統一地址格式</span>
            </p>
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
                  :value="(searchResults.length * 100 / addressesToSearch.length)"
                ></v-progress-linear>
                <ResultCard
                  v-if="selectedAddress !== undefined"
                  :result="selectedAddress"
                  :rank="rank"
                  :searchAddress="selectedAddress.input"
                  :filterOptions="filterOptions"
                />
              </template>
            </v-form>
          </v-flex>
        </v-layout>
      </v-container>
    </v-navigation-drawer>
    <VueLayerMap
      :searchResults="searchResults.filter(address => address !== undefined)"
      v-on:featureSelected="onFeatureSelected"
      :filterOptions="filterOptions"
    />
  </v-content>
</template>

<script>
import AddressResolver from "hk-address-parser";
import asyncLib from "async";
import asyncify from "async/asyncify";
import dclookup from "./../utils/dclookup";
import ogcioHelper from "./../utils/ogcio-helper";
import VueLayerMap from "./../components/VueLayerMap";
import ResultCard from "./../components/ResultCard";
import { trackMapSearch, trackPinSelected } from "./../utils/ga-helper";
const SEARCH_LIMIT = 200;

export default {
  components: {
    VueLayerMap,
    ResultCard
  },
  data: () => ({
    drawer: true,
    addressString: "",
    addressesToSearch: [],
    errorMessage: null,
    count: 200,
    searchResults: [],  // Store the result (only store the first Address instance for each input)
    filterOptions: [],
    rank: 0 // best match always returns 0
  }),
  computed: {
    hasError: function() {
      return this.errorMessage !== null;
    },
    /**
     * Will return undefined if no selected
     */
    selectedAddress: function() {
      return this.searchResults.find(address => address && address.selected);
    }
  },
  methods: {
    submit: async function submit() {
      // Clear up the alert box first
      this.errorMessage = null;
      this.searchResults = [];
      if (this.addressString.length === 0) {
        this.errorMessage = "請輸入地址";
        return;
      }
      this.addressesToSearch = this.addressString.split("\n").filter(address => address !== undefined && address.length > 0);
      trackMapSearch(this, this.addressesToSearch.length);
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
      // Auto open first result, TODO: Turn first result's marker to selectedPin
      // this.setSelectedFeature(index)
    },
    onFeatureSelected: function(feature) {
      if (feature !== null) {
        const index = feature.properties.index;
        this.selectAddress(index);
        trackPinSelected(this, this.searchResults[index].input);
      } else {
      }
    },
    selectAddress: function(index) {

        this.searchResults.filter(address => address !== undefined).forEach((address, key) => {
          address.selected = address.index === index;
          //
          this.$set(this.searchResults, key, address);
        });
        // HACK: create a filter option that all fields are enabled
        this.filterOptions = this.selectedAddress.components("chi").map(component => ({
          key: component.key,
          value: component.translatedLabel,
          enabled: true,
        }));
    }
  }
};

async function searchSingleResult(address, key) {
  // //const res = await fetch('http://localhost:8081/search/' + this.address);
  const records = await AddressResolver(address);
  // We take only the first record
  if (records.length === 0) {
    // TODO: What happened when there is no results?
    // this.$set(this.searchResults, key, undefined);
    console.error('Something went wrong with the result..');
    return;
  }

  const addressObj = records[0];
  addressObj.input = address;
  addressObj.index = key;
  addressObj.selected = false;

  this.$set(this.searchResults, key, addressObj);
  if (this.selectedAddress === undefined) {
    this.selectAddress(key);
  }


  return addressObj;
}
</script>

<style scoped>
p.intro-text {
  font-weight: 700;
  margin: 1rem 0;
}
</style>
