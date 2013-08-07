/**
 * @class lodash
 *
 * guide.js lodash extensions
 */
(function(_) {
  'use strict';

  (function() {
    var EXTENSIONS = [ 'dotAssign', 'parseOptions' ],
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

  /**
   * Dot-notation assignment. Assigns a value to a nested key within an object.
   *
   * @param {String}  k         The dot-delimited key.
   * @param {Mixed}   v         The value to assign.
   * @param {Object}  [in_o={}] The object to modify.
   *
   * Usage example
   *
   *     _.dotAssign('foo.bar', 123, {}) // returns { foo: { bar: 123 } }
   *
   * @return {Object} The passed object (or a newly created one) with the
   * assigned property.
   */
  _.dotAssign = function(k, v, in_o) {
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

  _.dotGet = function(k, in_o, delim) {
    var path_tokens = k.toString().split(delim || '.'),
        pathsz      = path_tokens.length,
        o           = in_o || {},
        token,
        i;

    if (pathsz <= 1) {
      return o[k];
    }

    for (i = 0; i < pathsz; ++i) {
      token = path_tokens[i];

      o = o[token];

      if (!o) { return undefined; }
    }

    return o;
  };

  // var strOptionsSeparator = new RegExp('[:|,]'),
  var
  strOptionsSeparator = /[:|,]/,
  strOptionsSanitizer = new RegExp(':\\s+', 'g'),

  /**
   * @method typeCast
   *
   * Converts stringified numbers and booleans to their real versions.
   *
   * @param   {String} The value to convert.
   * @return  {Number/Boolean} The cast value.
   */
  typeCast = function(v) {
    if (v === 'false') {
      return false;
    }
    else if (v === 'true') {
      return true;
    }
    else if (Number(v).toString() === v) {
      return Number(v);
    }
    else {
      return v;
    }
  };

  /**
   * Extracts key-value pairs specified in a string, delimited by a certain
   * separator. The pairs are returned in an object.
   *
   * The default tokenizer/separator delimits by commas, ie:
   * 'key:value, key2:value2, ..., keyN:[\s*]valueN'. See the in_options parameter
   * for specifying your own tokenizer.
   *
   * Usage example:
   *
   *     _.parseOptions('foo:bar') // => { foo: 'bar' }
   *     _.parseOptions('foo:bar, xyz:123') // => { foo: 'bar', xyz: 123 }
   *     _.parseOptions('x.y.z: true') // => { x: { y: { z: true }}}
   *
   * @param {String} str      The options string to parse.
   * @param {Object} options  Parser options, see below.
   *
   * @param {RegExp}  [options.separator=/[:|,]/]
   * The key-value delimiter pattern. Used for tokenizing the string into k-v
   * fragments.
   *
   * @param {RegExp}  [options.sanitizer=RegExp(':\\s+', 'g')]
   * Used to pre-process the string, the default trims the values of whitespace.
   *
   * @param {Boolean} [options.convert=true]
   * Whether to query and cast string values to other types
   *
   * @param {Function} [options.converter=typeCast]
   * A method that takes a string value and returns a type-casted version.
   *
   * @return {Object} The extracted key-value pairs.
   */
  _.parseOptions = function(str, options) {
    var
    separator = (options||{}).separator || strOptionsSeparator,
    sanitizer = (options||{}).sanitizer || strOptionsSanitizer,
    converter = (options||{}).converter || typeCast,
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

      _.dotAssign(k, converter(v), out);
    }

    return out;
  };
})(_);