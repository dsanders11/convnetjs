'use strict';
var gulp = require('gulp');
var runSequence = require('run-sequence');
var del = require('del');
var format = require('gulp-clang-format');
var karma = require('karma');
var sourcemaps = require('gulp-sourcemaps');
var closureCompiler = require('google-closure-compiler').gulp(
  {extraArguments: ['-XX:+TieredCompilation']});


var PATHS = {
  src: {
    checkFormat: [
      'src/**/*.js'
    ],
    closure: [
      'node_modules/google-closure-library/closure/goog/**/*.js',
      '!node_modules/google-closure-library/closure/goog/**/*_test.js',
      'node_modules/google-closure-library/third_party/**/*.js',
      '!node_modules/google-closure-library/third_party/**/*_test.js',
      'src/**/*.js'
    ],
  }
};

var CLOSURE_CONFIG = {
  assume_function_wrapper: true,
  generate_exports: true,
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  language_in: 'ECMASCRIPT6_STRICT',
  language_out: 'ECMASCRIPT5_STRICT',
  dependency_mode: 'STRICT',
  hide_warnings_for: [
    'node_modules/',
    '[synthetic'
  ],
  isolation_mode: 'IIFE',
  warning_level: 'VERBOSE',
  jscomp_warning: [
    'const',
    'constantProperty',
    'deprecatedAnnotations',
    'extraRequire',
    'functionParams',
    'globalThis',
    'lintChecks',
    'missingProperties',
    'missingProvide',
    'missingOverride',
    'missingRequire',
    'missingReturn',
    'nonStandardJsDocs',
    // 'reportUnknownTypes',
    'undefinedNames',
    'undefinedVars',
    'unknownDefines',
    'unusedLocalVariables',
    'unusedPrivateMembers',
    'uselessCode',
    'underscore',
    'visibility'
  ]
};

var CLOSURE_DEBUG_CONFIG = JSON.parse(JSON.stringify(CLOSURE_CONFIG));
delete CLOSURE_DEBUG_CONFIG['isolation_mode'];
CLOSURE_DEBUG_CONFIG['compilation_level'] = 'WHITESPACE_ONLY';
CLOSURE_DEBUG_CONFIG['force_inject_library'] = ['es6_runtime'];
CLOSURE_DEBUG_CONFIG['language_out'] = 'ECMASCRIPT5';
CLOSURE_DEBUG_CONFIG['formatting'] = 'PRETTY_PRINT';
CLOSURE_DEBUG_CONFIG['output_wrapper'] = 'self.CLOSURE_NO_DEPS = true;\n%output%';


gulp.task('clean', function() {
  return del(['dist', 'build', 'coverage']);
});

gulp.task('check-format', function() {
  return gulp.src(PATHS.src.checkFormat)
     .pipe(format.checkFormat(undefined, undefined, {verbose: true}));
});

gulp.task('format', function() {
  // The base option ensures the glob doesn't strip prefixes
  return gulp.src(PATHS.src.checkFormat, {base: '.'})
      .pipe(format.format())
      .pipe(gulp.dest('.'));
});

gulp.task('coverage', ['buildDebug'], function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true,
    preprocessors: {
      '**/*.js': ['sourcemap'],
      'dist/**/*.js': ['sourcemap', 'coverage']
    },
    reporters: ['progress', 'coverage', 'karma-remap-istanbul']
  }, done).start();
});

gulp.task('test', ['buildDebug'], function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('buildDebug:convnetjs', function() {
  var config = JSON.parse(JSON.stringify(CLOSURE_DEBUG_CONFIG));
  config['js_output_file'] = 'convnet.js';
  config['entry_point'] = 'convnetjs';

  return gulp.src(PATHS.src.closure)
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(config))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('buildDebug:cnnutil', function() {
  var config = JSON.parse(JSON.stringify(CLOSURE_DEBUG_CONFIG));
  config['js_output_file'] = 'convnet.util.js';
  config['entry_point'] = 'cnnutil';

  return gulp.src(PATHS.src.closure)
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(config))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('buildDebug:cnnvis', function() {
  var config = JSON.parse(JSON.stringify(CLOSURE_DEBUG_CONFIG));
  config['js_output_file'] = 'convnet.vis.js';
  config['entry_point'] = 'cnnvis';

  return gulp.src(PATHS.src.closure)
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(config))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('buildDebug', ['buildDebug:convnetjs', 'buildDebug:cnnutil', 'buildDebug:cnnvis']);

gulp.task('compile', function() {
  var config = JSON.parse(JSON.stringify(CLOSURE_CONFIG));
  config['js_output_file'] = 'convnet.min.js';
  config['entry_point'] = 'convnetjs';

  return gulp.src(PATHS.src.closure)
    .pipe(closureCompiler(config))
    .pipe(gulp.dest('dist'));
});

gulp.task('all', function(cb) {
  runSequence('compile', 'test', cb);
});

gulp.task('default', function(cb) {
  runSequence('clean', 'all', cb);
});
