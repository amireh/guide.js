(function(_, $, guide) {
  'use strict';

  var
  Extension = function() {
    return this.constructor();
  },

  JST_TUTOR = _.template([
    '<div>',
    // '<button id="gjs_close_tutor">&times;</button>',

    '<div class="navigation">',
      '<button class="bwd"></button>',
      '<span></span>',
      '<button class="fwd"></button>',
    '</div>',

    '<div class="content"></div>',
    '</div>'
  ].join('')),

  JST_SPOT = _.template([
    '<div>',
    '<% if (spot.hasCaption()) { %>',
      '<h6 class="caption"><%= spot.getCaption() %></h6>',
    '<% } %>',
    '<div><%= spot.getText() %></div>',
    '</div>'
  ].join(''), null, { variable: 'spot' });

  _.extend(Extension.prototype, guide.Extension, {
    id: 'tutor',

    defaults: {
      spanner: false
    },

    constructor: function() {
      var that = this;

      this.$container = guide.$el;

      this.$el = $(JST_TUTOR({}));

      this.$el.attr({
        'id': 'gjs_tutor',
        'class': guide.entityKlass()
      });

      _.extend(this, {
        $content: this.$el.find('> .content'),
        $nav: this.$el.find('> .navigation'),
        $close_btn: this.$el.find('#gjs_close_tutor'),
        $bwd: this.$el.find('.bwd'),
        $fwd: this.$el.find('.fwd')
      });

      guide.$
      .on('show', _.bind(this.show, this))
      .on('hide', _.bind(this.hide, this))
      .on('dismiss', _.bind(this.remove, this))
      .on('focus', _.bind(this.focus, this))
      .on('start.tours', function(e, tour) {
        if (tour.current) {
          that.focus(e, tour.current, tour);
        }
      });

      this.$close_btn.on('click', _.bind(guide.hide, guide));

      this.$nav.on('click','.bwd', function() {
        guide.tour.prev()
      });
      this.$nav.on('click','.fwd', function() {
        guide.tour.next();
      });

      return this;
    },

    show: function(e) {
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

    toggle: function() {
      return this.$el.parent().length ?
        this.hide.apply(this, arguments) :
        this.show.apply(this, arguments);
    },

    refresh: function() {
      this.$el.toggleClass('spanner', this.options.spanner);
    },

    focus: function(e, spot, tour) {
      var left = tour.previous && tour.previous.index > tour.cursor,
          $number;

      this.$content.html(JST_SPOT(spot));

      $number  = this.$nav.find('span');

      $number
      .stop(true, true)
      .animate({ 'text-indent': (left ? '' : '-') + '50px' }, 'fast', function() {
          $number.html(tour.cursor+1);
          $number
            .css({ 'text-indent': (left ? '-' : '') + '50px' }, 'fast')
            .animate({ 'text-indent': "0" }, 'fast');
      });

      this.$bwd.toggleClass('disabled', !tour.hasPrev());
      this.$fwd.toggleClass('disabled', !tour.hasNext());

      return true;
    },
  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);