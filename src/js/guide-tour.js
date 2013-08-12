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
      isDefault: false,

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
      onStop: null
    },

    constructor: function(label) {
      this.$ = $(this);

      _.extend(this, {
        id: label, // TODO: unique constraints on tour IDs

        options: _.extend({}, guide.options.tours, this.defaults),

        spots: [],

        // current and previous spots
        current:  null,
        previous: null,

        // a shortcut to the current spot's index
        cursor: -1,

        active: false
      });

      // console.log('guide.js: tour defined: ', this.id);

      if (_.isFunction(this.options.onStart)) {
        this.$.on('start.user', _.bind(this.options.onStart, this));
      }
      if (_.isFunction(this.options.onStop)) {
        this.$.on('stop.user', _.bind(this.options.onStop, this));
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
      options = _.defaults(options || {}, {
        // Set a default spot to focus if none was specified, we'll default to
        // the current one (if resuming) or the first.
        spot: this.current || this.spots[0]
      });

      if (!guide.isShown()) {
        guide.runTour(this, options);

        return false;
      }
      else if (this.isActive()) {
        return false;
      }

      this.active = true;

      // Ask the spots to highlight themselves if they should; see Spot#highlight
      _.invoke(this.spots, 'highlight');

      // Focus a spot if possible.
      if (options.spot) {
        this.focus(this.__getSpot(options.spot));
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

      // Has the spot been already defined? we can not handle duplicates
      // if ($el.data('gjs-spot')) {
        // throw 'guide.js: duplicate spot, see console for more information';
      // }

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
      return this.spots.length !== 1 && this.cursor > 0;
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
      var spot = this.__getSpot(index);

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

        this.previous = this.current;
        this.current = null;
      }

      if (_.isFunction(spot.options.preFocus)) {
        spot.options.preFocus.apply(spot, []);
      }

      spot.$.triggerHandler('pre-focus');
      this.$.triggerHandler('pre-focus', [ spot ]);
      guide.$.triggerHandler('pre-focus', [ spot, this ]);

      // If the spot target isn't currently visible, we'll try to refresh
      // the selector in case the element has just been created, and if it still
      // isn't visible, we'll try finding any visible spot to focus instead.
      if (!spot.isVisible()) {
        if (!spot.__refreshTarget() || !spot.isVisible()) {
          guide.log('tour: spot#' + spot.index, 'isnt visible, looking for one that is');

          spot = this.__closest(spot, spot.options.fallback);

          if (!spot) {
            return false;
          }

          return this.focus(spot);
        }
      }

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

    /**
     * Attempt to find the closest visible spot to the given one.
     *
     * @param {Number/String} [direction='forwards']
     * The first direction to seek a match in:
     *
     * - `forwards`: will look for spots that follow the anchor
     * - `backwards`: will look for spots that precede the anchor
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

        if (direction === 'backwards') {
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

      if (_.contains([ 'forwards', 'backwards' ], direction)) {
        return seek(direction);
      } else {
        if (this.spots.length > anchor && (spot = seek('forwards'))) {
          return spot;
        }

        if (anchor > 0 && (spot = seek('backwards'))) {
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
        return _.find(this.spots || [], index);
      }

      return null;
    },

    /**
     * @private
     */
    __removeSpot: function(e, spot) {
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