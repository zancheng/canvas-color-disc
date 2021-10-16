/*
 * @Descripttion: 
 * @version: 
 * @Author: chengzan
 * @Date: 2021-10-13 14:19:14
 * @LastEditors: 
 * @LastEditTime: 2021-10-13 14:19:28
 */
import Vue from 'vue/dist/vue.min.js'
import App from './App.vue'

/* eslint-disable */
console.log(Vue.version)
new Vue({
  el: '#app-wrap',
  render: h => h(App)
  // components: { App }
})