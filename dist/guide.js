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

(function(root, _, $, undefined) {
  'use strict';

  if (!$) {
    throw new Error('guide.js: jQuery is undefined, are you sure it has been loaded yet?');
  }

  var
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

      /**
       * @cfg {Boolean} [withOverlay=false]
       * Attach a CSS 'shade' overlay to the document.
       */
      withOverlay: false,

      /**
       * @cfg {Boolean} [withAnimations=true]
       * Animate showing or hiding tours using jQuery.
       */
      withAnimations: true,

      /**
       * @cfg {Boolean} [animeDuration=500]
       * How long the animations should take.
       */
      animeDuration: 500,

      debug: true
    },

    constructor: function() {
      _.extend(this, {
        $container: $('body'),
        $el:        $('<div id="gjs" />'),
        options: _.clone(this.defaults),
        extensions: [],

        /**
         * @property {jQuery} $
         * An event delegator, used for emitting custom events and intercepting them.
         *
         * Modules can use this object to emit events just like any other jQuery
         * selector:
         *
         *     guide.$.triggerHandler('my_event', [ arg1, arg2 ]);
         *
         * And they can also listen to these events:
         *
         *     guide.$.on('my_event', function(e, arg1, arg2) {
         *       // ...
         *     });
         */
        $: $(this),

        /** @property {Tour[]} tours All defined tours, see #defineTour. */
        tours: [],

        /** @property {Tour} tour The active tour */
        tour: null
      });

      console.log('guide.js: running');
    },

    /**
     * Define a blank tour uniquely identified by the given label.
     *
     * @param {String} label
     * A unique name for this tour.
     *
     * @param {Object[]} [spots=[]]
     * A collection of spot definitions to pass to the tour, see Tour#addSpots.
     *
     * @return {Tour}
     * The newly created tour, or an existing one if the name was taken.
     */
    defineTour: function(label, spots) {
      var tour;

      if (!(tour = this.getTour(label))) {
        tour = new Guide.Tour(label);
        this.tours.push(tour);
      }

      if (spots) {
        this.addSpots(spots);
      }

      return tour;
    },

    /**
     * Looks up a tour by its label or an actual Tour object.
     *
     * @param {Tour/String} id The tour's label, or object, to look for.
     * @return {Tour/null} The tour, if found.
     */
    getTour: function(id) {
      return _.isString(id) ?
        _.find(this.tours || [], { id: id }) :
        _.find(this.tours || [], id);
    },

    allTours: function() {
      return _.reject(this.tours, function(tour) { return !tour.spots.length; });
    },

    /**
     * Find the default tour which might be explicitly set by the user, or
     * the first one otherwise.
     *
     * See Tour#isDefault for more information.
     */
    defaultTour: function() {
      var i, tour;

      for (i = 0; i !== this.tours.length; ++i) {
        tour = this.tours[i];

        if (tour.options.isDefault) {
          return tour;
        }
      }

      return this.tour || this.tours[0];
    },

    /** @private */
    inactiveTours: function() {
      return _.without(this.tours, this.tour);
    },

    /**
     * Shows the guide, stops the active tour (if any,) and starts the given tour.
     *
     * @param {Tour/String} id The Tour to start.
     * @async
     */
    runTour: function(id, options) {
      var current = this.tour,
          tour;

      if (!(tour = this.getTour(id))) {
        throw 'guide.js: undefined tour "' + id + '", did you call #defineTour()?';
      }

      // Must show first then start the tour.
      if (!this.isShown()) {
        this.$.one('show', _.bind(this.runTour, this, tour.id, options ));
        this.show({ noAutorun: true });

        return false;
      }

      // Must stop the current tour first, wait for it to clean up, then start
      // the new one.
      if (current && current.isActive()) {
        // Kill the active tour reference, otherwise we're stuck in a loop.
        this.tour = null;

        current.$.one('stop', _.bind(this.runTour, this, tour.id, options ));
        current.stop();

        return false;
      }

      console.log('guide.js: touring "' + tour.id + '"');

      this.tour = tour;
      this.tour.start(options);

      return true;
    },


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

      $container.find('[data-guide-tour]').add($container).each(function() {
        var id      = $(this).attr('data-guide-tour'),
            options = $(this).attr('data-guide-options'),
            tour;

        if (id) {
          tour = that.defineTour(id);
          if (options) {
            tour.setOptions(options);
          }
        }
      });

      $container.find('[data-guide], [data-guide-spot]').each(function() {
        var $target = $(this);

        // Elements with [data-guide-spot] are "references" since they point
        // to a target that will be used as a spot, while they act as the
        // content of that spot.
        //
        // Side-effect:
        // The reference node will be detached and no longer available in the DOM.
        if ($(this).is('[data-guide-spot]')) {
          that.fromReferenceNode($target);
        }
        else {
          that.fromNode($target, {
            text: $target.attr('data-guide')
          });
        }
      });

      return this;
    },

    fromNode: function($node, inOptions) {
      var
      $this = $node,
      $tour,
      options = _.extend({
          caption:  $this.attr('data-guide-caption'),
          tour:     inOptions.tour || $this.attr('data-guide-tour')
        },
        _.parseOptions($this.attr('data-guide-options')),
        inOptions);

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

    fromReferenceNode: function($ref) {
      var
      $tour   = $ref.parents('[data-guide-tour]:first'),
      $target = $($ref.detach().attr('data-guide-spot')),
      options = _.parseOptions($ref.attr('data-guide-options'));

      this.fromNode($target, _.extend(options, {
        text: $ref.attr('data-guide-spot', null)[0].outerHTML,
        tour: $tour.attr('data-guide-tour')
      }));
    },

    show: function(inOptions, inCallback) {
      var options     = inOptions || {},
          that        = this,
          animeMs     = this.options.withAnimations ? this.options.animeDuration:0;

      if (this.isShown()) {
        return this;
      }
      else if (!this.tours.length) {
        throw 'guide.js: can not show with no tours defined!';
      }

      this.$.triggerHandler('showing');

      this.$container.addClass(KLASS_ENABLED);
      this.toggleOverlayMode();

      this.$el.appendTo(this.$container);
      this.$el.animate({ opacity: 'show' }, animeMs, function() {
        that.$.triggerHandler('show');

        if (!options.noAutorun) {
          that.runTour(options.tour || that.defaultTour());
        }

        if (inCallback && _.isFunction(inCallback)) {
          inCallback.apply(that, []);
        }
      });

      return this;
    },

    isShown: function() {
      return  this.$container.hasClass(KLASS_ENABLED) &&
              !this.$container.hasClass(KLASS_HIDING);
    },

    /**
     * Hide all guide.js spawned elements, turn off all extensions, and stop
     * the active tour, if any.
     *
     * @async
     */
    hide: function() {
      var that     = this,
          animeMs  = this.options.withAnimations ? this.options.animeDuration:0;

      if (!this.isShown()) {
        return this;
      }

      this.$container.addClass(KLASS_HIDING);

      that.$.triggerHandler('hiding');

      that.$el.animate({ opacity: 'hide' }, animeMs, function() {
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

      return this;
    },

    refresh: function() {
      _.invoke(this.extensions, 'refresh');

      if (this.tour) {
        this.tour.refresh();
      }

      if (this.isShown()) {
        this.toggleOverlayMode();
      }

      return this;
    },

    reset: function() {
      if (this.isShown()) {
        this.hide();
      }

      this.$.triggerHandler('reset.guide');
      this.options = _.clone(this.defaults);

      _.invoke(this.extensions, 'reset', true);
      _.invoke(this.tours,      'reset', true);

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
      var option = this.options.withOverlay;

      if (doToggle) {
        this.options.withOverlay = !this.options.withOverlay;
      }

      if (this.tour && this.tour.hasOption('withOverlay')) {
        option = this.tour.getOptions().withOverlay;
      }

      if (option) {
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

    /**
     * All nodes generated by guide.js or any of its extensions should mark
     * themselves with the CSS class returned by this method.
     *
     * @return {String}
     * The CSS class guide.js uses to flag its entities, see KLASS_ENTITY.
     */
    entityKlass: function() {
      return KLASS_ENTITY;
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

    log: function() {
      if (this.options.debug) {
        console.log.apply(console, arguments);
      }
    }

  }); // guide.prototype

  Guide = new Guide();
  Guide.VERSION = '1.2.7';

  // expose the instance to everybody
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Guide;
    }
    exports.guide = Guide;
  } else {
    root.guide = Guide;
  }
})(this, _, jQuery);

