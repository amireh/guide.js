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
      throw 'guide.js: existing $.' + ext + ' implementation!';
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
    throw new Error('guide.js: jQuery is undefined, are you sure it has been loaded yet?');
  }

  var
  root = this,
  module,
  exports,

  /**
   * @class Guide
   * The primary interface for creating and managing guide.js tours.
   *
   * @mixins Guide.Optionable
   * @singleton
   */
  Guide = function() {
    this.constructor.apply(this, arguments);

    return this;
  },

  KLASS_ENABLED         = 'with-gjs',
  KLASS_OVERLAYED       = 'gjs-with-overlay',
  KLASS_NOT_OVERLAYED   = 'gjs-without-overlay',
  KLASS_HIDING          = 'gjs-hiding',
  KLASS_ENTITY          = 'gjs-entity';

  _.extend(Guide.prototype, {
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
      var that = this;

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

      this.$.on('start.tours', function(e, tour) {
        if (!that.isShown()) {
          that.show({ noTour: true });
        }

        if (tour !== that.tour) {
          if (that.tour) {
            that.tour.stop();
          }

          that.tour = tour;
        }
      });

      console.log('guide.js: running');
    },

    inactiveTours: function() {
      return _.without(this.tours, this.tour);
    },

    defineTour: function(label, optSpots) {
      var tour;

      if (!(tour = this.getTour(label))) {
        tour = new Guide.Tour(label);
        this.tours.push(tour);
      }

      if (optSpots) {
        this.addSpots(optSpots);
      }

      return tour;
    },

    runTour: function(id) {
      var tour;

      if (!this.isShown()) {
        this.show({ noTour: true });
      }

      if (!(tour = this.getTour(id))) {
        throw new Error('guide.js: undefined tour "' + id + '", did you call #defineTour()?');
      }

      if (this.tour) {
        this.tour.stop();
      }

      console.log('guide.js: touring "' + tour.id + '"');

      this.tour = tour;
      this.tour.start();

      return this;
    },

    /**
     * Creates a new Tour Spot and attaches it to the current Tour.
     *
     * @param {jQuery} $el The target element of the tour spot.
     * @param {Object} [inOptions={}] inOptions
     * {
     *   text: {String} [required] A text message to show when the spot is focused.
     *   caption: {String} [optional]
     *   tour: {Guide.Tour} [optional] defaults to the current tour
     *
     *   onFocus: function($prevSpot) {}
     *   onDefocus: function($currentSpot) {}
     * }
     *
     * @return {Guide.Spot} The newly created tour spot.
     *
     * Look at Guide.Tour#addSpot for defining spots on a specific tour directly.
     */
    addSpot: function($el, inOptions) {
      var tour    = this.tour,
          options = inOptions || {},
          tour_id = options.tour;

      if (tour_id) {
        if (_.isString(tour_id)) {
          tour = this.defineTour(tour_id);
        }
        else if (tour_id instanceof Guide.Tour) {
          tour = tour_id;
        }
        else {
          throw new Error('guide.js: bad tour object, unrecognized type: ' + typeof(tour_id));
        }
      }

      return tour.addSpot($el, options);
    },

    addSpots: function(spots) {
      if (spots instanceof jQuery) {
        return this.fromDOM(spots);
      }
      else if (_.isArray(spots)) {
        return this.fromJSON(spots);
      }

      throw new Error('guide.js: bad spots, expected Array or jQuery selector,' +
                      ' got: ' + typeof(spots));
    },

    fromJSON: function(spots) {
      spots = _.isArray(spots) ? spots : [ spots ];

      _.each(spots, function(definition) {
        this.addSpot(definition.$el, definition);
      }, this);

      return this;
    },

    fromDOM: function(selector_or_container) {
      var that = this,
          $container = $(selector_or_container || 'body');

      $container.find('[data-guide]').each(function() {
        var $target = $(this);

        that.fromNode($target, {
          text: $target.attr('data-guide')
        });
      });

      // Elements with [data-guide-spot] are "references" since they point
      // to a target that will be used as a spot, while they act as the
      // content of that spot.
      //
      // Side-effect:
      // The reference node will be detached and no longer available in the DOM.
      $container.find('[data-guide-spot]').each(function() {
        var $ref    = $(this),
            $target = $($ref.attr('data-guide-spot')),
            options = _.parseOptions($ref.attr('data-guide-options'));

        that.fromNode($target, _.extend(options, {
          text: $ref.detach().attr('data-guide-spot', null)[0].outerHTML
        }));
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

      return this.addSpot($this, options);
    },

    show: function(inOptions) {
      var options     = inOptions || {},
          that        = this,
          should_show  = !this.isShown(),
          show_after   = this.options.withAnimations ? this.options.toggleDuration:0;

      if (!this.tours.length) {
        throw new Error('guide.js: can not show with no tours defined!');
      }

      if (should_show) {
        this.$container.addClass(KLASS_ENABLED);
        this.toggleOverlayMode();

        this.$.triggerHandler('showing');
      }

      if (should_show) {
        this.$el.appendTo(this.$container);
        this.$el.show(show_after + 1, function() {
          that._shown = true;
          that.$.triggerHandler('show');

          if (!options.noTour) {
            that.runTour(options.tour || that.tour || that.tours[0]);
          }
        });
      }

      return this;
    },

    isShown: function() {
      // return  this.$container.hasClass(KLASS_ENABLED) &&
      //         !this.$container.hasClass(KLASS_HIDING);
      return !!this._shown;
    },

    /**
     *
     * @async
     */
    hide: function() {
      var that        = this,
          hide_after  = this.options.withAnimations ? this.options.toggleDuration:0;

      if (this.isShown()) {
        this._shown = false;
        this.$container.addClass(KLASS_HIDING);

        that.$.triggerHandler('hiding');

        that.$el.hide(hide_after + 1, function() {
          if (that.tour) {
            that.tour.stop();
          }

          that.$.triggerHandler('hide');

          that.$el.detach();

          that.$container.removeClass([
            KLASS_ENABLED,
            KLASS_OVERLAYED,
            KLASS_HIDING
          ].join(' '));
        });
      }

      return this;
    },

    refresh: function(noCallbacks) {
      _.each(this.extensions, function(e) {
        if (e.refresh) {
          e.refresh();
        }
      });

      if (this.tour) {
        this.tour.refresh(noCallbacks);
      }

      this.toggleOverlayMode();

      return this;
    },

    reset: function() {
      if (this.isShown()) {
        this.hide();
      }

      this.options = _.clone(this.defaults);

      this.tours  = [];
      this.tour   = this.defineTour('Default Tour');
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
        this.$container.addClass(KLASS_OVERLAYED).removeClass(KLASS_NOT_OVERLAYED);
      }
      else {
        this.$container.removeClass(KLASS_OVERLAYED).addClass(KLASS_NOT_OVERLAYED);
      }
    },


    dismiss: function(/*optTourId*/) {
      this.$.triggerHandler('dismiss');
    },

    focus: function() {
      return this.tour.focus.apply(this.tour, arguments);
    },

    addExtension: function(ext) {
      if (!ext.id) {
        throw new Error('guide.js: bad extension, no #id attribute defined');
      }

      this.extensions.push(ext);

      if (void 0 === ext.__initExtension) {
        throw new Error('guide.js: bad extension, does not seem to implement the' +
              ' guide.Extension prototype');
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
        _.find(this.tours || [], id);
    }
  }); // guide.prototype

  Guide = new Guide();

  console.log($('body'));

  // expose the instance to everybody
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Guide;
    }
    exports.guide = Guide;
  } else {
    root.guide = Guide;
  }


}).call(this, _, jQuery);

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
      // this.options = _.extend(this.getOptions(), options);
      this.options = _.extend(this.options, options);

      if (this.refresh) {
        this.refresh(this.getOptions());
      }

      if (this.$) {
        console.log('guide.js:', this.id,'options changed, triggering refresh');

        this.$.triggerHandler('refresh', [ this.options, this ]);
      }

      return this;
    },

    getOptions: function() {
      return _.extend({}, this.options);
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

      this.options = _.extend({}, this.defaults, { enabled: true }, this.options);

      guide.$
        .on(this.nsEvent('show'), function() {
          if (that.onGuideShow && that.isEnabled()) {
            that.onGuideShow();
          }
        })
        .on(this.nsEvent('hide'), function() {
          if (that.onGuideHide && that.isEnabled()) {
            that.onGuideHide();
          }
        })
        .on(this.nsEvent('start.tours'), function(e, tour) {
          if (that.onTourStart && that.isEnabled(tour)) {
            that.onTourStart(tour);
          }
        })
        .on(this.nsEvent('stop.tours'), function(e, tour) {
          if (that.onTourStop && that.isEnabled(tour)) {
            that.onTourStop(tour);
          }
        });
    },

    /**
     * An event namespaced to this specific extension.
     */
    nsEvent: function(event) {
      return [ event, 'gjs_extension', this.id ].join('.');
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
    getOptions: function(tour) {
      var key = this.id;

      tour = tour || guide.tour;

      return _.extend({},
        this.options,
        guide.options[key],
        tour ? (tour.options || {})[key] : null);
    },

    isEnabled: function(tour) {
      if (tour) {
        var extOptions = (tour.options[this.id] || {});

        if (_.isBoolean(extOptions.enabled)) {
          return extOptions.enabled;
        }
      }

      // return !!this.options.enabled;
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

    start: function() {
      var that      = this,
          callback  = this.options.onStart;

      if (!this.spots.length) {
        return this;
      }

      _.each(this.spots, function(spot) {
        spot.highlight();
      });

      that.focus(that.current || 0);

      console.log('guide.js', 'tour started');
      guide.$.triggerHandler('start.tours', [ that ]);

      if (callback && _.isFunction(callback)) {
        callback.apply(that, []);
      }

      return this;
    },

    stop: function() {
      var that      = this,
          callback  = this.options.onStop;

      _.each(this.spots, function(spot) {
        spot.dehighlight({ force: true });
      });

      guide.$.triggerHandler('stop.tours', [ this ]);

      if (callback && _.isFunction(callback)) {
        callback.apply(that, []);
      }

      return this;
    },

    reset: function() {
      this.cursor = 0;
      this.current = null;

      return this;
    },

    isActive: function() {
      return this === guide.tour;
    },

    refresh: function() {
      if (this.isActive()) {
        this.stop().start();
      }

      return this;
    },

    addSpot: function($el, options) {
      var spot;

      if (!($el instanceof jQuery)) {
        throw new Error('guide.js: bad Spot target, expected a jQuery object ' +
          'but got ' + typeof($el));
      }

      // has the spot been already defined? we can not handle duplicates
      if ($el.data('gjs_spot')) {
        console.log('guide.js: element is already bound to a tour spot:');
        console.log($el);

        throw new Error('guide.js: duplicate spot, see console for more information');
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
        data('gjs_spot', spot);

      if (guide.isShown()) {
        spot.highlight();
      }

      guide.$.triggerHandler('add', [ spot ]);

      return spot;
    },

    addSpots: function(spots) {
      if (!_.isArray(spots)) {
        throw new Error('guide.js: bad spots, expected Array,' + ' got: ' +
                        typeof(spots));
      }

      _.each(spots, function(definition) {
        this.addSpot(definition.$el, definition);
      }, this);

      return this;
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
      var spot  = this.getSpot(index),
          i; // spot iterator

      if (!spot) {
        throw new Error('guide.js: bad spot @ ' + index + ' to focus');
      }
      else if (spot.isCurrent()) {
        return false;
      }
      else if (!spot.isVisible()) {
        console.log('guide.js', 'spot', spot.index, 'isnt visible, looking for another one');

        // look for any spot that's visible and focus it instead
        for (i = 0; i < this.spots.length; ++i) {
          spot = this.spots[i];

          if (spot.isVisible()) {
            this.cursor = i;
            break;
          }
          else {
            spot = null;
          }
        }

        if (!spot) {
          console.log('guide.js', 'no visible spot to focus, aborting');
          return false;
        }
      }

      if (!this.isActive()) {
        // guide.runTour(this);
        return false;
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

    getSpot: function(index) {
      if (_.isNumber(index)) {
        return this.spots[index];
      }
      else if (!index) {
        return null;
      }
      else if (index instanceof guide.Spot) {
        return _.find(this.spots || [], index);
      }

      return null;
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
      _.extend(this, attributes, _.pick(options || {}, ['text','caption']), {
        options: _.extend({}, this.defaults, options)
      });

      this.$scrollAnchor = this.$el;

      if (!this.tour) {
        throw new Error('guide.js: expected #tour to be specified for a new Spot, got none');
      }

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

    isVisible: function() {
      return this.$el.length && this.$el.is(':visible');
    },

    highlight: function() {
      var applicable =
        this.tour.getOptions().alwaysHighlight ||
        this.isCurrent();

      // the spot-scoped option takes precedence over the tour one
      if (!this.options.highlight) {
        applicable = false;
      }

      if (!this.$el.length) {
        this.$el = $(this.$el.selector);

        if (!this.$scrollAnchor || !this.$scrollAnchor.length) {
          this.$scrollAnchor = this.$el;
        }
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
      var callback = this.options.onDefocus;

      this.dehighlight();

      this.$el.removeClass(KLASS_FOCUSED);
      this.$el.triggerHandler('defocus.gjs', next_spot);

      if (callback && _.isFunction(callback)) {
        callback.apply(this, arguments);
      }
    },

    refresh: function() {
      this.dehighlight();
      this.highlight();

      if (this.isCurrent()) {
        this.defocus();
        this.focus();
      }
    },

    setScrollAnchor: function($el) {
      this.$scrollAnchor = $el;
    },

    toString: function() {
      return this.tour.id + '#' + this.index;
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
      '<select name="tour" data-action="switchTour"></select>',
    '</div>'
  ].join('')),

  JST_TOUR_LIST = _.template([
    '<% _.forEach(tours, function(tour) { %>',
      '<option value="<%= tour.id %>"><%= tour.id %></option>',
    '<% }); %>'
  ].join('')),

  JST_DEV_CONTORLS = _.template([
    '<div class="developer-controls">',
      '<button data-action="guide.toggle">Toggle</button>',
      '<button data-action="toggleOverlay">Toggle Overlay</button>',
    '</div>'
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,
      withDeveloperControls: false,
      inMarkers:  false,
      inTutor:    false
    },

    id: 'controls',

    constructor: function() {
      var that = this;

      this.$container = guide.$el;
      this.guide = guide;
      this.tour  = guide.tour;
      this.options = this.getOptions();

      // this.refresh();

      guide.$
      .on('show', _.bind(this.show, this))
      .on('hide', _.bind(this.hide, this))
      .on('dismiss', _.bind(this.remove, this))
      .on('focus', function(/*e, spot*/) {
        that.refreshControls();
      });

      this.$el = $(JST_CONTROLS({}));

      if (this.options.withDeveloperControls) {
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
        $hide:  this.$el.find('[data-action*=hide]'),
        $tour_selector:  this.$el.find('[data-action="switchTour"]')
      });

      return this;
    },

    onTourStart: function(tour) {
      this.tour = tour;
      this.refresh();
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
      extTutor    = guide.getExtension('tutor'),
      extMarkers  = guide.getExtension('markers'),
      options     = this.getOptions();

      // this.remove();

      if (extMarkers && extMarkers.isEnabled() && options.inMarkers) {
        this.markerMode(extMarkers);
      }
      else if (extTutor && extTutor.isEnabled() && options.inTutor) {
        this.tutorMode(extTutor);
      }
      else {
        this.classicMode();
      }

      this.show();
    },

    classicMode: function() {
      var extTutor = guide.getExtension('tutor'),
          extMarkers  = guide.getExtension('markers');

      this.$container = guide.$el;

      if (extTutor) {
        extTutor.$el
          .addClass('without-controls')
          .removeClass('with-controls');
      }

      if (extMarkers) {
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

      if (!action) {
        return;
      }
      else if (action.indexOf('.') > -1) {
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
      var tour = this.tour;

      this.$tour_selector.html(JST_TOUR_LIST({ tours: guide.tours }));
      this.$bwd.prop('disabled', !tour.hasPrev());
      this.$fwd.prop('disabled', !tour.hasNext());
      this.$first.prop('disabled', !tour.hasPrev());
      this.$last.prop('disabled', !tour.hasNext());
      this.$hide.toggle(!tour.hasNext());
      this.$tour_selector.find('[value="' + tour.id + '"]').prop('selected', true);
    },

    switchTour: function() {
      var tour = guide.getTour(this.$tour_selector.find(':selected').val());

      if (tour && !tour.isActive()) {
        tour.reset();
        guide.runTour(tour);
      }

      return true;
    }

  }); // Extension.prototype

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
    '<div>',
      '<span class="index"><%= index +1 %></span>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and text otherwise.
   */
  JST_WITH_CONTENT = _.template([
    '<div>',
      '<span class="index"><%= index +1 %></span>',
      '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and both caption
   * and text otherwise.
   */
  JST_WITH_CAPTION = _.template([
    '<div>',
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
  POS_L   = 8;

  /**
   * Marker implementation.
   */
  _.extend(Extension.prototype, guide.Extension, {
    id: 'markers',

    defaults: {
      enabled: true,
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
      else if (!this.isEnabled(spot.tour)) {
        return null;
      }

      // console.log('guide.js', 'markers', 'adding marker for spot', spot.toString());

      marker = new Marker(spot, attributes || {});

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
      else if (!this.isEnabled()) {
        return;
      }

      $(window).off('resize.gjs_markers');
      $(window).on('resize.gjs_markers',
        _.throttle(
          _.bind(this.repositionMarkers, this),
          this.getOptions().refreshFrequency));

      // this.onGuideHide();

      // this.rebuildMarkers(tour);

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

      // this.onGuideShow();
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

      $(document.body).on('click.gjs_markers', '.gjs-marker', function(e) {
        var marker = $(this).data('gjs');

        if (marker) {
          marker.spot.tour.focus(marker.spot);

          return $.consume(e);
        }

        return true;
      });

      // return this.onTourStart(guide.tour);
    },

    onGuideHide: function() {
      $(window).off('resize.gjs_markers');
      $(document.body).off('click.gjs_markers');

      // return this.onTourStop(guide.tour);
    },

    onTourStart: function(tour) {
      var that = this;

      if (!this.isEnabled(tour)) {
        return this;
      }

      console.log('guide.js', '[markers] showing markers for tour ', tour.id);

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
      tour.$.on('refresh.gjs_markers', function(/*e, options*/) {
        that.refresh();
      });
    },

    onTourStop: function(tour) {
      console.log('[markers] destroying markers for tour ', tour.id);

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          spot.marker.hide();
          // spot.marker.remove();
        }
      });

      tour.$.off('refresh.gjs_markers');
    },

    rebuildMarkers: function(/*tour*/) {
      // var that = this,
      //     $container,
      //     marker;

      // console.log('[markers] rebuilding markers for tour ', tour.id);

      // _.each(tour.spots, function(spot) {
      //   if (spot.marker) {
      //     $container = spot.marker.$container;
      //     spot.marker.remove();
      //     marker = that.addMarker(null, spot, { $container: $container });
      //   }
      // });

      // if (tour.current && tour.current.marker) {
      //   tour.current.marker.highlight();
      // }
    },

    repositionMarkers: function() {
      var tour = guide.tour;

      if (!tour) {
        return true;
      }

      console.log('[markers] repositioning markers for tour ', tour.id);

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          spot.marker.place();
        }
      });

      return true;
    }
  }); // Extension.prototype


  /**
   * @class Marker
   *
   * A single marker object attached to a Tour Spot. Markers show up around
   * a tour spot, and can show the index of the spot, its content when highlighted,
   * and more.
   *
   * Marker instances allow you to configure where and how they should be placed.
   *
   */
  _.extend(Marker.prototype, {
    defaults: {

      /**
       * The position of the marker relative to the spot target element.
       *
       * Position can be one of:
       *
       *     'topleft'    'top'    'topright'
       *     'left'                'right'
       *     'bottomleft' 'bottom' 'bottomright'
       *
       * @cfg
       */
      position:   'right',

      /**
       * The placement mode to use for attaching the marker.
       *
       * Available placement modes are:
       *
       *  - `inline`: the marker is attached **inside** the target and is positioned
       *  using margins
       *
       *  - `sibling`: the marker and the target are **wrapped** in a
       *  container so they become siblings, positioning is done using margins
       *
       *  - `overlay`: the marker is positioned independently of the target using
       *  absolute coordinates
       *
       * @cfg
       */
      placement:  'sibling',

      /**
       * Setting this to false will prevent the markers from containing any
       * content, and instead show only the index of the spot.
       *
       * @cfg
       */
      withText:   true,

      /**
       * Specify a pixel value to use as the width of the marker, in case the
       * default (auto) width doesn't make sense (ie, a small button)
       *
       * @cfg
       */
      width:      'auto'
    },

    constructor: function(spot, attributes) {
      _.extend(this, attributes);

      this.spot   = spot;
      spot.marker = this;

      // Parse the marker options
      this.options = _.extend(
        {},
        // lowest priority: our defaults
        this.options || this.defaults,
        // then, guide's global marker options,
        guide.getOptions().marker,
        // then, the spot's tour options,
        spot.tour.getOptions().marker,
        // and highest priority: the spot's options
        spot.getOptions().marker);

      return this.build();
    },

    /**
     * Build the marker element and prepare it for attachment.
     *
     * @return {Guide.Marker} this
     */
    build: function() {
      var
      $el,
      $container, // used for sibling placement, see below
      template,
      spot      = this.spot,
      $spot     = spot.$el;

      // Shouldn't build a marker for a spot target that's not (yet) visible.
      if (!spot.isVisible()) {
        return this;
      }
      // Already built? no-op at the moment, we don't support re-building
      else if (this.$el) {
        return this;
      }

      // If spot has explicitly asked for no text, or doesn't have
      // any textual content, then we should respect the setting when
      // highlighted.
      //
      // See #highlight.
      this.withText = this.options.withText && spot.hasContent();

      this.width = this.options.width || this.defaults.width;

      this.spot_klasses = [
        'gjs-spot-' + this.options.placement,
        'gjs-spot-' + this.options.position
      ].join(' ');

      // Parse placement and position modes.
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

      // Determine which template we should use.
      if (_.isFunction(this.options.template)) {
        template = this.options.template;
      }
      else if (spot.hasCaption()) {
        template = JST_WITH_CAPTION;
      }
      else if (spot.hasText()) {
        template = JST_WITH_CONTENT;
      }
      else {
        template = JST_PLAIN;
      }

      // Build the marker element.
      $el = $(template({
        index:    spot.index,
        text:     spot.getText(),
        caption:  spot.getCaption()
      }));

      // Assign the marker element as the spot's scrolling anchor so that the
      // marker is entirely visible when the spot is highlighted.
      spot.setScrollAnchor($el);

      // A few handy accessors we'll use as the marker content changes, ie: on
      // (de)highlights
      _.extend(this, {
        $el:      $el,
        $index:   $el.find('.index'),
        $caption: $el.find('.caption'),
        $text:    $el.find('.text')
      });

      $el
        // Expose the marker mode as CSS classes for some control
        .addClass([
          'gjs-marker',
          guide.entityKlass(),
          this.options.placement + '-marker',
          this.options.position
        ].join(' '))

        // Attach the marker to the jQuery object, necessary for handling events
        //
        // See Extension#onGuideShow
        .data('gjs', this);

      // In Sibling placement mode, we need to construct a container element
      // that will be the parent of the spot target and the marker element.
      //
      // While there's high portion of hackery involved here, it is only so in
      // order to be as transparent as possible, and not to break the page's
      // layout.
      if (this.placement === PMT_SIBLING) {
        if (!this.isWrapped()) {
          // Build the container:
          //
          // Instead of building a plain `<div/>`, we'll try to replicate the
          // target element, so we won't break any CSS/JS that uses the tag as
          // an identifier, we'll do that by cloning the tag and stripping
          // some properties from it.
          $container = $($spot[0].outerHTML.replace(/(<\/?)\w+\s/, '$1div '))
                      // Empty it, we only need the tag and its structure
                      .html('')
                      .attr({
                        'id': null,

                        // Remove any gjs- related classes from the container
                        'class': $spot[0].className.replace(/(gjs(\-?\w+)+)/g, '').trim()
                      })
                      .css({
                        // Try to mimic the alignment of the target element
                        display: $spot.css('display'),

                        // The container must be relatively positioned, since
                        // we're positioning the marker using margins.
                        position: 'relative'
                      })

                      // Set a flag so we can tell whether the spot target is
                      // already wrapped so that we will properly clean up
                      //
                      // See #isWrapped and #remove.
                      .data('gjs_container', true)

                      // Position the container right where the target is, and
                      // move the target and the marker inside of it.
                      .insertBefore($spot)
                      .append($spot)
                      .append($el);
        } else {
          // Container already built, we just need to place the marker element
          // inside of it:
          $container = $spot.parent();
          $container.append($el);
        }

        // We'll need the left and right margins for proper positioning.
        //
        // See #negateMargins for more info.
        this.margin_right = parseInt($el.css('margin-right'), 10);
        this.margin_left  = parseInt($el.css('margin-left'), 10);
      }

      return this;
    },

    show: function() {
      if (!this.canShow()) {
        return this;
      }

      // Mark the spot as being highlighted by a marker
      this.spot.$el.addClass(this.spot_klasses);

      // Attach and position the marker
      this.place();
    },

    hide: function() {
      this.spot.$el.removeClass(this.spot_klasses);

      if (this.$el) {
        this.$el.detach();
      }
    },

    remove: function() {
      var $container;

      this.hide();

      if (this.$el) {
        this.$el.remove();
      }

      // Return the target back to its place by completely removing the
      // sibling container we created
      if (this.isWrapped()) {
        $container = this.spot.$el.parent();

        $container.replaceWith(this.spot.$el);
        $container.remove();
      }
    },

    highlight: function() {
      if (!this.$el) {
        this.build();
      }

      guide.$.triggerHandler('marking.gjs_markers', [ this ]);

      this.$el.addClass('focused');

      if (this.withText) {
        this.$index.hide();

        this.$text.show();
        this.$caption.show();
        this.$el.css({
          width: this.width
        });
      }

      this.show();

      guide.$.triggerHandler('marked.gjs_markers', [ this ]);
    },

    dehighlight: function(/*spot*/) {
      if (!this.$el) {
        return;
      }

      guide.$.triggerHandler('unmarking.gjs_markers', [ this ]);

      this.$el.removeClass('focused');

      if (this.withText) {
        this.$index.show();

        this.$text.hide();
        this.$caption.hide();
        this.$el.css({
          width: 'auto'
        });
      }

      if (!this.spot.tour.getOptions().alwaysMark) {
        this.hide();
      }
      else {
        this.show();
      }

      guide.$.triggerHandler('unmarked.gjs_markers', [ this ]);
    },

    /**
     * Whether the marker can and should be shown.
     *
     * The marker can be shown if the following conditions are met:
     *
     * - The marker element is actually built
     * - The spot target is valid and visible
     * - The spot is the current one *or* its tour has the `alwaysMark` option
     *
     */
    canShow: function() {
      var spot = this.spot;

      if (!this.$el) {
        return false;
      }

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

      this.attach();

      switch(this.placement) {
        case PMT_INLINE:
          this.hvCenter($marker, this.position);
        break;
        case PMT_SIBLING:
          this.negateMargins($marker,
                        $spot,
                        this.position,
                        this.margin_left,
                        this.margin_right,
                        15);

          this.hvCenter($marker, this.position);
        break;
        case PMT_OVERLAY:
          this.snapTo($marker, $spot, this.position);
        break;
      }
    },

    // insert our DOM node at the appropriate position
    attach: function() {
      var method;

      switch(this.placement) {
        case PMT_INLINE:
          this.spot.$el.append(this.$el);
        break;
        case PMT_SIBLING:
          method  = (this.position >= POS_TR && this.position <= POS_BR) ?
            'after' :
            'before';

          this.spot.$el[method](this.$el);
        break;
        case PMT_OVERLAY:
          guide.$el.append(this.$el);
        break;
      }

      return this;
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
    hvCenter: function($node, pos) {
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

    negateMargins: function($node, $anchor, pos, ml, mr) {
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

      return delta;
    },

    snapTo: function($node, $anchor, pos, margin) {
      var
      offset  = $anchor.offset(),
      a_w     = $anchor.outerWidth(),
      a_h     = $anchor.outerHeight(),
      n_h     = $node.outerHeight(),
      n_w     = $node.outerWidth(),
      m       = margin || 0;

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
    },

    isWrapped: function() {
      var $container;

      if (!this.spot.$el.length) { return false; }

      $container = this.spot.$el.parent();

      if ($container.length && $container.data('gjs_container')) {
        return true;
      }
    },


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
      .on(this.nsEvent('showing'), _.bind(this.collapse, this))
      .on(this.nsEvent('hiding'), _.bind(this.expand, this))
      .on(this.nsEvent('dismiss'), _.bind(this.remove, this));

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

    collapse: function() {
      this.$indicator
        .text('Stop Tour')
        .removeClass('show')
        .addClass('hide');

      this.$el.removeClass('collapsed');
    },

    expand: function() {
      this.$indicator
        .text('Tour')
        .removeClass('hide')
        .addClass('show');

      this.$el.addClass('collapsed');
    },

    refresh: function() {
      if (!this.isEnabled()) {
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
        .on('focus', _.bind(this.focus, this));

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
      if (!this.isEnabled()) {
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

    refresh: function() {
      var options = this.getOptions();

      if (!this.isEnabled()) {
        return this.hide();
      }
      else if (!this.$el.parent().length) {
        this.show();
      }

      this.$el.toggleClass('spanner', options.spanner);
      this.focus(null, guide.tour.current, guide.tour);
    },

    onGuideStart: function() {
      this.show();
    },

    onGuideStop: function() {
      this.hide();
    },

    onTourStart: function(tour) {
      if (tour.current) {
        this.focus(null, tour.current, tour);
      }
    },

    onTourStop: function() {
      this.hide();
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