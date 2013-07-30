(function(_, $, guide) {
  'use strict';

  var
  Tour = function() {
    return this.constructor.apply(this, arguments);
  };

  _.extend(Tour.prototype, guide.Optionable, {
    defaults: {
      alwaysHighlight: true
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

      console.log('guide.js: tour defined: ', this.id);

      return this;
    },

    addSpot: function($el, options) {
      var spot;

      if (!($el instanceof jQuery)) {
        throw new Error('guide.js: bad Spot target, expected a jQuery object ' +
          'but got ' + typeof($el));
      }

      // has the spot been already defined? we can not handle duplicates
      if ($el.data('gjs_spot')) {
        console.log('guide.js: element is already bound to a tour spot:');
        console.log($el);

        throw new Error('guide.js: duplicate spot, see console for more information');
      }

      spot = new guide.Spot({
        $el: $el,
        // the element that will be used as an indicator of the spot's position
        // when scrolling the element into view, could be modified by extensions
        $scrollAnchor: $el,
        tour: this,
        index: this.spots.length
      }, options);

      this.spots.push(spot);

      $el.
        addClass(guide.entityKlass()).
        data('gjs_spot', spot);

      if (guide.isShown()) {
        spot.highlight();
      }

      guide.$.triggerHandler('add', [ spot ]);

      return spot;
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
      var spot  = this.getStep(index),
          i; // spot iterator

      if (!spot) {
        throw new Error('guide.js: bad spot @ ' + index + ' to focus');
      }
      else if (!spot.$el.is(':visible')) {
        // look for any spot that's visible and focus it instead
        for (i = 0; i < this.spots.length; ++i) {
          spot = this.spots[i];

          if (spot.$el.is(':visible')) {
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

      if (spot.isCurrent()) {
        return false;
      }

      if (!this.isActive()) {
        guide.runTour(this);
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
      guide.$.triggerHandler('focus', [ spot, this ]);

      console.log('guide.js: visiting tour spot #', spot.index);

      return true;
    },

    start: function() {
      if (!this.spots.length) {
        return this;
      }

      _.each(this.spots, function(spot) {
        spot.highlight();
      });

      this.focus(this.current || 0);

      return this;
    },

    stop: function() {
      _.each(this.spots, function(spot) {
        spot.dehighlight({ force: true });
      });

      return this;
    },

    isActive: function() {
      return guide.isShown() && this === guide.tour;
    },

    refresh: function() {
      if (this.isActive()) {
        this.stop().start();
      }
    },

    getStep: function(index_or_el) {
      var index = index_or_el;

      if (typeof(index) === 'number') {
        return this.spots[index];
      }
      else if (!index) {
        return null;
      }

      // console.log('looking up spot:', arguments)

      return _.find(this.spots || [], index);
    },

    indexOf: function(spot) {
      return _.indexOf(this.spots, spot);
    }
  });

  guide.Tour = Tour;

  // The default tour
  guide.tour = guide.defineTour('Default Tour');
})(_, jQuery, window.guide);