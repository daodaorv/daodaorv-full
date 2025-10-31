import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import uviewPlus from "uview-plus";
import App from "./App.vue";
import router from "@/utils/router";

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(uviewPlus);

  // 挂载路由工具到全局
  app.config.globalProperties.$router = router;

  return {
    app,
  };
}
