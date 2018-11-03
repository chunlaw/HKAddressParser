<template>
  <v-card >
    <v-card-title primary-title>
      <div>
        <h3 class="headline mb-0">{{ rank === 0 ? 'BEST MATCH!' : `Rank #${rank + 1}` }}</h3>
        <div>{{ fullChineseAddressFromResult(result.chi) }}</div>
        <div class="grey--text">{{ result.geo.Latitude + "," + result.geo.Longitude }}</div>
      </div>
      <v-container grid-list-md text-xs-left>
          <v-layout row wrap v-for="(value, key, index) in result.chi" :key="index" :class="index % 2 === 0 ? 'row-even': 'row-odd'">
            <v-flex class="field-title" xs4>{{ key }}</v-flex>
            <v-flex xs8>{{ value }}</v-flex>
          </v-layout>
      </v-container>
      <!-- <span class="grey--text">{{ 'Match: ' + levelToString(result.status.level) }}</span> -->
    </v-card-title>

    <br>
  </v-card>
</template>

<script>
import utils from "./../utils";
export default {
  props: {
    rank: Number,
    result: {
      status: Object,
      geo: Object,
      chi: Object,
      eng: Object
    }
  },
  data: () => ({}),
  methods: {
    levelToString: utils.levelToString,
    fullChineseAddressFromResult: utils.fullChineseAddressFromResult
  }
};
</script>

<style>
.form {
  width: 80%;
}

.field-title {
  border-right: 1px solid;
}

.row-odd {
  background-color: #ffffff;
}

.row-even {
  background-color: #cdffff;
}
</style>
