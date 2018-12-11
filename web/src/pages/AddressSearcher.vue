<template>
  <v-container grid-list-md>
    <v-layout justify-center row>
      <v-flex xs10 lg6>
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
              <v-text-field
                v-model="address"
                placeholder="九龍佐敦彌敦道380號"
                append-icon="search"
                required
              ></v-text-field>

              <v-expansion-panel popout>
                <v-expansion-panel-content>
                  <div slot="header">進階選項</div>
                  <SearchFilter :filterOptions.sync="filterOptions"/>
                </v-expansion-panel-content>
              </v-expansion-panel>

              <v-btn @click="submit" dark class="teal">拆地址</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

    <v-layout justify-center row v-if="toggleMap">
      <v-flex xs10 lg6>
        <ArcGISMap ref="topMap"/>
      </v-flex>
    </v-layout>

    <v-layout justify-center row>
      <v-flex xs10 lg6>
        <div v-for="(result, index) in results" :key="index" class="expansion-wrapper">
          <SingleMatch :result="result" :rank="index" :filterOptions="filterOptions" :expanded="[index === 0]"/>
        </div>
      </v-flex>
    </v-layout>

    <v-layout justify-center row wrap>
      <v-flex xs5 lg3>
        <v-card class="px-2" height="100%">
          <v-card-text>
            <v-card-title>
              <h2>識揼code？</h2>
            </v-card-title>
            <v-card-text>
              <span>如果你識Python, node.js, vue.js，歡迎過嚟俾意見幫吓手！</span>
            </v-card-text>
            <v-card-actions>
              <v-btn
                outline
                color="teal"
                href="https://github.com/g0vhk-io/HKAddressParser"
                target="_blank"
              >Github</v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex xs5 lg3>
        <v-card class="px-2" height="100%">
          <v-card-text>
            <v-card-title>
              <h2>想一次過轉大量地址？</h2>
            </v-card-title>
            <v-card-text>
              <span>零技術含量，簡單Copy and Paste就得，仲可以下載CSV</span>
            </v-card-text>
            <v-card-actions>
              <v-btn outline color="teal" to="/batch">即刻試</v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import AddressParser from "./../lib/address-parser";
import SingleMatch from "./../components/SingleMatch";
import ArcGISMap from "./../components/ArcGISMap";
import SearchFilter from "./../components/SearchFilter";
import ogcioHelper from "./../utils/ogcio-helper";
import {
  trackSingleSearch,
  trackSingleSearchResult
} from "./../utils/ga-helper";

export default {
  components: {
    SingleMatch,
    ArcGISMap,
    SearchFilter
  },
  data: () => ({
    address: "",
    count: 200,
    results: [],
    filterOptions: {},
    toggleMap: false
  }),
  created: function() {
    this.filterOptions = ogcioHelper.topLevelKeys();
    this.filterOptions.forEach(option => (option.enabled = true));
  },
  methods: {
    submit: async function submit() {
      this.results = [];
      //const res = await fetch('http://localhost:8081/search/' + this.address);
      const URL = `https://www.als.ogcio.gov.hk/lookup?q=${this.address}&n=${
        this.count
      }`;
      trackSingleSearch(this, this.address);
      const res = await fetch(URL, {
        headers: {
          Accept: "application/json",
          "Accept-Language": "en,zh-Hant",
          "Accept-Encoding": "gzip"
        }
      });
      const data = await res.json();
      this.toggleMap = true;
      this.results = await AddressParser.searchResult(this.address, data);
      if (this.results && this.results.length > 0) {
        const result = this.results[0];
        trackSingleSearchResult(this, this.address, result.score | 0);
      }

      await this.$refs.topMap.gotoLatLng(
        Number(this.results[0].geo[0].Latitude),
        Number(this.results[0].geo[0].Longitude)
      );
    }
  }
};
</script>