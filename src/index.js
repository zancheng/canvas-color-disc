/*
 * @Descripttion:
 * @version:
 * @Author: chengzan
 * @Date: 2021-10-13 11:14:52
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-10-16 15:01:18
 */
import CanvasColorDisc from './components/CanvasColorDisc.vue'
import _Vue from 'vue'

CanvasColorDisc.install = Vue => {
    if (!Vue) {
        window.Vue = Vue = _Vue
    }
    Vue.component(CanvasColorDisc.name, CanvasColorDisc)
}
export default CanvasColorDisc
