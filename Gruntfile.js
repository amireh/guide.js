module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    jasmine : {
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
        vendor: 'src/vendor/**/*.js',
        specs : 'spec/**/*.js'
      }
    },
    jshint: {
      all: [
        'src/js/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    jsvalidate: {
      files: ['src/js/**/*.js' ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsvalidate');

  grunt.registerTask('test', [ 'jsvalidate', 'jshint', 'jasmine' ]);
  grunt.registerTask('default', ['test']);
};