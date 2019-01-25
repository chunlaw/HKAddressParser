<template>
  <v-content>
    <v-container grid-list-sm>
      <v-layout row wrap>
        <v-flex xs12 pa-0 mt-3>
          <h2 class="teal--text heading-2">表格模式</h2>
          <p>請將香港地址貼於下方表格，網站會將地址解析成地區、街道、門牌、大廈、區議會選區等地址資料。</p>
          <p>你可以按「下載CSV」按鈕，進一步作樞紐分析空間數據，歸納地址集中在哪一地區、哪條街道，從凌亂資料中提煉找出有價值的資訊。</p>
          <v-form ref="form" class="form" @submit.prevent="submit">
            <v-textarea
              outline
              name="input-7-1"
              label="請輸入地址（每行一個地址）"
              value
              v-model="addressString"
            ></v-textarea>
            <div slot="header">進階選項</div>
            <SearchFilter :filterOptions.sync="filterOptions"/>
            <v-flex>
              <v-layout row wrap>
                <v-btn @click="submit" dark class="teal">拆地址</v-btn>
                <download-excel
                  v-if="results.length > 0 && results.length === addressesToSearch.length"
                  :fetch="prepareDownloadCSV"
                  type="csv"
                >
                  <v-btn dark class="teal">下載 CSV</v-btn>
                </download-excel>
              </v-layout>
            </v-flex>
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
                  <td v-for="(field, index) in props.item" :key="index">{{ field }}</td>
                </template>
              </v-data-table>
            </template>
          </v-form>
        </v-flex>
      </v-layout>
    </v-container>
  </v-content>
</template>

<script>
import AddressResolver from "./../lib/address-resolver";
import asyncLib from "async";
import dclookup from "./../utils/dclookup";
import ogcioHelper from "./../utils/ogcio-helper";
import SearchFilter from "./../components/SearchFilter";
import asyncify from "async/asyncify";
import { trackTableSearch, trackDownloadCSV } from "./../utils/ga-helper";
const SEARCH_LIMIT = 200;
var asde = 200;

export default {
  components: {
    SearchFilter
  },
  data: () => ({
    drawer: true,
    addressString: "",
    addressesToSearch: [],
    errorMessage: null,
    count: 200,
    results: [],
    filterOptions: []
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
      ].filter(header => {
        // Filter only enabled header
        // note: if header option not found, it is default enabled
        const option = this.filterOptions.find(
          option => option.key === header.value
        );
        return option === undefined || option.enabled;
      });
    },
    normalizedResults: function() {
      // get the keys of the headers
      const headers = this.getDistinctHeaders();
      // We map the results to get the first match and with all the fields (including fields that other records have)
      // TODO: english address
      const results = this.results.map((searchResults, index) => {
        const result = searchResults[0];
        let json = {
          address: this.addressesToSearch[index],
          full_address: result.fullAddress("chi"),
          subdistrict_name: dclookup.dcNameFromCoordinates(
            result.coordinate().lat,
            result.coordinate().lng
          ).csubdistrict,
          dc_name: dclookup.dcNameFromCoordinates(
            result.coordinate().lat,
            result.coordinate().lng
          ).cname,
          lat: result.coordinate().lat,
          lng: result.coordinate().lng
        };
        // Add the remaining fields from ogcio result
        headers.forEach(({ key }) => {
          json[key] = result.componentValueForKey(key, "chi");
        });

        for (const key of Object.keys(json)) {
          const option = this.filterOptions.find(option => option.key === key);

          if (option !== undefined && !option.enabled) {
            delete json[key];
          }
        }
        return json;
      });
      return results;
    }
    // markers: function() {
    //   const latlng = this.normalizedResults.reduce((accumulator, currentValue) => {
    //     console.log(currentValue)
    //     // return accumulator.push(currentValue.lat)
    //   }, []);
    //   return latlng;
    // }
  },
  methods: {
    prepareDownloadCSV: function() {
      trackDownloadCSV(this, this.normalizedResults.length);
      return this.normalizedResults;
    },
    /**
     * Return an array of distinct headers from all of the ogcio results
     */
    getDistinctHeaders: function() {
      let headers = [];
      this.results.forEach(result => {
        const address = result[0];
        const components = address.components("chi");

        components.forEach(component => {
          if (
            headers.find(header => header.key === component.key) === undefined
          ) {
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
      this.addressesToSearch = this.addressString
        .split("\n")
        .filter(address => address !== undefined && address.length > 0);
      trackTableSearch(this, this.addressesToSearch.length);
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
  }
  return records;
}
</script>

<style>
.heading-2 {
  margin-bottom: 1rem;
}
</style>
