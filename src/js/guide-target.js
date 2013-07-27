(function(_, $, guide) {
  'use strict';
  var

  Target = function() {
    return this.constructor.apply(this, arguments);
  },

  KLASS_TARGET  = 'guide-target',
  KLASS_FOCUSED = 'guide-target-focused';

  _.extend(Target.prototype, guide.Optionable, {
    defaults: {
      withMarker: true,
      highlight:  true,
      autoScroll: true
    },

    constructor: function(attributes) {
      _.extend(this, {
        index: -1
      }, attributes);

      this.options = _.defaults(attributes.options || {}, this.defaults);

      return this;
    },

    isCurrent: function() {
      // return guide.cTarget == this;
      return this.tour.current == this;
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
      var applicable = this.tour.options.alwaysHighlight;

      // the target-scoped option takes precedence over the tour one
      if (!this.options.highlight) {
        applicable = false;
      }

      this.$el.toggleClass('no-highlight', !applicable);
      this.$el.toggleClass(KLASS_TARGET, applicable);

      return this;
    },

    /**
     * Remove the highlight CSS classes on the target $element.
     *
     * If the Tour option 'alwaysHighlight' is enabled, the target will only
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

    focus: function(prev_target) {
      var $scroller = this.$scrollAnchor;

      this.highlight();

      this.$el
        .addClass(KLASS_FOCUSED)
        .triggerHandler('focus.gjs', prev_target);

      if (this.options.autoScroll && !$scroller.is(":in_viewport")) {

        _.defer(function() {
          $('html,body').animate({
            scrollTop: $scroller.offset().top * 0.9
          }, 250);
        })
      }
    },

    defocus: function(next_target) {
      this.dehighlight();

      this.$el.removeClass(KLASS_FOCUSED);
      this.$el.triggerHandler('defocus.gjs', next_target);
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

  guide.Target = Target;
})(_, jQuery, window.guide);