<template>
  <v-app>
    <v-toolbar app>
      <v-toolbar-title>香港地址編碼定位器 Hong Kong Address Parser</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn flat to="/">進階處理</v-btn>
        <v-btn flat to="/batch">大量處理</v-btn>
        <v-btn flat href="https://goo.gl/forms/lDKpoOm7bStvJ2483" target="_blank">反映意見</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-content>
      <router-view/>
    </v-content>

  </v-app>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      //
    };
  }
};
</script>
