(function(_, $, guide) {
  'use strict';
  var

  /**
   * @class Spot
   *
   * A tour spot represents an element in the DOM that will be visited in a
   * {@link Tour tour}.
   *
   * Spots contain text to be shown to the user to tell them about the element
   * they represent, and have a static position in the tour (their *index*.)
   */
  Spot = function() {
    return this.constructor.apply(this, arguments);
  },

  KLASS_TARGET  = 'gjs-spot',
  KLASS_FOCUSED = 'gjs-spot-focused';

  _.extend(Spot.prototype, guide.Optionable, {
    defaults: {

      /**
       * @cfg {Boolean} [withMarker=true]
       * Attach a Marker to this spot, if the Markers extension is enabled.
       */
      withMarker: true,

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
      noPositioningFix: false
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
         * This could be modified by extensions.
         */
        $scrollAnchor: $el,

        options: _.extend({}, this.defaults, options)
      });

      $el
        .addClass(guide.entityKlass())
        .data('gjs-spot', this);

      return this;
    },

    /**
     * Whether the spot is the current one being visited by the user.
     */
    isFocused: function() {
      return this.$el.hasClass(KLASS_FOCUSED);
    },

    isCurrent: function() {
      return this.tour.current === this;
    },

    getText: function() {
      return this.text;
    },

    hasText: function() {
      return !!((this.getText()||'').length);
    },

    getCaption: function() {
      return this.caption;
    },

    hasCaption: function() {
      return !!(this.getCaption()||'').length;
    },

    hasContent: function() {
      return this.hasText() || this.hasCaption();
    },

    /**
     * Check if the spot target is currently reachable in the DOM.
     */
    isAvailable: function() {
      return !!(this.$el.length);
    },

    isAttached: function() {
      return this.isAvailable() && this.$el.parent().length > 0;
    },

    /**
     * Check if the spot target is currently available *and* visible in the DOM.
     */
    isVisible: function() {
      return this.isAttached() && this.$el.is(':visible');
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
      klasses = [ KLASS_TARGET ],
      positionQuery;

      // If the target isn't valid (ie, hasnt been in the DOM), try refreshing
      // the selector to see if it's now available, otherwise we can't highlight.
      if (!this.isAvailable()) {
        this.__refreshTarget();
      }

      // Still not visible? Abort highlighting
      if (!this.isVisible() || !this.options.highlight) {
        return false;
      }

      if (!this.tour.getOptions().alwaysHighlight && !this.isCurrent()) {
        return false;
      }

      // Apply the positioning fix if the target is statically positioned;
      // to be able to properly highlight the target, it must be positioned
      // as one of 'relative', 'absolute', or 'fixed' so that we can apply
      // the necessary CSS style.
      if (!this.options.noPositioningFix &&
          !this.tour.hasOption('spots.noPositioningFix') &&
          !guide.hasOption('spots.noPositioningFix')) {

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
     *  Dehighlight regardless of any options that might otherwise be respected.
     */
    dehighlight: function(options) {
      if ((options||{}).force ||
          !this.tour.getOptions().alwaysHighlight) {

        this.$el.removeClass([
          KLASS_TARGET,
          'gjs-positioning-fix'
        ].join(' '));

        return true;
      }

      return false;
    },

    /**
     * Apply a CSS class to indicate that the spot is focused, and scroll it
     * into view if #autoScroll is enabled. The spot will also be implicitly
     * {@link #highlight highlighted}.
     *
     * @fires focus_gjs
     */
    focus: function(prev_spot) {
      var that      = this,
          callback  = this.options.onFocus,
          $scroller = this.$scrollAnchor;

      this.highlight();

      this
        .$el
          .addClass(KLASS_FOCUSED)
          /**
           * @event focus_gjs
           * Fired when a tour focuses a new spot.
           *
           * **This event is triggered on the Spot's #$el.**
           *
           * @param {jQuery.Event} event
           *  A default jQuery event.
           * @param {Spot} previousSpot
           *  The spot that was previously focused, if any.
           */
          .triggerHandler('focus.gjs', prev_spot);

      this.$.triggerHandler('focus');

      if (callback && _.isFunction(callback)) {
        callback.apply(this, arguments);
      }

      _.defer(function() {
        if (that.options.autoScroll && $scroller.length && !$scroller.is(':in_viewport')) {
          $('html,body').animate({
            scrollTop: $scroller.offset().top * 0.9
          }, 250);
        }
      });

      return this;
    },

    /**
     *
     */
    defocus: function(next_spot) {
      var callback = this.options.onDefocus;

      this.dehighlight();

      this.$el
        .removeClass(KLASS_FOCUSED)
        .triggerHandler('defocus.gjs', next_spot);

      if (callback && _.isFunction(callback)) {
        callback.apply(this, arguments);
      }

      this.$.triggerHandler('defocus');

      return this;
    },

    remove: function() {
      this.$.triggerHandler('remove');
      guide.$.triggerHandler('remove.spots', [ this ]);

      this.$el
        .removeData('gjs-spot')
        .removeClass([
          'no-highlight',
          KLASS_TARGET,
          KLASS_FOCUSED
        ].join(' '));
    },

    refresh: function() {
      if (!this.isVisible()) {
        this.__refreshTarget();
      }

      if (this.isFocused()) {
        return this.defocus().focus();
      }

      this.dehighlight();
      this.highlight();

      return this;
    },

    /**
     * @private
     */
    __refreshTarget: function() {
      this.$el = $(this.$el.selector);

      if (!this.$scrollAnchor ||
        // Could be set by an extension, like Markers, to something other than
        // the target $el, don't override it.
        !this.$scrollAnchor.length) {
        this.$scrollAnchor = this.$el;
      }

      return this.isAvailable();
    },

    setScrollAnchor: function($el) {
      this.$scrollAnchor = $el;
    },

    toString: function() {
      return this.tour.id + '#' + this.index;
    },

  });

  guide.Spot = Spot;
})(_, jQuery, window.guide);