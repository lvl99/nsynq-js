var gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('build', function () {
  return gulp.src('./build/nsynq.js')
    .pipe( rename('nsynq.min.js') )
    .pipe( sourcemaps.init() )
      .pipe( uglify() )
    .pipe( sourcemaps.write('./') )
    .pipe( gulp.dest('./build') );
});