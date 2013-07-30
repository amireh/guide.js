(function(_, $) {
  'use strict';

  if (!$) {
    throw new Error('guide.js: jQuery is undefined, are you sure it has been loaded yet?');
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
        this.addSpots(optSpots);
      }

      return tour;
    },

    runTour: function(id) {
      var tour;

      if (!this.isShown()) {
        this.show();
      }

      if (!(tour = this.getTour(id))) {
        throw new Error('guide.js: undefined tour "' + id + '", did you call #defineTour()?');
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
    addSpot: function($el, inOptions) {
      var tour    = this.tour,
          options = inOptions || {},
          tour_id = options.tour;

      if (tour_id) {
        if (_.isString(tour_id)) {
          tour = this.defineTour(tour_id);
        }
        else if (tour_id instanceof guide.Tour) {
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
          text: $ref.detach().attr('data-guide-spot', null)[0].outerHTML
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
      }

      this.runTour(options.tour || this.tour || this.tours[0]);

      if (should_show) {
        this.$el.appendTo(this.$container);
        this.$el.show(show_after + 1, function() {
          that.$.triggerHandler('show');
        });
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

      this.toggleOverlayMode();

      return this;
    },

    /**
     *
     * @async
     */
    hide: function() {
      var that        = this,
          hide_after  = this.options.withAnimations ? this.options.toggleDuration:0;

      if (this.isShown()) {
        this.$container.addClass(KLASS_HIDING);
        that.$el.hide(hide_after + 1, function() {
          that.$el.detach();

          that.$container.removeClass([
            KLASS_ENABLED,
            KLASS_OVERLAYED,
            KLASS_HIDING
          ].join(' '));

          if (that.tour) {
            that.tour.stop();
          }

          that.$.triggerHandler('hide');
        });
      }

      return this;
    },

    reset: function() {
      if (this.isShown()) {
        this.hide();
      }

      this.tours  = [];
      this.tour   = this.defineTour('Default Tour');

      this.options = _.clone(this.defaults);
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

  guide = new guide();

  // expose the instance to everybody
  window.guide = guide;
  window.GJS_DEBUG = true;
})(_, jQuery);