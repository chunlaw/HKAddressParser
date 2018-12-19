<template>
    <v-container>
        <v-layout row wrap>
            <v-flex
              :xs3="xs3"
              :key="item.key"
              v-for="item in filterOptions">
              <v-checkbox
                    :label="item.value"
                    v-model="item.enabled"
                    v-on:change="onChange(item)"
                    color="teal"
                ></v-checkbox>
           </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
import {
  trackToggleFilterOption
} from "./../utils/ga-helper";

export default {
  props: {
    filterOptions: Array,
    xs3: Boolean
  },
  data: () => ({
  }),
  created: function() {
  },
  methods: {
    onChange: function(option) {
      trackToggleFilterOption(this, option.key, option.enabled);
      this.$root.$emit('filterUpdate', this.filterOptions);
    }
  }
};
</script>