<template>
  <v-container>
    <v-layout >
     <v-form ref="form" class="form">
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
import AddressParser from "./../../../src/address-parser";
import SingleMatch from "./../components/SingleMatch";

export default {
  components: {
    SingleMatch
  },
  data: () => ({
    address: "",
    count: 200,
    results: []
  }),
  methods: {
    async submit() {
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
    },
    /**
     * Match the level from the parser to some meaningful information
     */
    levelToString(level) {
      switch (level) {
        case 0:
          return "?";
        case 1:
          return "街名";
        case 2:
          return "大廈名/村名";
        case 3:
          return "街道名稱";
      }
      return "?";
    }
  }
};
</script>

<style>
.form {
  width: 80%;
}
</style>
