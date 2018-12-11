<template>
  <v-awicon label="Tick" v-on:click.native="onIconClicked" class="icon-button">
    <v-awicon name="circle" scale="2" class="icon-bg"/>
    <v-awicon name="check" class="icon-content"/>
  </v-awicon>
</template>

<script>
export default {
  props: {
    onClick: Function
  },
  methods: {
    onIconClicked: function(event) {
      event.stopPropagation();
      if (this.onClick) {
        this.onClick();
      }
    }
  }
};
</script>

<style>

.icon-bg {
  color: #41b883;
}

.icon-content {
 color: #35495e;
}
.icon-button:hover .icon-bg{
  color: #35495e;
}

.icon-button:hover .icon-content{
  color: #41b883;
}
</style>
