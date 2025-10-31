<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useUserStore } from "@/store/modules/user";

onLaunch(() => {
  console.log("App Launch");

  // 初始化用户状态
  const userStore = useUserStore();
  userStore.init();
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style>
/*每个页面公共css */
</style>
