<template>
  <v-awicon v-if="enabled" label="Tick" v-on:click.native="onIconClicked" class="icon-button">
    <v-awicon name="circle" scale="2" class="icon-bg"/>
    <v-awicon :name="icon" class="icon-content"/>
  </v-awicon>
  <v-awicon v-else label="Tick">
    <v-awicon name="circle" scale="2" class="icon-bg disabled"/>
    <v-awicon :name="icon" class="icon-content disabled"/>
  </v-awicon>
</template>

<script>
export default {
  props: {
    onClick: Function,
    icon: {
      type: String,
      default: "check"
    },
    enabled: Boolean
  },
  methods: {
    onIconClicked: function(event) {
      if (this.enabled) {
        event.stopPropagation();
        if (this.onClick) {
          this.onClick();
        }
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
.icon-button:hover .icon-bg {
  color: #35495e;
}

.icon-button:hover .icon-content {
  color: #41b883;
}

.disabled {
  opacity: 0.5;
}
</style>
