// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential',
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    // 'standard'
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  rules: {
    // allow async-await
    // allow debugger during development
    "vue/html-indent": ["error", 4, {
      "attribute": 1,
      "baseIndent": 1,
      "closeBracket": 0,
      "alignAttributesVertically": true,
      "ignores": []
    }],
    "vue/max-attributes-per-line": ["error", {
      "singleline": 3,
      "multiline": {
        "max": 5,
        "allowFirstLine": false
      }
    }],
    'indent': [2, 4], // 缩进4
    'comma-dangle': 0, // 对象字面量项尾不能有逗号
    'new-cap': 0, // 函数名首行大写必须使用new方式调用，首行小写必须用不带new方式调用
    'no-console': 0,// 禁止使用console
    'no-extra-semi': 0, // 禁止多余的冒号
    'no-new': 0, // 禁止在使用new构造一个实例后不赋值
    'no-undef': 0, // 不能有未定义的变量
    'quote-props': 0, // 属性名不限制
    "quotes": [0, "double"],
    'space-before-function-paren': [2, 'never'], // 函数定义时括号前面要不要有空格
    'semi': [2, 'never'], // 语句强制分号结尾
    'no-unused-expressions': 'off', // 禁止无用的表达式
    'generator-star-spacing': 'off', // 生成器函数*的前后空格
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 禁止使用debugger
    "vue/html-quotes": ["error", "double"], // html内使用双引号
    "vue/eqeqeq": 2,
    "no-empty": 2, // 禁止出现空语句块
    "no-alert": 0,//禁止使用alert confirm prompt
    "no-array-constructor": 2,//禁止使用数组构造器
    "no-eq-null": 2,//禁止对null使用==或!=运算符
  }
}
