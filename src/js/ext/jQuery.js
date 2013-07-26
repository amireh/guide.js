/**
 * guide.js jQuery extensions
 *
 * $.is(":viewport_visible"):
 *
 * function: checks whether an element is visible in the current window's
 *           scroll boundaries
 * usage: $('#element').is(":viewport_visible")
 *
 * $.consume(evt):
 *
 * function: blocks an event from propagating or bubbling further
 * usage: $.consume(evt)
 */
(function($) {
  var EXTENSIONS = [ 'consume' ];

  // Break if there's a conflicting implementation
  for (var i = 0; i < EXTENSIONS.length; ++i) {
    var ext = EXTENSIONS[i];

    if (void 0 !== $[ext] || void 0 !== $.fn[ext]) {
      throw 'guide.js: existing $.' + ext + ' implementation!';
    }
  }

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

  $.consume = function(e) {
    if (!e) { return false; }

    e.preventDefault && e.preventDefault();
    e.stopPropagation && e.stopPropagation();
    e.stopImmediatePropagation && e.stopImmediatePropagation();

    e.cancelBubble = true;
    e.returnValue = false;

    return false;
  };
})($);