<template>
  <v-content>
    <v-navigation-drawer clipped fixed v-model="drawer" width="600" permanent app>
      
      <v-card class="pa-2">
        <v-card-title>
          <h1 class="teal--text">我哋幫你解決難搞地址</h1>
        </v-card-title>
        <v-card-text>
          <h3>
            輸入中英文香港地址，我們幫你解析成
            <span class="amber lighten-4 red--text px-1">地區</span>、
            <span class="amber lighten-4 red--text px-1">街道門牌</span>、
            <span class="amber lighten-4 red--text px-1">大廈</span>、
            <span class="amber lighten-4 red--text px-1">坐標</span>，連
            <span class="amber lighten-4 red--text px-1">區議會選區</span>都有
          </h3>
          
         <v-form ref="form" class="form" @submit.prevent="submit">
        <v-textarea outline name="input-7-1" label="請輸入地址（每行一個地址）" value v-model="addressString"></v-textarea>
        <div slot="header">進階選項</div>
        <SearchFilter :filterOptions.sync="filterOptions"/>
        <v-container>
          <v-layout row wrap>
            <v-btn @click="submit" dark class="teal">拆地址</v-btn>
            <download-excel
              v-if="results.length > 0 && results.length === addressesToSearch.length"
              :data="normalizedResults"
              type="csv"
            >
              <v-btn dark class="teal">下載 CSV</v-btn>
            </download-excel>
          </v-layout>
        </v-container>

        <template v-if="addressesToSearch.length > 0">
          <v-progress-linear
            background-color="lime"
            color="success"
            :value="(results.length * 100 / addressesToSearch.length)"
          ></v-progress-linear>

          <!-- When to show the datatable? Now showing it when ever there is data -->
          <v-data-table
            :headers="normalizedHeaders"
            :items="normalizedResults"
            :rows-per-page-items="[ 50, 100, 500, { 'text': '$vuetify.dataIterator.rowsPerPageAll', 'value': -1 } ]"
            class="elevation-1"
          >
            <template slot="items" slot-scope="props">
              <td v-for="(field, index) in props.item.afterNormalizedResult" :key="index">{{ field }}</td>
            </template>
          </v-data-table>
        </template>
      </v-form>
          
        </v-card-text>
      </v-card>

<v-alert v-model="hasError" type="error">{{ this.errorMessage }}</v-alert>


    </v-navigation-drawer>
    <VueLayerMap :markers="normalizedResults" :filterOptions="filterOptions"/>
  </v-content>




</template>

<script>
import AddressResolver from "./../lib/address-resolver";
import asyncLib from "async";
import dclookup from "./../utils/dclookup";
import ogcioHelper from "./../utils/ogcio-helper";
import SearchFilter from "./../components/SearchFilter";
import VueLayerMap from "./../components/VueLayerMap";
import asyncify from 'async/asyncify';
import {
  trackBatchSearch,
  trackBatchSearchResult
} from "./../utils/ga-helper";
const SEARCH_LIMIT = 200;

export default {
  components: {
    SearchFilter,
    VueLayerMap
  },
  data: () => ({
    drawer: true,
    addressString: "",
    addressesToSearch: [],
    errorMessage: null,
    count: 200,
    results: [],
    filterOptions: [],
    //normalizedResultsArr: [],
  }),
  computed: {
    hasError: function() {
      return this.errorMessage !== null;
    },
    // Return the unioned field list of all the results
    normalizedHeaders: function() {
      const headers = this.getDistinctHeaders();
      return [
        // the raw search
        {
          text: "地址",
          value: "address"
        },
        {
          text: "結果",
          value: "full_address"
        },
        {
          text: "地區",
          value: "subdistrict_name"
        },
        {
          text: "區議會選區",
          value: "dc_name"
        },
        {
          text: "緯度",
          value: "lat"
        },
        {
          text: "經度",
          value: "lng"
        },
        // the union headers
        ...headers.map(header => ({
          // TODO: change the "Region/DcDistrict" keywords to some meaningful text
          text: header.label,
          value: header.key
        }))
      ].filter(header => { // Filter only enabled header
        // note: if header option not found, it is default enabled
        const option = this.filterOptions.find(option => option.key === header.value);
        return option === undefined || option.enabled;
      });
    },
    normalizedResults: function() {
      // get the keys of the headers
      const headers = this.getDistinctHeaders();
      // We map the results to get the first match and with all the fields (including fields that other records have)
      // TODO: english address


      if(this.results[0] != undefined) {
          const results = this.results[0].map((result, index) => {
          let json = {
            afterNormalizedResult: {
              address: this.addressesToSearch[index],
              full_address: result.fullAddress('chi'),
              subdistrict_name: dclookup.dcNameFromCoordinates(
                result.coordinate().lat,
                result.coordinate().lng
              ).csubdistrict,
              dc_name: dclookup.dcNameFromCoordinates(
                result.coordinate().lat,
                result.coordinate().lng
              ).cname,
              lat: result.coordinate().lat,
              lng: result.coordinate().lng,
            },
            beforeNormalizedResult: result,
            rank: Number(index)
          };
          // Add the remaining fields from ogcio result
          headers.forEach(({key}) => {
            json.afterNormalizedResult[key] = result.componentValueForKey(key);
          });

          for (const key of Object.keys(json.afterNormalizedResult)) {
            const option = this.filterOptions.find(option => option.key === key);

            if (option !== undefined && !option.enabled) {
              delete json.afterNormalizedResult[key];
            };
          }
          return json;
        });
        //this.normalizedResultsArr = results;
        return results;
      }
    },
    // markers: function() {
    //   const latlng = this.normalizedResultsArr.reduce((accumulator, currentValue) => {
    //     accumulator.push({
    //       latlng: [Number(currentValue.lng), Number(currentValue.lat)]
    //     });
    //     return accumulator;
    //   }, []);
    //   return latlng;
    // }
  },
  methods: {
    /**
     * Return an array of distinct headers from all of the ogcio results
     */
    getDistinctHeaders: function() {
      let headers = [];
      this.results.forEach(result => {
        const address = result[0];
        const components = address.components();

        components.forEach(component => {
          if (headers.find(header => header.key === component.key) === undefined) {
            headers.push({
              key: component.key,
              label: component.translatedLabel
            });
          }
        });
      });
      return headers;
    },
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
          // Merge the filter options rather than reset it coz we want to keep the previous settings
          const options = self.filterOptions;
          self.normalizedHeaders.forEach(header => {
            if (options.find(opt => opt.key === header.value) === undefined) {
              options.push({
                value: header.text,
                key: header.value,
                enabled: true
              });
            }
          });
          self.filterOptions = options;

        }
      );
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