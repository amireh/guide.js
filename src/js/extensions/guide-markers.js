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
   * Plain markers that contain only the step index, no text, and no caption.
   */
  JST_PLAIN = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= index +1 %></span>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and text otherwise.
   */
  JST_WITH_CONTENT = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= index +1 %></span>',
    '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and both caption
   * and text otherwise.
   */
  JST_WITH_CAPTION = _.template([
    '<div class="guide-marker">',
    '<span class="index"><%= index +1 %></span>',
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

  // insert our DOM node at the appropriate position
  attach = function(m) {
    switch(m.placement) {
      case PMT_INLINE:
        m.spot.$el.append(m.$el);
      break;
      case PMT_SIBLING:
        var
        p       = m.position,
        method  = (p >= POS_TR && p <= POS_BR)
          ? 'after'
          : 'before';

        m.spot.$el[method](m.$el);
      break;
      case PMT_OVERLAY:
        guide.$el.append(m.$el);
      break;
    }

    return m;
  },

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

  negateMargins = function($node, $anchor, pos, ml, mr) {
    // we must account for the spot node's margin-[right,left] values;
    // ie, in any of the right positions, if the spot has any margin-right
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
          // offset is the spot margin without the marker margin
          delta = -1 * t_m + ml;
          dir = 'left';
        }
      break;

      case POS_TL:
      case POS_L:
      case POS_BL:
        var t_m = parseInt($anchor.css('margin-left'));

        if (t_m > 0) {
          // offset is spot margin without marker margin (arrow dimension)
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

  snapTo = function($node, $anchor, pos, margin) {
    var
    offset  = $anchor.offset(),
    a_w     = $anchor.outerWidth(),
    a_h     = $anchor.outerHeight(),
    n_h     = $node.outerHeight(),
    n_w     = $node.outerWidth(),
    m       = margin || 15;

    switch(pos) {
      case POS_TL:
        offset.top  -= n_h + m;
      break;
      case POS_T:
        offset.top  -= n_h + m;
        offset.left += a_w / 2 - ( (n_w - m) /2);
      break;
      case POS_TR:
        offset.top  -= n_h + m;
        offset.left += a_w - n_w;
      break;
      case POS_R:
        offset.top  += a_h / 2 - (n_h/2);
        offset.left += a_w + m;
      break;
      case POS_BR:
        offset.top  += a_h + m;
        offset.left += a_w - n_w;
      break;
      case POS_B:
        offset.top  += a_h + m;
        offset.left += a_w / 2 - ( (n_w - m) /2);
      break;
      case POS_BL:
        offset.top  += a_h + m;
      break;
      case POS_L:
        offset.top  += (a_h / 2) - (n_h/2);
        offset.left -= n_w + m;
      break;
    }

    $node.offset(offset);
  };

  /**
   * Marker implementation.
   */
  _.extend(Extension.prototype, guide.Extension, {
    id: 'markers',

    constructor: function() {
      var that = this;

      guide.Tour.prototype.addOption('alwaysMark', true);

      // we must manually assign the options to the default tour as it has already
      // been created
      if (guide.tour) {
        guide.tour.addOption('alwaysMark', true);
      }

      this.$container = guide.$el;

      guide.$
        .on('add', _.bind(this.addMarker, this))
        .on('focus', function(e, spot) {
          spot.marker && spot.marker.highlight();
        })
        .on('defocus', function(e, spot) {
          spot.marker && spot.marker.dehighlight();
        });

      return this;
    },

    addMarker: function(e, spot) {
      var marker;

      if (!spot.options.withMarker) {
        return null;
      }

      marker = new Marker(spot, this);

      marker.$el
      .addClass(guide.entityKlass())
      .on('click.gjs-markers', function(e) {
        spot.tour.focus(spot);

        return $.consume(e);
      });

      if (guide.isShown() && spot.tour.isActive()) {
        marker.show();
      }
      else {
        marker.hide();
      }

      return marker;
    },

    refresh: function() {
      var that = this;

      if (!guide.isShown()) {
        return;
      }

      this.onTourStop(guide.tour);
      this.onTourStart(guide.tour);
    },

    onGuideShow: function() {
      return this.onTourStart(guide.tour);
    },

    onGuideHide: function() {
      return this.onTourStop(guide.tour);
    },

    onTourStart: function(tour) {
      // show markers for this tour
      _.defer(function() {
        _.each(tour.spots, function(t) {
          t.marker && t.marker.show();
        });
      });

      // listen to its option changes
      tour.$
      .on('refresh.gjs_markers', function(e, options) {
        _.each(tour.spots, function(t) {
          if (t.marker) {
            if (tour.options.alwaysMark) {
              t.marker.show();
            } else {
              !t.isCurrent() && t.marker.hide();
            }
          }
        });
      })
    },

    onTourStop: function(tour) {
      _.each(tour.spots, function(spot) {
        spot.marker && spot.marker.hide();
      });

      tour.$.off('refresh.gjs_markers');
    }
  }); // Extension.prototype

  _.extend(Marker.prototype, {
    constructor: function(spot) {
      var index = spot.index,
          $el;

      this.spot   = spot;

      // build the marker options
      this.options = _.defaults(
        {},
        // accept the spot options
        (spot.options || {}).marker,
        // the spot's tour options,
        (spot.tour.options || {}).marker,
        // and finally, the defaults
        DEFAULTS);

      $el       = $(this.build(spot));
      $el.place = $.proxy(this.place, this);

      // expose the placement and position modes as classes for some CSS control
      $el.addClass([
        this.options.placement + '-marker',
        this.options.position
      ].join(' '));

      _.extend(this, {
        $el:      $el,
        $index:  $el.find('.index'),
        $caption: $el.find('.caption'),
        $text:    $el.find('.text')
      });

      if (this.placement == PMT_SIBLING) {
        var $t = spot.$el;

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

      spot.marker = this;
      spot.$scrollAnchor = this.$el;

      return this;
    },

    /**
     * Build a string version of the DOM element of the marker.
     *
     * @param <Spot> instance to build the marker for
     *
     * @return <string> the marker DOM element
     */
    build: function(spot) {
      var template = JST_PLAIN;

      // if spot has explicitly asked for no text, or doesn't have
      // any textual content, then we should respect the setting when
      // #highlight()-ed
      this.withText = this.options.withText && spot.hasContent();

      this.min_width = this.options.width || DEFAULTS.width;

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

      if (spot.hasCaption()) {
        template = JST_WITH_CAPTION;
      }
      else if (spot.hasText()) {
        template = JST_WITH_CONTENT;
      }

      return template({
        index:    spot.index,
        text:     spot.getText(),
        caption:  spot.getCaption()
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

      guide.$.triggerHandler('marking.gjs_markers', [ this ]);

      if (this.withText) {
        this.$text.show();
        this.$caption.show();
        this.$index.hide();
        this.$el.css({
          width: this.min_width
        });

        this.show();
      }

      guide.$.triggerHandler('marked.gjs_markers', [ this ]);
    },

    dehighlight: function(spot) {
      this.$el.removeClass('focused');

      guide.$.triggerHandler('unmarking.gjs_markers', [ this ]);

      if (this.withText) {
        this.$text.hide();
        this.$caption.hide();
        this.$index.show();
        this.$el.css({
          width: 'auto'
        });

        this.$el.place();
      }

      if (!this.spot.tour.options.alwaysMark) {
        this.hide();
      }

      guide.$.triggerHandler('unmarked.gjs_markers', [ this ]);
    },

    place: function() {
      var $t      = this.spot.$el,
          options = this.options;

      if (!$t || !$t.length || !$t.is(":visible")) {
        return this.hide();
      }

      attach(this);

      // mark the spot as being highlighted by a marker
      $t.addClass([
        'guide-spot-' + options.placement,
        'guide-spot-' + options.position
      ].join(' '));

      if (this.placement == PMT_INLINE) {
        hvCenter(this.$el, this.position);
      }
      else if (this.placement == PMT_SIBLING) {
        negateMargins(this.$el,
                      this.spot.$el,
                      this.position,
                      this.margin_left,
                      this.margin_right);
      }

      else if (this.placement == PMT_OVERLAY) {
        snapTo(this.$el, this.spot.$el, this.position);
      }
    }
  });

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);