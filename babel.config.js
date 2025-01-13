module.exports = {
  plugins: [
    [
      '@emotion/babel-plugin',
      {
        autoLabel: 'always',
        labelFormat: '[local]',
        sourceMap: true,
        cssPropOptimization: true
      }
    ]
  ]
};
