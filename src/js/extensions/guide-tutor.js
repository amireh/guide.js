(function(_, $, guide) {
  'use strict';

  var
  /**
   * @class Guide.Tutor
   * @extends Guide.Extension
   * @singleton
   *
   * A widget that displays the focused spot's content in a static
   * place on the bottom of the page.
   */
  Extension = function() {
    return this.constructor();
  },

  JST_TUTOR = _.template([
    '<div id="gjs_tutor">',
    '<div class="tutor-navigation">',
      '<button class="bwd"></button>',
      '<span></span>',
      '<button class="fwd"></button>',
    '</div>',
    '<div class="tutor-content"></div>',
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
      enabled: true,
      spanner: false
    },

    constructor: function() {
      this.$container = guide.$el;

      this.$el = $(JST_TUTOR({}));

      this.$el.attr({
        'class': guide.entityKlass()
      });

      _.extend(this, {
        $content: this.$el.find('> .tutor-content'),
        $nav: this.$el.find('> .tutor-navigation'),
        // $close_btn: this.$el.find('#gjs_close_tutor'),
        $bwd: this.$el.find('.bwd'),
        $fwd: this.$el.find('.fwd')
      });

      guide.$.on('dismiss', _.bind(this.remove, this));

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

    refresh: function() {
      var tour = guide.tour,
          options = this.getOptions();

      this.$el.toggleClass('spanner', options.spanner);

      if (tour && tour.isActive() && tour.current) {
        this.focus(null, tour.current);
      }
    },

    onTourStart: function(tour) {
      this.refresh();

      tour.$.on(this.nsEvent('focus'), _.bind(this.focus, this));

      this.$nav
        .on('click','.bwd', _.bind(tour.prev, tour))
        .on('click','.fwd', _.bind(tour.next, tour));

      this.show();
    },

    onTourStop: function(tour) {
      this.hide();

      this.$nav.off('click');
      tour.$.off(this.nsEvent('focus'));
    },

    focus: function(e, spot) {
      var tour = spot.tour,
          left = tour.previous && tour.previous.index > tour.cursor,
          anim_dur = 'fast', // animation duration
          anim_offset = '50px',
          $number;

      if (spot === this.spot) {
        return;
      }

      if (!spot) {
        throw 'guide.js: no spot?';
      }

      this.$content.html(JST_SPOT(spot));

      $number  = this.$nav.find('span');

      $number
        .stop(true, true) // kill the current animation if user clicks too fast
        .animate({
            'text-indent': (left ? '' : '-') + anim_offset
          },
          anim_dur,
          function() {
            $number.html(tour.cursor+1);
            $number
              .css({ 'text-indent': (left ? '-' : '') + anim_offset }, anim_dur)
              .animate({ 'text-indent': 0 }, anim_dur);
          });

      this.$bwd.toggleClass('disabled', !tour.hasPrev());
      this.$fwd.toggleClass('disabled', !tour.hasNext());

      this.spot = spot;

      return true;
    },
  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);