(function(_, $, Guide, undefined) {
  'use strict';

  var
  /**
   * @class Guide.Tour
   * @mixins Guide.Optionable
   *
   * A Guide.js tour is a collection of {@link Spot tour spots} which provides
   * an interface for navigating between the spots and focusing them.
   *
   * @alternateClassName Tour
   */
  Tour = function() {
    return this.constructor.apply(this, arguments);
  };

  _.extend(Tour.prototype, Guide.Optionable, {
    defaults: {
      /**
       * @cfg {Boolean} [alwaysHighlight=true]
       * Highlight all spots while the tour is active, as opposed to highlighting
       * only the focused spot.
       */
      alwaysHighlight: true,

      /**
       * @cfg {Boolean} [isDefault=false]
       * Guide.js will run the default tour if no tour is specified, and falls
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
          'default': _.merge({}, this.defaults, Guide.getOptions('tours'))
        },

        spots: [],

        // current and previous spots
        current:  null,
        previous: null,

        // a shortcut to the current spot's index
        cursor: -1,

        active: false
      });

      // console.log('Guide.js: tour defined: ', this.id);

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

      if (!Guide.isShown()) {
        Guide.runTour(this, options);

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
      Guide.$.triggerHandler('starting.tours', [ this ]);

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
      Guide.$.triggerHandler('start.tours', [ this ]);

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
       * **This event is triggered on `Guide.$`, the guide event delegator.**
       *
       * @param {Tour} tour This tour.
       */
      Guide.$.triggerHandler('stop.tours', [ this ]);

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
        throw 'Guide.js: bad Spot target, expected a jQuery object, ' + 'got ' + typeof($el);
      }

      spot = new Guide.Spot($el, this, this.spots.length, options);
      this.spots.push(spot);

      // Stop tracking it if it gets removed
      spot.$.on('remove', _.bind(this.__removeSpot, this));

      if (this.isActive()) {
        spot.highlight();
      }

      this.$.triggerHandler('add', [ spot ]);
      Guide.$.triggerHandler('add', [ spot ]);

      return spot;
    },

    addSpots: function(spots) {
      if (!_.isArray(spots)) {
        throw 'Guide.js: bad spots, expected Array,' + ' got: ' + typeof(spots);
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
        Guide.$.triggerHandler('add', [ spot ]);
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
        throw 'Guide.js: bad spot @ ' + index + ' to focus';
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
        Guide.log('tour: preparing spot ' + spot + ' for focusing.');
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
        Guide.$.triggerHandler('pre-focus', [ spot, this ]);

        // If the spot target isn't currently visible, we'll try to refresh
        // the selector in case the element has just been created, and if it still
        // isn't visible, we'll try finding any visible spot to focus instead.
        //
        // We'll give the spot a space of 10ms to refresh by default, otherwise
        // see #refreshInterval.
        if (spot.isOn('dynamic') && !spot.isVisible()) {
          Guide.log('tour: spot#' + (spot.index+1), 'isnt visible, attempting to refresh...');

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
              Guide.log('tour: \tspot is now visible, focusing.');
              return this.focus(spot);
            }
            // Or, look for an alternative:
            else if (spot.isOn('bouncable')) {
              Guide.log('tour: \tspot still isnt visible, looking for an alternative...');
              spot = this.__closest(spot, spot.getOption('bounce'));

              if (spot) {
                Guide.log('tour: \t\talternative found: ' + spot + ', focusing.');

                this._prepared = false;
                this.focus(spot);
              } else {
                Guide.log('tour: \t\tno alternative found, focusing aborted.');
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
      Guide.$.triggerHandler('focus', [ spot, this.previous ]);

      console.log('Guide.js: visiting tour spot #', spot.index+1);

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
      Guide.$.triggerHandler('defocus', [ this.current, nextSpot ]);

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
      else if (index instanceof Guide.Spot) {
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

  Guide.Tour = Tour;

  // The default tour
  Guide.tour = Guide.defineTour('Default Tour');
})(_, jQuery, window.Guide);