<template>
  <v-app>
    <v-toolbar app fixed clipped-left color="grey lighten-5 teal--text" >
      <v-toolbar-title>香港地址解析器 Hong Kong Address Parser (Beta - Release 0.3)</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn flat to="/">解析地址</v-btn>
        <v-btn flat href="https://goo.gl/forms/r6bdJHG228IZTgIZ2" target="_blank">反映意見</v-btn>
      </v-toolbar-items>
    </v-toolbar>
      <router-view/>
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
