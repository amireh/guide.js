(function(_, $, guide) {
  'use strict';

  var
  extension = function() {
    return this.constructor();
  },

  JST_PLAIN = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= cursor +1 %></span>',
    '</div>'
  ].join('')),

  JST_WITH_CONTENT = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= cursor +1 %></span>',
    '<div class="content"></div>',
    '</div>'
  ].join('')),

  JST_WITH_CAPTION = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= cursor +1 %></span>',
    '<h6 class="caption"><%= caption %></h6>',
    '<div class="content"></div>',
    '</div>'
  ].join('')),

  hasOption = function(target, option) {
    return  (target.options.marker || {})[option] || // target-specific options
            // target context options
            (target.context.options.marker || {})[option] ||
            // guide.js instance options
            (guide.options.marker || {})[option];
  },

  DEFAULTS = {
    position:   'right',
    placement:  'inline',
    withText:   true,
    width:      'auto'
  };

  _.extend(extension.prototype, {
    id: 'marker',

    constructor: function() {
      var that = this;

      guide.extensions.push(this);
      this.$container = guide.$el;

      guide.$
      .on('target:add', _.bind(this.addMarker, this))
      .on('show', _.bind(this.refresh, this))
      .on('hide', function() {
        _.each(guide.context.targets, that.hideMarker, that);
      })
      .on('focus', function(e, target) {
        return that.highlightTarget(target);
      })
      .on('defocus', function(e, target) {
        return that.dehighlightTarget(target);
      });

      return this;
    },

    mkMarker: function(index, target) {
      var template = JST_PLAIN;

      if (target.hasCaption()) {
        template = JST_WITH_CAPTION;
      }
      else if (target.hasText()) {
        template = JST_WITH_CONTENT;
      }

      return template(_.extend({}, target.options, {
        cursor: index
      }));
    },

    addMarker: function(e, target, guide) {
      var index = _.indexOf(target.context.targets, target),
          $el;

      target.options.marker = target.options.marker || {};
      _.defaults(target.options.marker, DEFAULTS);

      $el = $(this.mkMarker(index, target));
      $el.place = this.place;

      target.marker = {
        $el:      $el,
        $cursor:  $el.find('.index')
      };

      if (hasOption(target, 'withText')) {
        _.extend(target.marker, {
          $caption: $el.find('.caption'),
          $content: $el.find('.content')
        });
      }

      $el
        .data('target', target)
        .data('guide',  guide)
        .addClass(guide.entityKlass())
        .on('click', _.bind(guide.focus, guide, target));

      if (guide.isShown()) {
        this.showMarker(target);
      }
    },

    showMarker: function(target) {
      // target.marker.$el.css({
      //   opacity: 1
      // }).place(target.options.marker || {});

      target.marker.$el.place(target.options.marker || {});
    },

    hideMarker: function(target) {
      // target.marker.$el.animate({
      //   opacity: 'hide'
      // });
      // target.marker.$el.css({
      //   opacity: 0
      // });
      target.marker.$el.detach();
    },

    refresh: function() {
      var that = this;

      if (!guide.isShown()) {
        return;
      }

      _.defer(function() {
        _.each(guide.context.targets, that.showMarker, that);
      });
    },

    highlightTarget: function(target) {
      target.marker.$el.addClass('focused');

      if (hasOption(target, 'withText') && target.hasText()) {
        target.marker.$content.html(target.options.text);
        target.marker.$caption.show();
        target.marker.$cursor.hide();
        target.marker.$el.place(target.options.marker || {});
      }
    },

    dehighlightTarget: function(target) {
      target.marker.$el.removeClass('focused');

      if (hasOption(target, 'withText') && target.hasText()) {
        target.marker.$content.empty();
        target.marker.$caption.hide();
        target.marker.$cursor.show();
        target.marker.$el.place(target.options.marker || {});
      }
    },

    place: function(options) {
      var $this = $(this),
          t     = $this.data('target'),
          guide = $this.data('guide'),
          options = options || {},
          attrs = {
            // 'z-index': guide.entityZIndex() + 1
          };


      if (!t.$el.is(":visible")) {
        return guide.getExtension('marker').hideMarker(t);
      }

      _.defaults(options, DEFAULTS);

      switch(options.placement) {
        case 'inline':
          t.$el.append($this);
          $this.addClass('inline-marker');
        break;

        case 'sibling':
          var method = 'before';
          if (_.indexOf([ '', 'right' ], options.position) > -1) {
            method = 'after';
          }

          t.$el[method]($this);
          $this.addClass('sibling-marker');
        break;

        case 'overlay':
          // $this.appendTo(this.$container).addClass('marked-overlay');
          $this.appendTo(guide.$el);
          $this.addClass('overlay-marker');
        break;

        default:
          throw 'guide-marker.js: bad placement "' + options.placement + '"';
      }

      $this.css(attrs).addClass(options.position);
      t.$el.addClass([
        'guide-target-' + options.placement,
        'guide-target-' + options.position
      ].join(' '));

      if (options.placement == 'inline') {
        var o = {};

        if (options.position == 'top') {
          o.left = t.$el.outerWidth() / 2 - $this.outerWidth() / 2
        };

        // $this.offset(o)
      }
      else if (options.placement == 'sibling') {
        t.$el.parent().css({
          position: 'relative'
        })

        switch(options.position) {
          case 'right':
            var margin = parseInt(t.$el.css('margin-right'));
            if (margin > 0) {
              var my_margin = parseInt($this.data('original_ml') || $this.css('margin-left'));

              if (!$this.data('original_ml')) {
                $this.data('original_ml', my_margin);
              }

              $this.css('margin-left', -1 * margin + my_margin );
            }
          break;
          case 'left':
            var m_offset = $this.offset(),
                m_w = $this.outerWidth(),
                m_m = parseInt($this.css('margin-right')),
                t_m = parseInt(t.$el.css('margin-left')),
                delta = t_m - (m_w + m_m);

            if (delta < 0) {
              // $this.
            }
            else {
              $this.css({
                'margin-left': delta
              })
            }
            // if (margin > 0) {
            //   var my_margin = parseInt($this.css('margin-right'))
            //   $this.css('margin-left', margin - my_margin );
            // }
          break;

        }
      }

      if (options.placement == 'overlay') {
        var offset  = t.$el.offset(),
            h       = $this.outerHeight(),
            arrow_d = 14,
            w       = $this.outerWidth();

        switch(options.position) {
          case 'top':
            offset.top  -= h + arrow_d;
            // offset.top  -= t.$el.outerHeight();
            // offset.left += t.$el.outerWidth() / 2 - (w/2);
            break;
          case 'bottom':
            offset.top  += t.$el.outerHeight() + arrow_d;
            // offset.left += t.$el.outerWidth() / 2 - (w/2);
            break;
          case 'left':
            // offset.top  += t.$el.outerHeight() / 2 - (h/2);
            offset.left -= w + arrow_d;
            break;
          case 'right':
            // offset.top  += t.$el.outerHeight() / 2 - (h/2);
            offset.left += t.$el.outerWidth() + arrow_d;
            break;
        }

        console.log('overlay marker: ', offset, ', target offset: ', t.$el.offset())
        $this.offset(offset);
      }

      return $this;
      // console.log('marker placement options:' , options)
    }
  }); // extension.prototype

  extension = new extension();
})(_, jQuery, window.guide);