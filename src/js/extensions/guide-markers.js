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
    '<div class="gjs-marker">',
    '<span class="index"><%= index +1 %></span>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and text otherwise.
   */
  JST_WITH_CONTENT = _.template([
    '<div class="gjs-marker">',
    '<span class="index"><%= index +1 %></span>',
    '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and both caption
   * and text otherwise.
   */
  JST_WITH_CAPTION = _.template([
    '<div class="gjs-marker">',
    '<span class="index"><%= index +1 %></span>',
    '<h6 class="caption"><%= caption %></h6>',
    '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

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
        method  = (p >= POS_TR && p <= POS_BR) ?
          'after' :
          'before';

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
    // same applies to left positions but in the opposite direction (margin-left)
    var delta = 0, dir, t_m;

    switch(pos) {
      case POS_TR:
      case POS_R:
      case POS_BR:
        t_m = parseInt($anchor.css('margin-right'), 10);

        if (t_m > 0) {
          // offset is the spot margin without the marker margin
          delta = -1 * t_m + ml;
          dir = 'left';
        }
      break;

      case POS_TL:
      case POS_L:
      case POS_BL:
        t_m = parseInt($anchor.css('margin-left'), 10);

        if (t_m > 0) {
          // offset is spot margin without marker margin (arrow dimension)
          delta = -1 * (t_m - mr);
          dir = 'right';
        }
      break;
    }

    if (delta !== 0) {
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
        offset.left += a_w / 2 - n_w / 2;
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
        offset.left += a_w / 2 - n_w / 2;
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

    defaults: {
      refreshFrequency: 500
    },

    constructor: function() {
      guide.Tour.prototype.addOption('alwaysMark', true);

      // we must manually assign the options to the default tour as it has
      // already been created
      if (guide.tour) {
        guide.tour.addOption('alwaysMark', true);
      }

      this.$container = guide.$el;

      guide.$
        .on('add', _.bind(this.addMarker, this))
        .on('focus', function(e, spot) {
          if (spot.marker) {
            spot.marker.highlight();
          }
        })
        .on('defocus', function(e, spot) {
          if (spot.marker) {
            spot.marker.dehighlight();
          }
        });

      return this;
    },

    addMarker: function(e, spot, attributes) {
      var marker;

      if (!spot.options.withMarker) {
        return null;
      }

      marker = new Marker(spot, attributes || {});

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
      var tour = guide.tour;

      if (!guide.isShown()) {
        return;
      }

      this.onGuideHide();

      this.rebuildMarkers(tour);

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          if (spot.tour.getOptions().alwaysMark) {
            spot.marker.show();
          } else {
            if (!spot.isCurrent()) {
              spot.marker.hide();
            }
          }
        }
      });

      this.onGuideShow();
    },

    /**
     * Install the window resize handler and launch markers for the current tour.
     *
     * @see #onTourStart
     * @see #repositionMarkers
     */
    onGuideShow: function() {
      $(window).on('resize.gjs_markers',
        _.throttle(
          _.bind(this.repositionMarkers, this),
          this.options.refreshFrequency));

      return this.onTourStart(guide.tour);
    },

    onGuideHide: function() {
      $(window).off('resize.gjs_markers');

      return this.onTourStop(guide.tour);
    },

    onTourStart: function(tour) {
      var that = this;

      // show markers for this tour
      //
      // we need to defer in order to correctly calculate the offset of targets
      // as they might still be populating their content at this stage
      _.defer(function() {
        _.each(tour.spots, function(spot) {
          if (spot.marker) {
            spot.marker.show();
          }
        });
      });

      // listen to its option changes
      tour.$
      .on('refresh.gjs_markers', function(/*e, options*/) {
        that.refresh();
      });
    },

    onTourStop: function(tour) {
      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          spot.marker.hide();
        }
      });

      tour.$.off('refresh.gjs_markers');
    },

    rebuildMarkers: function(tour) {
      var that = this,
          $container,
          marker;

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          $container = spot.marker.$container;
          spot.marker.remove();
          marker = that.addMarker(null, spot, { $container: $container });
        }
      });

      if (tour.current && tour.current.marker) {
        tour.current.marker.highlight();
      }
    },

    repositionMarkers: function() {
      var tour = guide.tour;

      if (!tour) {
        return true;
      }

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          spot.marker.$el.place();
        }
      });

      return true;
    }
  }); // Extension.prototype

  _.extend(Marker.prototype, {
    defaults: {
      position:   'right',
      placement:  'inline',
      withText:   true,
      width:      'auto'
    },

    constructor: function(spot, attributes) {
      var $el,
          $spot,
          $container;

      _.extend(this, attributes);
      this.spot   = spot;

      // build the marker options
      this.options = _.extend(
        {},
        this.options || this.defaults,
        // global guide marker options,
        guide.getOptions().marker,
        // the spot's tour options,
        spot.tour.getOptions().marker,
        // accept the spot options
        spot.getOptions().marker);

      $el       = $(this.build(spot));
      $el.place = $.proxy(this.place, this);

      // expose the placement and position modes as classes for some CSS control
      $el.addClass([
        this.options.placement + '-marker',
        this.options.position
      ].join(' '));

      _.extend(this, {
        $el:      $el,
        $index:   $el.find('.index'),
        $caption: $el.find('.caption'),
        $text:    $el.find('.text')
      });

      if (this.placement === PMT_SIBLING) {
        $spot = spot.$el;
        $container = this.$container;

        // the container must be relatively positioned
        // var $container = $('<div />').css({
        //   display:  $spot.css('display'),
        //   position: 'relative'
        // });
        if (!$container) {
          $container =
            $($spot[0].outerHTML.replace(/(<\/?)\w+\s/, '$1div '))
            .html('').attr({
              'id': null,
              'class': $spot[0].className.replace(/(gjs(\-?\w+)+)/g, '').trim()
            });

          $container.css({
            display:  $spot.css('display'),
            position: 'relative'
          });

          $container.data('gjs-container', true);

          // we'll keep a reference so we'll be able to use the same container
          // if/when we refresh
          this.$container = $container;
        }

        $container.insertBefore($spot);
        $spot.appendTo($container);
        $el.appendTo($container);

        // we'll need these for positioning
        this.margin_right = parseInt($el.css('margin-right'), 10);
        this.margin_left  = parseInt($el.css('margin-left'), 10);
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

      this.min_width = this.options.width || this.defaults.width;

      // parse placement and position
      switch(this.options.placement) {
        case 'inline':  this.placement = PMT_INLINE; break;
        case 'sibling': this.placement = PMT_SIBLING; break;
        case 'overlay': this.placement = PMT_OVERLAY; break;
        default:
          throw 'guide-marker.js: bad placement "'+this.options.placement+'"';
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
      this.spot.$el.removeClass([
        'gjs-spot-' + this.options.placement,
        'gjs-spot-' + this.options.position
      ].join(' '));

      this.$el.detach();
    },

    remove: function() {
      this.hide();

      // return the spot element back to its place by completely removing the
      // sibling container we created
      if (this.placement === PMT_SIBLING) {
        this.$container.replaceWith(this.spot.$el);
        this.$container.remove();
      }

      this.$el.remove();
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
      }

      this.show();

      guide.$.triggerHandler('marked.gjs_markers', [ this ]);
    },

    dehighlight: function(/*spot*/) {
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

      if (!this.spot.tour.getOptions().alwaysMark) {
        this.hide();
      }

      guide.$.triggerHandler('unmarked.gjs_markers', [ this ]);
    },

    canShow: function() {
      var spot = this.spot;

      if (!spot.tour.getOptions().alwaysMark && !spot.isCurrent()) {
        return false;
      }

      if (!spot.$el.length || !spot.$el.is(':visible')) {
        return false;
      }

      return true;
    },

    place: function() {
      var $spot = this.spot.$el,
          $marker = this.$el;

      if (!this.canShow()) {
        return this.hide();
      }

      attach(this);

      // mark the spot as being highlighted by a marker
      $spot.addClass([
        'gjs-spot-' + this.options.placement,
        'gjs-spot-' + this.options.position
      ].join(' '));

      if (this.placement === PMT_INLINE) {
        hvCenter($marker, this.position);
      }
      else if (this.placement === PMT_SIBLING) {
        negateMargins($marker,
                      $spot,
                      this.position,
                      this.margin_left,
                      this.margin_right);
      }

      else if (this.placement === PMT_OVERLAY) {
        snapTo($marker, $spot, this.position);
      }
    }
  });

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);