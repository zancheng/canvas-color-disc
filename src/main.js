/*
 * @Descripttion:
 * @version:
 * @Author: chengzan
 * @Date: 2021-10-16 10:31:31
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-10-16 15:50:40
 */
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
//main.js中引入
import canvasColorDisc from 'canvasColorDisc'
import App from './App'

Vue.config.productionTip = false

Vue.use(canvasColorDisc);
/* eslint-disable no-new */
new Vue({
    el: '#app',
    components: { App },
    template: '<App/>'
})
