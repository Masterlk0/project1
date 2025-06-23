module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'), // Use require.resolve
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
};
