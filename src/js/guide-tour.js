(function(_, $, guide) {
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
        cursor: -1
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
    start: function() {
      var callback    = this.options.onStart,
          spotToFocus = this.current || this.spots[0];

      if (!guide.isShown()) {
        guide.runTour(this);

        return this;
      }

      _.each(this.spots, function(spot) {
        spot.highlight();
      });

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

      _.each(this.spots, function(spot) {
        spot.dehighlight({ force: true });
      });

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
      return this === guide.tour && guide.isShown();
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
     *
     * Look at Guide.Tour#addSpot for defining spots on a specific tour directly.
     */
    addSpot: function($el, options) {
      var spot;

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

      if (!spot) {
        throw 'guide.js: bad spot @ ' + index + ' to focus';
      }
      else if (spot.isFocused()) {
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

      // console.log('guide.js: visiting tour spot #', spot.index);

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