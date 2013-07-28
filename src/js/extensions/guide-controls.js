(function(_, $, guide) {
  'use strict';

  var
  Extension = function() {
    return this.constructor();
  },

  JST_CONTROLS = _.template([
    '<div id="gjs_controls">',
      '<button data-action="tour.first">First</button>',
      '<button data-action="tour.prev">&lt;</button>',
      '<button data-action="tour.next">&gt;</button>',
      '<button data-action="tour.last">Last</button>',
    '</div>'
  ].join('')),

  JST_DEV_CONTORLS = _.template([
    '<div class="developer-controls">',
      '<button data-action="guide.toggle">Toggle</button>',
      '<button data-action="toggleOverlay">Toggle Overlay</button>',
    '</div>'
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      withDeveloperControls: false,
      // inMarkers:  true,
      inTutor:    true
    },

    id: 'controls',

    constructor: function() {
      var that = this

      this.$container = guide.$el;
      this.guide = guide;
      this.tour  = guide.tour;
      this.options = _.defaults({}, this.defaults);

      this.refresh();

      guide.$
      .on('show', _.bind(this.show, this))
      .on('hide', _.bind(this.hide, this))
      .on('dismiss', _.bind(this.remove, this))
      .on('focus', function(e, spot) {
        that.refreshControls();
      });

      return this;
    },

    onTourStart: function(tour) {
      this.tour = tour;
      this.refreshControls();
    },

    show: function(e) {
      this.$el.appendTo(this.$container);
      this.refreshControls();

      return this;
    },

    hide: function() {
      // guide.$container.append(this.$el);
      this.$el.detach();

      return this;
    },

    remove: function() {
      if (this.$el) {
        this.$el.remove();
        guide.$
        .off('marking.gjs_markers.embedded_controls')
        .off('unmarking.gjs_markers.embedded_controls');
      }
    },

    attachToMarker: function(marker) {
      this.$container = marker.$el;
      this.$container.addClass('with-controls');

      this.show();
    },

    detachFromMarker: function(marker) {
      this.$container.removeClass('with-controls');
      this.$container = $();

      this.hide();
    },


    refresh: function() {
      var
      that        = this,
      tutor_ext   = guide.getExtension('tutor'),
      marker_ext  = guide.getExtension('markers'),
      options     = this.options;

      this.remove();

      if (marker_ext && options.inMarkers) {
        this.$container = $();

        guide.$.on('marking.gjs_markers.embedded_controls', function(e, marker) {
          that.attachToMarker(marker);
        }).on('unmarking.gjs_markers.embedded_controls', function(e, marker) {
          that.detachFromMarker(marker);
        });
      }
      else if (tutor_ext && options.inTutor) {
        this.$container = tutor_ext.$el;
        tutor_ext.$el.addClass('with-controls');
      }
      else if (tutor_ext) {
        tutor_ext.$el.addClass('without-controls');
      }

      this.$el = $(JST_CONTROLS({}));

      if (options.withDeveloperControls) {
        this.$el.append($(JST_DEV_CONTORLS({})));
      }

      this.$el
        .addClass(guide.entityKlass())
        .on('click', '[data-action]', _.bind(this.delegate, this));

      _.extend(this, {
        $bwd: this.$el.find('[data-action*=prev]'),
        $fwd: this.$el.find('[data-action*=next]'),
        $first: this.$el.find('[data-action*=first]'),
        $last: this.$el.find('[data-action*=last]')
      })

      // if we're embedding into markers and a spot is currently marked,
      // attach ourselves to the marker
      if (marker_ext && options.inMarkers &&
          guide.tour &&
          guide.tour.current &&
          guide.tour.current.marker) {

        var marker = guide.tour.current.marker;
        marker.hide();
        this.attachToMarker(marker);
        marker.show();
      }

      this.show();
    },

    delegate: function(e) {
      var action = $(e.target).attr('data-action');

      if (action.indexOf('.') > -1) {
        var
        pair    = action.split('.'),
        target  = pair[0],
        method  = pair[1];

        this[target] && this[target][method] && this[target][method]();
      }
      else {
        this[action] && this[action]();
      }

      return $.consume(e);
    },

    toggleOverlay: function() {
      guide.setOptions({
        withOverlay: !guide.options.withOverlay
      });
    },

    refreshControls: function() {
      this.$bwd.prop('disabled', !guide.tour.hasPrev());
      this.$fwd.prop('disabled', !guide.tour.hasNext());
      this.$first.prop('disabled', !guide.tour.hasPrev());
      this.$last.prop('disabled', !guide.tour.hasNext());
    }

  }); // tutor.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);