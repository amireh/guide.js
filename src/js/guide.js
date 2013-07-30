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
})(_, jQuery);