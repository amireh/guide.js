/**
 * guide.js jQuery extensions
 *
 * $.is(":viewport_visible"):
 *
 * function: checks whether an element is visible in the current window's
 *           scroll boundaries
 * usage: $('#element').is(":in_viewport")
 *
 * $.consume(evt):
 *
 * function: blocks an event from propagating or bubbling further
 * usage: $.consume(evt)
 *
 * $.fn.guide({}):
 *
 * See method doc below.
 */
(function($) {
  'use strict';

  var EXTENSIONS = [ 'consume', 'guide' ],
      $window    = $(window),
      i,
      ext;

  // Break if there's a conflicting implementation
  for (i = 0; i < EXTENSIONS.length; ++i) {
    ext = EXTENSIONS[i];

    if (void 0 !== $[ext] || void 0 !== $.fn[ext]) {
      throw 'guide.js: existing $.' + ext + ' implementation!';
    }
  }

  $.extend($.expr[':'], {
    in_viewport: function (el) {
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

    if (e.preventDefault) {
      e.preventDefault();
    }
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }

    e.cancelBubble = true;
    e.returnValue = false;

    return false;
  };

  /**
   * Convenience method for adding a jQuery selector element as a guide spot.
   *
   * @example
   *   $('#my_button').guide({
   *     text: "Click me to build your own nuclear reactor in just a minute."
   *   })
   *
   * @see guide#addSpot for more info on options.
   */
  $.fn.guide = function(in_options) {
    var options   = in_options || {},
        instance  = window.guide;

    if (!instance) {
      throw 'guide.js: bad $.fn.guide call, global guide has not been setup,' +
            'have you forgotten to initialize guide.js?';
    }

    instance.addSpot($(this), options);

    return $(this);
  };

})($);