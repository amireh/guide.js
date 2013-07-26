(function(_, $, guide) {
  'use strict';
  var

  Target = function(attrs) {
    _.extend(this, attrs);

    this.options = _.defaults(attrs.options || {}, TARGET_DEFAULTS);

    return this;
  },

  KLASS_TARGET  = 'guide-target',
  KLASS_FOCUSED = 'guide-target-focused',

  TARGET_DEFAULTS = {
    withMarker: true,
    highlight:  true,
    autoScroll: true
  };

  _.extend(Target.prototype, {
    isCurrent: function() {
      return guide.cTarget == this;
    },

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

      if (this.tour.options.alwaysHighlight) {
        this.$el.addClass(KLASS_TARGET);
      }

      return this;
    },

    dehighlight: function() {
      this.$el.removeClass([
        this.tour.options.alwaysHighlight ? '' : KLASS_TARGET,
        KLASS_FOCUSED
      ].join(' '));

      return this;
    },

    focus: function(prev_target) {
      var $scroller = this.$scrollAnchor;

      this.$el
        .addClass([ KLASS_TARGET, KLASS_FOCUSED ].join(' '))
        .triggerHandler('focus.gjs', prev_target);

      if (this.options.autoScroll && !$scroller.is(":viewport_visible")) {

        _.defer(function() {
          $('html,body').animate({
            scrollTop: $scroller.offset().top * 0.9
          }, 250);
        })
      }
    },

    defocus: function(next_target) {
      this.dehighlight();

      this.$el.triggerHandler('defocus.gjs', next_target);
    }
  });

  guide.Target = Target;
})(_, jQuery, window.guide);