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
   * @return {Boolean} false
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

  /**
   * @class jQuery.Event
   *
   * See [the official jQuery Event documentation][1] for more info.
   *
   * [1]: http://api.jquery.com/category/events/event-object/
   */
})($);

/**
 * @class lodash
 *
 * guide.js lodash extensions
 */
(function(_, undefined) {
  'use strict';

  (function() {
    var EXTENSIONS = [ 'dotAssign', 'parseOptions' ],
        ext,
        ext_iter;

    // Break if there's a conflicting implementation
    for (ext_iter = 0; ext_iter < EXTENSIONS.length; ++ext_iter) {
      ext = EXTENSIONS[ext_iter];

      if (undefined !== _[ext]) {
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

      if (undefined === o) {
        return undefined;
      }
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
   * @mixins Guide.Optionable
   * @singleton
   *
   * The primary interface for creating and managing guide.js tours.
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
       * Attach a darkening CSS overlay to the document while touring.
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

      RTL: false,

      debug: false
    },

    constructor: function() {
      _.extend(this, {
        $container: $('body'),
        $el:        $('<div id="gjs" />'),
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
        tour: null,

        platforms: []
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
      return _.filter(this.tours, function(tour) {
        return tour.spots.length > 0 && tour.isOn('available');
      });
    },

    /**
     * Find the default tour which might be explicitly set by the user, otherwise
     * the first one that contains any spots.
     *
     * See Tour#isDefault for more information.
     */
    defaultTour: function() {
      var tour;

      tour =_.find(this.tours, function(tour) {
        return tour.isOn('available') && tour.isOn('isDefault');
      });

      if (tour) {
        return tour;
      }

      tour =_.find(this.tours, function(tour) {
        return tour.isOn('available') && tour.spots.length > 0;
      });

      if (tour) {
        return tour;
      }

      return this.tour || _.find(this.tours, function(tour) {
        return tour.isOn('available');
      });
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
      else if (!tour.isOn('available')) {
        console.log('guide.js: tour', tour.id, 'is not available.');
        return false;
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
      caption = $ref.attr('data-guide-caption'),
      options = _.parseOptions($ref.attr('data-guide-options'));

      if (caption) {
        _.extend(options, {
          caption: caption
        });
      }

      this.fromNode($target, _.extend(options, {
        text: $ref.attr('data-guide-spot', null)[0].outerHTML,
        tour: $tour.attr('data-guide-tour')
      }));
    },

    show: function(inOptions, inCallback) {
      var options     = inOptions || {},
          that        = this,
          animeMs     = this.isOn('withAnimations') ? this.getOption('animeDuration') : 0;

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
          animeMs  = this.isOn('withAnimations') ?
            this.getOption('animeDuration') :
            0;

      if (!this.isShown()) {
        return this;
      }

      this.$container.addClass(KLASS_HIDING);
      that.$.triggerHandler('hiding');

      that.$el.animate({ opacity: 'hide' }, animeMs, function() {
        if (that.tour) {
          that.tour.stop();
          that.tour = null;
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
      if (this.tour) {
        this.tour.refresh();
      }

      if (this.isShown()) {
        this.toggleOverlayMode();
      }

      return this;
    },

    reset: function() {
      if (this.tour) {
        this.tour.stop();
        this.tour = null;
      }

      if (this.isShown()) {
        this.hide();
      }

      this.$.triggerHandler('reset');

      _.invoke(this.extensions, 'reset', true);
      _.invoke(this.tours,      'reset', true);

      this.options = {};
      this.setOptions(this.defaults);

      this.tours  = [];
      this.tour   = this.defineTour('Default Tour');
    },

    /**
     * Attaches a darkening overlay to the window as per the withOverlay option.
     *
     * @param {Boolean} [doToggle=false]
     * Toggle the value of Guide#withOverlay.
     *
     * **Note**:
     *
     * We need to track two states: 'with-overlay' and 'without-overlay'
     * because in overlayed mode, the foreground of highlighted elements needs
     * a higher level of contrast than in non-overlayed mode (they're lighter),
     * thus the CSS is able to do the following:
     *
     *     .gjs-with-overlay #my_element { color: white }
     *     .gjs-without-overlay #my_element { color: black }
     *
     */
    toggleOverlayMode: function(doToggle) {
      var option = this.isOn('withOverlay');

      if (doToggle) {
        this.setOption('withOverlay', !this.isOn('withOverlay'));
      }

      if (this.tour && this.tour.hasOption('withOverlay')) {
        option = this.tour.getOption('withOverlay');
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
      if (this.isOn('debug')) {
        console.log.apply(console, arguments);
      }
    }

  }); // guide.prototype

  Guide = new Guide();
  Guide.VERSION = '1.5.2';

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
   * @class Guide.Optionable
   * An interface for defining and updating options an object accepts.
   *
   * @alternateClassName Optionable
   */
  var
  Guide = guide,
  Optionable = {

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
     * The set of options to override. If the parameter is a String, it will
     * be parsed into an object using _#parseOptions if it's valid.
     */
    setOptions: function(options, platform, silent) {
      var _platform;

      if (_.isString(options)) {
        options = _.parseOptions(options);
      }
      else if (!_.isObject(options)) {
        throw 'guide.js: bad options passed to #setOptions; expected an Object' +
              ' or a String, but got: ' + typeof(options);
      }

      if (!this.options) {
        this.options = {};
      }

      if (options.overrides) {
        for (_platform in options.overrides) {
          this.setOptions(options.overrides[_platform], _platform, true);
        }

        delete options.overrides;
      }

      _platform = platform || 'default';
      this.options[_platform] = _.extend(this.options[_platform] || {}, options);

      if (!silent && this.refresh) {
        this.refresh();
      }

      if (!silent && this.$) {
        /**
         * @event refresh
         * Fired when an object's options are updated.
         *
         * **This event is triggered on the Optionable's #$ if set.**
         *
         * @param {jQuery.Event} event
         * A default jQuery event.
         * @param {Object} options
         * The the new set of options.
         * @param {Optionable} object
         * The Optionable object that has been modified.
         */
        this.$.triggerHandler('refresh', [ this ]);
      }

      return this;
    },

    setOption: function(key, value, platform, silent) {
      var option = {};
      option[key] = value;

      return this.setOptions(option, platform, silent);
    },

    /**
     * Retrieve a mutable set of the current options of the object.
     */
    getOptions: function(scope, source) {
      var set,
          platform = Guide.platform;

      source = source || this.options;

      set = _.extend({}, source['default'], source[platform]);

      if (set.overrides) {
        _.extend(set, set.overrides[platform]);
        delete set.overrides;
      }

      if (scope) {
        return this.getOption(scope, set);
      }

      return set;
    },

    getOption: function(key, set) {
      return _.dotGet(key, set || this.getOptions());
    },

    /**
     * Check if an option is set, regardless of its value.
     */
    hasOption: function(key, set) {
      return this.getOption(key, set) !== void 0;
    },

    /**
     * Check if an option is set and evaluates to true.
     */
    isOptionOn: function(key, set) {
      var option = this.getOption(key, set);
      return _.isBoolean(option) && option;
    },

    isOn: function() {
      return this.isOptionOn.apply(this, arguments);
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
        this.setOption(key, default_value);
      }
    }
  };

  // expose the Optionable interface for other components to re-use
  guide.Optionable = Optionable;

  // guide itself requires this functionality so we add it manually
  _.extend(guide, _.omit(Optionable, 'defaults'));
  guide.setOptions(guide.defaults);
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  /**
   * @class Guide.Extension
   * @mixins Guide.Optionable
   * @inheritable
   * @abstract
   *
   * An interface, and some helpers, for extensions to mount inside guide.js.
   *
   * @alternateClassName Extension
   */
  var
  Guide = guide,
  Extension = _.extend({}, guide.Optionable, {
    __initExtension: function() {
      if (!this.id) {
        throw 'guide.js: bad extension, missing #id';
      }

      // Make sure an `enabled` option always exists
      this.defaults = _.defaults(this.defaults || {}, { enabled: true });

      // An event delegator.
      this.$ = $(this);

      this.options = {};
      this.setOptions(_.extend({}, this.defaults));

      // Uninstall extension on Guide.js dismissal
      guide.$.on(this.nsEvent('dismiss'), _.bind(this.remove, this));

      // Refresh it on option updates
      guide.$.on(this.nsEvent('refresh'), _.bind(this.refresh, this));

      // If implemented, hook into Guide#show and Guide#hide:
      //
      // The handlers will be invoked only if the extension is enabled.
      if (this.onGuideShow) {
        guide.$.on(this.nsEvent('show'), _.bind(function() {
          if (this.isEnabled()) {
            this.onGuideShow();

            // Bind the clean-up handler to the guide hide event, if implemented:
            if (this.onGuideHide) {
              guide.$.one(this.nsEvent('hide'), _.bind(this.onGuideHide, this));
            }
          }
        }, this));
      }

      // If implemented, hook into Tour#start and Tour#stop:
      //
      // The handlers will be invoked only if the extension has not been explicitly
      // disabled for the active tour. This saves the extension from doing the
      // needed tests in the handlers.
      if (this.onTourStart) {
        guide.$.on(this.nsEvent('start.tours'), _.bind(function(e, tour) {
          if (this.isEnabled(tour)) {
            this.onTourStart(tour);

            // Bind the clean-up handler to the tour stop event, if implemented:
            if (this.onTourStop) {
              tour.$.one(this.nsEvent('stop'), _.bind(this.onTourStop, this, tour));
            }
          }
        }, this));
      }

      if (this.install) {
        this.install();
      }
    },

    /**
     * Namespace an event to this extension.
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
      var set,
          key = this.id;

      tour = tour || guide.tour;

      set = _.extend({},
        this.options['default'],
        this.options[Guide.platform],
        Guide.getOptions()[key],
        tour ? tour.getOptions()[key] : null);

      if (set.overrides) {
        _.extend(set, set.overrides[Guide.platform]);
        delete set.overrides;
      }

      return set;
    },

    /**
     * Whether the extension is available for use in the passed tour.
     *
     * If the tour does not explicitly specify an #enabled option for this extension,
     * the global guide options is then queried, and if not set there either,
     * the default value is used (which is `true`).
     */
    isEnabled: function(tour) {
      var scopedOption = [ this.id, 'enabled' ].join('.');

      if (tour) {
        if (tour.hasOption(scopedOption)) {
          return tour.isOptionOn(scopedOption);
        }
      }

      return this.isOptionOn('enabled');
    },

    /**
     * Handle the extension options, re-render nodes, or re-install event handlers.
     *
     * Behaviour of #refresh is heavily extension-specific and so no stock
     * implementation exists.
     *
     * This method is implicitly called in Guide#refresh and Optionable#setOptions.
     *
     * @template
     */
    refresh: function() {
    },

    /**
     * Restore all internal state/context of the extension to the point where
     * guide.js has not been used yet.
     *
     * The stock #reset behaviour merely resets the Extension's options to
     * their defaults.
     *
     * @template
     */
    reset: function() {
      this.options = {};
      this.setOptions(this.defaults);
    },

    /**
     * Uninstall the extension.
     *
     * @template
     */
    remove: function() {
    }
  });

  guide.Extension = Extension;
})(_, jQuery, window.guide);

(function(_, $, guide, undefined) {
  'use strict';

  var
  /**
   * @class Guide.Tour
   * @mixins Guide.Optionable
   *
   * A guide.js tour is a collection of {@link Spot tour spots} which provides
   * an interface for navigating between the spots and focusing them.
   *
   * @alternateClassName Tour
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
      isDefault: false,

      /**
       * @cfg {Number} [refreshInterval=10]
       *
       * Milliseconds to wait for a spot's element that's not visible to show up
       * before looking for an alternative spot to focus, or "bouncing".
       *
       * See Spot#dynamic and Tour#focus for more details on this behaviour.
       */
      refreshInterval: 10,

      /**
       * @cfg {Function} [onStart=null]
       * A chance to prepare any elements, install event handlers, or context
       * needed for this tour.
       *
       * A few usage examples for this callback:
       *
       * - Backbone apps can ensure that a certain view or route is active
       *   prior to starting the tour (ie, its elements reside in that view)
       * - Listen to events that should advance the tour, stop it, restart it, etc.
       * - Show a greeting modal or a message to the user to tell them what
       *   the tour is about
       *
       * This callback will be invoked with the tour object being `thisArg`,
       * and will also receive the tour object as its second parameter.
       */
      onStart: null,

      /**
       * @cfg {Function} [onStop=null]
       * A chance to clean-up any resources allocated during the tour, or specific
       * to it. This should basically undo what Tour#onStart did.
       *
       * This callback will be invoked with the tour object being `thisArg`,
       * and will also receive the tour object as its second parameter.
       */
      onStop: null,

      available: true
    },

    constructor: function(label) {
      _.extend(this, {

        /**
         * @property {jQuery} $
         * An event delegator, used for emitting custom events and intercepting them.
         *
         * See Guide#$ for details.
         */
        $: $(this),

        id: label, // TODO: unique constraints on tour IDs

        options: {
          'default': _.merge({}, this.defaults, guide.getOptions('tours'))
        },

        spots: [],

        // current and previous spots
        current:  null,
        previous: null,

        // a shortcut to the current spot's index
        cursor: -1,

        active: false
      });

      // console.log('guide.js: tour defined: ', this.id);

      if (_.isFunction(this.getOption('onStart'))) {
        this.$.on('start.user', _.bind(this.getOption('onStart'), this));
      }
      if (_.isFunction(this.getOption('onStop'))) {
        this.$.on('stop.user', _.bind(this.getOption('onStop'), this));
      }
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
      // Set a default spot to focus if none was specified, we'll default to
      // the current one (if resuming) or the first.
      var spot = this.current || this.spots[0];

      options = options || {};

      if (undefined !== options.spot) {
        spot = options.spot;
      }

      if (!guide.isShown()) {
        guide.runTour(this, options);

        return false;
      }
      else if (this.isActive()) {
        return false;
      }

      this.active = true;

      /**
       * @event starting
       *
       * Fired when the tour is starting, ie: no spots have yet been highlighted
       * or focused.
       *
       * **This event is triggered on the tour delegator, Tour#$.**
       *
       * @param {Tour} tour This tour.
       */
      this.$.triggerHandler('starting', [ this ]);

      /**
       * @event starting_tours
       *
       * See Tour#event-starting.
       *
       * **This event is triggered on Guide#$, the guide event delegator.**
       */
      guide.$.triggerHandler('starting.tours', [ this ]);

      // Ask the spots to highlight themselves if they should; see Spot#highlight
      _.invoke(this.spots, 'highlight');

      // Focus a spot if possible.
      if (spot) {
        this.focus(this.__getSpot(spot));
      }

      /**
       * @event start
       *
       * Same as Tour#start_tours but triggered on the tour's event delegator
       * instead: Tour#$.
       */
      this.$.triggerHandler('start', [ this ]);

      /**
       * @event start_tours
       *
       * Fired when the tour has been started, ie: the spots have been highlighted
       * and one has been focused, if viable.
       *
       * **This event is triggered on Guide#$, the guide event delegator.**
       *
       * @param {Tour} tour This tour.
       */
      guide.$.triggerHandler('start.tours', [ this ]);

      return true;
    },

    /**
     * Stop the current tour by dehighlighting all its spots, and de-focusing
     * the current spot, if any.
     *
     * @fires stop
     * @fires stop_tours
     */
    stop: function() {
      if (!this.isActive()) {
        return false;
      }

      if (this.current) {
        this.current.defocus();
      }

      _.invoke(this.spots, 'dehighlight', { force: true });

      this.active = false;

      /**
       * @event stop
       *
       * Same as Tour#stop_tours but triggered on the tour's event delegator
       * instead: `tour.$`.
       */
      this.$.triggerHandler('stop', [ this ]);

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

      return true;
    },

    /**
     * Reset the tour's internal state by de-focusing its current target, and
     * resetting the spot cursor so when #start is called again, the tour will
     * start from the first spot.
     */
    reset: function(full) {
      if (this.current) {
        this.current.defocus();

        // should we also de-highlight, as in #stop?
      }

      this.current = this.previous = null;
      this.cursor = -1;

      if (full) {
        _.invoke(this.spots, 'remove');

        this.spots = [];
        this.setOptions( _.clone(this.defaults) );
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
        this.stop();
        this.start();
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
        throw 'guide.js: bad Spot target, expected a jQuery object, ' + 'got ' + typeof($el);
      }

      spot = new guide.Spot($el, this, this.spots.length, options);
      this.spots.push(spot);

      // Stop tracking it if it gets removed
      spot.$.on('remove', _.bind(this.__removeSpot, this));

      if (this.isActive()) {
        spot.highlight();
      }

      this.$.triggerHandler('add', [ spot ]);
      guide.$.triggerHandler('add', [ spot ]);

      return spot;
    },

    addSpots: function(spots) {
      if (!_.isArray(spots)) {
        throw 'guide.js: bad spots, expected Array,' + ' got: ' + typeof(spots);
      }

      _.each(spots, function(definition) {
        this.addSpot(definition.$el, definition);
      }, this);

      return this;
    },

    /**
     * Focuses the next spot, if any.
     */
    next: function() {
      var nextSpot = this.hasNext();

      if (!this.hasNext()) {
        return false;
      }

      return this.focus(nextSpot);
    },

    hasNext: function() {
      var ln = this.spots.length;

      if (ln === 1 || this.cursor === ln - 1) {
        return false;
      }

      return _.first( this._availableSpots( _.rest(this.spots, this.cursor + 1) ) );
    },

    prev: function() {
      var prevSpot = this.hasPrev();

      if (!prevSpot) {
        return false;
      }

      return this.focus(prevSpot);
    },

    hasPrev: function() {
      if (this.spots.length === 1 || this.cursor === 0) {
        return false;
      }

      return _.last( this._availableSpots( _.head(this.spots, this.cursor) ) );
    },

    first: function() {
      return this.focus( _.first( this._availableSpots() ) );
    },

    last: function() {
      return this.focus( _.last( this._availableSpots() ) );
    },

    _availableSpots: function(set) {
      return _.filter(set || this.spots, function(spot) {
        return spot.isOn('available');
      });
    },

    rebuild: function() {
      this._rebuilding = true;

      _.each(this.spots, function(spot) {
        spot.$.triggerHandler('remove', [ spot ]);
        spot.__rebuild();
      }, this);

      _.each(this.spots, function(spot) {
        this.$.triggerHandler('add', [ spot ]);
        guide.$.triggerHandler('add', [ spot ]);
      }, this);

      this._rebuilding = false;
    },

    /**
     * Guide the user to a given spot in this tour.
     *
     * Current spot will be defocused, and in case the given spot is not currently
     * visible, an attempt to 'refresh' it will be made, and if that fails,
     * an alternative spot will be searched for and used if found, unless
     * the spot isn't {@link Spot#bouncable bouncable}.
     *
     * @param {Number/Spot} index
     * The spot, or an index of a spot, that should be focused.
     *
     * @fires defocus
     * @fires prefocus
     * @fires focus
     *
     * @return {Boolean} Whether the spot has been successfully focused.
     * @async
     */
    focus: function(index) {
      var spot = this.__getSpot(index);

      if (!this.isActive()) {
        return false;
      }

      if (!spot) {
        throw 'guide.js: bad spot @ ' + index + ' to focus';
      }
      else if (spot.isFocused()) {
        spot.refresh();

        return false;
      }

      // de-focus the last spot
      if (this.current && this.current.isFocused()) {
        this.__defocus(spot);
      }

      if (!this._prepared) {
        guide.log('tour: preparing spot ' + spot + ' for focusing.');
        this._prepared = true;

        /**
         * @event pre-focus
         * Fired when a spot is about to be focused. See Spot#preFocus for
         * more details.
         *
         * **This event is triggered on multiple targets:**
         *
         *  - Spot#$
         *  - Tour#$
         *  - Guide#$
         *
         * @param {jQuery.Event} event
         * A default jQuery event.
         * @param {Spot} spot
         * The spot.
         */
        spot.$.triggerHandler('pre-focus', [ spot ]);
        this.$.triggerHandler('pre-focus', [ spot ]);
        guide.$.triggerHandler('pre-focus', [ spot, this ]);

        // If the spot target isn't currently visible, we'll try to refresh
        // the selector in case the element has just been created, and if it still
        // isn't visible, we'll try finding any visible spot to focus instead.
        //
        // We'll give the spot a space of 10ms to refresh by default, otherwise
        // see #refreshInterval.
        if (spot.isOn('dynamic') && !spot.isVisible()) {
          guide.log('tour: spot#' + (spot.index+1), 'isnt visible, attempting to refresh...');

          setTimeout(_.bind(function() {
            // This is a necessary evil for specs as in some cases, a spot gets
            // removed before the timeout has elapsed, in that case we'll abort.
            //
            // TODO: remove in production build.
            if (!spot.$el) {
              return;
            }

            // Refresh
            if (spot.__refreshTarget() && spot.isVisible()) {
              guide.log('tour: \tspot is now visible, focusing.');
              return this.focus(spot);
            }
            // Or, look for an alternative:
            else if (spot.isOn('bouncable')) {
              guide.log('tour: \tspot still isnt visible, looking for an alternative...');
              spot = this.__closest(spot, spot.getOption('bounce'));

              if (spot) {
                guide.log('tour: \t\talternative found: ' + spot + ', focusing.');

                this._prepared = false;
                this.focus(spot);
              } else {
                guide.log('tour: \t\tno alternative found, focusing aborted.');
              }
            }
            // Nothing we can do.
          }, this), this.getOption('refreshInterval'));

          return false;
        } // visibility test
      } // refreshing block

      this._prepared = false;

      this.current = spot;
      this.cursor  = _.indexOf(this.spots, spot);

      spot.focus(this.previous);

      /**
       * @event focus
       * Fired when a tour focuses a new spot. See Spot#onFocus for
       * more details.
       *
       * **This event is triggered on multiple targets:**
       *
       *  - Spot#$
       *  - Tour#$
       *  - Guide#$
       *
       * @param {jQuery.Event} event
       * A default jQuery event.
       * @param {Spot} currentSpot
       * The spot that's currently focused.
       * @param {Spot} previousSpot
       * The spot that was previously focused, if any.
       */
      this.$.triggerHandler('focus', [ spot, this.previous ]);
      guide.$.triggerHandler('focus', [ spot, this.previous ]);

      console.log('guide.js: visiting tour spot #', spot.index+1);

      return true;
    },

    /**
     * @private
     */
    __defocus: function(nextSpot) {
      this.current.defocus(nextSpot);

      /**
       * @event defocus
       *
       * Fired when a spot has lost focus. See Spot#onDefocus for more details.
       *
       * **This event is triggered on multiple targets:**
       *
       *  - Spot#$
       *  - Tour#$
       *  - Guide#$
       *
       * @param {jQuery.Event} event
       * A default jQuery event.
       * @param {Spot} lastSpot
       * The spot that's no longer focused.
       * @param {Spot} nextSpot
       * The spot that will soon be focused, if any.
       */
      this.$.triggerHandler('defocus',  [ this.current, nextSpot ]);
      guide.$.triggerHandler('defocus', [ this.current, nextSpot ]);

      this.previous = this.current;
      this.current = null;
    },

    /**
     * Attempt to find the closest visible spot to the given one.
     *
     * @param {Number/String} [direction='forward']
     * The first direction to seek a match in:
     *
     * - `forward`: will look for spots that follow the anchor
     * - `backward`: will look for spots that precede the anchor
     * - Number: will use the spot at the given index, see Spot#index
     *
     * If the direction yields no visible spot, the opposite direction is then
     * searched.
     *
     * @return {null/Spot}
     * If a number was passed, and that spot isn't visible, `null` is returned,
     * same goes for if a direction was given and no visible spot could be found.
     *
     * @private
     */
    __closest: function(inSpot, direction) {
      var
      anchor = inSpot.index,
      spot,
      seek = _.bind(function(direction) {
        var i, spot;

        if (direction === 'backward') {
          for (i = anchor-1; i >= 0; --i) {
            spot = this.spots[i];

            if (spot.isVisible()) {
              return spot;
            }
          }
        }
        else {
          for (i = anchor+1; i < this.spots.length; ++i) {
            spot = this.spots[i];

            if (spot.isVisible()) {
              return spot;
            }
          }
        }

        return null;
      }, this);

      if (this.spots.length <= 1) {
        return null;
      }

      if (_.isNumber(direction)) {
        return this.__getSpot(direction);
      }
      else if (_.contains([ 'forward', 'backward' ], direction)) {
        return seek(direction);
      } else {
        if (this.spots.length > anchor && (spot = seek('forward'))) {
          return spot;
        }

        if (anchor > 0 && (spot = seek('backward'))) {
          return spot;
        }
      }

      return null;
    },

    /**
     * @private
     */
    __getSpot: function(index) {
      if (_.isNumber(index)) {
        return this.spots[index];
      }
      else if (!index /* undefined arg */) {
        return null;
      }
      else if (index instanceof guide.Spot) {
        // We need to do the lookup because it might be a spot in another tour.
        return _.find(this.spots, index);
      }

      return null;
    },

    /**
     * @private
     */
    __removeSpot: function(e, spot) {
      if (this._rebuilding) {
        return;
      }

      this.spots = _.without(this.spots, spot);

      if (spot === this.current) {
        this.current = null;
        this.cursor = -1;
      }
      else if (spot === this.previous) {
        this.previous = null;
      }
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
   * @class Guide.Spot
   * @mixins Guide.Optionable
   *
   * A tour spot represents an element in the DOM that will be visited in a
   * {@link Tour tour}.
   *
   * Spots contain text to be shown to the user to tell them about the element
   * they represent, and have a static position in the tour (their *index*.)
   *
   * @alternateClassName Spot
   */
  Spot = function() {
    return this.constructor.apply(this, arguments);
  },

  KLASS_TARGET  = 'gjs-spot',
  KLASS_ENTITY  = guide.entityKlass(),
  KLASS_FOCUSED = 'gjs-spot-focused';

  _.extend(Spot.prototype, guide.Optionable, {
    defaults: {

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
      noPositioningFix: false,

      /**
       * @cfg {Boolean} [dynamic=true]
       * Indicates that the spot's target is (re)created dynamically and might not
       * be visible all the time. If that's the case, and this option is enabled,
       * Guide.js will attempt to dynamically locate the target everytime the spot
       * is visited.
       *
       * See Tour#focus for more details on this behaviour.
       *
       * You can further control this by tuning the
       * {@link Tour#refreshInterval refreshInterval} tour option and the #bouncable
       * option.
       */
      dynamic: true,

      /**
       * @cfg {Boolean} [bouncable=true]
       * Turning this on will allow the tour to look for an alternative spot to
       * focus if this spot isn't visible and couldn't be located.
       *
       * See the #dynamic option.
       *
       * *This option has no effect if either #dynamic is turned off.*
       */
      bouncable: true,

      /**
       * @cfg {String/Number} [bounce="forward"]
       * In case we're bouncing off to a new spot, this option controls which
       * spot to focus exactly if you specify a number, or gives a hint by specifying
       * 'forwards' or 'backwards'.
       *
       * **Accepted values:**
       *
       * - a number: the spot index to bounce to
       * - a string: 'forward' or 'backward', the preferred direction in which
       *   to look for a match (a visible spot)
       *
       * *This option has no effect if #bouncable is turned off.*
       */
      bounce: 'both',

      /**
       * @cfg {Boolean} [disco=false]
       * A disco-lights highlighting effect on the spot target. Highlighting it
       * will not only shade it with an overlay, but also throw in a light particle
       * that dances around its borders.
       *
       * Very pretty for small, rectangular elements like buttons and panels.
       */
      disco: false,

      /**
       * @cfg {Boolean/'once'} [flashy=false]
       * Flash the target when it gets focus. Turn it red, then not, then red,
       * then not.
       *
       * Pair this with Spot#disco for maximum hackery.
       */
      flashy: false,

      /**
       * @cfg {Function} [preFocus=null]
       * A chance to prepare the Spot's target before being visited by the user.
       *
       * This callback should be used if the element is dynamically added to
       * the DOM and might not have been visible at the time the tour started.
       *
       * A few usage examples for this callback:
       *
       * - Backbone apps that use JavaScript routing, you can jump to a different
       *   view, or render it, where the target element will become visible.
       * - Show a dropdown-menu that contains a link or element that the spot
       *   represents
       *
       * This callback will be invoked with the spot object being `thisArg`,
       * and will also receive the spot object as its second parameter.
       */
      preFocus: null,

      /**
       * @cfg {Function} [onFocus=null]
       * Invoked when the Spot has been focused and the user is currently viewing it.
       *
       * A few usage example for this callback:
       *
       * - Show a dropdown-menu that's *related* to the context of the spot, unless
       *   the user has manually displayed it.
       * - Bind to events in your application that should cause the tour to advance
       *   to the next spot, or retreat to the previous one.
       *
       * See #onDefocus for a chance to clean up things you've done in this phase.
       *
       * This callback will be invoked with the spot object being `thisArg`,
       * and will also receive the spot object as its second parameter.
       */
      onFocus: null,

      /**
       * @cfg {Function} [onDefocus=null]
       * Invoked when the Spot is no longer focused.
       *
       * You can use this callback to do any necessary clean-ups for things you've
       * done in earlier callbacks.
       *
       * This callback will be invoked with the spot object being `thisArg`,
       * and will also receive the spot object as its second parameter.
       */
      onDefocus: null,

      available: true
    },

    templates: {
      disco: _.template('<div class="gjs-spot-disco"></div>'),
      flashy: _.template('<div class="gjs-spot-flashy"></div>')
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

        /**
         * @property {jQuery} $
         * An event delegator, used for emitting custom events and intercepting them.
         *
         * See Guide#$ for details.
         */
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
         * This could be modified by extensions. Use #setScrollAnchor for overriding.
         */
        $scrollAnchor: $el
      });

      if (!_.isNumber(index) || index < 0) {
        throw 'guide.js: bad spot index ' + index;
      }

      this.setOptions(_.merge({},
        this.defaults,
        tour.getOptions('spots'),
        options));

      // Install handlers that were passed manually for convenience.
      if (_.isFunction(options.preFocus)) {
        // This is triggered by the tour itself in #focus as the spot has no
        // control at that stage yet.
        //
        // See Tour#focus.
        this.$.on('pre-focus.user', _.bind(options.preFocus, this));
      }
      if (_.isFunction(options.onFocus)) {
        this.$.on('focus.user', _.bind(options.onFocus, this));
      }
      if (_.isFunction(options.onDefocus)) {
        this.$.on('defocus.user', _.bind(options.onDefocus, this));
      }

      return this;
    },

    /**
     * Whether the spot is the current one being visited by the user.
     */
    isFocused: function() {
      return this.$el.hasClass(KLASS_FOCUSED);
    },

    /**
     * Whether the spot is currently highlighted in the tour.
     */
    isHighlighted: function() {
      return this.$el.hasClass(KLASS_TARGET);
    },

    getText: function() {
      return this.getOption('text');
    },

    hasText: function() {
      return !!((this.getText()||'').length);
    },

    getCaption: function() {
      return this.getOption('caption');
    },

    hasCaption: function() {
      return !!(this.getCaption()||'').length;
    },

    hasContent: function() {
      return this.hasText() || this.hasCaption();
    },

    /**
     * Check if the target is currently existent *and* visible in the DOM.
     */
    isVisible: function() {
      return this.isOn('available') && this.$el.length && this.$el.is(':visible');
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
      klasses = [ KLASS_TARGET, KLASS_ENTITY ],
      positionQuery;

      // If the target isn't valid (ie, hasnt been in the DOM), try refreshing
      // the selector to see if it's now available, otherwise we can't highlight.
      if (!this.isVisible()) {
        this.__refreshTarget();

        // Still not visible? Abort highlighting
        if (!this.isVisible()) {
          return false;
        }
      }

      if (!this.isOn('highlight')) {
        return false;
      }
      else if (!this.tour.isOn('alwaysHighlight') && !this.__isCurrent()) {
        return false;
      }

      // Apply the positioning fix if the target is statically positioned;
      // to be able to properly highlight the target, it must be positioned
      // as one of 'relative', 'absolute', or 'fixed' so that we can apply
      // the necessary CSS style.
      if (!this.isOn('noPositioningFix') &&
          !this.tour.isOn('spots.noPositioningFix') &&
          !guide.isOn('spots.noPositioningFix')) {

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
     * Dehighlight regardless of any options that might otherwise be respected.
     */
    dehighlight: function(options) {
      options = _.defaults(options || {}, {
        force: false
      });

      if (options.force ||
        !this.tour.isOn('alwaysHighlight') ||
        !this.tour.isOn('alwaysMark')) {
        this.$el.removeClass([
          KLASS_TARGET,
          KLASS_ENTITY,
          'gjs-positioning-fix'
        ].join(' '));

        return true;
      }

      return false;
    },

    /**
     * Apply a CSS class to indicate that the spot is focused, and scroll it
     * into view if #autoScroll is enabled. The spot will also be implicitly
     * {@link #cfg-highlight highlighted}.
     *
     * @fires focus
     * @fires focus_gjs
     */
    focus: function(prev_spot) {
      this.highlight();

      if (this.isOn('disco')) {
        if (!this.$disco) {
          this.$disco = $(this.templates.disco({}));
        }
        this.$disco.appendTo(this.$el);
      }

      if (this.isOn('flashy')) {
        if (!this.$flashy) {
          this.$flashy = $(this.templates.flashy({}));
        }

        this.$flashy.appendTo(this.$el);
        this.$flashy.toggleClass('flash-once', this.getOption('flashy') === 'once');
      }

      this.$el
        .addClass(KLASS_FOCUSED)
        /**
         * @event focus_gjs
         * Fired when a tour focuses a new spot.
         *
         * **This event is triggered on the Spot#$el.**
         *
         * @param {jQuery.Event} event
         * A default jQuery event.
         * @param {Spot} elementSpot
         * The spot this element is represented by.
         * @param {Spot} previousSpot
         * The spot that was previously focused, if any.
         */
        .triggerHandler('focus.gjs', [ this, prev_spot ]);


      this.$.triggerHandler('focus', [ this, prev_spot ]);

      if (this.isOn('autoScroll')) {
        _.defer(_.bind(this.scrollIntoView, this));
      }

      return this;
    },

    /**
     * Restore the target as if it was not focused by this spot.
     *
     * @param  {Spot} nextSpot
     * The spot that will be focused once this loses focus.
     */
    defocus: function(nextSpot) {
      this.dehighlight();

      if (this.$disco) {
        this.$disco.detach();
      }
      if (this.$flashy) {
        this.$flashy.detach();
      }

      this.$el.removeClass(KLASS_FOCUSED);

      this.$.triggerHandler('defocus', [ this, nextSpot ]);
      this.$el.triggerHandler('defocus.gjs', [ this, nextSpot ]);

      return this;
    },

    /**
     * Scrolls the spot into view so that the user sees it.
     *
     * The element that is used to tell whether the spot is not currently visible,
     * and thus should be scrolled to, can be overridden in #setScrollAnchor.
     *
     * This method respects Guide#withAnimations in animating the scrolling,
     * and uses jQuery#in_viewport to test the element's visibility.
     *
     * @async
     */
    scrollIntoView: function() {
      if (!this.$scrollAnchor ||
          !this.$scrollAnchor.length ||
          this.$scrollAnchor.is(':in_viewport')) {
        return false;
      }

      $('html, body').animate({
        scrollTop: this.$scrollAnchor.offset().top * 0.9
      }, guide.isOn('withAnimations') ? 250 : 0);

      return true;
    },

    /**
     * Unlink the Spot from its target, restoring any attributes that might
     * have been modified by the spot.
     */
    remove: function() {
      guide.log('Spot ' + this + ' is being removed.');

      /**
       * @event remove
       *
       * Fired when the spot is being entirely removed from a tour. Once a spot
       * is removed, its target must be _completely_ restored as if guide.js has
       * never been shown.
       *
       * Use this callback to clean-up any DOM mods.
       *
       * **This event is triggered on the Spot delegator, Spot#$.**
       */
      this.$.triggerHandler('remove', [ this ]);

      if (this.isFocused()) {
        this.defocus();
      }

      this.dehighlight({ force: true });

      // Remove all handlers and invalidate all properties
      this.$.off();
      this.$el = this.$scrollAnchor = this.$ = this.tour = null;
      this.index = -1;

      return this;
    },

    /**
     * Refresh the target selector, re-focus if Spot is focused, otherwise
     * re-highlight if applicable.
     */
    refresh: function() {
      if (!this.isVisible()) {
        this.__refreshTarget();
      }

      if (this.isFocused()) {
        this.defocus();
        this.focus();

        return this;
      }

      if (this.isHighlighted()) {
        this.dehighlight();
        this.highlight();
      }

      return this;
    },

    __rebuild: function() {
      this.setOptions(_.extend({},
        this.defaults,
        this.tour.getOptions('spots')));
    },

    setScrollAnchor: function($el) {
      this.$scrollAnchor = $el;
    },

    /**
     * @private
     */
    __refreshTarget: function() {
      if (this.$el.selector.length) {
        this.$el = $(this.$el.selector);

        if (!this.$scrollAnchor ||
            // Could be set by an extension, like Markers, to something other than
            // the target $el, don't override it.
            !this.$scrollAnchor.length ||
            !this.$scrollAnchor.is(':visible')) {
          this.setScrollAnchor(this.$el);
        }
      }

      return this.isVisible();
    },

    /**
     * @private
     */
    __isCurrent: function() {
      return this.tour.current === this;
    },

    /**
     * @private
     */
    toString: function() {
      return this.tour.id + '#' + (this.index+1);
    },
  });

  guide.Spot = Spot;

  /**
   * @event focus
   * @inheritdoc Tour#focus
   */

  /**
   * @event defocus
   * @inheritdoc Tour#defocus
   */

  /**
   * @event pre-focus
   * @inheritdoc Tour#pre-focus
   */
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var
  /**
   * @class Guide.Controls
   * @extends Guide.Extension
   *
   * A widget that provides tour navigation controls, like going forward and
   * backward, jumping to first or last spot, or closing the tour.
   *
   * **This extension can integrate with Guide.Tutor and Guide.Markers.**
   */
  Extension = function() {
    return this.constructor();
  };

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,
      inMarkers:  false,
      inTutor:    false,
      withTourSelector: true,
      withJumps: true,
      withClose: true
    },

    id: 'controls',

    templates: {
      controls: _.template([
        '<div id="gjs_controls">',
          '<button data-action="tour.first">First</button>',
          '<button data-action="tour.prev">&lt;</button>',
          '<button data-action="tour.next">&gt;</button>',
          '<button data-action="tour.last">Last</button>',
          '<button data-action="guide.hide">Close</button>',
          '<select name="tour" data-action="switchTour"></select>',
        '</div>'
      ].join('')),

      tourList: _.template([
        '<% _.forEach(tours, function(tour) { %>',
          '<% if (tour.spots.length) { %>',
            '<option value="<%= tour.id %>"><%= tour.id %></option>',
          '<% } %>',
        '<% }); %>'
      ].join(''))
    },

    constructor: function() {
      this.$container = guide.$el;
      this.guide = guide;
      this.tour = null;

      this.$el = $(this.templates.controls({}));
      this.$el.addClass(guide.entityKlass());

      _.extend(this, {
        $bwd:   this.$el.find('[data-action*=prev]'),
        $fwd:   this.$el.find('[data-action*=next]'),
        $first: this.$el.find('[data-action*=first]'),
        $last:  this.$el.find('[data-action*=last]'),
        $hide:  this.$el.find('[data-action*=hide]'),
        $tour_selector:  this.$el.find('[data-action="switchTour"]')
      });

      guide.$
        .on(this.nsEvent('focus'), _.bind(function() {
          this.$el.on(this.nsEvent('click'), '[data-action]', _.bind(this.proxy, this));
        }, this))
        .on(this.nsEvent('defocus'), _.bind(function() {
          this.$el.off(this.nsEvent('click'), '[data-action]');
        }, this));

      return this;
    },

    onTourStart: function(tour) {
      this.tour = tour;
      this.tour.$.on(this.nsEvent('focus'), _.bind(this.refreshControls, this));
      this.tour.$.on(this.nsEvent('add'), _.bind(this.refreshControls, this));

      this.refresh();
    },

    onTourStop: function() {

      this.tour.$.off(this.nsEvent('focus'));
      this.tour = null;
      this.hide();
    },

    show: function() {
      if (!this.tour) {
        return false;
      }

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
          .off(this.nsEvent('marking.gjs_markers'))
          .off(this.nsEvent('unmarking.gjs_markers'));
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

      // If we're embedding into markers and a spot is currently marked,
      // attach ourselves to the marker.
      if (guide.tour && guide.tour.current && guide.tour.current.marker) {
        marker = guide.tour.current.marker;

        this.attachToMarker(marker);

        // We've to refresh its position as its width might have changed.
        marker.place();
      }
    },

    tutorMode: function(ext) {
      this.$container = ext.$el;
      ext.$el.addClass('with-controls');
    },

    proxy: function(e) {
      var action = $(e.target).attr('data-action'),
          pair,
          target,
          method;

      if (!action) {
        return $.consume(e);
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
      var tour    = this.tour,
          options = this.getOptions(tour);

      this.$bwd.prop('disabled',    !tour.hasPrev());
      this.$fwd.prop('disabled',    !tour.hasNext());
      this.$first.prop('disabled',  !tour.hasPrev()).toggle(options.withJumps);
      this.$last.prop('disabled',   !tour.hasNext()).toggle(options.withJumps);
      this.$hide.toggle(options.withClose);

      if (options.withTourSelector) {
        this.$tour_selector
          .html(this.templates.tourList({ tours: guide.tours }))
          .toggle(guide.tours.length > 1)
          .find('[value="' + tour.id + '"]').prop('selected', true);

        if (this.$tour_selector.children().length === 1) {
          this.$tour_selector.hide();
        }
      }
      else {
        this.$tour_selector.hide();
      }
    },

    switchTour: function() {
      var tour = guide.getTour(this.$tour_selector.find(':selected').val());

      if (tour && !tour.isActive()) {
        tour.reset();
        return guide.runTour(tour);
      }

      return false;
    }

  }); // Extension.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var
  Guide = guide,
  /**
   * @class Guide.Markers
   * @extends Guide.Extension
   * @singleton
   *
   * A guide.js extension that provides interactive {@link Marker markers} that
   * can be attached to {@link Spot tour spots}.
   *
   * @alternateClassName Markers
   */
  Extension = function() {
    return this.constructor();
  },

  Marker = function() {
    return this.constructor.apply(this, arguments);
  },

  idGenerator = 0,

  // Plain markers that contain only the step index, no text, and no caption.
  JST_PLAIN = _.template([
    '<div>',
      '<span class="index"><%= index +1 %></span>',
    '</div>'
  ].join('')),

  // Markers that contain the step index when not focused, and text otherwise.
  JST_WITH_CONTENT = _.template([
    '<div>',
      '<span class="index"><%= index +1 %></span>',
      '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  // Markers that contain the step index when not focused, and both caption
  // and text otherwise.
  JST_WITH_CAPTION = _.template([
    '<div>',
      '<span class="index"><%= index +1 %></span>',
      '<h6 class="caption"><%= caption %></h6>',
      '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  JST_CONTAINER = _.template('<div style="position: relative;"></div>'),

  // Placement modes
  PMT_INLINE = 1,
  PMT_SIBLING = 2,
  PMT_OVERLAY = 3,

  // The positioning grid
  POS_TL  = 1,
  POS_T   = 2,
  POS_TR  = 3,
  POS_R   = 4,
  POS_BR  = 5,
  POS_B   = 6,
  POS_BL  = 7,
  POS_L   = 8,
  POS_C   = 9;

  _.extend(Extension.prototype, guide.Extension, {
    id: 'markers',

    defaults: {
      /**
       * @cfg {Boolean} [enabled=true]
       * Enable {@link Marker markers} functionality and build them for each
       * tour spot automatically.
       */
      enabled: true,

      /**
       * @cfg {Number} [refreshFrequency=500]
       * Milliseconds to wait before re-positioning markers after the window
       * has been resized.
       */
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
        guide.tour.setOption('alwaysMark', true);
      }

      guide.Spot.prototype.addOption('withMarker', true);

      guide.$.on('add', _.bind(this.addMarker, this));

      return this;
    },

    addMarker: function(e, spot, attributes) {
      var marker;

      if (!spot.isOn('withMarker')) {
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

      if (!this.isEnabled()) {
        return;
      }

      if (guide.tour && this.isEnabled(guide.tour)) {
        this.onTourStop(guide.tour);
        this.onTourStart(guide.tour);
      }
    },

    /**
     * Launch markers for the tour if the {@link Tour#cfg-alwaysMark option} is
     * enabled, and install the window resize handler and proxy clicks on markers
     * to focus their spots.
     *
     * See #repositionMarkers for the repositioning logic.
     */
    onTourStart: function(tour) {
      $(document.body).on(this.nsEvent('click'), '.gjs-marker', function() {
        var marker = $(this).data('gjs-marker');

        if (marker) {
          if (!marker.spot.isFocused()) {
            marker.spot.tour.focus(marker.spot);
          }

          // return $.consume(e);
        }

        return true;
      });

      $(window).on(this.nsEvent('resize'),
        _.throttle(
          _.bind(this.repositionMarkers, this),
          this.getOption('refreshFrequency')));

      if (tour.isOn('alwaysMark')) {
        _.invoke(tour.getMarkers(), 'show');
      }
    },

    onTourStop: function(tour) {
      $(window).off(this.nsEvent('resize'));
      $(document.body).off(this.nsEvent('click'));

      _.invoke(tour.getMarkers(), 'hide');
    },

    repositionMarkers: function() {
      var tour = guide.tour;

      if (!tour) {
        return true;
      }

      console.log('[markers] repositioning markers for tour ', tour.id);

      _.invoke(_.where(tour.getMarkers(), { placement: PMT_OVERLAY }), 'snapToSpot');

      return true;
    }
  }); // Extension.prototype


  /**
   * @class Guide.Marker
   * @mixins Guide.Optionable
   *
   * A single marker object attached to a Tour Spot. Markers show up around
   * a tour spot, and can show the index of the spot, its content when highlighted,
   * and more.
   *
   * Marker instances allow you to configure where and how they should be placed.
   *
   * Example of creating a basic marker:
   *
   *     @example
   *     $(function() {
   *       $('<button>Hi</button>').appendTo($('body'));
   *
   *       // Enable the Markers extension:
   *       guide.setOptions({
   *         markers: {
   *           enabled: true
   *         }
   *       });
   *
   *       // Create a spot with a marker:
   *       guide.tour.addSpot($('button'), {
   *         text: "I'm a button full of awesome.",
   *         withMarker: true,
   *         marker: {
   *           position: 'right',
   *           width: 140
   *         }
   *       });
   *
   *       guide.show();
   *     });
   *
   * @alternateClassName Marker
   */
  _.extend(Marker.prototype, Guide.Optionable, {
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

      mimic: false,
      mimicDisplay: true,

      margin: 15
    },

    constructor: function(spot, attributes) {
      _.extend(this, attributes, {
        id: ++idGenerator,
        spot: spot
      });

      this.setOptions(_.extend({},
        // lowest priority: our defaults
        this.defaults,

        (attributes || {}).options,
        // then, guide's global marker options,
        guide.getOptions('marker'),
        // then, the spot's tour options,
        spot.tour.getOptions('marker'),
        // and highest priority: the spot's options
        spot.getOptions('marker')));

      spot.marker = this;

      this.spot.$
        .on(this.ns('focus'),   _.bind(function() { this.show(); }, this))
        .on(this.ns('defocus'), _.bind(function() { this.hide(); }, this))
        .on(this.ns('remove'),  _.bind(function() { this.remove(); }, this));

      this.build();

      guide.log('Marker', this.id, 'created for spot', this.spot.toString());

      return this;
    },

    ns: function(event) {
      return [ event, 'gjs_marker', this.id ].join('.');
    },

    /**
     * Build the marker element and prepare it for attachment.
     *
     * @return {Guide.Marker} this
     */
    build: function() {
      var $el, template, rtl_pos,
      rtl   = guide.isOn('RTL'),
      spot  = this.spot,
      options = this.getOptions();

      // Shouldn't build a marker for a spot target that's not (yet) visible.
      if (!spot || !spot.isVisible()) {
        return false;
      }
      // Already built? no-op at the moment, we don't support re-building
      else if (this.$el) {
        return false;
      }

      // Parse placement and position modes.
      switch(options.placement) {
        case 'inline':  this.placement = PMT_INLINE; break;
        case 'sibling': this.placement = PMT_SIBLING; break;
        case 'overlay': this.placement = PMT_OVERLAY; break;
        default:
          throw 'guide-marker.js: bad placement "' + this.getOption('placement') + '"';
      }

      if (rtl) {
        switch(this.getOption('position')) {
          case 'topleft':     rtl_pos = 'topright'; break;
          case 'topright':    rtl_pos = 'topleft'; break;
          case 'right':       rtl_pos = 'left'; break;
          case 'bottomright': rtl_pos = 'bottomleft'; break;
          case 'bottomleft':  rtl_pos = 'bottomright'; break;
          case 'left':        rtl_pos = 'right'; break;
          default:
            rtl_pos = this.getOption('position');
        }

        this.setOptions({
          position: rtl_pos
        });

        options.position = rtl_pos;
      }

      switch(options.position) {
        case 'topleft':     this.position = rtl ? POS_TR  : POS_TL; break;
        case 'top':         this.position = POS_T; break;
        case 'topright':    this.position = rtl ? POS_TL  : POS_TR; break;
        case 'right':       this.position = rtl ? POS_L   : POS_R; break;
        case 'bottomright': this.position = rtl ? POS_BL  : POS_BR; break;
        case 'bottom':      this.position = POS_B; break;
        case 'bottomleft':  this.position = rtl ? POS_BR  : POS_BL; break;
        case 'left':        this.position = rtl ? POS_R   : POS_L; break;
        case 'center':      this.position = POS_C; break;
        default:
          throw 'guide-marker.js: bad position "' + options.position + '"';
      }

      // If spot has explicitly asked for no text, or doesn't have
      // any textual content, then we should respect the setting when
      // highlighted.
      //
      // See #highlight.
      this.withText     = !!options.withText && spot.hasContent();
      this.spot_klasses = [
        'gjs-spot-' + options.placement,
        'gjs-spot-' + options.position
      ].join(' ');

      // Determine which template we should use.
      if (_.isFunction(options.template)) {
        template = options.template;
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
          options.placement + '-marker',
          options.position
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

    remove: function() {
      if (!this.spot) {
        throw 'marker being removed twice?!';
      }

      guide.log('Marker', this.id, 'removed for spot', this.spot.toString());

      this.hide({
        completely: true
      });

      this.spot.$
        .off(this.ns('remove'))
        .off(this.ns('defocus'))
        .off(this.ns('focus'));

      delete this.spot.marker;

      if (this.$el) {
        this.$el.remove();
        this.$el = this.spot = null;
      }
    },

    show: function() {
      if (!this.$el && !this.build()) {
        return false;
      }
      else if (!this.canShow()) {
        this.hide({ completely: true });
        return false;
      }


      if (this.spot.isFocused()) {
        guide.$.triggerHandler('marking.gjs_markers', [ this ]);

        this.$el.addClass('focused');

        if (this.withText) {
          this.$index.hide();

          this.$text.show();
          this.$caption.show();
          this.$el.css({
            width: this.getOption('width') || this.defaults.width
          });
        }

        guide.$.triggerHandler('marked.gjs_markers', [ this ]);
      } else if (this.withText) {
        this.$text.hide();
        this.$caption.hide();
      }

      // Mark the spot as being highlighted by a marker
      this.spot.$el.addClass(this.spot_klasses);

      this.attach();
      this.place();

      guide.log('Marker',this.id,'highlighted for spot', this.spot.toString());

    },

    /**
     * Collapse the marker if Tour#alwaysMark is on, otherwise detach it.
     *
     * @param  {Object} options
     * Some overrides.
     *
     * @param {Boolean} [options.completely=false]
     * Don't respect any options that might otherwise prevent the marker from
     * being detached.
     */
    hide: function(options) {
      options = _.defaults(options || {}, {
        completely: false
      });

      guide.$.triggerHandler('unmarking.gjs_markers', [ this ]);

      // If the tour doesn't want markers to always be shown, or we're being
      // removed (options.completely), then we'll roll-back our changes,
      // detach ourselves, and unwrap if viable.
      //
      if (!this.spot.tour.isOn('alwaysMark') || options.completely) {
        // Restore the spot's target's CSS classes
        this.spot.$el.removeClass(this.spot_klasses);

        // Hide ourselves.
        if (this.$el) {
          this.$el.detach();
        }

        // Un-wrap the spot's target, if we're in sibling placement mode.
        if (this.isWrapped()) {
          this.unwrap();
        }
      }
      // This check is necessary because #hide might be called while the marker
      // has not been built, or has failed to build.
      else if (this.$el) {
        this.$el.removeClass('focused');

        // Hide the content, show the number marker.
        if (this.withText) {
          this.$index.show();

          this.$text.hide();
          this.$caption.hide();
          this.$el.css({
            width: 'auto'
          });
        }

        // this.attach();
        // this.place();
        _.defer(_.bind(this.show, this));
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

      if (!spot.tour.isActive() || !spot.isOn('withMarker')) {
        return false;
      }

      if (!spot.tour.isOn('alwaysMark') && !spot.isFocused()) {
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

      switch(this.placement) {
        case PMT_INLINE:
          this.hvCenter();
        break;
        case PMT_SIBLING:
          if (!this.$container.is(':visible')) {
            this.wrap();
            this.attach();
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

      // if (this.isOn('smart') && !dontBeSmart) {
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
          if (!this.isWrapped()) {
            this.wrap();
          }

          method  = (this.position >= POS_TR && this.position <= POS_BR) ?
            'append' :
            'prepend';

          this.$container.append(this.spot.$el);
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
     * Positions `POS_T` and `POS_B` will cause horizontal centering, while
     * positions `POS_L` and `POS_R` will cause vertical centering.
     */
    hvCenter: function() {
      var center,
          $marker = this.$el,
          margin  = 0,
          origin  = this.spot.$el.offset(),
          query   = {
            w: $marker.outerWidth(),
            h: $marker.outerHeight(),

            vw: $(window).width()   - 20,
            vh: $(window).height()  - 20
          };

      if (_.contains( [ POS_T, POS_C, POS_B ], this.position)) {
        center = ($marker.outerWidth() / 2);
        margin = -1 * center;

        // if (origin.left < center) {
          // margin = -1 * (center - origin.left) / 2;
        // }
        // else if (origin.left + query.w > query.vw) {
        if (origin.left + query.w > query.vw) {
          margin = -1 * (origin.left + query.w - query.vw);
        }

        $marker.css('margin-left', margin);
      }

      if (_.contains( [ POS_R, POS_C, POS_L ], this.position)) {
        center = ($marker.outerHeight() / 2);
        margin = -1 * center;

        $marker.css('margin-top', margin);
      }
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
      if (!this.canShow()) {
        this.hide({ completely: true });
        return false;
      }

      var markerWidth, markerHeight, scrollLock,
      origin        = this.$el.offset() || { top: 0, left: 0 },
      offset        = this.spot.$el.offset(),
      anchorWidth   = this.spot.$el.outerWidth(),
      anchorHeight  = this.spot.$el.outerHeight(),
      margin        = this.getOption('margin');

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
        case POS_C:
          offset.top -= anchorHeight/2;
          offset.left += -1*markerWidth/2 + anchorWidth/2;
          break;
      }

      // Move the marker.
      if (guide.isOn('withAnimations')) {
        // Prevent the spot from autoScrolling to the marker since it'll be
        // moving still while animated.
        scrollLock = this.spot.isOn('autoScroll');
        this.spot.setOptions({ autoScroll: false }, null, true);

        this.$el.offset(origin);
        this.$el
          .animate({
              top: offset.top,
              left: offset.left
            },
            250,
            // Restore the autoScroll option.
            _.bind(function() {
              this.spot.setOptions({ autoScroll: scrollLock }, null, true);
            }, this));

        // Scroll the marker into view if needed
        if (this.spot.isFocused() && !this.spot.$el.is(':in_viewport')) {
          $('html, body').animate({
            scrollTop: offset.top * 0.9
          }, guide.isOn('withAnimations') ? 250 : 0);
        }
      }
      else {
        this.$el.offset(offset);
      }

      return offset;
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

      if (this.isWrapped()) {
        this.unwrap();
      }

      // Build the container by either 'mimicking' the target, or by building
      // a plain <div>:
      if (this.isOn('mimic')) {
        // We'll try to replicate the target element, so we won't break any CSS/JS
        // that uses the tag as an identifier, we'll do that by cloning the tag
        // and stripping some of its properties.
        this.$container =
          $($spot[0].outerHTML.replace(/(<\/?)\w+\s/, '$1div '))
          // Empty it, we only need the tag and its structure
          .html('')
          .attr({
            'id': null,
            // Remove any gjs- related classes from the container
            'class': $spot[0].className.replace(/(gjs(\-?\w+)+)/g, '').trim()
          })
          // The container must be relatively positioned
          .css({
            position: 'relative'
          });
      }
      else {
        this.$container = $(JST_CONTAINER({}));
      }

      this.$container
        // Classify it so the user can override its css if needed
        .addClass('gjs-container gjs-container-' + (this.spot.index+1))
        // Try to mimic the display type of the target element
        .css({
          display: this.isOn('mimicDisplay') ? $spot.css('display') : 'inherit',
        })
        // Place the container right where the target is, and
        // move the target and (later) the marker inside of it.
        .insertBefore($spot)
        .append($spot);

      guide.log('Marker',this.id,'wrapped');
    },

    /**
     * Undo what #wrap did by detaching our element, restoring the spot element
     * back to its original position, and removing the container.
     */
    unwrap: function() {
      if (this.$container) {
        guide.log('Marker',this.id,'unwrapping');

        if (this.$el) {
          this.$el.detach();
        }

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

  /**
   * @class Guide.Spot
   *
   * @cfg {Boolean} [withMarker=true]
   * Attach and display a marker to the spot's element when it receives focus.
   *
   * **This option is available only if the Markers extension is enabled.**
   */

  /**
   * @class Guide.Tour
   *
   * @cfg {Boolean} [alwaysMark=true]
   * Display markers for all tour spots, not only the focused one. Non-focused
   * markers will only display the spot index and not its content.
   *
   * **This option is available only if the Markers extension is enabled.**
   */

})(_, jQuery, window.guide);

(function(_, $, guide, MarkersExt) {
  'use strict';

  if (!MarkersExt) {
    throw 'guide.js: Smart Markers requires the Markers extension to be loaded.';
  }

  var
  /**
   * @class Guide.SmartMarkers
   * @extends Guide.Extension
   * @singleton
   *
   * A an extension that adds a "smartness" layer to {@link Guide.Marker guide.js markers}.
   */
  Extension = function() {
    return this.constructor();
  },
  JST_ARROW = _.template([
    '<div class="gjs-arrow"></div>'
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,

      /**
       * @cfg {Boolean} [adjustArrows=true]
       * Re-position the marker's arrow to always point at the middle of the
       * target.
       */
      adjustArrows: true,

      arrowDim: 15
    },

    id: 'smart_markers',

    constructor: function() {
      return this;
    },

    install: function() {
      guide.$.on(this.nsEvent('starting.tours'), _.bind(function(e, tour) {
        if (this.isEnabled(tour)) {
          this.onTourStarting(tour);

          // Bind the clean-up handler to the tour stop event, if implemented:
          if (this.onTourStop) {
            tour.$.one(this.nsEvent('stop'), _.bind(this.onTourStop, this, tour));
          }
        }
      }, this));
    },

    onTourStarting: function() {
      if (this.isOn('adjustArrows')) {
        guide.$.on(this.nsEvent('marked.gjs_markers'), _.bind(function(e, marker) {
          _.defer(_.bind(this.adjustArrows, this, e, marker));
        }, this));
      }
    },

    onTourStop: function() {
      guide.$.off(this.nsEvent('marked.gjs_markers'));
    },

    adjustArrows: function(e, marker) {
      if (!marker.canShow() || !marker.$el) {
        return false;
      }

      var
      adjusted = false,
      // the arrow we might be creating and aligning
      $arrow,
      // the size of the arrow
      arrowDim = this.getOption('arrowDim'),
      $marker = marker.$el,
      $spot = marker.spot.$el,
      // a query object we'll be using later
      q = {},
      // the marker's position
      position = marker.positionToString(marker.position);

      if (_.contains([ 'top', 'bottom' ], position)) {
        $arrow = $marker.$arrow;

        q = {
          marker: {
            width: $marker.outerWidth(),
            offset: $marker.offset()
          },
          spot: {
            width: $spot.outerWidth(),
            offset: $spot.offset()
          }
        };

        // If the marker's centre point is farther to the right than where the
        // target is (from a horizontal axis, offset.left),
        // then we need to move the arrow to the center of the target.
        //
        if (q.marker.offset.left + q.marker.width / 2 + arrowDim >= q.spot.offset.left ) {
          if (!$arrow) {
            $arrow = $( JST_ARROW({}) ).addClass(position).appendTo($marker);
            $marker.addClass('no-arrow');

            // We'll keep a reference so we don't re-create the arrow
            marker.$arrow = $arrow;
          }

          // Centre the arrow
          $arrow.css('left', (q.spot.offset.left - q.marker.offset.left) + q.spot.width / 2);
          adjusted = true;
        } else {
          if ($arrow) {
            $marker.removeClass('no-arrow');
            $arrow.remove();

            delete marker.$arrow;
          }
        }
      }

      return adjusted;
    }
  });

  guide.addExtension(new Extension());
})(_, jQuery, window.guide, window.guide.getExtension('markers'));

(function(_, $, guide) {
  'use strict';

  var
  /**
   * @class Guide.Toggler
   * @extends Guide.Extension
   * @singleton
   *
   * A guide.js extension that installs a toggle button that plays and stops tours.
   */
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

      return this;
    },

    install: function() {
      if (this.isEnabled()) {
        this.show().expand();
      }
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
      if (this.isOn('resetOnStart')) {
        if (guide.tour) {
          guide.tour.reset();
        }
      }

      guide.show();
    }

  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);

(function(_, $, guide) {
  'use strict';

  var
  /**
   * @class Guide.Tutor
   * @extends Guide.Extension
   * @singleton
   *
   * A widget that displays the focused spot's content in a static
   * place on the bottom of the page.
   */
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