<template>
  <v-container>
    <v-alert
      v-model="hasError"
      type="error"
    >
      {{ this.errorMessage }}
    </v-alert>

      <v-form ref="form" class="form" @submit.prevent="submit">

        <v-textarea
          outline
          name="input-7-1"
          label="Please input the addresses to search. (Seperated by newlines)"
          value=""
          v-model="addressString"
        ></v-textarea>

      <v-btn @click="submit">
        Search
      </v-btn>
      <download-excel
          v-if="results.length > 0 && results.length === addressesToSearch.length"
          :data="normalizedResults"
          type="csv"
          >
          <v-btn>Download</v-btn>
          <!-- <img src="download_icon.png"> -->
      </download-excel>

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
          :rows-per-page-items='[ 50, 100, 500, { "text": "$vuetify.dataIterator.rowsPerPageAll", "value": -1 } ]'

          class="elevation-1"
        >
          <template slot="items" slot-scope="props">
            <td v-for="(field, index) in props.item" :key="index" >
              {{ field }}
            </td>

          </template>
        </v-data-table>
      </template>


      <!-- <div v-for="(result, index) in results" :key="index">
        <SingleMatch :result="result" :rank="index"/>
      </div> -->

    </v-form>
  </v-container>
</template>

<script>
import AddressParser from "./../lib/address-parser";
import SingleMatch from "./../components/SingleMatch";
import ArcGISMap from "./../components/ArcGISMap";
import async from "async";
import utils from "./../utils";

const SEARCH_LIMIT = 200;

export default {
  components: {
    SingleMatch,
    ArcGISMap
  },
  data: () => ({
    addressString:
      "",
    addressesToSearch: [],
    errorMessage: null,
    count: 200,
    results: []
  }),
  computed: {
    hasError: function() {
      return this.errorMessage !== null;
    },
    // Return the unioned field list of all the results
    normalizedHeaders: function() {
      const headers = this.getUnionedHeaders();
      return [
        // the raw search
        {
          text: "Address",
          value: "address"
        },
        {
          text: "Full Result",
          value: "full_result"
        },
        {
          text: "Latitude",
          value: "lat"
        },
        {
          text: "Longitude",
          value: "lng"
        },
        // the union headers
        ...headers.map(header => ({
          // TODO: change the "Region/DcDistrict" keywords to some meaningful text
          text: header,
          value: header
        }))
      ];
    },
    normalizedResults: function() {
      // get the keys of the headers
      const headers = this.getUnionedHeaders();
      // We map the results to get the first match and with all the fields (including fields that other records have)
      // TODO: english address
      const results = this.results.map((result, index) => {
        let json = {
          address: this.addressesToSearch[index],
          full_address: utils.fullChineseAddressFromResult(result[0].chi),
          lat: result[0].geo.Latitude,
          long: result[0].geo.Longitude
        };

        headers.forEach(field => {
          json[field] = result[0].chi[field] ? result[0].chi[field] : "";
        });

        return json;
      });
      return results;
    }
  },
  methods: {
    getUnionedHeaders: function() {
      let headers = [];
      this.results.forEach(result => {
        // result is an array
        const singleResult = result[0].chi;
        const keys = Object.keys(singleResult);
        // Get the union of headers
        headers = [...new Set([...headers, ...keys])];
      });
      return headers;
    },
    submit: async function submit() {
      // Clear up the alert box first
      this.errorMessage = null;
      this.results = [];
      if (this.addressString.length === 0) {
        this.errorMessage = "No address to search";
        return;
      }
      this.addressesToSearch = this.addressString.split(/\n/).fliter(address => address !== null && address.length > 0);
      async.eachOfLimit(
        this.addressesToSearch,
        5,
        // binding this for setting the results during the process
        searchSingleResult.bind(this),
        err => {
          // All query finished
        }
      );
    }
  }
};

async function searchSingleResult(address, key) {
  //const res = await fetch('http://localhost:8081/search/' + this.address);
  const URL = `https://www.als.ogcio.gov.hk/lookup?q=${address}&n=${SEARCH_LIMIT}`;
  const res = await fetch(URL, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en,zh-Hant",
      "Accept-Encoding": "gzip"
    }
  });
  const data = await res.json();
  const records = await AddressParser.searchResult(address, data);

  this.$set(this.results, key, records);
  return records;
}
</script>

<style>
.form {
  width: 100%;
}
</style>
