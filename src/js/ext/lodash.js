/**
 * guide.js lodash extensions
 *
 * _.assign: dot-notation assignment
 *
 * function: assigns a given value to a nested key within an object
 * usage: _.assign('foo.bar', 123, {}) // returns { foo: { bar: 123 } }
 *
 */
(function(_) {
  var EXTENSIONS = [ 'assign' ];

  // Break if there's a conflicting implementation
  for (var i = 0; i < EXTENSIONS.length; ++i) {
    var ext = EXTENSIONS[i];

    if (void 0 !== _[ext]) {
      throw 'guide.js: existing _.' + ext + ' implementation!';
    }
  }

  _.assign = function(k, v, o) {
    var path_tokens = k.split('.'),
        pathsz      = path_tokens.length;

    if (pathsz > 1) {
      k = o;

      for (var x = 0; x < pathsz; ++x) {
        var token = path_tokens[x];

        k[ token ] = k[ token ] || {};

        if (x == pathsz-1) {
          k[token] = v;
          break;
        }

        k = k[token];
      }
    } else {
      o[k] = v;
    }
  }
})(_);