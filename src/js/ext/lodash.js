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
  'use strict';

  (function() {
    var EXTENSIONS = [ 'assign', 'parseOptions' ],
        ext,
        ext_iter;

    // Break if there's a conflicting implementation
    for (ext_iter = 0; ext_iter < EXTENSIONS.length; ++ext_iter) {
      ext = EXTENSIONS[ext_iter];

      if (void 0 !== _[ext]) {
        throw 'guide.js: existing _.' + ext + ' implementation!';
      }
    }
  }());

  _.assign = function(k, v, in_o) {
    var path_tokens = k.toString().split('.'),
        pathsz      = path_tokens.length,
        o           = in_o || {},
        token,
        i;

    if (pathsz > 1) {
      k = o;

      for (i = 0; i < pathsz; ++i) {
        token = path_tokens[i];

        k[ token ] = k[ token ] || {};

        if (i === pathsz-1) {
          k[token] = v;
          break;
        }

        k = k[token];
      }
    } else {
      o[k] = v;
    }

    return o;
  };

  // var strOptionsSeparator = new RegExp('[:|,]'),
  var strOptionsSeparator = /[:|,]/,
      strOptionsSanitizer = new RegExp(':\\s+', 'g');

  /**
   * Extracts key-value pairs specified in a string, delimited by a certain
   * separator. The pairs are returned in an object.
   *
   * The default tokenizer/separator delimits by commas, ie:
   * 'key:value, key2:value2, ..., keyN:[\s*]valueN'. See the @options parameter
   * for specifying your own tokenizer.
   *
   * @example
   *   _.parseOptions('foo:bar') => { foo: 'bar' }
   *   _.parseOptions('foo:bar, xyz:123') => { foo: 'bar', xyz: 123 }
   *   _.parseOptions('x.y.z: true') => { x: { y: { z: true }}}
   *
   * @param <String> str the options string to parse
   * @param <Object> options: {
   *   separator: <RegExp> that will be used for tokenizing
   *   sanitizer: <RegExp> that will optionally be used to pre-process the str
   *   convert: <Boolean> whether to query and cast string values to other types
   * }
   *
   * @return <Object> the extracted key-value pairs
   */
  _.parseOptions = function(str, in_options) {
    var
    options   = in_options || {},
    separator = options.separator || strOptionsSeparator,
    sanitizer = options.sanitizer || strOptionsSanitizer,
    tokens    = (str || '').replace(sanitizer, ':').split(separator),
    tokenssz  = tokens.length,
    out       = {},
    i, // token iterator
    k,
    v;

    for (i = 0; i < tokenssz; ++i) {
      k = (tokens[i]||'').trim();
      v = (tokens[++i]||'').trim();

      if (!k) { continue; }

      if (v === 'false') { v = false; }
      else if (v === 'true') { v = true; }
      else if (Number(v).toString() === v) {
        v = Number(v);
      }

      _.assign(k, v, out);
    }

    return out;
  };
})(_);