// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  // 需要解析 .vue，因此用 vue-eslint-parser；脚本部分由 espree 按 ES2020 解析
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  extends: [
    'eslint:recommended',
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // 组件源码同时编译给 Vue 2 / Vue 3，这里用不含版本差异的 essential 规则集
    'plugin:vue/essential',
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    'vue/html-indent': ['error', 4, {
      'attribute': 1,
      'baseIndent': 1,
      'closeBracket': 0,
      'alignAttributesVertically': true,
      'ignores': []
    }],
    // eslint-plugin-vue 9 起 multiline 只接受数字
    'vue/max-attributes-per-line': ['error', {
      'singleline': 3,
      'multiline': 5
    }],
    'indent': [2, 4], // 缩进4
    'comma-dangle': 0, // 对象字面量项尾不能有逗号
    'new-cap': 0, // 函数名首行大写必须使用new方式调用，首行小写必须用不带new方式调用
    'no-console': 0,// 禁止使用console
    'no-extra-semi': 0, // 禁止多余的冒号
    'no-new': 0, // 禁止在使用new构造一个实例后不赋值
    'no-undef': 0, // 不能有未定义的变量
    'quote-props': 0, // 属性名不限制
    'quotes': [0, 'double'], // 引号不限制
    'space-before-function-paren': [2, 'never'], // 函数定义时括号前面不要有空格
    // 源码统一使用分号结尾，规则需与代码保持一致
    'semi': [2, 'always'],
    'no-unused-expressions': 'off', // 禁止无用的表达式
    'generator-star-spacing': 'off', // 生成器函数*的前后空格
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 禁止使用debugger
    'vue/html-quotes': ['error', 'double'], // html内使用双引号
    'vue/eqeqeq': 2,
    'no-empty': [2, { 'allowEmptyCatch': true }], // 禁止空语句块，但允许空的 catch
    'no-alert': 0,//禁止使用alert confirm prompt
    'no-array-constructor': 2,//禁止使用数组构造器
    'no-eq-null': 2,//禁止对null使用==或!=运算符
  },
  overrides: [
    {
      // 测试与构建配置跑在 Node 下，且使用 ESM
      files: ['test/**/*.js', 'config/**/*.js'],
      env: {
        node: true,
        browser: false
      }
    }
  ]
}
