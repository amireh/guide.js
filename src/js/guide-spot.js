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

    constructor: function(attributes) {
      this.options = _.defaults(attributes.options || {}, this.defaults);

      _.extend(this, {
        index: -1
      }, attributes, _.pick(this.options, [
        'text',
        'caption'
      ]));

      return this;
    },

    isCurrent: function() {
      // return guide.cSpot == this;
      return this.tour.current == this;
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

    highlight: function() {
      var applicable = this.tour.options.alwaysHighlight;

      // the spot-scoped option takes precedence over the tour one
      if (!this.options.highlight) {
        applicable = false;
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
     * Available options:
     *
     *   force: will dehighlight regardless of any options that might be respected
     *
     */
    dehighlight: function(options) {
      var applicable = (options||{}).force || !this.tour.options.alwaysHighlight;

      if (applicable) {
        this.$el.removeClass(KLASS_TARGET);
      }

      return this;
    },

    focus: function(prev_spot) {
      var $scroller = this.$scrollAnchor;

      this.highlight();

      this.$el
        .addClass(KLASS_FOCUSED)
        .triggerHandler('focus.gjs', prev_spot);

      if (this.options.autoScroll && !$scroller.is(":in_viewport")) {

        _.defer(function() {
          $('html,body').animate({
            scrollTop: $scroller.offset().top * 0.9
          }, 250);
        })
      }
    },

    defocus: function(next_spot) {
      this.dehighlight();

      this.$el.removeClass(KLASS_FOCUSED);
      this.$el.triggerHandler('defocus.gjs', next_spot);
    },

    refresh: function() {
      this.dehighlight();
      this.highlight();

      if (this.isCurrent()) {
        this.defocus();
        this.focus();
      }
    }
  });

  guide.Spot = Spot;
})(_, jQuery, window.guide);