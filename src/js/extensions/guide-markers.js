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
      guide.Tour.prototype.getMarkers = function() {
        return _.pluck(_.filter(this.spots, function(spot) {
            return !!spot.marker;
          }), 'marker');
      };

      // We must manually assign the options to the default tour as it has
      // already been created.
      if (guide.tour) {
        guide.tour.addOption('alwaysMark', true);
      }

      guide.$.on('add', _.bind(this.addMarker, this));

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

      marker = new Marker(spot, attributes || {});

      if (marker.canShow()) {
        marker.show();
      }

      return marker;
    },

    refresh: function() {
      if (!guide.isShown()) {
        return;
      }

      this.onGuideHide();

      if (!this.isEnabled()) {
        return;
      }

      this.onGuideShow();

      if (guide.tour) {
        this.onTourStop(guide.tour);
        this.onTourStart(guide.tour);
      }
    },

    /**
     * Install the window resize handler and launch markers for the current tour.
     *
     * @see #onTourStart
     * @see #repositionMarkers
     */
    onGuideShow: function() {
      $(document.body).on(this.nsEvent('click'), '.gjs-marker', function(e) {
        var marker = $(this).data('gjs-marker');

        if (marker) {
          marker.spot.tour.focus(marker.spot);

          return $.consume(e);
        }

        return true;
      });

      // Install a resize handler to reposition overlay placed markers
      $(window).on(this.nsEvent('resize'),
        _.throttle(
          _.bind(this.repositionMarkers, this),
          this.options.refreshFrequency));
    },

    onGuideHide: function() {
      $(window).off(this.nsEvent('resize'));
      $(document.body).off(this.nsEvent('click'));
    },

    onTourStart: function(tour) {
      // Show all markers for this tour if the option is enabled
      if (tour.options.alwaysMark) {
        _.invoke(tour.getMarkers(), 'show');
      }

      // listen to its option changes
      // tour.$.on(this.nsEvent('refresh'), _.bind(this.refresh, this));
    },

    onTourStop: function(tour) {
      // tour.$.off(this.nsEvent('refresh'));

      _.invoke(tour.getMarkers(), 'hide');
    },

    repositionMarkers: function() {
      var tour = guide.tour;

      if (!tour) {
        return true;
      }

      console.log('[markers] repositioning markers for tour ', tour.id);

      _.invoke(_.filter(tour.getMarkers(), function(marker) {
        return marker.placement === PMT_OVERLAY;
      }), 'snapToSpot');

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
      width:      'auto',

      smart: true,

      noClone: true,

      margin: 15
    },

    constructor: function(spot, attributes) {
      _.extend(this, attributes);

      this.spot   = spot;
      spot.marker = this;

      // Parse the marker options
      this.options = _.extend(
        {},
        // lowest priority: our defaults
        this.defaults,

        (attributes || {}).options,
        // then, guide's global marker options,
        guide.getOptions().marker,
        // then, the spot's tour options,
        spot.tour.getOptions().marker,
        // and highest priority: the spot's options
        spot.getOptions().marker);

      this.spot.$
        .on('focus', _.bind(this.highlight, this))
        .on('defocus', _.bind(this.dehighlight, this))
        .on('remove', _.bind(this.remove, this));

      this.build();

      return this;
    },

    /**
     * Build the marker element and prepare it for attachment.
     *
     * @return {Guide.Marker} this
     */
    build: function() {
      var
      $el,
      template,
      spot      = this.spot;

      // Shouldn't build a marker for a spot target that's not (yet) visible.
      if (!spot.isVisible()) {
        return false;
      }
      // Already built? no-op at the moment, we don't support re-building
      else if (this.$el) {
        return false;
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
        .data('gjs-marker', this);

      // In Sibling placement mode, we need to construct a container element
      // that will be the parent of the spot target and the marker element.
      if (this.placement === PMT_SIBLING) {
        this.wrap();

        // We'll need the left and right margins for proper positioning.
        //
        // See #negateMargins for more info.
        this.rightMargin = parseInt($el.css('margin-right'), 10);
        this.leftMargin  = parseInt($el.css('margin-left'), 10);
      }

      return true;
    },

    show: function() {
      if (!this.$el && !this.build()) {
        return false;
      }

      // Mark the spot as being highlighted by a marker
      this.spot.$el.addClass(this.spot_klasses);

      this.attach();
      this.place();
    },

    hide: function() {
      var $el = this.$el;

      this.spot.$el.removeClass(this.spot_klasses);

      if ($el) {
        $el.detach();
      }
    },

    remove: function() {
      this.hide();
      this.unwrap();

      if (this.$el) {
        this.$el.remove();
        this.$el = null;
      }
    },

    highlight: function() {
      if (!this.$el && !this.build()) {
        return false;
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

      guide.log('marker highlighted for spot', this.spot.toString());

      guide.$.triggerHandler('marked.gjs_markers', [ this ]);
    },

    dehighlight: function() {
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

      if (!this.spot.tour.options.alwaysMark) {
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

      if (!spot.tour.isActive()) {
        return false;
      }

      if (!spot.tour.options.alwaysMark && !spot.isFocused()) {
        return false;
      }

      if (!spot.isVisible()) {
        return false;
      }

      return true;
    },

    fitsIn: function(p) {
      var mo = this.spot.$el.offset(),
          sw = this.spot.$el.outerWidth(),
          mw = this.$el.outerWidth(),
          mh = this.$el.outerHeight(),
          vw = $(window).width() - 20;

      if ( _.contains([ POS_TL, POS_L, POS_BL ], p) ) {
        if (mo.left - mw < 0) {
          return 1;
        }
      }

      if ( _.contains([ POS_TR, POS_R, POS_BR ], p) ) {
        if (mo.left + sw + mw > vw) {
          return 2;
        }
      }

      if ( _.contains([ POS_TL, POS_T, POS_TR ], p) ) {
        if (mo.top - mh < 0) {
          return 3;
        }
      }

      return 0;
    },

    beSmart: function() {
      var //s,
          p = -1,
          np;

      if ((np = this.fitsIn(this.position)) !== 0) {
        if (np === 1) {
          p = POS_L;
        }
        else if (np === 2) {
          p = POS_L;
        }
        else if (np === 3) {
          p = POS_B;
        }
      }

      // if (p > -1) {
      //   p = np+1;
      //   s = this.positionToString(p);
      //   console.log('marker: position ', this.position, ' doesnt fit, trying: ', s);
      //   console.log('query: ', mo.top, mo.left, mw,mh, vw, vh);

      //   this.$el
      //     .removeClass(this.positionToString(this.position))
      //     .addClass(s);

      //   this.spot.$el
      //     .removeClass('gjs-spot-' + this.positionToString(this.position))
      //     .addClass('gjs-spot-' + s);

      //   this.position = p;
      //   this.place(true);
      // }
    },

    place: function(/*dontBeSmart*/) {
      var $spot = this.spot.$el,
          $marker = this.$el;

      this.query = {
        w: $marker.outerWidth(),
        h: $marker.outerHeight(),

        o:  $spot.offset(),
        sw: $spot.outerWidth(),
        sh: $spot.outerHeight(),

        vw: $(window).width()   - 20,
        vh: $(window).height()  - 20
      };

      switch(this.placement) {
        case PMT_INLINE:
          this.hvCenter();
        break;
        case PMT_SIBLING:
          if (!this.$container.is(':visible')) {
            this.wrap();
          }

          this.negateMargins($marker,
                        $spot,
                        this.position,
                        this.leftMargin,
                        this.rightMargin,
                        15);

          this.hvCenter();
        break;
        case PMT_OVERLAY:
          this.snapToSpot();
        break;
      }

      // if (this.options.smart && !dontBeSmart) {
        // this.beSmart();
      // }
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
            'append' :
            'prepend';

          this.$container[method](this.$el);
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
    hvCenter: function() {
      var dir, center,
          $marker = this.$el,
          margin  = 0,
          query   = this.query;

      switch(this.position) {
        case POS_T:
        case POS_B:
          dir = 'left';
          center = ($marker.outerWidth() / 2);
          margin = -1 * center;

          if (query.o.left < center) {
            margin = -1 * (center - query.o.left) / 2;
          }
          else if (query.o.left + query.w > query.vw) {
            margin = -1 * (query.o.left + query.w - query.vw);
          }

        break;

        case POS_R:
        case POS_L:
          dir = 'top';
          center = ($marker.outerHeight() / 2);
          margin = -1 * center;
        break;
      }

      $marker.css('margin-' + dir, margin);
    },

    negateMargins: function() {
      // we must account for the spot node's margin-[right,left] values;
      // ie, in any of the right positions, if the spot has any margin-right
      // we must deduct enough of it to place the marker next to it, we do so
      // by applying negative margin-left by the computed amount
      //
      // same applies to left positions but in the opposite direction (margin-left)
      var
      // The direction of the negation; left or right
      dir,

      // The margin value of the anchor node (ie, margin-left, or margin-right)
      anchorMargin,

      // Number of pixels to negate the margin by
      delta = 0,

      // Our marker element whose margin property will be negated
      $marker = this.$el,

      // The spot's element whose margin value will be taken into account
      $anchor = this.spot.$el;

      switch(this.position) {
        // Right row
        case POS_TR:
        case POS_R:
        case POS_BR:
          anchorMargin = parseInt($anchor.css('margin-right'), 10);

          if (anchorMargin > 0) {
            // offset is the spot margin without the marker margin
            delta = -1 * anchorMargin + this.leftMargin;
            dir = 'left';
          }
        break;

        // Left row
        case POS_TL:
        case POS_L:
        case POS_BL:
          anchorMargin = parseInt($anchor.css('margin-left'), 10);

          if (anchorMargin > 0) {
            // offset is spot margin without marker margin (arrow dimension)
            delta = -1 * (anchorMargin - this.rightMargin);
            dir = 'right';
          }
        break;
      }

      if (delta !== 0) {
        $marker.css('margin-' + dir, delta);
      }

      return delta;
    },

    /**
     * Position the marker by means of #offset by querying the spot element's
     * offset and applying a correction to the top/left coords based on the
     * position of the marker, its dimensions, and the target's dimensions.
     */
    snapToSpot: function() {
      var markerWidth, markerHeight,
      offset        = this.spot.$el.offset(),
      anchorWidth   = this.spot.$el.outerWidth(),
      anchorHeight  = this.spot.$el.outerHeight(),
      margin        = this.options.margin;

      // We must explicitly reset the marker element's offset before querying
      // its dimensions.
      this.$el.offset({
        top: 0,
        left: 0
      });
      markerWidth   = this.$el.outerWidth();
      markerHeight  = this.$el.outerHeight();

      switch(this.position) {
        case POS_TL:
          offset.top  -= markerHeight + margin;
        break;
        case POS_T:
          offset.top  -= markerHeight + margin;
          offset.left += anchorWidth / 2 - markerWidth / 2;
        break;
        case POS_TR:
          offset.top  -= markerHeight + margin;
          offset.left += anchorWidth - markerWidth;
        break;
        case POS_R:
          offset.top  += anchorHeight / 2 - (markerHeight/2);
          offset.left += anchorWidth + margin;
        break;
        case POS_BR:
          offset.top  += anchorHeight + margin;
          offset.left += anchorWidth - markerWidth;
        break;
        case POS_B:
          offset.top  += anchorHeight + margin;
          offset.left += anchorWidth / 2 - markerWidth / 2;
        break;
        case POS_BL:
          offset.top  += anchorHeight + margin;
        break;
        case POS_L:
          offset.top  += (anchorHeight / 2) - (markerHeight/2);
          offset.left -= markerWidth + margin;
        break;
      }

      this.$el.offset(offset);
    },

    /**
     * Wrap the marker's element and its spot's element in a container
     * so they can be siblings.
     *
     * While there's high portion of hackery involved here, it is only so in
     * order to be as transparent as possible, and not to break the page's
     * layout.
     */
    wrap: function() {
      var $spot = this.spot.$el;

      if (this.$container) {
        this.unwrap();
      }

      // Build the container:
      this.$container =
        $(this.options.noClone ?
            '<div />' :
            // Instead of building a plain `<div/>`, we'll try to replicate the
            // target element, so we won't break any CSS/JS that uses the tag as
            // an identifier, we'll do that by cloning the tag and stripping
            // some properties from it.
            $spot[0].outerHTML.replace(/(<\/?)\w+\s/, '$1div ')
        )
        // Empty it, we only need the tag and its structure
        .html('')
        .attr({
          'id': null,

          // Remove any gjs- related classes from the container
          'class': this.options.noClone ?
                   '' :
                   $spot[0].className.replace(/(gjs(\-?\w+)+)/g, '').trim()
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
        .data('gjs-container', true)

        // Position the container right where the target is, and
        // move the target and the marker inside of it.
        .insertBefore($spot)
        .append($spot);

      guide.log('wrapped');
    },

    /**
     * Undo what #wrap did by detaching our element, restoring the spot element
     * back to its original position, and removing the container.
     */
    unwrap: function() {
      if (this.$container) {
        guide.log('unwrapping');
        this.$el.detach();

        if (this.spot.$el.parent().is(this.$container)) {
          this.$container.replaceWith(this.spot.$el);
        }

        this.$container.remove();
        this.$container = null;
      }
    },

    isWrapped: function() {
      return !!this.$container;
    },

    positionToString: function(p) {
      var s;

      switch(p) {
        case POS_TL:  s = 'topleft'     ; break;
        case POS_T:   s = 'top'         ; break;
        case POS_TR:  s = 'topright'    ; break;
        case POS_R:   s = 'right'       ; break;
        case POS_BR:  s = 'bottomright' ; break;
        case POS_B:   s = 'bottom'      ; break;
        case POS_BL:  s = 'bottomleft'  ; break;
        case POS_L:   s = 'left'        ; break;
      }

      return s;
    }

  });

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);