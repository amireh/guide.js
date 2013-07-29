module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    jasmine : {
      // src: 'src/js/**/*.js',
      src: [
        'src/js/ext/*.js',
        'src/js/guide.js',
        'src/js/guide-extension.js',
        'src/js/guide-tour.js',
        'src/js/guide-spot.js',
        'src/js/extensions/*.js'
      ],
      options : {
        timeout: 10000,
        outfile: '_SpecRunner.html',
        version: '1.3.1',
        vendor: 'src/js/vendor/*.js',
        specs : 'spec/unit/*.js'
      }
    },
    jshint: {
      all: [
        'src/js/ext/*.js',
        'src/js/*.js',
        'src/js/extensions/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    jsvalidate: {
      files: ['src/js/ext/*.js', 'src/js/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsvalidate');

  grunt.registerTask('test', ['jshint', 'jasmine']);
  grunt.registerTask('default', ['test']);
};