module.exports = function(grunt) {
  'use strict';

  var sources = [
    'src/js/ext/*.js',
    'src/js/guide.js',
    'src/js/guide-optionable.js',
    'src/js/guide-extension.js',
    'src/js/guide-tour.js',
    'src/js/guide-spot.js',
    'src/js/extensions/*.js'
  ],

  readPkg = function() {
    return grunt.file.readJSON('package.json');
  };

  // Project configuration.
  grunt.initConfig({
    pkg: readPkg(),
    bumpup: 'package.json',

    watch: {
      scripts: {
        files: [ 'src/js/**/*' ],
        tasks: [ 'jshint', 'docs' ]
      },
      css: {
        files: [ 'src/css/**/*' ],
        tasks: [ 'less' ]
      }
    },

    jasmine : {
      src: sources,
      options : {
        // timeout: 10000,
        outfile: '_SpecRunner.html',
        keepRunner: true,
        version: '1.3.1',
        styles: 'dist/guide.css',
        helpers: 'spec/helpers/**/*.js',
        vendor: 'src/vendor/**/*.js',
        specs : 'spec/unit/**/*.js'
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
    },

    concat: {
      options: {
        separator: '\n\n'
      },
      dist: {
        options: {
          // banner: '<%= meta.banner %>'
        },
        src: sources,
        dest: 'dist/guide.js'
      }
    },

    uglify: {
      options: {
        warnings: true,
        mangle: {
          except: [ 'jQuery', '_' ]
        },

        output: {
          beautify: false
        },

        compress: {
          sequences:  true,
          dead_code:  true,
          loops:      true,
          unused:     true,
          if_return:  true,
          join_vars:  true,
          global_defs: {
            "GJS_DEBUG": false
          }
        }
      },
      dist: {
        files: {
          'dist/guide.min.js': [ 'dist/guide.js' ]
        }
      }
    }, // uglify

    tagrelease: {
      file: 'package.json',
      commit: true,
      message: 'Release %version%',
      prefix: 'v',
      annotate: false
    },

    less: {
      options: {
        strictImports: true,
        report: 'gzip'
      },
      development: {
        options: {
          paths: [ "src/css" ],
        },
        files: {
          "dist/guide.css": "src/css/gjs.less"
        }
      },
      production: {
        options: {
          paths: [ "src/css" ],
          compress: true
        },
        files: {
          "dist/guide.min.css": "src/css/gjs.less"
        }
      }
    },

    jsduck: {
      main: {
        src: [
          'src/js'
        ],

        dest: 'docs/api',

        options: {
          'title': 'Guide.js API Reference',
          'categories': '.jsduck',
          'color': true,
          'tags': [ 'docs/jsduck_tags/async_tag' ],
          'warnings': [],
          'external': ['XMLHttpRequest', 'jQuery', '$']
        }
      }
    },

    'string-replace': {
      version: {
        files: {
          'src/js/guide.js': [ 'src/js/guide.js' ]
        },
        options: {
          replacements: [{
            pattern: /([g|G])uide\.VERSION\s*=\s*\'.*\';/,
            replacement: "$1uide.VERSION = '<%= grunt.config.get('pkg.version') %>';"
          }]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-tagrelease');
  grunt.loadNpmTasks('grunt-jsvalidate');
  grunt.loadNpmTasks('grunt-jsduck');
  grunt.loadNpmTasks('grunt-string-replace');

  grunt.registerTask('test', [ 'jsvalidate', 'jshint', 'jasmine' ]);
  grunt.registerTask('build', [ 'concat', 'uglify', 'test', 'less' ]);
  grunt.registerTask('docs', [ 'jsduck' ]);

  grunt.registerTask('default', ['test']);

  // Release alias task
  grunt.registerTask('release', function (type) {
    type = type ? type : 'patch';
    grunt.task.run('test');
    grunt.task.run('bumpup:' + type);
    grunt.config.set('pkg', readPkg());
    grunt.task.run('string-replace:version')
    grunt.task.run('build');
    grunt.task.run('tagrelease');
  });
};