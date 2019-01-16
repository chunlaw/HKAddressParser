<template>
  <v-app>
    <v-toolbar app fixed clipped-left color="grey lighten-5 teal--text" >
      <v-toolbar-title>香港地址解析器 Hong Kong Address Parser (Beta - Release {{ APP_VERSION }})</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn flat to="/">地圖模式</v-btn>
        <v-btn flat to="/table">表格模式</v-btn>
        <v-btn flat href="https://github.com/g0vhk-io/HKAddressParser" target="_blank">GitHub</v-btn>
        <v-btn flat href="https://goo.gl/forms/r6bdJHG228IZTgIZ2" target="_blank">反映意見</v-btn>
      </v-toolbar-items>
    </v-toolbar>
      <router-view/>
  </v-app>
</template>

<script>
const APP_VERSION = process.env.VUE_APP_REV_NAME;

export default {
  name: "App",
  data() {
    return {
      APP_VERSION
    };
  }
};
</script>