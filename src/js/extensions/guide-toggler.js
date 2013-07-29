(function(_, $, guide) {
  'use strict';

  var
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
      enabled: true
    },

    id: 'toggler',

    constructor: function() {
      this.options = _.defaults({}, this.defaults);

      this.$container = guide.$container;

      this.$el = $(JST({}));
      this.$el.addClass(guide.entityKlass());
      this.$indicator = this.$el.find('button');

      this.$el.on('click', '.show', _.bind(guide.show, guide));
      this.$el.on('click', '.hide', _.bind(guide.hide, guide));

      guide.$
      .on('show hide',  _.bind(this.update, this))
      .on('dismiss', _.bind(this.remove, this));

      this.show();

      return this;
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

    update: function() {
      if (guide.isShown()) {
        this.$indicator
          .text('Stop Tour')
          .removeClass('show')
          .addClass('hide');
      }
      else {
        this.$indicator
          .text('Tour')
          .removeClass('hide')
          .addClass('show');
      }

      this.$el.toggleClass('collapsed', !guide.isShown());
    },

    refresh: function(inOptions) {
      var options = inOptions || this.options;

      if (!options.enabled) {
        this.hide();
      } else {
        this.show();
      }
    }

  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);