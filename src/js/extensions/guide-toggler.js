(function(_, $, guide) {
  'use strict';

  var
  /**
   * @class Guide.Toggler
   * @extends Guide.Extension
   *
   * A guide.js extension that installs a toggle button that plays and stops tours.
   */
  Extension = function() {
    return this.constructor();
  },

  JST = _.template([
    '<div id="gjs_toggler">',
      '<button></button>',
    '</div>'
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,

      /**
       * @cfg {Boolean} [resetOnStart=true]
       * Reset the current tour when the toggler is used to launch guide.js.
       */
      resetOnStart: true
    },

    id: 'toggler',

    constructor: function() {
      this.$container = guide.$container;

      this.$el = $(JST({}));
      this.$el.addClass(guide.entityKlass());
      this.$indicator = this.$el.find('button');

      this.$el.on('click', '.show', _.bind(this.launchTour, this));
      this.$el.on('click', '.hide', _.bind(guide.hide, guide));

      guide.$
      .on(this.nsEvent('showing'), _.bind(this.collapse, this))
      .on(this.nsEvent('hiding'), _.bind(this.expand, this))
      .on(this.nsEvent('dismiss'), _.bind(this.remove, this));

      return this;
    },

    install: function() {
      if (this.isEnabled()) {
        this.show().expand();
      }
    },

    show: function() {
      this.$el.appendTo(this.$container);

      return this;
    },

    hide: function() {
      this.$el.detach();

      return this;
    },

    remove: function() {
      this.$el.remove();
    },

    collapse: function() {
      this.$indicator
        .text('Stop Tour')
        .removeClass('show')
        .addClass('hide');

      this.$el.removeClass('collapsed');
    },

    expand: function() {
      this.$indicator
        .text('Tour')
        .removeClass('hide')
        .addClass('show');

      this.$el.addClass('collapsed');
    },

    refresh: function() {
      if (!this.isEnabled()) {
        this.hide();
      } else {
        this.show();
      }
    },

    launchTour: function() {
      if (this.isOn('resetOnStart')) {
        if (guide.tour) {
          guide.tour.reset();
        }
      }

      guide.show();
    }

  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);