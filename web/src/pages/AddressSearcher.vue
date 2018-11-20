<template>
  <v-container>
    <ArcGISMap ref='topMap'/>

     <v-form ref="form" class="form" @submit.prevent="submit">

      <v-text-field
        v-model="address"
        label="請輸入地址"
        placeholder="如：九龍佐敦彌敦道380號"
        append-icon="search"
        required
      ></v-text-field>

      <v-btn @click="submit">
        拆地址
      </v-btn>
    </v-form>

    <v-container
            fluid
            grid-list-lg
          >
          <div v-for="(result, index) in results" :key="index">
            <SingleMatch :result="result" :rank="index"/>
          </div>
    </v-container>


    
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
          "Accept": "application/json",
          "Accept-Language": "en,zh-Hant",
          "Accept-Encoding": "gzip"
        }
      });
      const data = await res.json();
      this.results = await AddressParser.searchResult(this.address, data);
      await this.$refs.topMap.gotoLatLng(
        Number(this.results[0].geo.Latitude),
        Number(this.results[0].geo.Longitude)
      );
    }
  }
};
</script>
