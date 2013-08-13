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

      RTL: false,

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
  Guide.VERSION = '1.4.0';

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