<template>
  <v-content style="padding: 0px">
    <div slot="header">進階選項</div>
    <SearchFilter :filterOptions.sync="filterOptions" />
    <!-- When to show the datatable? Now showing it when ever there is data -->
    <v-data-table
    :headers="normalizedHeaders"
    :items="normalizedResults"
    :rows-per-page-items="[ 50, 100, 500, { 'text': '$vuetify.dataIterator.rowsPerPageAll', 'value': -1 } ]"
    class="elevation-1"
    >
    <template slot="items" slot-scope="props">
        <td v-for="(field, index) in props.item" :key="index">{{ field }}</td>
    </template>
    </v-data-table>
  </v-content>
</template>

<script>
import SearchFilter from "./../components/SearchFilter";

export default {
    components: {
        SearchFilter
    },
    props: {
        filterOptions: Array,
        normalizedHeaders: Array,
        normalizedResults: Array
    },
    computed: {
        hasError: function() {
            return this.errorMessage !== null;
        },
    }, 
}
</script>