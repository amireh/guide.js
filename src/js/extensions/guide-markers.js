(function(_, $, Guide) {
  'use strict';

  var
  /**
   * @class Guide.Markers
   * @extends Guide.Extension
   * @singleton
   *
   * A Guide.js extension that provides interactive {@link Marker markers} that
   * can be attached to {@link Spot tour spots}.
   *
   * @alternateClassName Markers
   */
  Extension = function() {
    return this.constructor();
  },

  Marker = function() {
    return this.constructor.apply(this, arguments);
  },

  idGenerator = 0,

  // Plain markers that contain only the step index, no text, and no caption.
  JST_PLAIN = _.template([
    '<div>',
      '<span class="index"><%= index +1 %></span>',
    '</div>'
  ].join('')),

  // Markers that contain the step index when not focused, and text otherwise.
  JST_WITH_CONTENT = _.template([
    '<div>',
      '<span class="index"><%= index +1 %></span>',
      '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  // Markers that contain the step index when not focused, and both caption
  // and text otherwise.
  JST_WITH_CAPTION = _.template([
    '<div>',
      '<span class="index"><%= index +1 %></span>',
      '<h6 class="caption"><%= caption %></h6>',
      '<div class="text"><%= text %></div>',
    '</div>'
  ].join('')),

  JST_CONTAINER = _.template('<div style="position: relative;"></div>'),

  // Placement modes
  PMT_INLINE = 1,
  PMT_SIBLING = 2,
  PMT_OVERLAY = 3,

  // The positioning grid
  POS_TL  = 1,
  POS_T   = 2,
  POS_TR  = 3,
  POS_R   = 4,
  POS_BR  = 5,
  POS_B   = 6,
  POS_BL  = 7,
  POS_L   = 8,
  POS_C   = 9;

  _.extend(Extension.prototype, Guide.Extension, {
    id: 'markers',

    defaults: {
      /**
       * @cfg {Boolean} [enabled=true]
       * Enable {@link Marker markers} functionality and build them for each
       * tour spot automatically.
       */
      enabled: true,

      /**
       * @cfg {Number} [refreshFrequency=500]
       * Milliseconds to wait before re-positioning markers after the window
       * has been resized.
       */
      refreshFrequency: 500
    },

    constructor: function() {
      Guide.Tour.prototype.addOption('alwaysMark', true);
      Guide.Tour.prototype.getMarkers = function() {
        return _.pluck(_.filter(this.spots, function(spot) {
            return !!spot.marker;
          }), 'marker');
      };

      // We must manually assign the options to the default tour as it has
      // already been created.
      if (Guide.tour) {
        Guide.tour.setOption('alwaysMark', true);
      }

      Guide.Spot.prototype.addOption('withMarker', true);

      Guide.$.on('add', _.bind(this.addMarker, this));

      return this;
    },

    addMarker: function(e, spot, attributes) {
      var marker;

      if (!spot.isOn('withMarker')) {
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
      if (!Guide.isShown()) {
        return;
      }

      if (!this.isEnabled()) {
        return;
      }

      if (Guide.tour && this.isEnabled(Guide.tour)) {
        this.onTourStop(Guide.tour);
        this.onTourStart(Guide.tour);
      }
    },

    /**
     * Launch markers for the tour if the {@link Tour#cfg-alwaysMark option} is
     * enabled, and install the window resize handler and proxy clicks on markers
     * to focus their spots.
     *
     * See #repositionMarkers for the repositioning logic.
     */
    onTourStart: function(tour) {
      $(document.body).on(this.nsEvent('click'), '.gjs-marker', function() {
        var marker = $(this).data('gjs-marker');

        if (marker) {
          if (!marker.spot.isFocused()) {
            marker.spot.tour.focus(marker.spot);
          }

          // return $.consume(e);
        }

        return true;
      });

      $(window).on(this.nsEvent('resize'),
        _.throttle(
          _.bind(this.repositionMarkers, this),
          this.getOption('refreshFrequency')));

      if (tour.isOn('alwaysMark')) {
        _.invoke(tour.getMarkers(), 'show');
      }
    },

    onTourStop: function(tour) {
      $(window).off(this.nsEvent('resize'));
      $(document.body).off(this.nsEvent('click'));

      _.invoke(tour.getMarkers(), 'hide');
    },

    repositionMarkers: function() {
      var tour = Guide.tour;

      if (!tour) {
        return true;
      }

      console.log('[markers] repositioning markers for tour ', tour.id);

      _.invoke(_.where(tour.getMarkers(), { placement: PMT_OVERLAY }), 'snapToSpot');

      return true;
    }
  }); // Extension.prototype


  /**
   * @class Guide.Marker
   * @mixins Guide.Optionable
   *
   * A single marker object attached to a Tour Spot. Markers show up around
   * a tour spot, and can show the index of the spot, its content when highlighted,
   * and more.
   *
   * Marker instances allow you to configure where and how they should be placed.
   *
   * Example of creating a basic marker:
   *
   *     @example
   *     $(function() {
   *       $('<button>Hi</button>').appendTo($('body'));
   *
   *       // Enable the Markers extension:
   *       Guide.setOptions({
   *         markers: {
   *           enabled: true
   *         }
   *       });
   *
   *       // Create a spot with a marker:
   *       Guide.tour.addSpot($('button'), {
   *         text: "I'm a button full of awesome.",
   *         withMarker: true,
   *         marker: {
   *           position: 'right',
   *           width: 140
   *         }
   *       });
   *
   *       Guide.show();
   *     });
   *
   * @alternateClassName Marker
   */
  _.extend(Marker.prototype, Guide.Optionable, {
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

      mimic: false,
      mimicDisplay: true,

      margin: 15
    },

    constructor: function(spot, attributes) {
      _.extend(this, attributes, {
        id: ++idGenerator,
        spot: spot
      });

      this.setOptions(_.extend({},
        // lowest priority: our defaults
        this.defaults,

        (attributes || {}).options,
        // then, guide's global marker options,
        Guide.getOptions('marker'),
        // then, the spot's tour options,
        spot.tour.getOptions('marker'),
        // and highest priority: the spot's options
        spot.getOptions('marker')));

      spot.marker = this;

      this.spot.$
        .on(this.ns('focus'),   _.bind(function() { this.show(); }, this))
        .on(this.ns('defocus'), _.bind(function() { this.hide(); }, this))
        .on(this.ns('remove'),  _.bind(function() { this.remove(); }, this));

      this.build();

      Guide.log('Marker', this.id, 'created for spot', this.spot.toString());

      return this;
    },

    ns: function(event) {
      return [ event, 'gjs_marker', this.id ].join('.');
    },

    /**
     * Build the marker element and prepare it for attachment.
     *
     * @return {Guide.Marker} this
     */
    build: function() {
      var $el, template, rtl_pos,
      rtl   = Guide.isOn('RTL'),
      spot  = this.spot,
      options = this.getOptions();

      // Shouldn't build a marker for a spot target that's not (yet) visible.
      if (!spot || !spot.isVisible()) {
        return false;
      }
      // Already built? no-op at the moment, we don't support re-building
      else if (this.$el) {
        return false;
      }

      // Parse placement and position modes.
      switch(options.placement) {
        case 'inline':  this.placement = PMT_INLINE; break;
        case 'sibling': this.placement = PMT_SIBLING; break;
        case 'overlay': this.placement = PMT_OVERLAY; break;
        default:
          throw 'guide-marker.js: bad placement "' + this.getOption('placement') + '"';
      }

      if (rtl) {
        switch(this.getOption('position')) {
          case 'topleft':     rtl_pos = 'topright'; break;
          case 'topright':    rtl_pos = 'topleft'; break;
          case 'right':       rtl_pos = 'left'; break;
          case 'bottomright': rtl_pos = 'bottomleft'; break;
          case 'bottomleft':  rtl_pos = 'bottomright'; break;
          case 'left':        rtl_pos = 'right'; break;
          default:
            rtl_pos = this.getOption('position');
        }

        this.setOptions({
          position: rtl_pos
        });

        options.position = rtl_pos;
      }

      switch(options.position) {
        case 'topleft':     this.position = rtl ? POS_TR  : POS_TL; break;
        case 'top':         this.position = POS_T; break;
        case 'topright':    this.position = rtl ? POS_TL  : POS_TR; break;
        case 'right':       this.position = rtl ? POS_L   : POS_R; break;
        case 'bottomright': this.position = rtl ? POS_BL  : POS_BR; break;
        case 'bottom':      this.position = POS_B; break;
        case 'bottomleft':  this.position = rtl ? POS_BR  : POS_BL; break;
        case 'left':        this.position = rtl ? POS_R   : POS_L; break;
        case 'center':      this.position = POS_C; break;
        default:
          throw 'guide-marker.js: bad position "' + options.position + '"';
      }

      // If spot has explicitly asked for no text, or doesn't have
      // any textual content, then we should respect the setting when
      // highlighted.
      //
      // See #highlight.
      this.withText     = !!options.withText && spot.hasContent();
      this.spot_klasses = [
        'gjs-spot-' + options.placement,
        'gjs-spot-' + options.position
      ].join(' ');

      // Determine which template we should use.
      if (_.isFunction(options.template)) {
        template = options.template;
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
          Guide.entityKlass(),
          options.placement + '-marker',
          options.position
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

    remove: function() {
      if (!this.spot) {
        throw 'marker being removed twice?!';
      }

      Guide.log('Marker', this.id, 'removed for spot', this.spot.toString());

      this.hide({
        completely: true
      });

      this.spot.$
        .off(this.ns('remove'))
        .off(this.ns('defocus'))
        .off(this.ns('focus'));

      delete this.spot.marker;

      if (this.$el) {
        this.$el.remove();
        this.$el = this.spot = null;
      }
    },

    show: function() {
      if (!this.$el && !this.build()) {
        return false;
      }
      else if (!this.canShow()) {
        this.hide({ completely: true });
        return false;
      }


      if (this.spot.isFocused()) {
        Guide.$.triggerHandler('marking.gjs_markers', [ this ]);

        this.$el.addClass('focused');

        if (this.withText) {
          this.$index.hide();

          this.$text.show();
          this.$caption.show();
          this.$el.css({
            width: this.getOption('width') || this.defaults.width
          });
        }

        Guide.$.triggerHandler('marked.gjs_markers', [ this ]);
      } else if (this.withText) {
        this.$text.hide();
        this.$caption.hide();
      }

      // Mark the spot as being highlighted by a marker
      this.spot.$el.addClass(this.spot_klasses);

      this.attach();
      this.place();

      Guide.log('Marker',this.id,'highlighted for spot', this.spot.toString());

    },

    /**
     * Collapse the marker if Tour#alwaysMark is on, otherwise detach it.
     *
     * @param  {Object} options
     * Some overrides.
     *
     * @param {Boolean} [options.completely=false]
     * Don't respect any options that might otherwise prevent the marker from
     * being detached.
     */
    hide: function(options) {
      options = _.defaults(options || {}, {
        completely: false
      });

      Guide.$.triggerHandler('unmarking.gjs_markers', [ this ]);

      // If the tour doesn't want markers to always be shown, or we're being
      // removed (options.completely), then we'll roll-back our changes,
      // detach ourselves, and unwrap if viable.
      //
      if (!this.spot.tour.isOn('alwaysMark') || options.completely) {
        // Restore the spot's target's CSS classes
        this.spot.$el.removeClass(this.spot_klasses);

        // Hide ourselves.
        if (this.$el) {
          this.$el.detach();
        }

        // Un-wrap the spot's target, if we're in sibling placement mode.
        if (this.isWrapped()) {
          this.unwrap();
        }
      }
      // This check is necessary because #hide might be called while the marker
      // has not been built, or has failed to build.
      else if (this.$el) {
        this.$el.removeClass('focused');

        // Hide the content, show the number marker.
        if (this.withText) {
          this.$index.show();

          this.$text.hide();
          this.$caption.hide();
          this.$el.css({
            width: 'auto'
          });
        }

        // this.attach();
        // this.place();
        _.defer(_.bind(this.show, this));
      }

      Guide.$.triggerHandler('unmarked.gjs_markers', [ this ]);
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

      if (!spot.tour.isActive() || !spot.isOn('withMarker')) {
        return false;
      }

      if (!spot.tour.isOn('alwaysMark') && !spot.isFocused()) {
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

      switch(this.placement) {
        case PMT_INLINE:
          this.hvCenter();
        break;
        case PMT_SIBLING:
          if (!this.$container.is(':visible')) {
            this.wrap();
            this.attach();
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

      // if (this.isOn('smart') && !dontBeSmart) {
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
          if (!this.isWrapped()) {
            this.wrap();
          }

          method  = (this.position >= POS_TR && this.position <= POS_BR) ?
            'append' :
            'prepend';

          this.$container.append(this.spot.$el);
          this.$container[method](this.$el);
        break;
        case PMT_OVERLAY:
          Guide.$el.append(this.$el);
        break;
      }

      return this;
    },

    /**
     * Center node horizontally or vertically by applying negative margins.
     *
     * Positions `POS_T` and `POS_B` will cause horizontal centering, while
     * positions `POS_L` and `POS_R` will cause vertical centering.
     */
    hvCenter: function() {
      var center,
          $marker = this.$el,
          margin  = 0,
          origin  = this.spot.$el.offset(),
          query   = {
            w: $marker.outerWidth(),
            h: $marker.outerHeight(),

            vw: $(window).width()   - 20,
            vh: $(window).height()  - 20
          };

      if (_.contains( [ POS_T, POS_C, POS_B ], this.position)) {
        center = ($marker.outerWidth() / 2);
        margin = -1 * center;

        // if (origin.left < center) {
          // margin = -1 * (center - origin.left) / 2;
        // }
        // else if (origin.left + query.w > query.vw) {
        if (origin.left + query.w > query.vw) {
          margin = -1 * (origin.left + query.w - query.vw);
        }

        $marker.css('margin-left', margin);
      }

      if (_.contains( [ POS_R, POS_C, POS_L ], this.position)) {
        center = ($marker.outerHeight() / 2);
        margin = -1 * center;

        $marker.css('margin-top', margin);
      }
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
      if (!this.canShow()) {
        this.hide({ completely: true });
        return false;
      }

      var markerWidth, markerHeight, scrollLock,
      origin        = this.$el.offset() || { top: 0, left: 0 },
      offset        = this.spot.$el.offset(),
      anchorWidth   = this.spot.$el.outerWidth(),
      anchorHeight  = this.spot.$el.outerHeight(),
      margin        = this.getOption('margin');

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
        case POS_C:
          offset.top -= anchorHeight/2;
          offset.left += -1*markerWidth/2 + anchorWidth/2;
          break;
      }

      // Move the marker.
      if (Guide.isOn('withAnimations')) {
        // Prevent the spot from autoScrolling to the marker since it'll be
        // moving still while animated.
        scrollLock = this.spot.isOn('autoScroll');
        this.spot.setOptions({ autoScroll: false }, null, true);

        this.$el.offset(origin);
        this.$el
          .animate({
              top: offset.top,
              left: offset.left
            },
            250,
            // Restore the autoScroll option.
            _.bind(function() {
              this.spot.setOptions({ autoScroll: scrollLock }, null, true);
            }, this));

        // Scroll the marker into view if needed
        if (this.spot.isFocused() && !this.spot.$el.is(':in_viewport')) {
          $('html, body').animate({
            scrollTop: offset.top * 0.9
          }, Guide.isOn('withAnimations') ? 250 : 0);
        }
      }
      else {
        this.$el.offset(offset);
      }

      return offset;
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

      if (this.isWrapped()) {
        this.unwrap();
      }

      // Build the container by either 'mimicking' the target, or by building
      // a plain <div>:
      if (this.isOn('mimic')) {
        // We'll try to replicate the target element, so we won't break any CSS/JS
        // that uses the tag as an identifier, we'll do that by cloning the tag
        // and stripping some of its properties.
        this.$container =
          $($spot[0].outerHTML.replace(/(<\/?)\w+\s/, '$1div '))
          // Empty it, we only need the tag and its structure
          .html('')
          .attr({
            'id': null,
            // Remove any gjs- related classes from the container
            'class': $spot[0].className.replace(/(gjs(\-?\w+)+)/g, '').trim()
          })
          // The container must be relatively positioned
          .css({
            position: 'relative'
          });
      }
      else {
        this.$container = $(JST_CONTAINER({}));
      }

      this.$container
        // Classify it so the user can override its css if needed
        .addClass('gjs-container gjs-container-' + (this.spot.index+1))
        // Try to mimic the display type of the target element
        .css({
          display: this.isOn('mimicDisplay') ? $spot.css('display') : 'inherit',
        })
        // Place the container right where the target is, and
        // move the target and (later) the marker inside of it.
        .insertBefore($spot)
        .append($spot);

      Guide.log('Marker',this.id,'wrapped');
    },

    /**
     * Undo what #wrap did by detaching our element, restoring the spot element
     * back to its original position, and removing the container.
     */
    unwrap: function() {
      if (this.$container) {
        Guide.log('Marker',this.id,'unwrapping');

        if (this.$el) {
          this.$el.detach();
        }

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

  Guide.addExtension(new Extension());

  /**
   * @class Guide.Spot
   *
   * @cfg {Boolean} [withMarker=true]
   * Attach and display a marker to the spot's element when it receives focus.
   *
   * **This option is available only if the Markers extension is enabled.**
   */

  /**
   * @class Guide.Tour
   *
   * @cfg {Boolean} [alwaysMark=true]
   * Display markers for all tour spots, not only the focused one. Non-focused
   * markers will only display the spot index and not its content.
   *
   * **This option is available only if the Markers extension is enabled.**
   */

})(_, jQuery, window.Guide);