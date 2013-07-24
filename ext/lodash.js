(function(_) {
  if (!_.assign) {
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
  }
})(_);