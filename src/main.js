import { createApp } from 'vue'
import App from './App.vue'
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";

const app = createApp(App)

Sentry.init({
  app,
  dsn: "https://a55430ddf772474bb49555c11a6d2354@o4504727768465408.ingest.sentry.io/4504727891935232",
  integrations: [
    new BrowserTracing({
      // routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracePropagationTargets: ["localhost", "my-site-url.com", /^\//],
    }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
app.mount('#app')

setTimeout(()=>{

throw new Error('test Sentry')
},5000)
