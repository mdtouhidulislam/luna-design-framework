'use strict';

const gulp = require('gulp'),
      rollup = require('gulp-rollup'),
      del = require('del'),
      rename = require('gulp-rename'),
      sass = require('gulp-sass')(require('sass')),
      autoprefixer = require('gulp-autoprefixer'),
      sourcemaps = require('gulp-sourcemaps'),
      browserSync = require('browser-sync').create(),
      reload = browserSync.reload,
      babel = require('gulp-babel'),
      uglify = require('gulp-uglify'),
      packageFile = require('./package.json');

// Define reusable paths
const path = {
  scss: 'assets/scss',
  src_js: 'assets/js/src',
  js: 'assets/js',
  css: 'assets/css',
  vendor: 'assets/vendor'
}

// Sass compiling
// Expanded
gulp.task('sass:expanded', () => {
  const options = {
    outputStyle: 'expanded',
    precision: 10 // rounding of css color values, etc..
  };
  const sourceOptions = {
    cwd: path.scss,
    base: path.scss
  };
  return gulp.src(['*.scss', '*/*/*.scss'], sourceOptions)
    .pipe(sass.sync(options).on('error', sass.logError))
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(gulp.dest(path.css))
    .pipe(browserSync.stream()); // Inject css into browser
});

// Minified
gulp.task('sass:minified', () => {
  const options = {
    outputStyle: 'compressed',
    precision: 10 // rounding of css color values, etc..
  };
  const sourceOptions = {
    cwd: path.scss,
    base: path.scss
  };
  return gulp.src(['*.scss', '*/*/*.scss'], sourceOptions)
    .pipe(sourcemaps.init())
    .pipe(sass.sync(options).on('error', sass.logError))
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(rename({ suffix: '.min'}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.css))
    .pipe(browserSync.stream()); // Inject css into browser
});

// JS compiling and minification
gulp.task('js', () => {
  return gulp.src(path.src_js + '/luna-df.js')
    .pipe(rollup({
      allowRealFiles: true,
      input: './' + path.src_js + '/luna-df.js',
      output: {
        format: 'iife',
        banner: `
        /**
         * Luna Design Framework | Customized Bootstrap 5 Template & UI Kit for LunaSoft Platform
         * Copyright 2023 LunaSoft
         * Framework core scripts
         * @author Md Touhidul Islam (Prince)
         * @version 1.0.0
         */
        `
      }
    }))
    .pipe(rename('luna-df.min.js'))
    .pipe(babel({
      presets: [['@babel/env', {modules: false}]],
    }))
    .pipe(uglify({output: {comments: /^!|@author|@version/i}}))
    .pipe(gulp.dest(path.js))
    .on('end', () => {
      reload(); // One time browser reload at end of uglification (minification)
    });
});

// Move vendor css and js files from node_modules to dist folder
// based on the list in package.json dependencies
gulp.task('vendor', () => {
  let dependencies = Object.keys(packageFile.dependencies);
  let libs = dependencies.map((key) => {
    return key + '/**/*';
  });
  return gulp.src(libs, {cwd: 'node_modules', base: './node_modules'})
  .pipe(gulp.dest(path.vendor));
});

// Clean certain files/folders from assets directory. Runs before compilation of new files. See 'default' task at the most bottom of this file
gulp.task('clean', () => {
  return del([
    path.css,
    path.js + '/luna-df.min.js',
    path.vendor
  ]);
});

// Watcher
gulp.task('watch', () => {
  global.watch = true;
  // BrowserSync
  browserSync.init({
    server: {
      baseDir: './',
    },
    open: true, // or "local"
  });
  gulp.watch(['./*.html', './**/*.html']).on('change', reload);
  gulp.watch(path.scss + '/**/*.scss', gulp.series('sass:minified'));
  gulp.watch(path.src_js + '/**/*.js', gulp.series('js'));
});

// Default task - the dependent tasks will run in parallell / excluding Docs and Components compilation
gulp.task(
  'default',
  gulp.series('clean', 'vendor', gulp.parallel('js', 'sass:minified', 'sass:expanded'), 'watch')
);
