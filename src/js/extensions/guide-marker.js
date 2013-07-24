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
  POS_L   = 8;

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
          _.each(guide.context.targets, that.hideMarker, that);
        })
        .on('focus', function(e, target) {
          target.marker.highlight();
          // return that.highlightTarget(target);
        })
        .on('defocus', function(e, target) {
          target.marker.dehighlight();
          // return that.dehighlightTarget(target);
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
      var $this   = this.$el,
          t       = this.target,
          $t      = this.target.$el,
          guide   = window.guide,
          options = this.options,
          // used for testing some placement / position combinations
          mode    = [ this.placement, this.position ];

      if (!$t.is(":visible")) {
        return this.hide();
      }

      // insert our DOM node at the appropriate position
      {
        var $node, method, p = this.position;

        switch(this.placement) {
          case PMT_INLINE:
            $node = $t;
            method = 'append';
          break;
          case PMT_SIBLING:
            method = (p >= POS_TR && p <= POS_BR)
            ? 'after'
            : 'before';

            $node = $t;
          break;
          case PMT_OVERLAY:
            $node = guide.$el;
            method = 'append';
          break;
        }

        $node[method]($this);
      }

      // mark the target as being highlighted by a marker
      $t.addClass([
        'guide-target-' + options.placement,
        'guide-target-' + options.position
      ].join(' '));

      if (_.isEqual([ PMT_INLINE, POS_T ], mode)) {
        // $this.offset({
        //   left: $t.outerWidth() / 2 - $this.outerWidth() / 2
        // });
      }
      else if (this.placement == PMT_SIBLING) {
        // we must account for the target node's margin-[right,left] values;
        // ie, in any of the right positions, if the target has any margin-right
        // we must deduct enough of it to place the marker next to it, we do so
        // by applying negative margin-left by the computed amount
        //
        // same applies for left positions but in the opposite direction (margin-left)
        var delta = 0, dir;

        switch(this.position) {
          case POS_TR:
          case POS_R:
          case POS_BR:
            var t_m = parseInt($t.css('margin-right'));

            if (t_m > 0) {
              // offset is the target margin without the marker margin
              delta = -1 * t_m + this.margin_left;
              dir = 'left';
            }
          break;

          case POS_TL:
          case POS_L:
          case POS_BL:
            var t_m = parseInt($t.css('margin-left'));

            if (t_m > 0) {
              // offset is target margin without marker margin (arrow dimension)
              delta = -1 * (t_m - this.margin_right);
              dir = 'right';
            }
          break;
        }

        if (delta != 0) {
          $this.css('margin-' + dir, delta);
        }
      }

      if (options.placement == 'overlay') {
        var offset  = $t.offset(),
            h       = $this.outerHeight(),
            arrow_d = 14,
            w       = $this.outerWidth();

        switch(options.position) {
          case 'top':
            offset.top  -= h + arrow_d;
            // offset.top  -= $t.outerHeight();
            // offset.left += $t.outerWidth() / 2 - (w/2);
            break;
          case 'bottom':
            offset.top  += $t.outerHeight() + arrow_d;
            // offset.left += $t.outerWidth() / 2 - (w/2);
            break;
          case 'left':
            // offset.top  += $t.outerHeight() / 2 - (h/2);
            offset.left -= w + arrow_d;
            break;
          case 'right':
            // offset.top  += $t.outerHeight() / 2 - (h/2);
            offset.left += $t.outerWidth() + arrow_d;
            break;
        }

        console.log('overlay marker: ', offset, ', target offset: ', $t.offset())
        $this.offset(offset);
      }

      return $this;
      // console.log('marker placement options:' , options)
    }
  });

  Extension = new Extension();
})(_, jQuery, window.guide);