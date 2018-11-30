<template>
    <v-container>
        <v-layout row wrap>
            <v-flex xs6 sm4 md4
              v-bind:key="item.key"
              v-for="item in filterOptions">
              <v-checkbox 
                    :label="item.value"
                    v-model="item.enabled"
                    v-on:change="onChange"
                    color="teal"
                ></v-checkbox>
           </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
export default {
  props: {
    filterOptions: Array
  },
  data: () => ({
  }),
  created: function() {    
  },
  methods: {
    onChange: function() {
      this.$root.$emit('filterUpdate', this.filterOptions);
    }
  }
};
</script>