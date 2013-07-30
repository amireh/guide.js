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

(function(_, $) {
  'use strict';

  if (!$) {
    throw 'guide.js: jQuery is undefined, are you sure it has been loaded yet?';
  }

  var
  guide = function() {
    this.constructor.apply(this, arguments);

    return this;
  },

  KLASS_ENABLED         = 'with-gjs',
  KLASS_OVERLAYED       = 'gjs-with-overlay',
  KLASS_NOT_OVERLAYED   = 'gjs-without-overlay',
  KLASS_HIDING          = 'gjs-hiding',
  KLASS_ENTITY          = 'gjs-entity';

  _.extend(guide.prototype, {
    id: 'guide',

    defaults: {
      withOverlay:    false,
      withAnimations: true,
      toggleDuration: 500
    },

    entityKlass: function() {
      return KLASS_ENTITY;
    },

    constructor: function() {
      // Used for emitting custom events.
      this.$ = $(this);

      _.extend(this, {
        $container: $('body'),
        $el:        $('<div class="gjs" />'),
        options: _.clone(this.defaults),
        extensions: [],
        tours: [],
        tour: null
      });

      this.$.on('refresh', function(e, options, el) {
        el.toggleOverlayMode();
      });

      console.log('guide.js: running');
    },

    inactiveTours: function() {
      return _.without(this.tours, this.tour);
    },

    defineTour: function(label, optSpots) {
      var tour;

      if (!(tour = this.getTour(label))) {
        tour = new guide.Tour(label);
        this.tours.push(tour);
      }

      if (optSpots) {
        if (!_.isArray(optSpots)) {
          throw 'guide.js#defineTour: bad spots, expected array, got: ' +
                typeof(optSpots);
        }

        this.fromJSON(optSpots);
      }

      return tour;
    },

    runTour: function(id) {
      var tour;

      if (!this.isShown()) {
        this.show();
      }

      if (!(tour = this.getTour(id))) {
        throw [
          'guide.js: undefined tour "',
          id,
          '", did you forget to call #defineTour()?'
        ].join('');
      }

      if (this.tour) {
        this.tour.stop();
        this.$.triggerHandler('stop.tours', [ this.tour ]);
      }

      this.tour = tour;

      this.$.triggerHandler('start.tours', [ this.tour ]);
      this.tour.start();

      console.log('guide.js: touring "' + tour.id + '"');

      return this;
    },

    /**
     * @param <Object> options
     * {
     *   text:
     *   caption:
     *   tour: defaults to the current tour
     *   placement: [ 'inline', 'inline:before', 'inline:after', 'overlay' ]
     *   position: [ 'tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l' ]
     *
     *   onFocus: function($prevSpot) {}
     *   onDefocus: function($currentSpot) {}
     * }
     */
    addSpot: function($el, options) {
      var tour    = this.tour,
          tour_id = options.tour;

      if (tour_id && _.isString(tour_id)) {
        tour = this.defineTour(tour_id);
      }
      else if (tour_id) {
        tour = tour_id;
      }

      return tour.addStep($el, options);
    },

    addSpots: function(spots) {
      return this.fromJSON(spots);
    },

    fromJSON: function(spots) {
      spots = _.isArray(spots) ? spots : [ spots ];

      _.each(spots, function(definition) {
        this.addSpot(definition.$el, definition);
      }, this);

      return this;
    },

    /** TODO */
    fromDOM: function(selector_or_container) {
      var that = this,
          $container = $(selector_or_container);

      $container.find('[data-guide]').each(function() {
        var $target = $(this);

        that.fromNode($target, {
          text: $target.attr('data-guide')
        });
      });

      // elements with [data-guide-spot] are "references" since they point
      // to a target that will be used as a spot, while they act as the
      // content of that spot
      //
      // @side-effect:
      // the reference node will be detached and thus no longer
      // available in the DOM
      $container.find('[data-guide-spot]').each(function() {
        var $ref    = $(this),
            $target = $($ref.attr('data-guide-spot'));

        that.fromNode($target, {
          text: $ref.detach()[0].outerHTML
        });
      });

      return this;
    },

    fromNode: function($node, inOptions) {
      var
      $this = $node,
      $tour,
      options = _.extend(
        inOptions || {},
        _.parseOptions($this.attr('data-guide-options')), {
          caption:  $this.attr('data-guide-caption'),
          tour:     $this.attr('data-guide-tour')
        });

      // if no tour is specified, take a look at the ancestry tree, perhaps
      // an element has a tour defined in [data-guide-tour]
      if (!options.tour) {
        $tour = $this.parents('[data-guide-tour]:first');

        if ($tour.length) {
          options.tour = $tour.attr('data-guide-tour');
        }
      }

      $this.attr({
        'data-guide': null,
        'data-guide-options': null,
        'data-guide-caption': null
      });

      this.addSpot($this, options);
    },

    show: function() {
      var klasses = [ KLASS_ENABLED ];

      if (!this.tour) {
        this.runTour(this.tours[0]);
      }

      this.toggleOverlayMode();

      this.$container.addClass(klasses.join(' '));
      this.$.triggerHandler('show');

      this.tour.start();

      this.$el.appendTo(this.$container);

      if (this.options.withAnimations) {
        this.$el.show(this.options.toggleDuration);
      }

      return this;
    },

    refresh: function() {
      _.each(this.extensions, function(e) {
        if (e.refresh) {
          e.refresh();
        }
      });

      if (this.tour) {
        this.tour.refresh();
      }

      return this;
    },

    hide: function() {
      var that = this;

      this.$container.addClass(KLASS_HIDING);

      if (this.options.withAnimations) {
        that.$el.hide(this.options.toggleDuration, function() {
          that.__hide();
        });
      }
      else {
        that.__hide();
      }

      return this;
    },

    __hide: function() {
      this.$el.detach();

      this.$container.removeClass([
        KLASS_ENABLED,
        KLASS_OVERLAYED,
        KLASS_HIDING
      ].join(' '));

      this.tour.stop();

      this.$.triggerHandler('hide');
    },

    toggle: function() {
      return this.isShown() ?
        this.hide.apply(this, arguments) :
        this.show.apply(this, arguments);
    },

    /**
     * Attaches a darkening overlay to the window as per the withOverlay option.
     *
     * @param <Boolean> doToggle if true, the withOverlay option will be toggled
     *
     * @note
     * We need to track two states: 'with-overlay' and 'without-overlay'
     * because in overlayed mode, the foreground of highlighted elements needs
     * a higher level of contrast than in non-overlayed mode (they're lighter),
     * thus the CSS is able to do the following:
     *
     *   .gjs-with-overlay #my_element { color: white }
     *   .gjs-without-overlay #my_element { color: black }
     *
     */
    toggleOverlayMode: function(doToggle) {
      if (doToggle) {
        this.options.withOverlay = !this.options.withOverlay;
      }

      if (this.options.withOverlay) {
        this.$container
          .addClass(KLASS_OVERLAYED)
          .removeClass(KLASS_NOT_OVERLAYED);
      }
      else {
        this.$container
          .removeClass(KLASS_OVERLAYED)
          .addClass(KLASS_NOT_OVERLAYED);
      }
    },

    isShown: function() {
      return this.$container.hasClass(KLASS_ENABLED);
    },

    dismiss: function(/*optTourId*/) {
      this.$.triggerHandler('dismiss');
    },

    focus: function() {
      return this.tour.focus.apply(this.tour, arguments);
    },

    addExtension: function(ext) {
      if (!ext.id) {
        throw 'guide.js: bad extension, no #id attribute defined';
      }

      this.extensions.push(ext);

      if (void 0 === ext.__initExtension) {
        throw 'guide.js: bad extension, does not seem to implement the ' +
              'guide.Extension prototype';
      }

      ext.__initExtension();

      console.log('guide.js: extension registered: ', ext.id);
    },

    getExtension: function(id) {
      return _.find(this.extensions, { id: id });
    },

    /**
     * @private
     * @nodoc
     */
    getTour: function(id) {
      return _.isString(id) ?
      _.find(this.tours || [], { id: id }) :
      id;
    }
  }); // guide.prototype

  guide = new guide();

  // expose the instance to everybody
  window.guide = guide;
  window.GJS_DEBUG = true;
})(_, jQuery);