(function(_, $, guide) {
  'use strict';

  /**
   * @class Optionable
   * An interface for defining and updating options an object accepts.
   */
  var Optionable = {
    /**
     * The options the object accepts along with their default values.
     */
    defaults: {},

    /**
     * Assign option values to this object, overriding any existing values.
     *
     * If the object supports it, #refresh will be called to give a chance for
     * the object to reflect the new options.
     *
     * @fires refresh
     * @param {Object/String} options
     *  The set of options to override. If the parameter is a String, it will
     *  be parsed into an object using _#parseOptions if it's valid.
     */
    setOptions: function(options) {
      if (_.isString(options)) {
        options = _.parseOptions(options);
      }
      else if (!_.isObject(options)) {
        throw 'guide.js: bad options passed to #setOptions; expected an Object' +
              ' or a String, but got: ' + typeof(options);
      }

      this.options = _.extend(this.options || {}, options);

      if (this.refresh) {
        this.refresh();
      }

      if (this.$) {
        /**
         * @event refresh
         * Fired when an object's options are updated.
         *
         * **This event is triggered on the Optionable's #$ if set.**
         *
         * @param {jQuery.Event} event
         *  A default jQuery event.
         * @param {Object} options
         *  The the new set of options.
         * @param {Optionable} object
         *  The Optionable object that has been modified.
         */
        this.$.triggerHandler('refresh', [ this.options, this ]);
      }

      return this;
    },

    /**
     * Retrieve a mutable set of the current options of the object.
     */
    getOptions: function() {
      return _.extend({}, this.options);
    },

    /**
     * Check if an option is set, regardless of its value.
     */
    hasOption: function(key) {
      return _.dotGet(key, this.getOptions()) !== void 0;
    },

    /**
     * Check if an option is set and evaluates to true.
     */
    isOptionOn: function(key) {
      return !!_.dotGet(key, this.getOptions());
    },

    /**
     * Define a new option that the object will understand from now on.
     *
     * This is useful for extensions that enable new options to be assigned on
     * core guide.js entities.
     *
     * @param {String} key          The option key.
     * @param {Mixed} default_value The default, *and initial*, value to assign.
     */
    addOption: function(key, default_value) {
      this.defaults[key] = default_value;

      if (this.options) {
        if (void 0 === this.options[key]) {
          this.options[key] = default_value;
        }
      }
    }
  };

  // expose the Optionable interface for other components to re-use
  guide.Optionable = Optionable;

  // guide itself requires this functionality so we add it manually
  _.extend(guide, Optionable);
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var Extension = _.extend({}, guide.Optionable, {
    __initExtension: function() {
      if (!this.id) {
        throw 'guide.js: bad extension, missing #id';
      }

      // Make sure an `enabled` option always exists
      _.defaults(this.defaults, { enabled: true });

      this.options = _.extend({}, this.defaults, this.options);

      if (this.onGuideShow) {
        guide.$.on(this.nsEvent('hide'), _.bind(function() {
          if (this.isEnabled()) {
            this.onGuideShow();
            this._shouldHide = true;
          }
        }, this));
      }

      if (this.onGuideHide) {
        guide.$.on(this.nsEvent('hide'), _.bind(function() {
          if (this._shouldHide) {
            this.onGuideHide();
            this._shouldHide = false;
          }
        }, this));
      }

      if (this.onTourStart) {
        guide.$.on(this.nsEvent('start.tours'), _.bind(function(e, tour) {
          // this.refresh();

          if (this.isEnabled(tour)) {
            this.onTourStart(tour);
            tour.$.one('stop', _.bind(this.onTourStop, this, tour));
          }
        }, this));
      }
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

    /**
     * Whether the extension is available for use in the passed tour.
     *
     * If the tour does not explicitly specify an #enabled option for this extension,
     * the global guide options is then queried, and if not set there either,
     * the default value is used (which is `true`).
     */
    isEnabled: function(tour) {
      var tourExtOptions;

      if (tour) {
        tourExtOptions = tour.options[this.id] || {};

        if (_.isBoolean(tourExtOptions.enabled)) {
          return tourExtOptions.enabled;
        }
      }

      return !!this.getOptions().enabled;
    },

    /**
     * Handle the extension options, re-render nodes, or re-install event handlers.
     *
     * Behaviour of #refresh is heavily extension-specific and so no stock
     * implementation exists.
     *
     * This method is implicitly called in Guide#refresh and Optionable#setOptions.
     */
    refresh: function() {
    },

    /**
     * Restore all internal state/context of the extension to the point where
     * guide.js has not been used yet.
     *
     * The stock #reset behaviour merely resets the Extension's options to
     * their defaults.
     */
    reset: function() {
      this.options = _.clone(this.defaults);
    }
  });

  guide.Extension = Extension;
})(_, jQuery, window.guide);

(function(_, $, guide, undefined) {
  'use strict';

  var
  /**
   * @class Tour
   *
   * A guide.js tour is a collection of {@link Spot tour spots} which provides
   * an interface for navigating between the spots and focusing them.
   */
  Tour = function() {
    return this.constructor.apply(this, arguments);
  };

  _.extend(Tour.prototype, guide.Optionable, {
    defaults: {
      /**
       * @cfg {Boolean} [alwaysHighlight=true]
       * Highlight all spots while the tour is active, as opposed to highlighting
       * only the focused spot.
       */
      alwaysHighlight: true,

      /**
       * @cfg {Boolean} [isDefault=false]
       * guide.js will run the default tour if no tour is specified, and falls
       * back to a blank 'Default Tour' if no tour has #isDefault specified.
       */
      isDefault: false
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
        cursor: -1,

        active: false
      });

      // console.log('guide.js: tour defined: ', this.id);

      return this;
    },

    /**
     * Show the guide if it isn't shown yet, and start the tour by highlighting
     * the spots and focusing the current (if resuming) or the first one.
     *
     * @fires start_tours
     * @fires start
     */
    start: function(options) {
      var callback    = this.options.onStart,
          spotToFocus = this.current || this.spots[0];

      if (!guide.isShown()) {
        guide.runTour(this, options);

        return this;
      }

      _.invoke(this.spots, 'highlight');

      if ((options||{}.spot) !== undefined) {
        spotToFocus = this.getSpot(options.spot);
      }

      this.active = true;

      if (spotToFocus) {
        this.focus(spotToFocus);
      }

      /**
       * @event start_tours
       *
       * Fired when the tour has been started, ie: the spots have been highlighted
       * and one has been focused, if viable.
       *
       * **This event is triggered on `guide.$`, the guide event delegator.**
       *
       * @param {Tour} tour This tour.
       */
      guide.$.triggerHandler('start.tours', [ this ]);

      /**
       * @event start
       *
       * Same as Tour#start_tours but triggered on the tour's event delegator
       * instead: `tour.$`.
       */
      this.$.triggerHandler('start');

      if (callback && _.isFunction(callback)) {
        callback.apply(this, []);
      }

      return this;
    },

    /**
     * Stop the current tour by dehighlighting all its spots, and de-focusing
     * the current spot, if any.
     *
     * @fires stop_tours
     * @fires stop
     */
    stop: function() {
      var callback  = this.options.onStop;

      _.invoke(this.spots, 'dehighlight', { force: true });

      this.active = false;

      /**
       * @event stop_tours
       *
       * Fired when the tour has been stopped: the spots have been dehighlighted
       * and de-focused.
       *
       * **This event is triggered on `guide.$`, the guide event delegator.**
       *
       * @param {Tour} tour This tour.
       */
      guide.$.triggerHandler('stop.tours', [ this ]);

      /**
       * @event stop
       *
       * Same as Tour#stop_tours but triggered on the tour's event delegator
       * instead: `tour.$`.
       */
      this.$.triggerHandler('stop');

      if (callback && _.isFunction(callback)) {
        callback.apply(this, []);
      }

      return this;
    },

    /**
     * Reset the tour's internal state by de-focusing its current target, and
     * resetting the spot cursor so when #start is called again, the tour will
     * start from the first spot.
     */
    reset: function(full) {
      if (this.current) {
        this.current.defocus();
        this.current = null;

        // should we also de-highlight, as in #stop?
      }

      this.previous = null;
      this.cursor = -1;

      if (full) {
        guide.$.triggerHandler('reset.tours', [ this ]);

        _.each(this.spots, function(spot) {
          spot.remove();
        });

        this.spots = [];
        this.options = _.clone(this.defaults);
      }

      return this;
    },

    /**
     * Whether the user is currently taking this tour.
     */
    isActive: function() {
      return this.active;
    },

    /**
     * Restart the tour if it's active.
     */
    refresh: function() {
      if (this.isActive()) {
        this.stop().start();
      }

      return this;
    },

    /**
     * Define a new spot for the user to visit in this tour.
     *
     * @param {jQuery} $el The target element of the tour spot.
     * @param {Object} [inOptions={}] The options to pass to Spot#constructor.
     *
     * @fires add
     *
     * @return {Spot} The newly created tour spot.
     */
    addSpot: function($el, options) {
      var spot;

      if (_.isString($el)) {
        $el = $($el);
      }

      if (!($el instanceof jQuery)) {
        throw 'guide.js: bad Spot target, expected a jQuery object ' +
              'but got ' + typeof($el);
      }

      // has the spot been already defined? we can not handle duplicates
      if ($el.data('gjs-spot')) {
        throw 'guide.js: duplicate spot, see console for more information';
      }

      spot = new guide.Spot($el, this, this.spots.length, options);

      this.spots.push(spot);

      if (this.isActive()) {
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


      if (!this.isActive()) {
        return false;
      }

      guide.log('tour: focusing spot', index);

      if (!spot) {
        throw 'guide.js: bad spot @ ' + index + ' to focus';
      }
      else if (spot.isFocused()) {
        spot.refresh();

        return false;
      }

      // de-focus the last spot
      if (this.current) {
        this.current.defocus(spot);
        guide.$.triggerHandler('defocus', [ this.current, spot, this ]);
        this.$.triggerHandler('defocus', [ this.current, spot ]);
      }

      if (_.isFunction(spot.options.preFocus)) {
        spot.options.preFocus.apply(spot, []);
      }

      guide.$.triggerHandler('pre-focus', [ spot, this ]);
      this.$.triggerHandler('pre-focus', [ spot ]);

      // If the spot target isn't currently visible, we'll try to refresh
      // the selector in case the element has just been created, and if it still
      // isn't visible, we'll try finding any visible spot to focus instead.
      if (!spot.isVisible()) {
        if (!spot.__refreshTarget() || !spot.isVisible()) {
          guide.log('tour: spot#' + spot.index, 'isnt visible, looking for one that is');

          for (i = 0; i < this.spots.length; ++i) {
            spot = this.spots[i];

            if (spot.isVisible()) {
              guide.log('tour: \tfound one:', spot.index);
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
      }

      this.previous = this.current;
      this.current = spot;
      this.cursor  = spot.index;

      spot.focus(this.previous);

      /**
       * @event focus
       * Fired when a tour focuses a new spot.
       *
       * **This event is triggered on the guide event delegator, Guide#$.**
       *
       * @param {jQuery.Event} event
       *  A default jQuery event.
       * @param {Spot} previousSpot
       *  The spot that was previously focused, if any.
       */
      guide.$.triggerHandler('focus', [ spot, this ]);
      this.$.triggerHandler('focus', [ spot ]);

      console.log('guide.js: visiting tour spot #', spot.index);

      return true;
    },

    getSpot: function(index) {
      if (_.isNumber(index)) {
        return this.spots[index];
      }
      else if (!index /* undefined arg */) {
        return null;
      }
      else if (index instanceof guide.Spot) {
        // We need to do the lookup because it might be a spot in another tour.
        return _.find(this.spots || [], index);
      }

      return null;
    }
  });

  guide.Tour = Tour;

  // The default tour
  guide.tour = guide.defineTour('Default Tour');
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';
  var

  /**
   * @class Spot
   *
   * A tour spot represents an element in the DOM that will be visited in a
   * {@link Tour tour}.
   *
   * Spots contain text to be shown to the user to tell them about the element
   * they represent, and have a static position in the tour (their *index*.)
   */
  Spot = function() {
    return this.constructor.apply(this, arguments);
  },

  KLASS_TARGET  = 'gjs-spot',
  KLASS_FOCUSED = 'gjs-spot-focused';

  _.extend(Spot.prototype, guide.Optionable, {
    defaults: {

      /**
       * @cfg {Boolean} [withMarker=true]
       * Attach a Marker to this spot, if the Markers extension is enabled.
       */
      withMarker: true,

      /**
       * @cfg {Boolean} [highlight=true]
       * Highlight this spot while the tour is active by attaching an opaque
       * overlay on top of it using CSS.
       */
      highlight:  true,

      /**
       * @cfg {Boolean} [autoScroll=true]
       * Scroll the window to the position of the spot when it receives focus,
       * if it's not currently visible within the window's viewport.
       *
       * See jQuery#in_viewport for testing the element's visibility.
       */
      autoScroll: true,

      /**
       * @cfg {Boolean} [noPositioningFix=false]
       * Do not force 'relative' positioning on elements that are statically
       * positioned.
       */
      noPositioningFix: false
    },

    /**
     * Build a new Spot.
     *
     * @param {jQuery}  $el           Selector of the element to bind this spot to.
     * @param {Tour}    tour          The tour this spot belongs to.
     * @param {Number}  index         The position of the spot in the tour.
     * @param {Object}  [options={}]  The Spot options, see below.
     *
     * @param {String} options.text
     *  A text message to show when the spot is focused.
     *
     * @param {String} [options.caption=""]
     *  A heading or title to use for this spot.
     *
     * @param {Function} [options.onFocus=null]
     *  A callback to be called when the spot is focused, which will receive
     *  the previously focused spot as the first argument, if any.
     *
     * @param {Function} [options.onDefocus=null]
     *  A callback to be called when the spot is no longer focused.
     *
     *  The callback receives the spot that will be focused right after this one
     *  as the second argument.
     */
    constructor: function($el, tour, index, options) {
      options = options || {};

      if (!$el) {
        throw 'guide.js: expected `$el` to be specified for a new Spot, got none';
      }
      if (!tour) {
        throw 'guide.js: expected `tour` to be specified for a new Spot, got none';
      }

      _.extend(this, {
        $: $(this),

        /**
         * @property {jQuery} $el
         * The target element that is represented by this spot.
         */
        $el:      $el,

        /**
         * @property {Tour} tour
         * The tour this spot belongs to.
         */
        tour:     tour,

        /**
         * @property {Number} index
         * The position of the spot in the tour.
         */
        index:    _.isNumber(index) ? index : -1,

        text:     options.text,
        caption:  options.caption,

        /**
         * @property {jQuery} [$scrollAnchor=$el]
         * The element that will be used as an indicator of the spot's position
         * when scrolling the element into view, if #autoScroll is enabled.
         *
         * This could be modified by extensions.
         */
        $scrollAnchor: $el,

        options: _.extend({}, this.defaults, options)
      });

      $el
        .addClass(guide.entityKlass())
        .data('gjs-spot', this);

      return this;
    },

    /**
     * Whether the spot is the current one being visited by the user.
     */
    isFocused: function() {
      return this.$el.hasClass(KLASS_FOCUSED);
    },

    isCurrent: function() {
      return this.tour.current === this;
    },

    getText: function() {
      return this.text;
    },

    hasText: function() {
      return !!((this.getText()||'').length);
    },

    getCaption: function() {
      return this.caption;
    },

    hasCaption: function() {
      return !!(this.getCaption()||'').length;
    },

    hasContent: function() {
      return this.hasText() || this.hasCaption();
    },

    /**
     * Check if the spot target is currently reachable in the DOM.
     */
    isAvailable: function() {
      return !!(this.$el.length);
    },

    isAttached: function() {
      return this.isAvailable() && this.$el.parent().length > 0;
    },

    /**
     * Check if the spot target is currently available *and* visible in the DOM.
     */
    isVisible: function() {
      return this.isAttached() && this.$el.is(':visible');
    },

    /**
     * Highlight the spot's #$el by applying a CSS class.
     *
     * The spot will be highlighted if all of the following conditions are met:
     *
     * 1. The Spot#highlight option is enabled, and if it is, then Tour#alwaysHighlight
     *    or Spot#isCurrent must be on to proceed.
     * 2. The target #$el is valid and is visible, see #isVisible, otherwise the selector
     *    is refreshed in hopes of the target becoming available now
     */
    highlight: function() {
      var
      klasses = [ KLASS_TARGET ],
      positionQuery;

      // If the target isn't valid (ie, hasnt been in the DOM), try refreshing
      // the selector to see if it's now available, otherwise we can't highlight.
      if (!this.isAvailable()) {
        this.__refreshTarget();
      }

      // Still not visible? Abort highlighting
      if (!this.isVisible() || !this.options.highlight) {
        return false;
      }

      if (!this.tour.getOptions().alwaysHighlight && !this.isCurrent()) {
        return false;
      }

      // Apply the positioning fix if the target is statically positioned;
      // to be able to properly highlight the target, it must be positioned
      // as one of 'relative', 'absolute', or 'fixed' so that we can apply
      // the necessary CSS style.
      if (!this.options.noPositioningFix &&
          !this.tour.hasOption('spots.noPositioningFix') &&
          !guide.hasOption('spots.noPositioningFix')) {

        positionQuery = this.$el.css('position');

        if (!_.contains([ 'fixed', 'absolute', 'relative' ], positionQuery)) {
          klasses.push('gjs-positioning-fix');
        }
      }

      this.$el.addClass(klasses.join(' '));

      return true;
    },

    /**
     * Remove the CSS highlight classes on the spot's #$el.
     *
     * If the Tour#alwaysHighlight option is enabled, this is a no-op.
     *
     * @param {Object} [options={}]
     * @param {Boolean} [options.force=false]
     *  Dehighlight regardless of any options that might otherwise be respected.
     */
    dehighlight: function(options) {
      if ((options||{}).force ||
          !this.tour.getOptions().alwaysHighlight) {

        this.$el.removeClass([
          KLASS_TARGET,
          'gjs-positioning-fix'
        ].join(' '));

        return true;
      }

      return false;
    },

    /**
     * Apply a CSS class to indicate that the spot is focused, and scroll it
     * into view if #autoScroll is enabled. The spot will also be implicitly
     * {@link #highlight highlighted}.
     *
     * @fires focus_gjs
     */
    focus: function(prev_spot) {
      var that      = this,
          callback  = this.options.onFocus,
          $scroller = this.$scrollAnchor;

      this.highlight();

      this
        .$el
          .addClass(KLASS_FOCUSED)
          /**
           * @event focus_gjs
           * Fired when a tour focuses a new spot.
           *
           * **This event is triggered on the Spot's #$el.**
           *
           * @param {jQuery.Event} event
           *  A default jQuery event.
           * @param {Spot} previousSpot
           *  The spot that was previously focused, if any.
           */
          .triggerHandler('focus.gjs', prev_spot);

      this.$.triggerHandler('focus');

      if (callback && _.isFunction(callback)) {
        callback.apply(this, arguments);
      }

      _.defer(function() {
        if (that.options.autoScroll && $scroller.length && !$scroller.is(':in_viewport')) {
          $('html,body').animate({
            scrollTop: $scroller.offset().top * 0.9
          }, 250);
        }
      });

      return this;
    },

    /**
     *
     */
    defocus: function(next_spot) {
      var callback = this.options.onDefocus;

      this.dehighlight();

      this.$el
        .removeClass(KLASS_FOCUSED)
        .triggerHandler('defocus.gjs', next_spot);

      if (callback && _.isFunction(callback)) {
        callback.apply(this, arguments);
      }

      this.$.triggerHandler('defocus');

      return this;
    },

    remove: function() {
      this.$.triggerHandler('remove');
      guide.$.triggerHandler('remove.spots', [ this ]);

      this.$el
        .removeData('gjs-spot')
        .removeClass([
          'no-highlight',
          KLASS_TARGET,
          KLASS_FOCUSED
        ].join(' '));
    },

    refresh: function() {
      if (!this.isVisible()) {
        this.__refreshTarget();
      }

      if (this.isFocused()) {
        return this.defocus().focus();
      }

      this.dehighlight();
      this.highlight();

      return this;
    },

    /**
     * @private
     */
    __refreshTarget: function() {
      this.$el = $(this.$el.selector);

      if (!this.$scrollAnchor ||
        // Could be set by an extension, like Markers, to something other than
        // the target $el, don't override it.
        !this.$scrollAnchor.length) {
        this.$scrollAnchor = this.$el;
      }

      return this.isAvailable();
    },

    setScrollAnchor: function($el) {
      this.$scrollAnchor = $el;
    },

    toString: function() {
      return this.tour.id + '#' + this.index;
    },

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
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,
      inMarkers:  false,
      inTutor:    false,
      withTourSelector: true
    },

    id: 'controls',

    constructor: function() {
      this.$container = guide.$el;
      this.guide = guide;
      this.tour = null;

      // this.refresh();

      guide.$
        .on('dismiss',  _.bind(this.remove, this))
        .on('focus',    _.bind(this.refreshControls, this));

      this.$el = $(JST_CONTROLS({}));
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

    onTourStop: function() {
      this.tour = null;
      this.hide();
    },

    show: function() {
      this.$el.appendTo(this.$container);
      this.refreshControls();
    },

    hide: function() {
      this.$el.detach();
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
      if (!marker.$el) {
        return this.hide();
      }

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
      tour        = guide.tour,
      extTutor    = guide.getExtension('tutor'),
      extMarkers  = guide.getExtension('markers'),
      options     = this.getOptions();

      // this.remove();

      if (extMarkers && extMarkers.isEnabled(tour) && options.inMarkers) {
        this.markerMode(extMarkers);
      }
      else if (extTutor && extTutor.isEnabled(tour) && options.inTutor) {
        this.tutorMode(extTutor);
      }
      else {
        this.classicMode();
      }

      this.show();
    },

    classicMode: function() {
      var extTutor    = guide.getExtension('tutor'),
          extMarkers  = guide.getExtension('markers');

      this.$container = guide.$el;

      if (extTutor) {
        extTutor.$el
          .addClass('without-controls')
          .removeClass('with-controls');
      }

      if (extMarkers) {
        guide.$
          .off(this.nsEvent('marking.gjs_markers'))
          .off(this.nsEvent('unmarking.gjs_markers'));
      }
    },

    markerMode: function(/*ext*/) {
      var that = this,
          marker;

      this.$container = $();

      guide.$
        .on(this.nsEvent('marking.gjs_markers'), function(e, marker) {
          that.attachToMarker(marker);
        })
        .on(this.nsEvent('unmarking.gjs_markers'), function(e, marker) {
          that.detachFromMarker(marker);
        });

      // if we're embedding into markers and a spot is currently marked,
      // attach ourselves to the marker
      if (guide.tour && guide.tour.current && guide.tour.current.marker) {
        marker = guide.tour.current.marker;

        _.defer(_.bind(this.attachToMarker, this, marker));
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


    refreshControls: function() {
      var tour = guide.tour;

      this.$bwd.prop('disabled',    !tour.hasPrev());
      this.$fwd.prop('disabled',    !tour.hasNext());
      this.$first.prop('disabled',  !tour.hasPrev());
      this.$last.prop('disabled',   !tour.hasNext());
      // this.$hide.toggle(            !tour.hasNext());
      this.$hide.show();

      if (this.getOptions().withTourSelector) {
        this.$tour_selector
          .html(JST_TOUR_LIST({ tours: guide.tours }))
          .toggle(guide.tours.length > 1)
          .find('[value="' + tour.id + '"]').prop('selected', true);
      }
      else {
        this.$tour_selector.hide();
      }
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
      guide.Tour.prototype.getMarkers = function() {
        return _.pluck(_.filter(this.spots, function(spot) {
            return !!spot.marker;
          }), 'marker');
      };

      // We must manually assign the options to the default tour as it has
      // already been created.
      if (guide.tour) {
        guide.tour.addOption('alwaysMark', true);
      }

      guide.$.on('add', _.bind(this.addMarker, this));

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

      marker = new Marker(spot, attributes || {});

      if (marker.canShow()) {
        marker.show();
      }

      return marker;
    },

    refresh: function() {
      if (!guide.isShown()) {
        return;
      }

      this.onGuideHide();

      if (!this.isEnabled()) {
        return;
      }

      this.onGuideShow();

      if (guide.tour) {
        this.onTourStop(guide.tour);
        this.onTourStart(guide.tour);
      }
    },

    /**
     * Install the window resize handler and launch markers for the current tour.
     *
     * @see #onTourStart
     * @see #repositionMarkers
     */
    onGuideShow: function() {
      $(document.body).on(this.nsEvent('click'), '.gjs-marker', function(e) {
        var marker = $(this).data('gjs-marker');

        if (marker) {
          marker.spot.tour.focus(marker.spot);

          return $.consume(e);
        }

        return true;
      });

      // Install a resize handler to reposition overlay placed markers
      $(window).on(this.nsEvent('resize'),
        _.throttle(
          _.bind(this.repositionMarkers, this),
          this.options.refreshFrequency));
    },

    onGuideHide: function() {
      $(window).off(this.nsEvent('resize'));
      $(document.body).off(this.nsEvent('click'));
    },

    onTourStart: function(tour) {
      // Show all markers for this tour if the option is enabled
      if (tour.options.alwaysMark) {
        _.invoke(tour.getMarkers(), 'show');
      }

      // listen to its option changes
      // tour.$.on(this.nsEvent('refresh'), _.bind(this.refresh, this));
    },

    onTourStop: function(tour) {
      // tour.$.off(this.nsEvent('refresh'));

      _.invoke(tour.getMarkers(), 'hide');
    },

    repositionMarkers: function() {
      var tour = guide.tour;

      if (!tour) {
        return true;
      }

      console.log('[markers] repositioning markers for tour ', tour.id);

      _.invoke(_.filter(tour.getMarkers(), function(marker) {
        return marker.placement === PMT_OVERLAY;
      }), 'snapToSpot');

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
      width:      'auto',

      smart: true,

      noClone: true,

      margin: 15
    },

    constructor: function(spot, attributes) {
      _.extend(this, attributes);

      this.spot   = spot;
      spot.marker = this;

      // Parse the marker options
      this.options = _.extend(
        {},
        // lowest priority: our defaults
        this.defaults,

        (attributes || {}).options,
        // then, guide's global marker options,
        guide.getOptions().marker,
        // then, the spot's tour options,
        spot.tour.getOptions().marker,
        // and highest priority: the spot's options
        spot.getOptions().marker);

      this.spot.$
        .on('focus', _.bind(this.highlight, this))
        .on('defocus', _.bind(this.dehighlight, this))
        .on('remove', _.bind(this.remove, this));

      this.build();

      return this;
    },

    /**
     * Build the marker element and prepare it for attachment.
     *
     * @return {Guide.Marker} this
     */
    build: function() {
      var
      $el,
      template,
      spot      = this.spot;

      // Shouldn't build a marker for a spot target that's not (yet) visible.
      if (!spot.isVisible()) {
        return false;
      }
      // Already built? no-op at the moment, we don't support re-building
      else if (this.$el) {
        return false;
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
        .data('gjs-marker', this);

      // In Sibling placement mode, we need to construct a container element
      // that will be the parent of the spot target and the marker element.
      if (this.placement === PMT_SIBLING) {
        this.wrap();

        // We'll need the left and right margins for proper positioning.
        //
        // See #negateMargins for more info.
        this.rightMargin = parseInt($el.css('margin-right'), 10);
        this.leftMargin  = parseInt($el.css('margin-left'), 10);
      }

      return true;
    },

    show: function() {
      if (!this.$el && !this.build()) {
        return false;
      }

      // Mark the spot as being highlighted by a marker
      this.spot.$el.addClass(this.spot_klasses);

      this.attach();
      this.place();
    },

    hide: function() {
      var $el = this.$el;

      this.spot.$el.removeClass(this.spot_klasses);

      if ($el) {
        $el.detach();
      }
    },

    remove: function() {
      this.hide();
      this.unwrap();

      if (this.$el) {
        this.$el.remove();
        this.$el = null;
      }
    },

    highlight: function() {
      if (!this.$el && !this.build()) {
        return false;
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

      guide.log('marker highlighted for spot', this.spot.toString());

      guide.$.triggerHandler('marked.gjs_markers', [ this ]);
    },

    dehighlight: function() {
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

      if (!this.spot.tour.options.alwaysMark) {
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

      if (!spot.tour.isActive()) {
        return false;
      }

      if (!spot.tour.options.alwaysMark && !spot.isFocused()) {
        return false;
      }

      if (!spot.isVisible()) {
        return false;
      }

      return true;
    },

    fitsIn: function(p) {
      var mo = this.spot.$el.offset(),
          sw = this.spot.$el.outerWidth(),
          mw = this.$el.outerWidth(),
          mh = this.$el.outerHeight(),
          vw = $(window).width() - 20;

      if ( _.contains([ POS_TL, POS_L, POS_BL ], p) ) {
        if (mo.left - mw < 0) {
          return 1;
        }
      }

      if ( _.contains([ POS_TR, POS_R, POS_BR ], p) ) {
        if (mo.left + sw + mw > vw) {
          return 2;
        }
      }

      if ( _.contains([ POS_TL, POS_T, POS_TR ], p) ) {
        if (mo.top - mh < 0) {
          return 3;
        }
      }

      return 0;
    },

    beSmart: function() {
      var //s,
          p = -1,
          np;

      if ((np = this.fitsIn(this.position)) !== 0) {
        if (np === 1) {
          p = POS_L;
        }
        else if (np === 2) {
          p = POS_L;
        }
        else if (np === 3) {
          p = POS_B;
        }
      }

      // if (p > -1) {
      //   p = np+1;
      //   s = this.positionToString(p);
      //   console.log('marker: position ', this.position, ' doesnt fit, trying: ', s);
      //   console.log('query: ', mo.top, mo.left, mw,mh, vw, vh);

      //   this.$el
      //     .removeClass(this.positionToString(this.position))
      //     .addClass(s);

      //   this.spot.$el
      //     .removeClass('gjs-spot-' + this.positionToString(this.position))
      //     .addClass('gjs-spot-' + s);

      //   this.position = p;
      //   this.place(true);
      // }
    },

    place: function(/*dontBeSmart*/) {
      var $spot = this.spot.$el,
          $marker = this.$el;

      this.query = {
        w: $marker.outerWidth(),
        h: $marker.outerHeight(),

        o:  $spot.offset(),
        sw: $spot.outerWidth(),
        sh: $spot.outerHeight(),

        vw: $(window).width()   - 20,
        vh: $(window).height()  - 20
      };

      switch(this.placement) {
        case PMT_INLINE:
          this.hvCenter();
        break;
        case PMT_SIBLING:
          if (!this.$container.is(':visible')) {
            this.wrap();
          }

          this.negateMargins($marker,
                        $spot,
                        this.position,
                        this.leftMargin,
                        this.rightMargin,
                        15);

          this.hvCenter();
        break;
        case PMT_OVERLAY:
          this.snapToSpot();
        break;
      }

      // if (this.options.smart && !dontBeSmart) {
        // this.beSmart();
      // }
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
            'append' :
            'prepend';

          this.$container[method](this.$el);
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
    hvCenter: function() {
      var dir, center,
          $marker = this.$el,
          margin  = 0,
          query   = this.query;

      switch(this.position) {
        case POS_T:
        case POS_B:
          dir = 'left';
          center = ($marker.outerWidth() / 2);
          margin = -1 * center;

          if (query.o.left < center) {
            margin = -1 * (center - query.o.left) / 2;
          }
          else if (query.o.left + query.w > query.vw) {
            margin = -1 * (query.o.left + query.w - query.vw);
          }

        break;

        case POS_R:
        case POS_L:
          dir = 'top';
          center = ($marker.outerHeight() / 2);
          margin = -1 * center;
        break;
      }

      $marker.css('margin-' + dir, margin);
    },

    negateMargins: function() {
      // we must account for the spot node's margin-[right,left] values;
      // ie, in any of the right positions, if the spot has any margin-right
      // we must deduct enough of it to place the marker next to it, we do so
      // by applying negative margin-left by the computed amount
      //
      // same applies to left positions but in the opposite direction (margin-left)
      var
      // The direction of the negation; left or right
      dir,

      // The margin value of the anchor node (ie, margin-left, or margin-right)
      anchorMargin,

      // Number of pixels to negate the margin by
      delta = 0,

      // Our marker element whose margin property will be negated
      $marker = this.$el,

      // The spot's element whose margin value will be taken into account
      $anchor = this.spot.$el;

      switch(this.position) {
        // Right row
        case POS_TR:
        case POS_R:
        case POS_BR:
          anchorMargin = parseInt($anchor.css('margin-right'), 10);

          if (anchorMargin > 0) {
            // offset is the spot margin without the marker margin
            delta = -1 * anchorMargin + this.leftMargin;
            dir = 'left';
          }
        break;

        // Left row
        case POS_TL:
        case POS_L:
        case POS_BL:
          anchorMargin = parseInt($anchor.css('margin-left'), 10);

          if (anchorMargin > 0) {
            // offset is spot margin without marker margin (arrow dimension)
            delta = -1 * (anchorMargin - this.rightMargin);
            dir = 'right';
          }
        break;
      }

      if (delta !== 0) {
        $marker.css('margin-' + dir, delta);
      }

      return delta;
    },

    /**
     * Position the marker by means of #offset by querying the spot element's
     * offset and applying a correction to the top/left coords based on the
     * position of the marker, its dimensions, and the target's dimensions.
     */
    snapToSpot: function() {
      var markerWidth, markerHeight,
      offset        = this.spot.$el.offset(),
      anchorWidth   = this.spot.$el.outerWidth(),
      anchorHeight  = this.spot.$el.outerHeight(),
      margin        = this.options.margin;

      // We must explicitly reset the marker element's offset before querying
      // its dimensions.
      this.$el.offset({
        top: 0,
        left: 0
      });
      markerWidth   = this.$el.outerWidth();
      markerHeight  = this.$el.outerHeight();

      switch(this.position) {
        case POS_TL:
          offset.top  -= markerHeight + margin;
        break;
        case POS_T:
          offset.top  -= markerHeight + margin;
          offset.left += anchorWidth / 2 - markerWidth / 2;
        break;
        case POS_TR:
          offset.top  -= markerHeight + margin;
          offset.left += anchorWidth - markerWidth;
        break;
        case POS_R:
          offset.top  += anchorHeight / 2 - (markerHeight/2);
          offset.left += anchorWidth + margin;
        break;
        case POS_BR:
          offset.top  += anchorHeight + margin;
          offset.left += anchorWidth - markerWidth;
        break;
        case POS_B:
          offset.top  += anchorHeight + margin;
          offset.left += anchorWidth / 2 - markerWidth / 2;
        break;
        case POS_BL:
          offset.top  += anchorHeight + margin;
        break;
        case POS_L:
          offset.top  += (anchorHeight / 2) - (markerHeight/2);
          offset.left -= markerWidth + margin;
        break;
      }

      this.$el.offset(offset);
    },

    /**
     * Wrap the marker's element and its spot's element in a container
     * so they can be siblings.
     *
     * While there's high portion of hackery involved here, it is only so in
     * order to be as transparent as possible, and not to break the page's
     * layout.
     */
    wrap: function() {
      var $spot = this.spot.$el;

      if (this.$container) {
        this.unwrap();
      }

      // Build the container:
      this.$container =
        $(this.options.noClone ?
            '<div />' :
            // Instead of building a plain `<div/>`, we'll try to replicate the
            // target element, so we won't break any CSS/JS that uses the tag as
            // an identifier, we'll do that by cloning the tag and stripping
            // some properties from it.
            $spot[0].outerHTML.replace(/(<\/?)\w+\s/, '$1div ')
        )
        // Empty it, we only need the tag and its structure
        .html('')
        .attr({
          'id': null,

          // Remove any gjs- related classes from the container
          'class': this.options.noClone ?
                   '' :
                   $spot[0].className.replace(/(gjs(\-?\w+)+)/g, '').trim()
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
        .data('gjs-container', true)

        // Position the container right where the target is, and
        // move the target and the marker inside of it.
        .insertBefore($spot)
        .append($spot);

      guide.log('wrapped');
    },

    /**
     * Undo what #wrap did by detaching our element, restoring the spot element
     * back to its original position, and removing the container.
     */
    unwrap: function() {
      if (this.$container) {
        guide.log('unwrapping');
        this.$el.detach();

        if (this.spot.$el.parent().is(this.$container)) {
          this.$container.replaceWith(this.spot.$el);
        }

        this.$container.remove();
        this.$container = null;
      }
    },

    isWrapped: function() {
      return !!this.$container;
    },

    positionToString: function(p) {
      var s;

      switch(p) {
        case POS_TL:  s = 'topleft'     ; break;
        case POS_T:   s = 'top'         ; break;
        case POS_TR:  s = 'topright'    ; break;
        case POS_R:   s = 'right'       ; break;
        case POS_BR:  s = 'bottomright' ; break;
        case POS_B:   s = 'bottom'      ; break;
        case POS_BL:  s = 'bottomleft'  ; break;
        case POS_L:   s = 'left'        ; break;
      }

      return s;
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
      enabled: true,

      /**
       * @cfg {Boolean} [resetOnStart=true]
       * Reset the current tour when the toggler is used to launch guide.js.
       */
      resetOnStart: true
    },

    id: 'toggler',

    constructor: function() {
      this.options = _.defaults({}, this.defaults);

      this.$container = guide.$container;

      this.$el = $(JST({}));
      this.$el.addClass(guide.entityKlass());
      this.$indicator = this.$el.find('button');

      this.$el.on('click', '.show', _.bind(this.launchTour, this));
      this.$el.on('click', '.hide', _.bind(guide.hide, guide));

      guide.$
      .on(this.nsEvent('showing'), _.bind(this.collapse, this))
      .on(this.nsEvent('hiding'), _.bind(this.expand, this))
      .on(this.nsEvent('dismiss'), _.bind(this.remove, this));

      this.show().expand();

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
    },

    launchTour: function() {
      if (this.options.resetOnStart) {
        guide.tour.reset();
      }

      guide.show();
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
    '<div id="gjs_tutor">',
    '<div class="tutor-navigation">',
      '<button class="bwd"></button>',
      '<span></span>',
      '<button class="fwd"></button>',
    '</div>',
    '<div class="tutor-content"></div>',
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
        'class': guide.entityKlass()
      });

      _.extend(this, {
        $content: this.$el.find('> .tutor-content'),
        $nav: this.$el.find('> .tutor-navigation'),
        // $close_btn: this.$el.find('#gjs_close_tutor'),
        $bwd: this.$el.find('.bwd'),
        $fwd: this.$el.find('.fwd')
      });

      guide.$.on('dismiss', _.bind(this.remove, this));

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

    refresh: function() {
      var tour = guide.tour,
          options = this.getOptions();

      this.$el.toggleClass('spanner', options.spanner);

      if (tour && tour.isActive() && tour.current) {
        this.focus(null, tour.current);
      }
    },

    onTourStart: function(tour) {
      this.refresh();

      tour.$.on(this.nsEvent('focus'), _.bind(this.focus, this));

      this.$nav
        .on('click','.bwd', _.bind(tour.prev, tour))
        .on('click','.fwd', _.bind(tour.next, tour));

      this.show();
    },

    onTourStop: function(tour) {
      this.hide();

      this.$nav.off('click');
      tour.$.off(this.nsEvent('focus'));
    },

    focus: function(e, spot) {
      var tour = spot.tour,
          left = tour.previous && tour.previous.index > tour.cursor,
          anim_dur = 'fast', // animation duration
          anim_offset = '50px',
          $number;

      if (spot === this.spot) {
        return;
      }

      if (!spot) {
        throw 'guide.js: no spot?';
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