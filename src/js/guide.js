(function(_, $) {
  'use strict';

  var
  guide = function() {
    this.constructor.apply(this, arguments);

    return this;
  },

  Tour = function() {
    return this.constructor.apply(this, arguments);
  },

  Target = function(options) {
    _.extend(this, options);
    return this;
  },

  GRACEFUL = false,
  DEBUG    = true,
  DEFAULTS = {
    withOverlay: false,
    withAnimations: true
  },

  TOUR_DEFAULTS = {
  },

  TARGET_DEFAULTS = {
    withMarker: true,
    highlight:  true,
    autoScroll: true
  },

  KLASS_VISIBLE     = 'with-guide',
  KLASS_OVERLAYED   = 'guide-with-overlay',
  KLASS_ENTITY      = 'guide-entity',
  KLASS_TARGET      = 'guide-target',
  KLASS_FOCUSED     = 'guide-target-focused',
  ENTITY_ZINDEX     = 100;

  _.extend(guide.prototype, {
    $container: $('body'),
    $el:        $('<div class="guide-js" />'),

    entityKlass: function() {
      return KLASS_ENTITY;
    },

    entityZIndex: function() {
      return ENTITY_ZINDEX;
    },

    constructor: function() {
      // Used for emitting custom events.
      this.$ = $(this);

      _.extend(this, {
        options: _.clone(DEFAULTS),
        tours:   [],
        extensions: [],
        tour: null,
        cTarget: null,
        pTarget: null,
        cursor:  -1
      });

      // A default tour
      this.tour = this.defineTour('Default Tour');
    },

    inactiveTours: function() {
      return _.without(this.tours, this.tour);
    },

    defineTour: function(label, optTargets) {
      var tour;

      if (!(tour = this.__getTour(label))) {
        tour = new Tour(label);
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

      if (!(tour = this.__getTour(id))) {
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

    setOptions: function(options) {
      _.merge(this.options, options);

      return this;
    },

    getOptions: function(overrides) {
      return _.extend(_.clone(this.options), overrides || {});
    },

    show: function(options) {
      var that    = this,
          options = this.getOptions(options),
          klasses = [ KLASS_VISIBLE ];

      if (!this.tour) {
        this.runTour(this.tours[0]);
      }

      if (options.withOverlay) {
        klasses.push(KLASS_OVERLAYED);
      }

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
        KLASS_VISIBLE,
        KLASS_OVERLAYED
      ].join(' '));

      this.tour.deactivate();

      if (this.cTarget) {
        this.cTarget.$el.removeClass(KLASS_FOCUSED);
      }

      this.$.triggerHandler('hide');

      return this;
    },

    toggle: function() {
      return this.isShown() ?
        this.hide.apply(this, arguments) :
        this.show.apply(this, arguments);
    },

    isShown: function() {
      return this.$container.hasClass(KLASS_VISIBLE);
    },

    dismiss: function(optTourId) {
      this.$.triggerHandler('dismiss');
    },

    /**
     * Focuses the next target, if any.
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
      var ln = this.tour.targets.length;

      return ln != 1 && this.cursor < ln-1;
    },

    prev: function() {
      if (!this.hasPrev()) {
        return false;
      }

      return this.focus(this.cursor - 1);
    },

    hasPrev: function() {
      var ln = this.tour.targets.length;

      return ln != 1 && this.cursor > 0;
    },

    first: function() {
      return this.focus(0);
    },

    last: function() {
      return this.focus(this.tour.targets.length-1);
    },

    /**
     *
     * @emit guide:defocus on the current (now previous) target, guide.pTarget.$el
     * @emit defocus [ prevTarget, currTarget, guide ] on guide.$
     *
     * @emit guide:focus on the next (now current) target, guide.cTarget.$el
     * @emit focus [ currTarget, guide ] on guide.$
     *
     * @return whether the target has been focused
     */
    focus: function(index) {
      var target  = this.__getTarget(index);

      if (!target) {
        throw "guide.js: bad target @ " + index + " to focus";
      }

      if (target == this.cTarget) {
        return false;
      }

      if (target.tour != this.tour) {
        this.runTour(target.tour);
      }

      this.pTarget = this.cTarget;
      this.cTarget = target;
      this.pCursor = this.cursor;
      this.cursor  = this.__idxTarget(target);

      // de-focus the last target
      if (this.pTarget) {
        this.pTarget.defocus(target);
        this.$.triggerHandler('defocus', [ this.pTarget, this.cTarget, this ]);
      }

      target.focus(this.pTarget);
      this.$.triggerHandler('focus', [ target, this ]);

      return true;
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
    __getTour: function(id) {

      return _.isString(id)
        ? _.find(this.tours || [], { id: id })
        : id;
    },

    __getTarget: function(index_or_el) {
      var index = index_or_el;

      if (typeof(index) == 'number') {
        return this.tour.targets[index];
      }
      else if (!index) {
        return null;
      }

      console.log('looking up target:', arguments)

      // return _.find(this.tour.targets || [], index);
      return index;
    },

    __idxTarget: function(target) {
      return _.indexOf(this.tour.targets, target);
    }
  }); // guide.prototype

  _.extend(Tour.prototype, {
    constructor: function(label) {
      _.extend(this, {
        id:       label,
        options:  {},
        targets:  []
      });

      console.log('guide.js: tour defined: ', this.id);

      return this;
    },

    addStep: function($el, options) {
      var index,
          target  = {},
          tour    = this;

      // has the target been already defined? we can not handle duplicates
      if ($el.data('guideling')) {
        console.log('guide.js: [error] duplicate target:');
        console.log($el);

        if (GRACEFUL) {
          return false;
        }

        throw "guide.js: duplicate target, see console for more information";
      }

      target = new Target({
        $el: $el,

        // the element that will be used as an indicator of the target's position
        // when scrolling the element into view, could be modified by extensions
        $scrollAnchor: $el,

        tour: tour,

        options: _.defaults(options || {}, TARGET_DEFAULTS)
      });

      index = tour.targets.push(target) - 1;

      $el.
        addClass(KLASS_ENTITY).
        data('guideling', target);

      if (guide.isShown()) {
        target.highlight();
      }

      guide.$.triggerHandler('add', [ target ]);

      return true;
    },

    activate: function() {
      _.each(this.targets, function(target) {
        target.highlight();
      });
    },

    isActive: function() {
      return this == guide.tour;
    },

    deactivate: function() {
      _.each(this.targets, function(target) {
        target.dehighlight();
      });
    }
  });

  _.extend(Target.prototype, {
    cursor: function() {
      return _.indexOf(this.tour.targets, this);
    },

    getCursor: function() {
      return this.cursor();
    },

    getText: function() {
      return this.options.text;
    },

    /** Whether the target has any text defined. */
    hasText: function() {
      return !!((this.getText()||'').length);
    },

    getCaption: function() {
      return this.options.caption;
    },

    /** Whether the target has a caption defined. */
    hasCaption: function() {
      return !!(this.getCaption()||'').length;
    },

    /** Whether the target has either a caption or text content. */
    hasContent: function() {
      return this.hasText() || this.hasCaption();
    },

    highlight: function() {
      this.$el.toggleClass('no-highlight', !this.options.highlight);
      this.$el.addClass(KLASS_TARGET);
    },

    dehighlight: function() {
      this.$el.removeClass(KLASS_TARGET);
    },

    focus: function(prev_target) {
      var $scroller = this.$scrollAnchor;

      this.$el
      .addClass(KLASS_FOCUSED)
      .triggerHandler('guide:focus', prev_target);

      if (this.options.autoScroll && !$scroller.is(":viewport_visible")) {

        _.defer(function() {
          $('html,body').animate({
            scrollTop: $scroller.offset().top * 0.9
          }, 250);
        })
      }
    },

    defocus: function(next_target) {
      this.$el
      .removeClass(KLASS_FOCUSED)
      .triggerHandler('guide:defocus', next_target);
    }
  });

  /**
   * Convenience method for adding a jQuery selector element as a guide target.
   *
   * @example
   *   $('#my_button').guide({
   *     text: "Click me to build your own nuclear reactor in just a minute. FREE."
   *   })
   *
   * @see guide#addTarget for more info on options.
   */
  $.fn.guide = function(options) {
    var options   = options || {},
        instance  = window.guide;

    if (!instance) {
      throw "guide.js: bad $.fn.guide call, global guide has not been setup, " +
            "have you forgotten to initialize guide.js?";
    }

    instance.addTarget($(this), options);

    return $(this);
  };

  window.guide = guide = new guide();
})(_, jQuery);