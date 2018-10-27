<template>
  <v-container>
    <v-layout >
     <v-form ref="form" class="form">
      <v-text-field
        v-model="address"
        label="Address"
        required
      ></v-text-field>


      <v-btn
        @click="submit"
      >
        Search
      </v-btn>
      <template>
       <div v-for="result in results">

            <v-card>
              <v-card-title primary-title>
                <span class="grey--text">{{ 'Match: ' + levelToString(result.status.level) }}</span>
              </v-card-title>
              <v-card-title primary-title>
                <span class="grey--text">{{ result.geo.Latitude + ":" + result.geo.Longitude }}</span>
              </v-card-title>
              <v-card-title primary-title>

                <ul>
                 <li v-for="value, index in result.chi">
                   {{ index +":" + value }}
                  </li>
                  </ul>
              </v-card-title>

              <br>
            </v-card>
        </div>
      </template>
    </v-form>


    </v-layout>
  </v-container>
</template>

<script>
  import AddressParser from './../../../src/address-parser';
  export default {
    data: () => ({
      address: '銅鑼灣謝斐道488號',
      count: 200,
      results: []
    }),
    methods: {
      async submit () {
        this.results = [];
        //const res = await fetch('http://localhost:8081/search/' + this.address);
        const URL = `https://www.als.ogcio.gov.hk/lookup?q=${this.address}&n=${this.count}`;
        const res = await fetch(URL, {
          headers: {
            Accept: 'application/json'
          }
        });
        const data = await res.json();
        this.results = await AddressParser.searchResult(this.address, data);
      },
      levelToString (level) {
        switch (level) {
          case 0: return '?';
          case 1: return '街名';
          case 2: return '大廈名/村名';
          case 3: return '街道名稱';
        }
        return '?';
      }
    }
  }
</script>

<style>
.form {
  width: 80%
}
</style>
