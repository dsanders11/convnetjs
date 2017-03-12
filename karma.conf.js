module.exports = function(karma) {
  var cfg = {
    basePath: '.',

    frameworks: ['jasmine'],

    preprocessors: {
      '**/*.js': ['sourcemap'],
    },

    coverageReporter: {
      type : 'json',
      dir : 'coverage/',
      file : 'coverage.json'
    },

    remapIstanbulReporter: {
      src: 'coverage/coverage.json',
      reports: {
        html: 'coverage/html/report'
      },
      remapOptions: {
        exclude: [
          'node_modules',
          '\[synthetic'
        ]
      }
    },

    files: [
      {pattern: 'src/**/*.js', included: false},
      'test/jasmine/spec/**/*.js',
      'dist/convnet.js'
    ],

    // list of files to exclude
    exclude: [],
    reporters: ['progress'],
    port: 8080,
    runnerPort: 9100,
    colors: true,
    autoWatch: true,

    browsers: ['Chrome'],
    singleRun: false,
    browserNoActivityTimeout: 200000
  };

  karma.set(cfg);
};
