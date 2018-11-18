<template>
  <v-container>
    <ArcGISMap ref='topMap'/>
    <v-layout >


     <v-form ref="form" class="form" @submit.prevent="submit">
      <v-text-field
        v-model="address"
        label="Address"
        placeholder="e.g. 銅鑼灣謝斐道488號"
        required
      ></v-text-field>

      <v-btn @click="submit">
        Search
      </v-btn>


      <div v-for="(result, index) in results" :key="index">
        <SingleMatch :result="result" :rank="index"/>
      </div>

    </v-form>


    </v-layout>
  </v-container>
</template>

<script>
import AddressParser from "./../lib/address-parser";
import SingleMatch from "./../components/SingleMatch";
import ArcGISMap from "./../components/ArcGISMap";

export default {
  components: {
    SingleMatch,
    ArcGISMap
  },
  data: () => ({
    address: "",
    count: 200,
    results: []
  }),
  methods: {
    submit: async function submit() {
      this.results = [];
      //const res = await fetch('http://localhost:8081/search/' + this.address);
      const URL = `https://www.als.ogcio.gov.hk/lookup?q=${this.address}&n=${
        this.count
      }`;
      const res = await fetch(URL, {
        headers: {
          Accept: "application/json",
          "Accept-Language": "en,zh-Hant",
          "Accept-Encoding": "gzip"
        }
      });
      const data = await res.json();
      this.results = await AddressParser.searchResult(this.address, data);
      await this.$refs.topMap.gotoLatLng(Number(this.results[0].geo.Latitude),
                                         Number(this.results[0].geo.Longitude));
    },
  }
};
</script>

<style>
.form {
  width: 80%;
}
</style>
