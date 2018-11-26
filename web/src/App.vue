<template>
  <v-app>
    <v-toolbar app color="grey lighten-5 teal--text">
      <v-toolbar-title>香港地址解析器 Hong Kong Address Parser</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn flat to="/">單次處理</v-btn>
        <v-btn flat to="/batch">大量處理</v-btn>
        <v-btn flat href="https://goo.gl/forms/r6bdJHG228IZTgIZ2" target="_blank">反映意見</v-btn>
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
