(function(_, $) {
  'use strict';

  var
  guide = function() {
    this.constructor.apply(this, arguments);

    return this;
  },

  GRACEFUL = false,
  DEBUG    = true,

  KLASS_ENABLED         = 'with-guide',
  KLASS_OVERLAYED       = 'guide-with-overlay',
  KLASS_NOT_OVERLAYED   = 'guide-without-overlay',
  KLASS_ENTITY          = 'guide-entity';

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
      _.merge(this.options, options);

      if (this.refresh) {
        this.refresh();
      }

      if (this.$) {
        console.log('guide.js: [Optionable] options changed, triggering refresh');

        this.$.triggerHandler('refresh', [ this.options, this ]);
      }

      return this;
    },

    getOptions: function(overrides) {
      return _.extend(_.clone(this.options), overrides || {});
    }
  };

  _.extend(guide.prototype, Optionable, {
    $container: $('body'),
    $el:        $('<div class="guide-js" />'),

    defaults: {
      withOverlay:    false,
      withAnimations: true
    },

    entityKlass: function() {
      return KLASS_ENTITY;
    },

    constructor: function() {
      // Used for emitting custom events.
      this.$ = $(this);

      _.extend(this, {
        options: _.clone(this.defaults),
        tours:   [],
        extensions: [],
        tour: null,
        // cTarget: null,
        // pTarget: null,
        // cursor:  -1
      });

      this.$.on('refresh', function(e, options, el) {
        el.toggleOverlayMode();
      });
    },

    inactiveTours: function() {
      return _.without(this.tours, this.tour);
    },

    defineTour: function(label, optTargets) {
      var tour;

      if (!(tour = this.getTour(label))) {
        tour = new guide.Tour(label);
        this.tours.push(tour);
      }

      if (optTargets) {
        var that = this;

        if (!_.isArray(optTargets)) {
          throw "guide.js#defineTour: bad targets, expected array, got: " +
                typeof(optTargets);
        };

        this.fromJSON(optTargets);
      }

      return tour;
    },

    runTour: function(id) {
      var tour;

      if (!(tour = this.getTour(id))) {
        throw [
          "guide.js: undefined tour '",
          id,
          "', did you forget to call #defineTour()?"
        ].join('');
      }

      if (this.tour) {
        this.tour.deactivate();
        this.$.triggerHandler('deactivate.tours', [ this.tour ]);
      }

      this.tour = tour;

      this.$.triggerHandler('activate.tours', [ this.tour ]);
      this.tour.activate();

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
     *   onFocus: function($prevTarget) {}
     *   onDefocus: function($currentTarget) {}
     * }
     */
    addTarget: function($el, options) {
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

    addTargets: function(targets) {
      return this.fromJSON(targets);
    },

    fromJSON: function(targets) {
      targets = _.isArray(targets) ? targets : [ targets ];

      _.each(targets, function(definition) {
        this.addTarget(definition.$el, definition);
      }, this);

      return this;
    },

    /** TODO */
    fromDOM: function(selector_or_container) {
      var that = this,
          $container = $(selector_or_container);

      $container.find('[data-guide]').each(function() {
        var $this   = $(this),
            $tour,
            options = {
              text:     $this.attr('data-guide'),
              caption:  $this.attr('data-guide-caption'),
              tour:     $this.attr('data-guide-tour')
            },
            tokens  = ($this.attr('data-guide-options') || '').split(/\,?\s+\,?/);

        // if no tour is specified, take a look at the ancestry tree, perhaps
        // an element has a tour defined in [data-guide-tour]
        if (!options.tour) {
          $tour = $this.parents('[data-guide-tour]:first');

          if ($tour.length) {
            options.tour = $tour.attr('data-guide-tour');
          }
        }

        for (var i = 0; i < tokens.length; ++i) {
          var pair  = tokens[i].split(':'),
              k     = pair[0],
              v     = pair[1];

          if (v == 'false') { v = false; }
          else if (v == 'true') { v = true; }

          _.assign(k, v, options);
        }

        that.addTarget($this, options);
      });

      $container.find('[data-guide-target]').each(function() {
        var $target = $($(this).attr('data-guide-target'));
        if ($target.length) {
          $(this).hide();
          that.addTarget($target, {
            text: $(this).html()
          });
        }
      })

      return this;
    },

    show: function(options) {
      var that    = this,
          options = this.getOptions(options),
          klasses = [ KLASS_ENABLED ];

      if (!this.tour) {
        this.runTour(this.tours[0]);
      }

      this.toggleOverlayMode();

      this.$container.addClass(klasses.join(' '));
      this.$.triggerHandler('show');

      this.tour.activate();

      this.$el.appendTo(this.$container);

      return this;
    },

    refresh: function() {
      _.each(this.extensions, function(e) {
        e.refresh && e.refresh();
      });

      return this;
    },

    hide: function() {
      this.$el.detach();

      this.$container.removeClass([
        KLASS_ENABLED,
        KLASS_OVERLAYED
      ].join(' '));

      this.tour.deactivate();

      this.$.triggerHandler('hide');

      return this;
    },

    toggle: function() {
      return this.isShown() ?
        this.hide.apply(this, arguments) :
        this.show.apply(this, arguments);
    },

    /**
     * Attaches a darkening overlay to the window as per the withOverlay option.
     *
     * @param <Boolean> do_toggle if true, the withOverlay option will be toggled
     *
     * @note
     * We need to track two states: 'with-overlay' and 'without-overlay'
     * because in overlayed mode, the foreground of highlighted elements needs
     * a different level of contrast than in non-overlayed mode (they're lighter),
     * thus the CSS is able to do the following:
     *
     *   .guide-with-overlay #my_element { color: white }
     *   .guide-without-overlay #my_element { color: black }
     *
     */
    toggleOverlayMode: function(do_toggle) {
      if (do_toggle) {
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

    dismiss: function(optTourId) {
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
    },

    getExtension: function(id) {
      return _.find(this.extensions, { id: id });
    },

    /**
     * @private
     * @nodoc
     */
    getTour: function(id) {

      return _.isString(id)
        ? _.find(this.tours || [], { id: id })
        : id;
    }
  }); // guide.prototype

  guide = new guide();

  // expose the Optionable interface for other components to re-use
  guide.Optionable = Optionable;

  // expose the instance to everybody
  window.guide = guide;
})(_, jQuery);