(function(_, $, guide) {
  'use strict';

  var Optionable = {
    defaults: {},

    addOption: function(key, default_value) {
      this.defaults[key] = default_value;

      if (this.options) {
        if (void 0 === this.options[key]) {
          this.options[key] = default_value;
        }
      }
    },

    setOptions: function(options) {
      this.options = this.getOptions(options);

      if (this.refresh) {
        this.refresh(this.options);
      }

      if (this.$) {
        console.log('guide.js:', this.id,'options changed, triggering refresh');

        this.$.triggerHandler('refresh', [ this.options, this ]);
      }

      return this;
    },

    getOptions: function(overrides) {
      return _.extend(_.clone(this.options || {}), overrides || {});
    }
  };

  // expose the Optionable interface for other components to re-use
  guide.Optionable = Optionable;

  _.extend(guide, Optionable);

})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var Extension = _.extend({}, guide.Optionable, {
    __initExtension: function() {
      var that = this;

      if (!this.id) {
        throw 'guide.js: bad extension, missing #id';
      }

      this.options = _.clone(this.defaults);

      guide.$
      .on('show', function() {
        if (that.onGuideShow) {
          that.onGuideShow();
        }
      })
      .on('hide', function() {
        if (that.onGuideHide) {
          that.onGuideHide();
        }
      })
      .on('start.tours.gjs_extension', function(e, tour) {
        tour.$.on('refresh.gjs_extension', function() {
          that.setOptions(that.getOptions());
        });

        that.setOptions(that.getOptions());

        if (that.onTourStart) {
          that.onTourStart(tour);
        }
      });
    },

    /**
     * Builds the option set from the Extension's current options (or defaults),
     * combined with global guide options and the current tour's overrides.
     *
     * The global options (guide's and tour's) are expected to be keyed by the
     * extension id. So for an extension IDed as 'foo', its options in the
     * global guide instance would be specified as:
     *
     *  guide.setOptions({ foo: { option: value }})
     *
     * The option set is prioritized as follows (from lowest to highest):
     *   1. the extensions' current options, or its defaults
     *   2. the extensions' options specified in the guide.js global option set
     *   3. the extensions' options specified in the current tour's option set
     */
    getOptions: function(overrides) {
      var key = this.id;

      return _.extend({},
        this.options || this.defaults,
        key && guide.getOptions()[key],
        key && guide.tour ? guide.tour.getOptions()[key] : null,
        overrides);
    },

    isEnabled: function() {
      return !!this.getOptions().enabled;
    }
  });

  guide.Extension = Extension;
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var
  Tour = function() {
    return this.constructor.apply(this, arguments);
  };

  _.extend(Tour.prototype, guide.Optionable, {
    defaults: {
      alwaysHighlight: true
    },

    constructor: function(label) {
      this.$ = $(this);

      _.extend(this, {
        id: label, // TODO: unique constraints on tour IDs

        options: _.extend({}, this.defaults),

        spots: [],

        // current and previous spots
        current:  null,
        previous: null,

        // a shortcut to the current spot's index
        cursor: -1
      });

      console.log('guide.js: tour defined: ', this.id);

      return this;
    },

    addStep: function($el, options) {
      var spot;

      // has the spot been already defined? we can not handle duplicates
      if ($el.data('guideling')) {
        console.log('guide.js: element is already bound to a tour spot:');
        console.log($el);

        throw 'guide.js: duplicate spot, see console for more information';
      }

      spot = new guide.Spot({
        $el: $el,
        // the element that will be used as an indicator of the spot's position
        // when scrolling the element into view, could be modified by extensions
        $scrollAnchor: $el,
        tour: this,
        index: this.spots.length
      }, options);

      this.spots.push(spot);

      $el.
        addClass(guide.entityKlass()).
        data('guideling', spot);

      if (guide.isShown()) {
        spot.highlight();
      }

      guide.$.triggerHandler('add', [ spot ]);

      return true;
    },

    /**
     * Focuses the next spot, if any.
     *
     * @see guide#focus
     */
    next: function() {
      if (!this.hasNext()) {
        return false;
      }

      return this.focus(this.cursor + 1);
    },

    hasNext: function() {
      var ln = this.spots.length;

      return ln !== 1 && this.cursor < ln-1;
    },

    prev: function() {
      if (!this.hasPrev()) {
        return false;
      }

      return this.focus(this.cursor - 1);
    },

    hasPrev: function() {
      var ln = this.spots.length;

      return ln !== 1 && this.cursor > 0;
    },

    first: function() {
      return this.focus(0);
    },

    last: function() {
      return this.focus(this.spots.length-1);
    },

    /**
     *
     * @emit defocus.gjs on the current (now previous) spot, guide.previous.$el
     * @emit defocus [ prevSpot, currSpot, guide ] on guide.$
     *
     * @emit focus.gjs on the next (now current) spot, guide.current.$el
     * @emit focus [ currSpot, guide ] on guide.$
     *
     * @return whether the spot has been focused
     */
    focus: function(index) {
      var spot  = this.getStep(index),
          i; // spot iterator

      if (!spot) {
        throw 'guide.js: bad spot @ ' + index + ' to focus';
      }
      else if (!spot.$el.is(':visible')) {
        // look for any spot that's visible and focus it instead
        for (i = 0; i < this.spots.length; ++i) {
          spot = this.spots[i];

          if (spot.$el.is(':visible')) {
            this.cursor = i;
            break;
          }
          else {
            spot = null;
          }
        }

        if (!spot) {
          return false;
        }
      }

      if (spot.isCurrent()) {
        return false;
      }

      if (!this.isActive()) {
        guide.runTour(this);
      }

      this.previous = this.current;
      this.current = spot;
      this.cursor  = spot.index;

      // de-focus the last spot
      if (this.previous) {
        this.previous.defocus(spot);
        guide.$.triggerHandler('defocus', [ this.previous, this.current, this ]);
      }

      guide.$.triggerHandler('pre-focus', [ spot, this ]);
      spot.focus(this.previous);
      guide.$.triggerHandler('focus', [ spot, this ]);

      console.log('guide.js: visiting tour spot #', spot.index);

      return true;
    },

    start: function() {
      if (!this.spots.length) {
        return this;
      }

      _.each(this.spots, function(spot) {
        spot.highlight();
      });

      this.focus(this.current || 0);

      return this;
    },

    stop: function() {
      _.each(this.spots, function(spot) {
        spot.dehighlight({ force: true });
      });

      return this;
    },

    isActive: function() {
      return guide.isShown() && this === guide.tour;
    },

    refresh: function() {
      if (this.isActive()) {
        this.stop().start();
      }
    },

    getStep: function(index_or_el) {
      var index = index_or_el;

      if (typeof(index) === 'number') {
        return this.spots[index];
      }
      else if (!index) {
        return null;
      }

      // console.log('looking up spot:', arguments)

      return _.find(this.spots || [], index);
    },

    indexOf: function(spot) {
      return _.indexOf(this.spots, spot);
    }
  });

  guide.Tour = Tour;

  // The default tour
  guide.tour = guide.defineTour('Default Tour');
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';
  var

  Spot = function() {
    return this.constructor.apply(this, arguments);
  },

  KLASS_TARGET  = 'gjs-spot',
  KLASS_FOCUSED = 'gjs-spot-focused';

  _.extend(Spot.prototype, guide.Optionable, {
    defaults: {
      withMarker: true,
      highlight:  true,
      autoScroll: true
    },

    constructor: function(attributes, options) {
      _.extend(this, attributes, _.pick(options, ['text','caption']), {
        options: _.extend({}, this.defaults, options)
      });

      return this;
    },

    isCurrent: function() {
      return this.tour.current === this;
    },

    getText: function() {
      return this.text;
    },

    /** Whether the spot has any text defined. */
    hasText: function() {
      return !!((this.getText()||'').length);
    },

    getCaption: function() {
      return this.caption;
    },

    /** Whether the spot has a caption defined. */
    hasCaption: function() {
      return !!(this.getCaption()||'').length;
    },

    /** Whether the spot has either a caption or text content. */
    hasContent: function() {
      return this.hasText() || this.hasCaption();
    },

    highlight: function() {
      var applicable =
        this.tour.getOptions().alwaysHighlight ||
        this.isCurrent();

      // the spot-scoped option takes precedence over the tour one
      if (!this.options.highlight) {
        applicable = false;
      }

      this.$el.toggleClass('no-highlight', !applicable);
      this.$el.toggleClass(KLASS_TARGET, applicable);

      return this;
    },

    /**
     * Remove the highlight CSS classes on the spot $element.
     *
     * If the Tour option 'alwaysHighlight' is enabled, the spot will only
     * be de-focused, but will stay highlighted.
     *
     * @param <Object> options: {
     *  "force": <Boolean> will dehighlight regardless of any options that might
     *           be respected
     * }
     */
    dehighlight: function(options) {
      var applicable =
        (options||{}).force ||
        !this.tour.getOptions().alwaysHighlight;

      if (applicable) {
        this.$el.removeClass(KLASS_TARGET);
      }

      return this;
    },

    focus: function(prev_spot) {
      var that = this,
          $scroller = this.$scrollAnchor;

      this.highlight();

      this.$el
        .addClass(KLASS_FOCUSED)
        .triggerHandler('focus.gjs', prev_spot);


      _.defer(function() {
        if (that.options.autoScroll && !$scroller.is(':in_viewport')) {
          $('html,body').animate({
            scrollTop: $scroller.offset().top * 0.9
          }, 250);
        }
      });
    },

    defocus: function(next_spot) {
      this.dehighlight();

      this.$el.removeClass(KLASS_FOCUSED);
      this.$el.triggerHandler('defocus.gjs', next_spot);
    },

    refresh: function() {
      this.dehighlight();
      this.highlight();

      if (this.isCurrent()) {
        this.defocus();
        this.focus();
      }
    }
  });

  guide.Spot = Spot;
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var
  Extension = function() {
    return this.constructor();
  },

  JST_CONTROLS = _.template([
    '<div id="gjs_controls">',
      '<button data-action="tour.first">First</button>',
      '<button data-action="tour.prev">&lt;</button>',
      '<button data-action="tour.next">&gt;</button>',
      '<button data-action="tour.last">Last</button>',
      '<button data-action="guide.hide">Close</button>',
    '</div>'
  ].join('')),

  JST_DEV_CONTORLS = _.template([
    '<div class="developer-controls">',
      '<button data-action="guide.toggle">Toggle</button>',
      '<button data-action="toggleOverlay">Toggle Overlay</button>',
    '</div>'
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      withDeveloperControls: false,
      inMarkers:  true,
      inTutor:    true
    },

    id: 'controls',

    constructor: function() {
      var that = this;

      this.$container = guide.$el;
      this.guide = guide;
      this.tour  = guide.tour;
      this.options = _.defaults({}, this.defaults);

      this.refresh();

      guide.$
      .on('show', _.bind(this.show, this))
      .on('hide', _.bind(this.hide, this))
      .on('dismiss', _.bind(this.remove, this))
      .on('focus', function(/*e, spot*/) {
        that.refreshControls();
      });

      return this;
    },

    onTourStart: function(tour) {
      this.tour = tour;
      this.refreshControls();
    },

    show: function() {
      this.$el.appendTo(this.$container);
      this.refreshControls();

      return this;
    },

    hide: function() {
      // guide.$container.append(this.$el);
      this.$el.detach();

      return this;
    },

    remove: function() {
      if (this.$el) {
        this.$el.remove();
        guide.$
        .off('marking.gjs_markers.embedded_controls')
        .off('unmarking.gjs_markers.embedded_controls');
      }
    },

    attachToMarker: function(marker) {
      this.$container = marker.$el;
      this.$container.addClass('with-controls');

      this.show();
    },

    detachFromMarker: function(/*marker*/) {
      this.$container.removeClass('with-controls');
      this.$container = $();

      this.hide();
    },


    refresh: function() {
      var
      tutor_ext   = guide.getExtension('tutor'),
      marker_ext  = guide.getExtension('markers'),
      options     = this.getOptions();

      this.remove();

      if (marker_ext && marker_ext.isEnabled() && options.inMarkers) {
        this.markerMode(marker_ext);
      }
      else if (tutor_ext && tutor_ext.isEnabled() && options.inTutor) {
        this.tutorMode(tutor_ext);
      }
      else {
        this.classicMode();
      }

      this.$el = $(JST_CONTROLS({}));

      if (options.withDeveloperControls) {
        this.$el.append($(JST_DEV_CONTORLS({})));
      }

      this.$el
        .addClass(guide.entityKlass())
        .on('click', '[data-action]', _.bind(this.delegate, this));

      _.extend(this, {
        $bwd:   this.$el.find('[data-action*=prev]'),
        $fwd:   this.$el.find('[data-action*=next]'),
        $first: this.$el.find('[data-action*=first]'),
        $last:  this.$el.find('[data-action*=last]'),
        $hide:  this.$el.find('[data-action*=hide]')
      });

      this.show();
    },

    classicMode: function() {
      var tutor_ext = guide.getExtension('tutor'),
          marker_ext  = guide.getExtension('markers');

      this.$container = guide.$el;

      if (tutor_ext) {
        tutor_ext.$el
          .addClass('without-controls')
          .removeClass('with-controls');
      }

      if (marker_ext) {
        guide.$
        .off('marking.gjs_markers.gjs_controls')
        .off('unmarking.gjs_markers.gjs_controls');
      }
    },

    markerMode: function(/*ext*/) {
      var that = this,
          marker;

      this.$container = $();

      guide.$
      .on('marking.gjs_markers.gjs_controls', function(e, marker) {
        that.attachToMarker(marker);
      })
      .on('unmarking.gjs_markers.gjs_controls', function(e, marker) {
        that.detachFromMarker(marker);
      });

      // if we're embedding into markers and a spot is currently marked,
      // attach ourselves to the marker
      if (guide.tour && guide.tour.current && guide.tour.current.marker) {
        marker = guide.tour.current.marker;

        _.defer(function() {
          marker.hide();
          that.attachToMarker(marker);
          marker.show();
        });
      }
    },

    tutorMode: function(ext) {
      this.$container = ext.$el;
      ext.$el.addClass('with-controls');
    },

    delegate: function(e) {
      var action = $(e.target).attr('data-action'),
          pair,
          target,
          method;

      if (action.indexOf('.') > -1) {
        pair    = action.split('.');
        target  = pair[0];
        method  = pair[1];

        if (this[target] && this[target][method]) {
          this[target][method]();
        }
      }
      else {
        if (this[action]) {
          this[action]();
        }
      }

      return $.consume(e);
    },

    toggleOverlay: function() {
      guide.setOptions({
        withOverlay: !guide.options.withOverlay
      });
    },

    refreshControls: function() {
      var that = this;

      $(function() {
        that.$bwd.prop('disabled', !guide.tour.hasPrev());
        that.$fwd.prop('disabled', !guide.tour.hasNext());
        that.$first.prop('disabled', !guide.tour.hasPrev());
        that.$last.prop('disabled', !guide.tour.hasNext());
        that.$hide.toggle(!guide.tour.hasNext());
      });
    }

  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var
  Extension = function() {
    return this.constructor();
  },

  Marker = function() {
    return this.constructor.apply(this, arguments);
  },

  /**
   * Plain markers that contain only the step index, no text, and no caption.
   */
  JST_PLAIN = _.template([
    '<div class="gjs-marker">',
    '<span class="index"><%= index +1 %></span>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and text otherwise.
   */
  JST_WITH_CONTENT = _.template([
    '<div class="gjs-marker">',
    '<span class="index"><%= index +1 %></span>',
    '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and both caption
   * and text otherwise.
   */
  JST_WITH_CAPTION = _.template([
    '<div class="gjs-marker">',
    '<span class="index"><%= index +1 %></span>',
    '<h6 class="caption"><%= caption %></h6>',
    '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  /* placement modes */
  PMT_INLINE = 1,
  PMT_SIBLING = 2,
  PMT_OVERLAY = 3,

  /* positioning grid */
  POS_TL  = 1,
  POS_T   = 2,
  POS_TR  = 3,
  POS_R   = 4,
  POS_BR  = 5,
  POS_B   = 6,
  POS_BL  = 7,
  POS_L   = 8,

  // insert our DOM node at the appropriate position
  attach = function(m) {
    switch(m.placement) {
      case PMT_INLINE:
        m.spot.$el.append(m.$el);
      break;
      case PMT_SIBLING:
        var
        p       = m.position,
        method  = (p >= POS_TR && p <= POS_BR) ?
          'after' :
          'before';

        m.spot.$el[method](m.$el);
      break;
      case PMT_OVERLAY:
        guide.$el.append(m.$el);
      break;
    }

    return m;
  },

  /**
   * Center node horizontally or vertically by applying negative margins.
   *
   * @param <jQuery object> $node the element to modify
   * @param <int> pos the position key
   *
   * Positions POS_T and POS_B will cause horizontal centering, while
   * positions POS_L and POS_R will cause vertical centering.
   *
   * @return null
   */
  hvCenter = function($node, pos) {
    var margin = 0, dir;

    switch(pos) {
      case POS_T:
      case POS_B:
        dir = 'left';
        margin = -1 * ($node.outerWidth() / 2);
      break;

      case POS_R:
      case POS_L:
        dir = 'top';
        margin = -1 * ($node.outerHeight() / 2);
      break;
    }

    $node.css('margin-' + dir, margin);
  },

  negateMargins = function($node, $anchor, pos, ml, mr) {
    // we must account for the spot node's margin-[right,left] values;
    // ie, in any of the right positions, if the spot has any margin-right
    // we must deduct enough of it to place the marker next to it, we do so
    // by applying negative margin-left by the computed amount
    //
    // same applies to left positions but in the opposite direction (margin-left)
    var delta = 0, dir, t_m;

    switch(pos) {
      case POS_TR:
      case POS_R:
      case POS_BR:
        t_m = parseInt($anchor.css('margin-right'), 10);

        if (t_m > 0) {
          // offset is the spot margin without the marker margin
          delta = -1 * t_m + ml;
          dir = 'left';
        }
      break;

      case POS_TL:
      case POS_L:
      case POS_BL:
        t_m = parseInt($anchor.css('margin-left'), 10);

        if (t_m > 0) {
          // offset is spot margin without marker margin (arrow dimension)
          delta = -1 * (t_m - mr);
          dir = 'right';
        }
      break;
    }

    if (delta !== 0) {
      $node.css('margin-' + dir, delta);
    }

    return hvCenter($node, pos);
  },

  snapTo = function($node, $anchor, pos, margin) {
    var
    offset  = $anchor.offset(),
    a_w     = $anchor.outerWidth(),
    a_h     = $anchor.outerHeight(),
    n_h     = $node.outerHeight(),
    n_w     = $node.outerWidth(),
    m       = margin || 15;

    switch(pos) {
      case POS_TL:
        offset.top  -= n_h + m;
      break;
      case POS_T:
        offset.top  -= n_h + m;
        offset.left += a_w / 2 - n_w / 2;
      break;
      case POS_TR:
        offset.top  -= n_h + m;
        offset.left += a_w - n_w;
      break;
      case POS_R:
        offset.top  += a_h / 2 - (n_h/2);
        offset.left += a_w + m;
      break;
      case POS_BR:
        offset.top  += a_h + m;
        offset.left += a_w - n_w;
      break;
      case POS_B:
        offset.top  += a_h + m;
        offset.left += a_w / 2 - n_w / 2;
      break;
      case POS_BL:
        offset.top  += a_h + m;
      break;
      case POS_L:
        offset.top  += (a_h / 2) - (n_h/2);
        offset.left -= n_w + m;
      break;
    }

    $node.offset(offset);
  };

  /**
   * Marker implementation.
   */
  _.extend(Extension.prototype, guide.Extension, {
    id: 'markers',

    defaults: {
      refreshFrequency: 500
    },

    constructor: function() {
      guide.Tour.prototype.addOption('alwaysMark', true);

      // we must manually assign the options to the default tour as it has
      // already been created
      if (guide.tour) {
        guide.tour.addOption('alwaysMark', true);
      }

      this.$container = guide.$el;

      guide.$
        .on('add', _.bind(this.addMarker, this))
        .on('focus', function(e, spot) {
          if (spot.marker) {
            spot.marker.highlight();
          }
        })
        .on('defocus', function(e, spot) {
          if (spot.marker) {
            spot.marker.dehighlight();
          }
        });

      return this;
    },

    addMarker: function(e, spot, attributes) {
      var marker;

      if (!spot.options.withMarker) {
        return null;
      }

      marker = new Marker(spot, attributes || {});

      marker.$el
      .addClass(guide.entityKlass())
      .on('click.gjs-markers', function(e) {
        spot.tour.focus(spot);

        return $.consume(e);
      });

      if (guide.isShown() && spot.tour.isActive()) {
        marker.show();
      }
      else {
        marker.hide();
      }

      return marker;
    },

    refresh: function() {
      var tour = guide.tour;

      if (!guide.isShown()) {
        return;
      }

      this.onGuideHide();

      this.rebuildMarkers(tour);

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          if (spot.tour.getOptions().alwaysMark) {
            spot.marker.show();
          } else {
            if (!spot.isCurrent()) {
              spot.marker.hide();
            }
          }
        }
      });

      this.onGuideShow();
    },

    /**
     * Install the window resize handler and launch markers for the current tour.
     *
     * @see #onTourStart
     * @see #repositionMarkers
     */
    onGuideShow: function() {
      $(window).on('resize.gjs_markers',
        _.throttle(
          _.bind(this.repositionMarkers, this),
          this.options.refreshFrequency));

      return this.onTourStart(guide.tour);
    },

    onGuideHide: function() {
      $(window).off('resize.gjs_markers');

      return this.onTourStop(guide.tour);
    },

    onTourStart: function(tour) {
      var that = this;

      // show markers for this tour
      //
      // we need to defer in order to correctly calculate the offset of targets
      // as they might still be populating their content at this stage
      _.defer(function() {
        _.each(tour.spots, function(spot) {
          if (spot.marker) {
            spot.marker.show();
          }
        });
      });

      // listen to its option changes
      tour.$
      .on('refresh.gjs_markers', function(/*e, options*/) {
        that.refresh();
      });
    },

    onTourStop: function(tour) {
      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          spot.marker.hide();
        }
      });

      tour.$.off('refresh.gjs_markers');
    },

    rebuildMarkers: function(tour) {
      var that = this,
          $container,
          marker;

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          $container = spot.marker.$container;
          spot.marker.remove();
          marker = that.addMarker(null, spot, { $container: $container });
        }
      });

      if (tour.current && tour.current.marker) {
        tour.current.marker.highlight();
      }
    },

    repositionMarkers: function() {
      var tour = guide.tour;

      if (!tour) {
        return true;
      }

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          spot.marker.$el.place();
        }
      });

      return true;
    }
  }); // Extension.prototype

  _.extend(Marker.prototype, {
    defaults: {
      position:   'right',
      placement:  'inline',
      withText:   true,
      width:      'auto'
    },

    constructor: function(spot, attributes) {
      var $el,
          $spot,
          $container;

      _.extend(this, attributes);
      this.spot   = spot;

      // build the marker options
      this.options = _.extend(
        {},
        this.options || this.defaults,
        // global guide marker options,
        guide.getOptions().marker,
        // the spot's tour options,
        spot.tour.getOptions().marker,
        // accept the spot options
        spot.getOptions().marker);

      $el       = $(this.build(spot));
      $el.place = $.proxy(this.place, this);

      // expose the placement and position modes as classes for some CSS control
      $el.addClass([
        this.options.placement + '-marker',
        this.options.position
      ].join(' '));

      _.extend(this, {
        $el:      $el,
        $index:   $el.find('.index'),
        $caption: $el.find('.caption'),
        $text:    $el.find('.text')
      });

      if (this.placement === PMT_SIBLING) {
        $spot = spot.$el;
        $container = this.$container;

        // the container must be relatively positioned
        // var $container = $('<div />').css({
        //   display:  $spot.css('display'),
        //   position: 'relative'
        // });
        if (!$container) {
          $container =
            $($spot[0].outerHTML.replace(/(<\/?)\w+\s/, '$1div '))
            .html('').attr({
              'id': null,
              'class': $spot[0].className.replace(/(gjs(\-?\w+)+)/g, '').trim()
            });

          $container.css({
            display:  $spot.css('display'),
            position: 'relative'
          });

          $container.data('gjs-container', true);

          // we'll keep a reference so we'll be able to use the same container
          // if/when we refresh
          this.$container = $container;
        }

        $container.insertBefore($spot);
        $spot.appendTo($container);
        $el.appendTo($container);

        // we'll need these for positioning
        this.margin_right = parseInt($el.css('margin-right'), 10);
        this.margin_left  = parseInt($el.css('margin-left'), 10);
      }

      spot.marker = this;
      spot.$scrollAnchor = this.$el;

      return this;
    },

    /**
     * Build a string version of the DOM element of the marker.
     *
     * @param <Spot> instance to build the marker for
     *
     * @return <string> the marker DOM element
     */
    build: function(spot) {
      var template = JST_PLAIN;

      // if spot has explicitly asked for no text, or doesn't have
      // any textual content, then we should respect the setting when
      // #highlight()-ed
      this.withText = this.options.withText && spot.hasContent();

      this.min_width = this.options.width || this.defaults.width;

      // parse placement and position
      switch(this.options.placement) {
        case 'inline':  this.placement = PMT_INLINE; break;
        case 'sibling': this.placement = PMT_SIBLING; break;
        case 'overlay': this.placement = PMT_OVERLAY; break;
        default:
          throw 'guide-marker.js: bad placement "'+this.options.placement+'"';
      }

      switch(this.options.position) {
        case 'topleft':     this.position = POS_TL; break;
        case 'top':         this.position = POS_T; break;
        case 'topright':    this.position = POS_TR; break;
        case 'right':       this.position = POS_R; break;
        case 'bottomright': this.position = POS_BR; break;
        case 'bottom':      this.position = POS_B; break;
        case 'bottomleft':  this.position = POS_BL; break;
        case 'left':        this.position = POS_L; break;
        default:
          throw 'guide-marker.js: bad position "' + this.options.position + '"';
      }

      if (spot.hasCaption()) {
        template = JST_WITH_CAPTION;
      }
      else if (spot.hasText()) {
        template = JST_WITH_CONTENT;
      }

      return template({
        index:    spot.index,
        text:     spot.getText(),
        caption:  spot.getCaption()
      });
    },

    show: function() {
      this.$el.place();
    },

    hide: function() {
      this.spot.$el.removeClass([
        'gjs-spot-' + this.options.placement,
        'gjs-spot-' + this.options.position
      ].join(' '));

      this.$el.detach();
    },

    remove: function() {
      this.hide();

      // return the spot element back to its place by completely removing the
      // sibling container we created
      if (this.placement === PMT_SIBLING) {
        this.$container.replaceWith(this.spot.$el);
        this.$container.remove();
      }

      this.$el.remove();
    },

    highlight: function() {
      this.$el.addClass('focused');

      guide.$.triggerHandler('marking.gjs_markers', [ this ]);

      if (this.withText) {
        this.$text.show();
        this.$caption.show();
        this.$index.hide();
        this.$el.css({
          width: this.min_width
        });
      }

      this.show();

      guide.$.triggerHandler('marked.gjs_markers', [ this ]);
    },

    dehighlight: function(/*spot*/) {
      this.$el.removeClass('focused');

      guide.$.triggerHandler('unmarking.gjs_markers', [ this ]);

      if (this.withText) {
        this.$text.hide();
        this.$caption.hide();
        this.$index.show();
        this.$el.css({
          width: 'auto'
        });

        this.$el.place();
      }

      if (!this.spot.tour.getOptions().alwaysMark) {
        this.hide();
      }

      guide.$.triggerHandler('unmarked.gjs_markers', [ this ]);
    },

    canShow: function() {
      var spot = this.spot;

      if (!spot.tour.getOptions().alwaysMark && !spot.isCurrent()) {
        return false;
      }

      if (!spot.$el.length || !spot.$el.is(':visible')) {
        return false;
      }

      return true;
    },

    place: function() {
      var $spot = this.spot.$el,
          $marker = this.$el;

      if (!this.canShow()) {
        return this.hide();
      }

      attach(this);

      // mark the spot as being highlighted by a marker
      $spot.addClass([
        'gjs-spot-' + this.options.placement,
        'gjs-spot-' + this.options.position
      ].join(' '));

      if (this.placement === PMT_INLINE) {
        hvCenter($marker, this.position);
      }
      else if (this.placement === PMT_SIBLING) {
        negateMargins($marker,
                      $spot,
                      this.position,
                      this.margin_left,
                      this.margin_right);
      }

      else if (this.placement === PMT_OVERLAY) {
        snapTo($marker, $spot, this.position);
      }
    }
  });

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var
  Extension = function() {
    return this.constructor();
  },

  JST = _.template([
    '<div id="gjs_toggler">',
      '<button></button>',
    '</div>'
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true
    },

    id: 'toggler',

    constructor: function() {
      this.options = _.defaults({}, this.defaults);

      this.$container = guide.$container;

      this.$el = $(JST({}));
      this.$el.addClass(guide.entityKlass());
      this.$indicator = this.$el.find('button');

      this.$el.on('click', '.show', _.bind(guide.show, guide));
      this.$el.on('click', '.hide', _.bind(guide.hide, guide));

      guide.$
      .on('show hide',  _.bind(this.update, this))
      .on('dismiss', _.bind(this.remove, this));

      this.show();

      return this;
    },

    show: function() {
      this.$el.appendTo(this.$container);

      return this;
    },

    hide: function() {
      this.$el.detach();

      return this;
    },

    remove: function() {
      this.$el.remove();
    },

    update: function() {
      if (guide.isShown()) {
        this.$indicator
          .text('Stop Tour')
          .removeClass('show')
          .addClass('hide');
      }
      else {
        this.$indicator
          .text('Tour')
          .removeClass('hide')
          .addClass('show');
      }

      this.$el.toggleClass('collapsed', !guide.isShown());
    },

    refresh: function(inOptions) {
      var options = inOptions || this.options;

      if (!options.enabled) {
        this.hide();
      } else {
        this.show();
      }
    }

  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var
  Extension = function() {
    return this.constructor();
  },

  JST_TUTOR = _.template([
    '<div>',
    // '<button id="gjs_close_tutor">&times;</button>',

    '<div class="navigation">',
      '<button class="bwd"></button>',
      '<span></span>',
      '<button class="fwd"></button>',
    '</div>',

    '<div class="content"></div>',
    '</div>'
  ].join('')),

  JST_SPOT = _.template([
    '<div>',
    '<% if (spot.hasCaption()) { %>',
      '<h6 class="caption"><%= spot.getCaption() %></h6>',
    '<% } %>',
    '<div><%= spot.getText() %></div>',
    '</div>'
  ].join(''), null, { variable: 'spot' });

  _.extend(Extension.prototype, guide.Extension, {
    id: 'tutor',

    defaults: {
      enabled: true,
      spanner: false
    },

    constructor: function() {
      var that = this;

      this.$container = guide.$el;

      this.$el = $(JST_TUTOR({}));

      this.$el.attr({
        'id': 'gjs_tutor',
        'class': guide.entityKlass()
      });

      _.extend(this, {
        $content: this.$el.find('> .content'),
        $nav: this.$el.find('> .navigation'),
        $close_btn: this.$el.find('#gjs_close_tutor'),
        $bwd: this.$el.find('.bwd'),
        $fwd: this.$el.find('.fwd')
      });

      guide.$
        .on('show', _.bind(this.show, this))
        .on('hide', _.bind(this.hide, this))
        .on('dismiss', _.bind(this.remove, this))
        .on('focus', _.bind(this.focus, this))
        .on('start.tours', function(e, tour) {
          if (tour.current) {
            that.focus(e, tour.current, tour);
          }
        });

      this.$close_btn.on('click', _.bind(guide.hide, guide));

      this.$nav
        .on('click','.bwd', function() {
          guide.tour.prev();
        })
        .on('click','.fwd', function() {
          guide.tour.next();
        });

      return this;
    },

    show: function() {
      if (!this.getOptions().enabled) {
        return this;
      }

      this.$el.appendTo(this.$container);

      return this;
    },

    hide: function() {
      this.$el.detach();

      return this;
    },

    remove: function() {
      this.$el.remove();
    },

    toggle: function() {
      return this.$el.parent().length ?
        this.hide.apply(this, arguments) :
        this.show.apply(this, arguments);
    },

    refresh: function() {
      var options = this.getOptions();

      if (!options.enabled) {
        return this.hide();
      }

      this.$el.toggleClass('spanner', options.spanner);
      this.focus(null, guide.tour.current, guide.tour);
    },

    focus: function(e, spot, tour) {
      var left = tour.previous && tour.previous.index > tour.cursor,
          anim_dur = 'fast', // animation duration
          anim_offset = '50px',
          $number;

      if (!spot || !spot.$el.is(':visible')) {
        return this.hide();
      }

      this.show();

      if (spot === this.spot) {
        return;
      }

      this.$content.html(JST_SPOT(spot));

      $number  = this.$nav.find('span');

      $number
        .stop(true, true) // kill the current animation if user clicks too fast
        .animate({
            'text-indent': (left ? '' : '-') + anim_offset
          },
          anim_dur,
          function() {
            $number.html(tour.cursor+1);
            $number
              .css({ 'text-indent': (left ? '-' : '') + anim_offset }, anim_dur)
              .animate({ 'text-indent': 0 }, anim_dur);
          });

      this.$bwd.toggleClass('disabled', !tour.hasPrev());
      this.$fwd.toggleClass('disabled', !tour.hasNext());

      this.spot = spot;

      return true;
    },
  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);