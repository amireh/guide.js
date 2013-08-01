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
    '<div>',
      '<span class="index"><%= index +1 %></span>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and text otherwise.
   */
  JST_WITH_CONTENT = _.template([
    '<div>',
      '<span class="index"><%= index +1 %></span>',
      '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  /**
   * Markers that contain the step index when not focused, and both caption
   * and text otherwise.
   */
  JST_WITH_CAPTION = _.template([
    '<div>',
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
  POS_L   = 8;

  /**
   * Marker implementation.
   */
  _.extend(Extension.prototype, guide.Extension, {
    id: 'markers',

    defaults: {
      enabled: true,
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
      else if (!this.isEnabled(spot.tour)) {
        return null;
      }

      // console.log('guide.js', 'markers', 'adding marker for spot', spot.toString());

      marker = new Marker(spot, attributes || {});

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
      else if (!this.isEnabled()) {
        return;
      }

      $(window).off('resize.gjs_markers');
      $(window).on('resize.gjs_markers',
        _.throttle(
          _.bind(this.repositionMarkers, this),
          this.getOptions().refreshFrequency));

      // this.onGuideHide();

      // this.rebuildMarkers(tour);

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

      // this.onGuideShow();
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

      $(document.body).on('click.gjs_markers', '.gjs-marker', function(e) {
        var marker = $(this).data('gjs');

        if (marker) {
          marker.spot.tour.focus(marker.spot);

          return $.consume(e);
        }

        return true;
      });

      // return this.onTourStart(guide.tour);
    },

    onGuideHide: function() {
      $(window).off('resize.gjs_markers');
      $(document.body).off('click.gjs_markers');

      // return this.onTourStop(guide.tour);
    },

    onTourStart: function(tour) {
      var that = this;

      if (!this.isEnabled(tour)) {
        return this;
      }

      console.log('guide.js', '[markers] showing markers for tour ', tour.id);

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
      tour.$.on('refresh.gjs_markers', function(/*e, options*/) {
        that.refresh();
      });
    },

    onTourStop: function(tour) {
      console.log('[markers] destroying markers for tour ', tour.id);

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          spot.marker.hide();
          // spot.marker.remove();
        }
      });

      tour.$.off('refresh.gjs_markers');
    },

    rebuildMarkers: function(/*tour*/) {
      // var that = this,
      //     $container,
      //     marker;

      // console.log('[markers] rebuilding markers for tour ', tour.id);

      // _.each(tour.spots, function(spot) {
      //   if (spot.marker) {
      //     $container = spot.marker.$container;
      //     spot.marker.remove();
      //     marker = that.addMarker(null, spot, { $container: $container });
      //   }
      // });

      // if (tour.current && tour.current.marker) {
      //   tour.current.marker.highlight();
      // }
    },

    repositionMarkers: function() {
      var tour = guide.tour;

      if (!tour) {
        return true;
      }

      console.log('[markers] repositioning markers for tour ', tour.id);

      _.each(tour.spots, function(spot) {
        if (spot.marker) {
          spot.marker.place();
        }
      });

      return true;
    }
  }); // Extension.prototype


  /**
   * @class Marker
   *
   * A single marker object attached to a Tour Spot. Markers show up around
   * a tour spot, and can show the index of the spot, its content when highlighted,
   * and more.
   *
   * Marker instances allow you to configure where and how they should be placed.
   *
   */
  _.extend(Marker.prototype, {
    defaults: {

      /**
       * The position of the marker relative to the spot target element.
       *
       * Position can be one of:
       *
       *     'topleft'    'top'    'topright'
       *     'left'                'right'
       *     'bottomleft' 'bottom' 'bottomright'
       *
       * @cfg
       */
      position:   'right',

      /**
       * The placement mode to use for attaching the marker.
       *
       * Available placement modes are:
       *
       *  - `inline`: the marker is attached **inside** the target and is positioned
       *  using margins
       *
       *  - `sibling`: the marker and the target are **wrapped** in a
       *  container so they become siblings, positioning is done using margins
       *
       *  - `overlay`: the marker is positioned independently of the target using
       *  absolute coordinates
       *
       * @cfg
       */
      placement:  'sibling',

      /**
       * Setting this to false will prevent the markers from containing any
       * content, and instead show only the index of the spot.
       *
       * @cfg
       */
      withText:   true,

      /**
       * Specify a pixel value to use as the width of the marker, in case the
       * default (auto) width doesn't make sense (ie, a small button)
       *
       * @cfg
       */
      width:      'auto'
    },

    constructor: function(spot, attributes) {
      _.extend(this, attributes);

      this.spot   = spot;
      spot.marker = this;

      // Parse the marker options
      this.options = _.extend(
        {},
        // lowest priority: our defaults
        this.options || this.defaults,
        // then, guide's global marker options,
        guide.getOptions().marker,
        // then, the spot's tour options,
        spot.tour.getOptions().marker,
        // and highest priority: the spot's options
        spot.getOptions().marker);

      return this.build();
    },

    /**
     * Build the marker element and prepare it for attachment.
     *
     * @return {Guide.Marker} this
     */
    build: function() {
      var
      $el,
      $container, // used for sibling placement, see below
      template,
      spot      = this.spot,
      $spot     = spot.$el;

      // Shouldn't build a marker for a spot target that's not (yet) visible.
      if (!spot.isVisible()) {
        return this;
      }
      // Already built? no-op at the moment, we don't support re-building
      else if (this.$el) {
        return this;
      }

      // If spot has explicitly asked for no text, or doesn't have
      // any textual content, then we should respect the setting when
      // highlighted.
      //
      // See #highlight.
      this.withText = this.options.withText && spot.hasContent();

      this.width = this.options.width || this.defaults.width;

      this.spot_klasses = [
        'gjs-spot-' + this.options.placement,
        'gjs-spot-' + this.options.position
      ].join(' ');

      // Parse placement and position modes.
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

      // Determine which template we should use.
      if (_.isFunction(this.options.template)) {
        template = this.options.template;
      }
      else if (spot.hasCaption()) {
        template = JST_WITH_CAPTION;
      }
      else if (spot.hasText()) {
        template = JST_WITH_CONTENT;
      }
      else {
        template = JST_PLAIN;
      }

      // Build the marker element.
      $el = $(template({
        index:    spot.index,
        text:     spot.getText(),
        caption:  spot.getCaption()
      }));

      // Assign the marker element as the spot's scrolling anchor so that the
      // marker is entirely visible when the spot is highlighted.
      spot.setScrollAnchor($el);

      // A few handy accessors we'll use as the marker content changes, ie: on
      // (de)highlights
      _.extend(this, {
        $el:      $el,
        $index:   $el.find('.index'),
        $caption: $el.find('.caption'),
        $text:    $el.find('.text')
      });

      $el
        // Expose the marker mode as CSS classes for some control
        .addClass([
          'gjs-marker',
          guide.entityKlass(),
          this.options.placement + '-marker',
          this.options.position
        ].join(' '))

        // Attach the marker to the jQuery object, necessary for handling events
        //
        // See Extension#onGuideShow
        .data('gjs', this);

      // In Sibling placement mode, we need to construct a container element
      // that will be the parent of the spot target and the marker element.
      //
      // While there's high portion of hackery involved here, it is only so in
      // order to be as transparent as possible, and not to break the page's
      // layout.
      if (this.placement === PMT_SIBLING) {
        if (!this.isWrapped()) {
          // Build the container:
          //
          // Instead of building a plain `<div/>`, we'll try to replicate the
          // target element, so we won't break any CSS/JS that uses the tag as
          // an identifier, we'll do that by cloning the tag and stripping
          // some properties from it.
          $container = $($spot[0].outerHTML.replace(/(<\/?)\w+\s/, '$1div '))
                      // Empty it, we only need the tag and its structure
                      .html('')
                      .attr({
                        'id': null,

                        // Remove any gjs- related classes from the container
                        'class': $spot[0].className.replace(/(gjs(\-?\w+)+)/g, '').trim()
                      })
                      .css({
                        // Try to mimic the alignment of the target element
                        display: $spot.css('display'),

                        // The container must be relatively positioned, since
                        // we're positioning the marker using margins.
                        position: 'relative'
                      })

                      // Set a flag so we can tell whether the spot target is
                      // already wrapped so that we will properly clean up
                      //
                      // See #isWrapped and #remove.
                      .data('gjs_container', true)

                      // Position the container right where the target is, and
                      // move the target and the marker inside of it.
                      .insertBefore($spot)
                      .append($spot)
                      .append($el);
        } else {
          // Container already built, we just need to place the marker element
          // inside of it:
          $container = $spot.parent();
          $container.append($el);
        }

        // We'll need the left and right margins for proper positioning.
        //
        // See #negateMargins for more info.
        this.margin_right = parseInt($el.css('margin-right'), 10);
        this.margin_left  = parseInt($el.css('margin-left'), 10);
      }

      return this;
    },

    show: function() {
      if (!this.canShow()) {
        return this;
      }

      // Mark the spot as being highlighted by a marker
      this.spot.$el.addClass(this.spot_klasses);

      // Attach and position the marker
      this.place();
    },

    hide: function() {
      this.spot.$el.removeClass(this.spot_klasses);

      if (this.$el) {
        this.$el.detach();
      }
    },

    remove: function() {
      var $container;

      this.hide();

      if (this.$el) {
        this.$el.remove();
      }

      // Return the target back to its place by completely removing the
      // sibling container we created
      if (this.isWrapped()) {
        $container = this.spot.$el.parent();

        $container.replaceWith(this.spot.$el);
        $container.remove();
      }
    },

    highlight: function() {
      if (!this.$el) {
        this.build();
      }

      guide.$.triggerHandler('marking.gjs_markers', [ this ]);

      this.$el.addClass('focused');

      if (this.withText) {
        this.$index.hide();

        this.$text.show();
        this.$caption.show();
        this.$el.css({
          width: this.width
        });
      }

      this.show();

      guide.$.triggerHandler('marked.gjs_markers', [ this ]);
    },

    dehighlight: function(/*spot*/) {
      if (!this.$el) {
        return;
      }

      guide.$.triggerHandler('unmarking.gjs_markers', [ this ]);

      this.$el.removeClass('focused');

      if (this.withText) {
        this.$index.show();

        this.$text.hide();
        this.$caption.hide();
        this.$el.css({
          width: 'auto'
        });
      }

      if (!this.spot.tour.getOptions().alwaysMark) {
        this.hide();
      }
      else {
        this.show();
      }

      guide.$.triggerHandler('unmarked.gjs_markers', [ this ]);
    },

    /**
     * Whether the marker can and should be shown.
     *
     * The marker can be shown if the following conditions are met:
     *
     * - The marker element is actually built
     * - The spot target is valid and visible
     * - The spot is the current one *or* its tour has the `alwaysMark` option
     *
     */
    canShow: function() {
      var spot = this.spot;

      if (!this.$el) {
        return false;
      }

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

      this.attach();

      switch(this.placement) {
        case PMT_INLINE:
          this.hvCenter($marker, this.position);
        break;
        case PMT_SIBLING:
          this.negateMargins($marker,
                        $spot,
                        this.position,
                        this.margin_left,
                        this.margin_right,
                        15);

          this.hvCenter($marker, this.position);
        break;
        case PMT_OVERLAY:
          this.snapTo($marker, $spot, this.position);
        break;
      }
    },

    // insert our DOM node at the appropriate position
    attach: function() {
      var method;

      switch(this.placement) {
        case PMT_INLINE:
          this.spot.$el.append(this.$el);
        break;
        case PMT_SIBLING:
          method  = (this.position >= POS_TR && this.position <= POS_BR) ?
            'after' :
            'before';

          this.spot.$el[method](this.$el);
        break;
        case PMT_OVERLAY:
          guide.$el.append(this.$el);
        break;
      }

      return this;
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
    hvCenter: function($node, pos) {
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

    negateMargins: function($node, $anchor, pos, ml, mr) {
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

      return delta;
    },

    snapTo: function($node, $anchor, pos, margin) {
      var
      offset  = $anchor.offset(),
      a_w     = $anchor.outerWidth(),
      a_h     = $anchor.outerHeight(),
      n_h     = $node.outerHeight(),
      n_w     = $node.outerWidth(),
      m       = margin || 0;

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
    },

    isWrapped: function() {
      var $container;

      if (!this.spot.$el.length) { return false; }

      $container = this.spot.$el.parent();

      if ($container.length && $container.data('gjs_container')) {
        return true;
      }
    },


  });

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);