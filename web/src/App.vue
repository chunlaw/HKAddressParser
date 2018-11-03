<template>
  <v-app>
    <v-content>
      <AddressSearcher/>
    </v-content>
  </v-app>
</template>

<script>
import AddressSearcher from './pages/AddressSearcher'

export default {
  name: 'App',
  components: {
    AddressSearcher
  },
  data () {
    return {
      //
    }
  }
}
</script>
