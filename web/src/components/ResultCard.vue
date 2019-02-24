<template>
  <v-container fluid>
    <v-layout row>
      <v-flex pa-0>
        <v-card flat>
          <v-card-text>
            <p class="grey--text">搜尋地址：{{searchAddress}}</p>
            <h2>{{ result.fullAddress('chi') }}</h2>
            <h3>{{ result.fullAddress('eng') }}</h3>
              <a 
              class="grey--text no-underline" 
              target='_blank' 
              :href='"https://www.google.com/maps/search/?api=1&query=" + result.coordinate().lat + "," + result.coordinate().lng'>{{ result.coordinate().lat + ", " + result.coordinate().lng }}</a>

          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex shrink pa-0>
        <v-card flat>
          <v-card-text>
            <v-layout row>
            <ButtonTick :enabled="!commented" :onClick="onTickClicked"/>
            <ButtonCross :enabled="!commented" :onClick="onCrossClicked"/>
            </v-layout>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
    <v-layout row>
      <v-flex pa-0>
        <v-card flat>
          <v-list dense subheader>
            <v-list-tile>
              <v-list-tile-content>
                <span>Sub District</span>
                <span>地區</span>
              </v-list-tile-content>
              <v-list-tile-content class="align-end">
                <span>{{ district.esubdistrict }}</span>
                <span>{{ district.csubdistrict }}</span>
              </v-list-tile-content>
            </v-list-tile>
            <v-divider></v-divider>
            <v-list-tile>
              <v-list-tile-content>
                <span>District Council Constituency Area</span>
                <span>區議會選區</span>
              </v-list-tile-content>
              <v-list-tile-content class="align-end">
                <span>{{ district.ename }}</span>
                <span>{{ district.cname }}</span>
              </v-list-tile-content>
            </v-list-tile>
            <v-divider></v-divider>
          </v-list>
          <v-list dense subheader v-for="key in filteredKeys" :key="key">
            <v-list-tile>
              <v-list-tile-content>
                <span>{{ result.componentLabelForKey(key, 'eng') }}</span>
                <span>{{ result.componentLabelForKey(key, 'chi') }}</span>
              </v-list-tile-content>
              <v-list-tile-content class="align-end">
                <span>{{ result.componentValueForKey(key, 'eng') }}</span>
                <span>{{ result.componentValueForKey(key, 'chi') }}</span>
              </v-list-tile-content>
            </v-list-tile>
            <v-divider></v-divider>
          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
    <v-layout row>
      <v-flex pa-0>
        <v-card flat>
          <v-card-text>{{ '資料來源： ' + result.dataSource() }}</v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import Address from "./../lib/models/address";
import dclookup from "./../utils/dclookup";
import ButtonTick from "./ButtonTick";
import ButtonCross from "./ButtonCross";
import { trackSingleSearchSatisfied } from "./../utils/ga-helper";
export default {
  components: {
    ButtonTick,
    ButtonCross
  },
  props: {
    searchAddress: String,
    rank: Number,
    result: Object,
    filterOptions: Array
  },
  data: () => ({
    commented: false,
    disableContent: false,
    filteredKeys: [],
    localFilterOptions: [],
    expanded: [true] // set the default value by the rank. first object should be expanded
  }),
  mounted: function() {
    this.localFilterOptions = this.filterOptions;
    this.filteredKeys = this.getFilteredKeys();
    this.$root.$on("filterUpdate", options => {
      this.localFilterOptions = options;
      this.filteredKeys = this.getFilteredKeys();
      this.$forceUpdate();
    });
    //this.expanded = [this.isBestMatch];
  },
  computed: {
    district: function() {
      return dclookup.dcNameFromCoordinates(
        this.result.coordinate().lat,
        this.result.coordinate().lng
      );
    },
    isBestMatch: function() {
      return this.rank === 0;
    }
  },
  methods: {
    tick: function(e) {
      e.stopPropagation();
      console.log("tick");
    },
    getFilteredKeys: function() {
      return (this.filteredKeys = this.localFilterOptions
        .filter(
          opt =>
            opt.enabled &&
            this.result.componentLabelForKey(opt.key, "chi") !== ""
        )
        .map(opt => opt.key));
    },
    onTickClicked: function() {
      this.commented = true;
      trackSingleSearchSatisfied(this, this.searchAddress, true);
    },
    onCrossClicked: function() {
      this.commented = true;
      trackSingleSearchSatisfied(this, this.searchAddress, false);
    }
  }
};
</script>

<style>
.no-underline {
  text-decoration: none;
}

.no-underline:hover {
  text-decoration: underline;
}
.align-end {
  text-align: right;
  white-space: pre;
  -webkit-box-align: end;
  -ms-flex-align: end;
  align-items: flex-end;
}

</style>