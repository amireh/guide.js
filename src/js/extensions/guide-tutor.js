(function(_, $, guide) {
  'use strict';

  var
  tutor = function() {
    return this.constructor();
  },

  JST = _.template([
    '<div>',
    '<h6 class="caption"><%= data.options.caption %></h6>',
    '<div><%= data.options.text %></div>',
    '</div>'
  ].join(''), null, { variable: 'data' });

  _.extend(tutor.prototype, {
    id: 'tutor',

    constructor: function() {
      var that = this;

      guide.addExtension(this);

      this.$container = guide.$container;

      this.$el = $([
        '<div>',
        '<button id="guide_close_tutor">close</button>',

        '<div class="navigation">',
          '<button class="bwd"></button>',
          '<span></span>',
          '<button class="fwd"></button>',
        '</div>',

        '<div class="content"></div>',
        '</div>'
      ].join(''));

      this.$el.attr({
        'id': 'guide_tutor',
        'class': guide.entityKlass()
      });

      _.extend(this, {
        $content: this.$el.find('> .content'),
        $nav: this.$el.find('> .navigation'),
        $close_btn: this.$el.find('#guide_close_tutor'),
        $bwd: this.$el.find('.bwd'),
        $fwd: this.$el.find('.fwd')
      });

      guide.$
      .on('show', _.bind(this.show, this))
      .on('hide', _.bind(this.hide, this))
      .on('dismiss', _.bind(this.remove, this))
      .on('focus', _.bind(this.focus, this))
      .on('activate.tours', function(e, tour) {
        if (tour.current) {
          that.focus(e, tour.current, tour);
        }
      })

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

    focus: function(e, target, tour) {
      var left = (tour.pCursor || -1) > tour.cursor,
          $caption,
          $number;

      this.$content.html(JST(target));

      $caption = this.$content.find('.caption');
      $number  = this.$nav.find('span');
      $caption.toggle(!$caption.is(":empty"));

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

  tutor = new tutor();
})(_, jQuery, window.guide);