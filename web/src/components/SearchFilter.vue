<template>
    <v-container>
        <v-layout row wrap>
            <v-flex xs12 sm4 md4>
                <v-checkbox
                    :label="`Region`"
                    v-model="region"
                    color="teal"
                ></v-checkbox>

                <v-checkbox
                    :label="`DC District`"
                    v-model="dcDistrict"
                    color="teal"
                ></v-checkbox>

            </v-flex>
            <v-flex xs12 sm4 md4>
                <v-checkbox
                    :label="`Building Number from`"
                    v-model="buildingNoFrom"
                    color="teal"
                ></v-checkbox>
                <v-checkbox
                    :label="`Building Name`"
                    v-model="buildingName"
                    color="teal"
                ></v-checkbox>
            </v-flex>
            <v-flex xs12 sm4 md4>
                <v-checkbox
                    :label="`Street Name`"
                    v-model="streetName"
                    color="teal"
                ></v-checkbox>
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
export default {
  props: {},
  data: () => ({
      region: true,
      dcDistrict: true,
      buildingNoFrom: true,
      buildingName: true,
      streetName: true
  }),
  methods: {
      getFilterOptions: function() {
          return {
              region: this.region,
              dcDistrict: this.dcDistrict,
              buildingNoFrom: this.buildingNoFrom,
              buildingName: this.buildingName,
              streetName: this.streetName
          }
      }
  }
};
</script>