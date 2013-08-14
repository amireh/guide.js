(function(_, $, guide) {
  'use strict';
  var

  /**
   * @class Guide.Spot
   *
   * A tour spot represents an element in the DOM that will be visited in a
   * {@link Tour tour}.
   *
   * Spots contain text to be shown to the user to tell them about the element
   * they represent, and have a static position in the tour (their *index*.)
   *
   * @alternateClassName Spot
   */
  Spot = function() {
    return this.constructor.apply(this, arguments);
  },

  KLASS_TARGET  = 'gjs-spot',
  KLASS_ENTITY  = guide.entityKlass(),
  KLASS_FOCUSED = 'gjs-spot-focused';

  _.extend(Spot.prototype, guide.Optionable, {
    defaults: {

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
      noPositioningFix: false,

      dynamic: true,

      /**
       * @cfg {Boolean} [disco=false]
       * A disco-lights highlighting effect on the spot target. Highlighting it
       * will not only shade it with an overlay, but also throw in a light particle
       * that dances around its borders.
       *
       * Very pretty for small, rectangular elements like buttons and panels.
       */
      disco: false,

      /**
       * @cfg {Boolean/'once'} [flashy=false]
       * Flash the target when it gets focus. Turn it red, then not, then red,
       * then not.
       *
       * Pair this with Spot#disco for maximum hackery.
       */
      flashy: false,

      /**
       * @cfg {Function} [preFocus=null]
       * A chance to prepare the Spot's target before being visited by the user.
       *
       * This callback should be used if the element is dynamically added to
       * the DOM and might not have been visible at the time the tour started.
       *
       * A few usage examples for this callback:
       *
       * - Backbone apps that use JavaScript routing, you can jump to a different
       *   view, or render it, where the target element will become visible.
       * - Show a dropdown-menu that contains a link or element that the spot
       *   represents
       *
       * This callback will be invoked with the spot object being `thisArg`,
       * and will also receive the spot object as its second parameter.
       */
      preFocus: null,

      /**
       * @cfg {Function} [onFocus=null]
       * Invoked when the Spot has been focused and the user is currently viewing it.
       *
       * A few usage example for this callback:
       *
       * - Show a dropdown-menu that's *related* to the context of the spot, unless
       *   the user has manually displayed it.
       * - Bind to events in your application that should cause the tour to advance
       *   to the next spot, or retreat to the previous one.
       *
       * See #onDefocus for a chance to clean up things you've done in this phase.
       *
       * This callback will be invoked with the spot object being `thisArg`,
       * and will also receive the spot object as its second parameter.
       */
      onFocus: null,

      /**
       * @cfg {Function} [onDefocus=null]
       * Invoked when the Spot is no longer focused.
       *
       * You can use this callback to do any necessary clean-ups for things you've
       * done in earlier callbacks.
       *
       * This callback will be invoked with the spot object being `thisArg`,
       * and will also receive the spot object as its second parameter.
       */
      onDefocus: null
    },

    templates: {
      disco: _.template('<div class="gjs-spot-disco"></div>'),
      flashy: _.template('<div class="gjs-spot-flashy"></div>')
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

        /**
         * @property {jQuery} $
         * An event delegator, used for emitting custom events and intercepting them.
         *
         * See Guide#$ for details.
         */
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
         * This could be modified by extensions. Use #setScrollAnchor for overriding.
         */
        $scrollAnchor: $el,

        options: _.extend({}, this.defaults, tour.options.spots, options)
      });

      if (this.options.disco) {
        this.$disco = $(this.templates.disco({}));
      }
      if (this.options.flashy) {
        this.$flashy = $(this.templates.flashy({}));
        if (this.options.flashy === 'once') {
          this.$flashy.addClass('flash-once');
        }
      }

      // Install handlers that were passed manually for convenience.
      if (_.isFunction(options.preFocus)) {
        // This is triggered by the tour itself in #focus as the spot has no
        // control at that stage yet.
        //
        // See Tour#focus.
        this.$.on('pre-focus.user', _.bind(options.preFocus, this));
      }
      if (_.isFunction(options.onFocus)) {
        this.$.on('focus.user', _.bind(options.onFocus, this));
      }
      if (_.isFunction(options.onDefocus)) {
        this.$.on('defocus.user', _.bind(options.onDefocus, this));
      }

      return this;
    },

    /**
     * Whether the spot is the current one being visited by the user.
     */
    isFocused: function() {
      return this.$el.hasClass(KLASS_FOCUSED);
    },

    /**
     * Whether the spot is currently highlighted in the tour.
     */
    isHighlighted: function() {
      return this.$el.hasClass(KLASS_TARGET);
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
     * Check if the target is currently existent *and* visible in the DOM.
     */
    isVisible: function() {
      return this.$el.length && this.$el.is(':visible');
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
      klasses = [ KLASS_TARGET, KLASS_ENTITY ],
      positionQuery;

      // If the target isn't valid (ie, hasnt been in the DOM), try refreshing
      // the selector to see if it's now available, otherwise we can't highlight.
      if (!this.isVisible()) {
        this.__refreshTarget();

        // Still not visible? Abort highlighting
        if (!this.isVisible()) {
          return false;
        }
      }

      if (!this.options.highlight) {
        return false;
      }
      else if (!this.tour.options.alwaysHighlight && !this.__isCurrent()) {
        return false;
      }

      // Apply the positioning fix if the target is statically positioned;
      // to be able to properly highlight the target, it must be positioned
      // as one of 'relative', 'absolute', or 'fixed' so that we can apply
      // the necessary CSS style.
      if (!this.options.noPositioningFix &&
          !this.tour.isOptionOn('spots.noPositioningFix') &&
          !guide.isOptionOn('spots.noPositioningFix')) {

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
     * Dehighlight regardless of any options that might otherwise be respected.
     */
    dehighlight: function(options) {
      options = _.defaults(options || {}, {
        force: false
      });

      if (options.force || !this.tour.options.alwaysHighlight) {
        this.$el.removeClass([
          KLASS_TARGET,
          KLASS_ENTITY,
          'gjs-positioning-fix'
        ].join(' '));

        return true;
      }

      return false;
    },

    /**
     * Apply a CSS class to indicate that the spot is focused, and scroll it
     * into view if #autoScroll is enabled. The spot will also be implicitly
     * {@link #cfg-highlight highlighted}.
     *
     * @fires focus
     * @fires focus_gjs
     */
    focus: function(prev_spot) {
      this.highlight();

      if (this.options.disco) {
        this.$disco.appendTo(this.$el);
      }

      if (this.options.flashy) {
        this.$flashy.appendTo(this.$el);
      }

      this.$el
        .addClass(KLASS_FOCUSED)
        /**
         * @event focus_gjs
         * Fired when a tour focuses a new spot.
         *
         * **This event is triggered on the Spot#$el.**
         *
         * @param {jQuery.Event} event
         * A default jQuery event.
         * @param {Spot} elementSpot
         * The spot this element is represented by.
         * @param {Spot} previousSpot
         * The spot that was previously focused, if any.
         */
        .triggerHandler('focus.gjs', [ this, prev_spot ]);


      this.$.triggerHandler('focus', [ this, prev_spot ]);

      if (this.options.autoScroll) {
        _.defer(_.bind(this.scrollIntoView, this));
      }

      return this;
    },

    /**
     * Restore the target as if it was not focused by this spot.
     *
     * @param  {Spot} nextSpot
     * The spot that will be focused once this loses focus.
     */
    defocus: function(nextSpot) {
      this.dehighlight();

      if (this.$disco) {
        this.$disco.detach();
      }
      if (this.$flashy) {
        this.$flashy.detach();
      }

      this.$el.removeClass(KLASS_FOCUSED);

      this.$.triggerHandler('defocus', [ this, nextSpot ]);
      this.$el.triggerHandler('defocus.gjs', [ this, nextSpot ]);

      return this;
    },

    /**
     * Scrolls the spot into view so that the user sees it.
     *
     * The element that is used to tell whether the spot is not currently visible,
     * and thus should be scrolled to, can be overridden in #setScrollAnchor.
     *
     * This method respects Guide#withAnimations in animating the scrolling,
     * and uses jQuery#in_viewport to test the element's visibility.
     *
     * @async
     */
    scrollIntoView: function() {
      if (!this.$scrollAnchor ||
          !this.$scrollAnchor.length ||
          this.$scrollAnchor.is(':in_viewport')) {
        return false;
      }

      $('html, body').animate({
        scrollTop: this.$scrollAnchor.offset().top * 0.9
      }, guide.options.withAnimations ? 250 : 0);

      return true;
    },

    /**
     * Unlink the Spot from its target, restoring any attributes that might
     * have been modified by the spot.
     */
    remove: function() {
      guide.log('Spot ' + this + ' is being removed.');

      /**
       * @event remove
       *
       * Fired when the spot is being entirely removed from a tour. Once a spot
       * is removed, its target must be _completely_ restored as if guide.js has
       * never been shown.
       *
       * Use this callback to clean-up any DOM mods.
       *
       * **This event is triggered on the Spot delegator, Spot#$.**
       */
      this.$.triggerHandler('remove', [ this ]);

      if (this.isFocused()) {
        this.defocus();
      }

      this.dehighlight({ force: true });

      // Remove all handlers and invalidate all properties
      this.$.off();
      this.$el = this.$scrollAnchor = this.$ = this.tour = null;
      this.index = -1;

      return this;
    },

    /**
     * Refresh the target selector, re-focus if Spot is focused, otherwise
     * re-highlight if applicable.
     */
    refresh: function() {
      if (!this.isVisible()) {
        this.__refreshTarget();
      }

      if (this.isFocused()) {
        this.defocus();
        this.focus();

        return this;
      }

      if (this.isHighlighted()) {
        this.dehighlight();
        this.highlight();
      }

      return this;
    },

    setScrollAnchor: function($el) {
      this.$scrollAnchor = $el;
    },

    /**
     * @private
     */
    __refreshTarget: function() {
      if (this.$el.selector.length) {
        this.$el = $(this.$el.selector);

        if (!this.$scrollAnchor ||
            // Could be set by an extension, like Markers, to something other than
            // the target $el, don't override it.
            !this.$scrollAnchor.length ||
            !this.$scrollAnchor.is(':visible')) {
          this.setScrollAnchor(this.$el);
        }
      }

      return this.isVisible();
    },

    /**
     * @private
     */
    __isCurrent: function() {
      return this.tour.current === this;
    },

    /**
     * @private
     */
    toString: function() {
      return this.tour.id + '#' + this.index;
    },
  });

  guide.Spot = Spot;

  /**
   * @event focus
   * @inheritdoc Tour#focus
   */

  /**
   * @event defocus
   * @inheritdoc Tour#defocus
   */

  /**
   * @event pre-focus
   * @inheritdoc Tour#pre-focus
   */
})(_, jQuery, window.guide);