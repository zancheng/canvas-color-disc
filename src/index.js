import CanvasColorDisc from './components/CanvasColorDisc.vue';

// Vue 2 下 Vue.use() 传入构造函数，Vue 3 下 app.use() 传入应用实例，
// 两者的 component() 用法一致，因此无需区分版本
CanvasColorDisc.install = (Vue) => {
    Vue.component(CanvasColorDisc.name, CanvasColorDisc);
};

// 只保留默认导出：UMD 构建下 window.CanvasColorDisc 才会是组件本身
export default CanvasColorDisc;
