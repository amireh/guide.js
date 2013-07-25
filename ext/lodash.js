(function(_, $) {
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

  _.consume = function(e) {
    if (!e) { return false; }

    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
    e.stopImmediatePropagation && e.stopImmediatePropagation();

    e.cancelBubble = true;
    e.returnValue = false;

    return false;
  };

  var $window = $(window);

  $.extend($.expr[":"], {
    viewport_visible: function (el, index, meta, stack) {
      var
      vp_top    = $window.scrollTop(),
      vp_bottom = vp_top + $window.height(),
      el_top    = $(el).offset().top,
      el_bottom = el_top + $(el).height();

      return ((vp_top < el_top) && (vp_bottom > el_bottom));
    }
  });
})(_, $);