(function(_, $, guide) {
  'use strict';

  var
  Extension = function() {
    return this.constructor();
  },

  Marker = function() {
    return this.constructor.apply(this, arguments);
  },

  /**
   * Plain markers that contain only the step cursor, no text, and no caption.
   */
  JST_PLAIN = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= cursor +1 %></span>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step cursor when not focused, and text otherwise.
   */
  JST_WITH_CONTENT = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= cursor +1 %></span>',
    '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step cursor when not focused, and both caption
   * and text otherwise.
   */
  JST_WITH_CAPTION = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= cursor +1 %></span>',
    '<h6 class="caption"><%= caption %></h6>',
    '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  DEFAULTS = {
    position:   'right',
    placement:  'inline',
    withText:   true,
    width:      'auto'
  },

  /* placement modes */
  PMT_INLINE = 1,
  PMT_SIBLING = 2,
  PMT_OVERLAY = 3,

  /* positioning grid */
  POS_TL  = 1,
  POS_T   = 2,
  POS_TR  = 3,
  POS_R   = 4,
  POS_BR  = 5,
  POS_B   = 6,
  POS_BL  = 7,
  POS_L   = 8,

  /**
   * Center node horizontally or vertically by applying negative margins.
   *
   * @param <jQuery object> $node the element to modify
   * @param <int> pos the position key
   *
   * Positions POS_T and POS_B will cause horizontal centering, while
   * positions POS_L and POS_R will cause vertical centering.
   *
   * @return null
   */
  hvCenter = function($node, pos) {
    var margin = 0, dir;

    switch(pos) {
      case POS_T:
      case POS_B:
        dir = 'left';
        margin = -1 * ($node.outerWidth() / 2);
      break;

      case POS_R:
      case POS_L:
        dir = 'top';
        margin = -1 * ($node.outerHeight() / 2);
      break;
    }

    $node.css('margin-' + dir, margin);
  },

  place_sibling = function($node, $anchor, pos, ml, mr) {
    // we must account for the target node's margin-[right,left] values;
    // ie, in any of the right positions, if the target has any margin-right
    // we must deduct enough of it to place the marker next to it, we do so
    // by applying negative margin-left by the computed amount
    //
    // same applies for left positions but in the opposite direction (margin-left)
    var delta = 0, dir;

    switch(pos) {
      case POS_TR:
      case POS_R:
      case POS_BR:
        var t_m = parseInt($anchor.css('margin-right'));

        if (t_m > 0) {
          // offset is the target margin without the marker margin
          delta = -1 * t_m + ml;
          dir = 'left';
        }
      break;

      case POS_TL:
      case POS_L:
      case POS_BL:
        var t_m = parseInt($anchor.css('margin-left'));

        if (t_m > 0) {
          // offset is target margin without marker margin (arrow dimension)
          delta = -1 * (t_m - mr);
          dir = 'right';
        }
      break;
    }

    if (delta != 0) {
      $node.css('margin-' + dir, delta);
    }

    return hvCenter($node, pos);
  },

  place_overlay = function($node, $anchor, pos) {
    var offset  = $anchor.offset(),
        t_w     = $anchor.outerWidth(),
        t_h     = $anchor.outerHeight(),
        h       = $node.outerHeight(),
        w       = $node.outerWidth(),
        arrow_d = 14;

    switch(pos) {
      case POS_TL:
        offset.top  -= h + arrow_d;
      break;
      case POS_T:
        offset.top  -= h + arrow_d;
        offset.left += t_w / 2 - ( (w - arrow_d) /2);
      break;
      case POS_TR:
        offset.top  -= h + arrow_d;
        offset.left += t_w - w;
      break;
      case POS_R:
        offset.top  += t_h / 2 - (h/2);
        offset.left += t_w + arrow_d;
      break;
      case POS_BR:
        offset.top  += t_h + arrow_d;
        offset.left += t_w - w;
      break;
      case POS_B:
        offset.top  += t_h + arrow_d;
        offset.left += t_w / 2 - ( (w - arrow_d) /2);
      break;
      case POS_BL:
        offset.top  += t_h + arrow_d;
      break;
      case POS_L:
        offset.top  += (t_h / 2) - (h/2);
        offset.left -= w + arrow_d;
      break;
    }

    $node.offset(offset);
  };

  /**
   * Marker implementation.
   */
  _.extend(Extension.prototype, {
    id: 'marker',

    constructor: function() {
      var that = this;

      guide.extensions.push(this);
      this.$container = guide.$el;

      guide.$
        .on('add', _.bind(this.addMarker, this))
        .on('show', _.bind(this.refresh, this))
        .on('hide', function() {
          _.each(guide.context.targets, function(t) {
            t.marker.hide();
          });
        })
        .on('focus', function(e, target) {
          target.marker.highlight();
        })
        .on('defocus', function(e, target) {
          target.marker.dehighlight();
        });

      return this;
    },

    addMarker: function(e, target, guide) {
      var marker = new Marker(target, this);

      marker.$el
        .addClass(guide.entityKlass())
        .on('click', _.bind(guide.focus, guide, target));

      if (guide.isShown()) {
        marker.show();
      }

      return marker;
    },

    refresh: function() {
      var that = this;

      if (!guide.isShown()) {
        return;
      }

      _.defer(function() {
        _.each(guide.context.targets, function(t) {
          t.marker.show();
        });
      });
    }
  }); // Extension.prototype

  _.extend(Marker.prototype, {
    constructor: function(target) {
      var index = target.cursor(),
          $el;

      this.target   = target;
      this.options  = _.defaults((target.options || {}).marker || {}, DEFAULTS);

      $el = $(this.build(target));
      $el.place = $.proxy(this.place, this);

      // expose the placement and position modes as classes for some CSS control
      $el.addClass([
        this.options.placement + '-marker',
        this.options.position
      ].join(' '));

      _.extend(this, {
        $el:      $el,
        $cursor:  $el.find('.index'),
        $caption: $el.find('.caption'),
        $text:    $el.find('.text')
      });

      if (this.placement == PMT_SIBLING) {
        var $t = target.$el;

        // the container must be relatively positioned
        var $container = $('<div />').css({
          display: $t.css('display'),
          position: 'relative'
        });

        $container.insertBefore($t);
        $t.appendTo($container);
        $el.appendTo($container);

        // we'll need these for positioning
        this.margin_right = parseInt($el.css('margin-right'));
        this.margin_left  = parseInt($el.css('margin-left'))
      }

      target.marker = this;

      return this;
    },

    /**
     * Build a string version of the DOM element of the marker.
     *
     * @param <Target> instance to build the marker for
     *
     * @return <string> the marker DOM element
     */
    build: function(target) {
      var template = JST_PLAIN;

      // if target has explicitly asked for no text, or doesn't have
      // any textual content, then we should respect the setting when
      // #highlight()-ed
      this.withText = this.options.withText && target.hasContent();

      // parse placement and position
      switch(this.options.placement) {
        case 'inline':  this.placement = PMT_INLINE; break;
        case 'sibling': this.placement = PMT_SIBLING; break;
        case 'overlay': this.placement = PMT_OVERLAY; break;
        default:
          throw 'guide-marker.js: bad placement "' + this.options.placement + '"';
      }

      switch(this.options.position) {
        case 'topleft':     this.position = POS_TL; break;
        case 'top':         this.position = POS_T; break;
        case 'topright':    this.position = POS_TR; break;
        case 'right':       this.position = POS_R; break;
        case 'bottomright': this.position = POS_BR; break;
        case 'bottom':      this.position = POS_B; break;
        case 'bottomleft':  this.position = POS_BL; break;
        case 'left':        this.position = POS_L; break;
        default:
          throw 'guide-marker.js: bad position "' + this.options.position + '"';
      }

      if (target.hasCaption()) {
        template = JST_WITH_CAPTION;
      }
      else if (target.hasText()) {
        template = JST_WITH_CONTENT;
      }

      return template({
        cursor:   target.getCursor(),
        text:     target.getText(),
        caption:  target.getCaption()
      });
    },

    show: function() {
      this.$el.place();
    },

    hide: function() {
      this.$el.detach();
    },

    highlight: function() {
      this.$el.addClass('focused');

      if (this.withText) {
        this.$text.show();
        this.$caption.show();
        this.$cursor.hide();
        this.$el.place();
      }

      // $('body').animate({
      //   scrollTop: this.$el.offset().top * 0.9
      // }, 250);
    },

    dehighlight: function(target) {
      this.$el.removeClass('focused');

      if (this.withText) {
        this.$text.hide();
        this.$caption.hide();
        this.$cursor.show();
        this.$el.place();
      }
    },

    place: function() {
      var $t      = this.target.$el,
          options = this.options;

      if (!$t || !$t.length || !$t.is(":visible")) {
        return this.hide();
      }

      this.__attach();

      // mark the target as being highlighted by a marker
      $t.addClass([
        'guide-target-' + options.placement,
        'guide-target-' + options.position
      ].join(' '));

      if (this.placement == PMT_INLINE) {
        hvCenter(this.$el, this.position);
      }
      else if (this.placement == PMT_SIBLING) {
        place_sibling(this.$el,
                      this.target.$el,
                      this.position,
                      this.margin_left,
                      this.margin_right);
      }

      else if (this.placement == PMT_OVERLAY) {
        place_overlay(this.$el, this.target.$el, this.position);
      }
    },

    // insert our DOM node at the appropriate position
    __attach: function() {
      switch(this.placement) {
        case PMT_INLINE:
          this.target.$el.append(this.$el);
        break;
        case PMT_SIBLING:
          var
          p       = this.position,
          method  = (p >= POS_TR && p <= POS_BR)
            ? 'after'
            : 'before';

          this.target.$el[method](this.$el);
        break;
        case PMT_OVERLAY:
          guide.$el.append(this.$el);
        break;
      }

      return this;
    },
  });

  Extension = new Extension();
})(_, jQuery, window.guide);