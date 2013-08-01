(function(_, $, guide) {
  'use strict';
  var

  Spot = function() {
    return this.constructor.apply(this, arguments);
  },

  KLASS_TARGET  = 'gjs-spot',
  KLASS_FOCUSED = 'gjs-spot-focused';

  _.extend(Spot.prototype, guide.Optionable, {
    defaults: {
      withMarker: true,
      highlight:  true,
      autoScroll: true
    },

    constructor: function(attributes, options) {
      _.extend(this, attributes, _.pick(options || {}, ['text','caption']), {
        options: _.extend({}, this.defaults, options)
      });

      this.$scrollAnchor = this.$el;

      if (!this.tour) {
        throw new Error('guide.js: expected #tour to be specified for a new Spot, got none');
      }

      return this;
    },

    isCurrent: function() {
      return this.tour.current === this;
    },

    getText: function() {
      return this.text;
    },

    /** Whether the spot has any text defined. */
    hasText: function() {
      return !!((this.getText()||'').length);
    },

    getCaption: function() {
      return this.caption;
    },

    /** Whether the spot has a caption defined. */
    hasCaption: function() {
      return !!(this.getCaption()||'').length;
    },

    /** Whether the spot has either a caption or text content. */
    hasContent: function() {
      return this.hasText() || this.hasCaption();
    },

    isVisible: function() {
      return this.$el.length && this.$el.is(':visible');
    },

    highlight: function() {
      var applicable =
        this.tour.getOptions().alwaysHighlight ||
        this.isCurrent();

      // the spot-scoped option takes precedence over the tour one
      if (!this.options.highlight) {
        applicable = false;
      }

      if (!this.$el.length) {
        this.$el = $(this.$el.selector);

        if (!this.$scrollAnchor || !this.$scrollAnchor.length) {
          this.$scrollAnchor = this.$el;
        }
      }

      this.$el.toggleClass('no-highlight', !applicable);
      this.$el.toggleClass(KLASS_TARGET, applicable);

      return this;
    },

    /**
     * Remove the highlight CSS classes on the spot $element.
     *
     * If the Tour option 'alwaysHighlight' is enabled, the spot will only
     * be de-focused, but will stay highlighted.
     *
     * @param <Object> options: {
     *  "force": <Boolean> will dehighlight regardless of any options that might
     *           be respected
     * }
     */
    dehighlight: function(options) {
      var applicable =
        (options||{}).force ||
        !this.tour.getOptions().alwaysHighlight;

      if (applicable) {
        this.$el.removeClass(KLASS_TARGET);
      }

      return this;
    },

    focus: function(prev_spot) {
      var that = this,
          $scroller = this.$scrollAnchor;

      this.highlight();

      this.$el
        .addClass(KLASS_FOCUSED)
        .triggerHandler('focus.gjs', prev_spot);

      _.defer(function() {
        if (that.options.autoScroll && !$scroller.is(':in_viewport')) {
          $('html,body').animate({
            scrollTop: $scroller.offset().top * 0.9
          }, 250);
        }
      });
    },

    defocus: function(next_spot) {
      var callback = this.options.onDefocus;

      this.dehighlight();

      this.$el.removeClass(KLASS_FOCUSED);
      this.$el.triggerHandler('defocus.gjs', next_spot);

      if (callback && _.isFunction(callback)) {
        callback.apply(this, arguments);
      }
    },

    refresh: function() {
      this.dehighlight();
      this.highlight();

      if (this.isCurrent()) {
        this.defocus();
        this.focus();
      }
    },

    setScrollAnchor: function($el) {
      this.$scrollAnchor = $el;
    },

    toString: function() {
      return this.tour.id + '#' + this.index;
    }
  });

  guide.Spot = Spot;
})(_, jQuery, window.guide);