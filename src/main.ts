import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue';
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import router from './router'
import store from './store'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'

//Vue.use(Buefy)
//import './registerServiceWorker'

Vue.use(BootstrapVue);

//Vue.config.productionTip = false

// new Vue({
//   router,
//   store,
//   render: h => h(App)
// }).$mount('#app')

const vm = new Vue({
  render: h => h(App)
});

vm.$mount('#app');
