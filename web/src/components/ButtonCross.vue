<script>
import ButtonTick from './ButtonTick';

export default {
  extends: ButtonTick,
  props: {
    icon: {
      type: String,
      default: "times"
    },
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
