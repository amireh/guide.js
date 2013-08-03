/**
 * @class jQuery
 *
 * guide.js jQuery extensions.
 */
(function($) {
  'use strict';

  var EXTENSIONS = [ 'consume', 'guide' ],
      $window    = $(window),
      i,
      ext,
      in_viewport;

  // Die hard if there's a conflicting implementation
  for (i = 0; i < EXTENSIONS.length; ++i) {
    ext = EXTENSIONS[i];

    if (void 0 !== $[ext] || void 0 !== $.fn[ext]) {
      // throw 'guide.js: existing $.' + ext + ' implementation!';
      console.log('guide.js: existing $.' + ext + ' implementation!');
    }
  }

  /**
   * Checks whether an element is visible in the current window's scroll boundaries.
   *
   * An example of scrolling an element into view if it's not visible:
   *
   *     if (!$('#element').is(":in_viewport")) {
   *       $('#element').scrollIntoView();
   *     }
   *
   */
  in_viewport = function (el) {
    var
    vp_top    = $window.scrollTop(),
    vp_bottom = vp_top + $window.height(),
    el_top    = $(el).offset().top,
    el_bottom = el_top + $(el).height();

    return ((vp_top < el_top) && (vp_bottom > el_bottom));
  };

  $.extend($.expr[':'], {
    in_viewport: in_viewport
  });

  /**
   * Blocks an event from propagating or bubbling further.
   *
   * Example of *blocking a `click` event after handling it*:
   *
   *     $('#element').on('click', function(evt) {
   *       return $.consume(evt);
   *     });
   *
   * @param {Event} e The event to consume.
   * @return {false}
   */
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
   * Usage example:
   *
   *     $('#my_button').guide({
   *       text: "Click me to build your own nuclear reactor in just a minute."
   *     })
   *
   * See Guide#addSpot for more info on options.
   */
  $.fn.guide = function(inOptions) {
    var instance  = window.guide;

    if (!instance) {
      throw 'guide.js: bad $.fn.guide call, global guide has not been setup,' +
            'have you forgotten to initialize guide.js?';
    }

    instance.addSpot($(this), inOptions || {});

    return $(this);
  };

})($);