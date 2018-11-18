<template>
  <v-app>
    <v-toolbar app>
      <nav class="App__nav">
      <router-link to="/">Single Search</router-link> |
      <router-link to="/batch">Batch Search</router-link>
      </nav>
    </v-toolbar>
    <v-content>
      <router-view/>
    </v-content>

  </v-app>
</template>

<script>


export default {
  name: 'App',
  data () {
    return {
      //
    }
  }
}
</script>
