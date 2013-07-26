({
  appDir:         './',
  baseUrl:        './',
  dir:            '../../dist',
  optimize:       'uglify2',

  removeCombined: true,
  keepBuildDir: true,
  skipDirOptimize: true,
  useStrict: true,
  preserveLicenseComments: false,
  skipModuleInsertion: true,
  optimizeCss: 'none',

  uglify2: {
    warnings: true,
    mangle:   true,

    output: {
      beautify: false
    },

    compress: {
      sequences:  true,
      dead_code:  true,
      loops:      true,
      unused:     true,
      if_return:  true,
      join_vars:  true
    }
  },

  pragmasOnSave: {
  },

  pragmas: {
    production: true
  },

  paths: {
    'lodash': 'vendor/lodash',
    'jQuery': 'vendor/jQuery-1.10.2'
  },

  shim: {
    'ext/lodash': { dependencies: [ 'lodash' ] },
    'ext/jQuery': { dependencies: [ 'jQuery' ] },

    'guide': {
      exports: 'guide',
      dependencies: [ 'jQuery', 'lodash', 'ext/lodash', 'ext/jQuery' ]
    },

    'extensions/guide-tutor': [ 'guide' ],
    'extensions/guide-markers': [ 'guide' ]
  },

  modules: [
    {
      name: "guide",

      include: [
        'ext/lodash',
        'ext/jQuery',

        'guide',
        'extensions/guide-tutor',
        'extensions/guide-markers'
      ],
      exclude: [ ]
    }
  ]
})