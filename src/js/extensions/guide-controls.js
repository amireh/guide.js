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
      '<button data-action="guide.hide">Close</button>',
      '<select name="tour" data-action="switchTour"></select>',
    '</div>'
  ].join('')),

  JST_TOUR_LIST = _.template([
    '<% _.forEach(tours, function(tour) { %>',
      '<option value="<%= tour.id %>"><%= tour.id %></option>',
    '<% }); %>'
  ].join('')),

  JST_DEV_CONTORLS = _.template([
    '<div class="developer-controls">',
      '<button data-action="guide.toggle">Toggle</button>',
      '<button data-action="toggleOverlay">Toggle Overlay</button>',
    '</div>'
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,
      withDeveloperControls: false,
      inMarkers:  false,
      inTutor:    false
    },

    id: 'controls',

    constructor: function() {
      var that = this;

      this.$container = guide.$el;
      this.guide = guide;
      this.tour  = guide.tour;
      this.options = this.getOptions();

      // this.refresh();

      guide.$
      .on('show', _.bind(this.show, this))
      .on('hide', _.bind(this.hide, this))
      .on('dismiss', _.bind(this.remove, this))
      .on('focus', function(/*e, spot*/) {
        that.refreshControls();
      });

      this.$el = $(JST_CONTROLS({}));

      if (this.options.withDeveloperControls) {
        this.$el.append($(JST_DEV_CONTORLS({})));
      }

      this.$el
        .addClass(guide.entityKlass())
        .on('click', '[data-action]', _.bind(this.delegate, this));

      _.extend(this, {
        $bwd:   this.$el.find('[data-action*=prev]'),
        $fwd:   this.$el.find('[data-action*=next]'),
        $first: this.$el.find('[data-action*=first]'),
        $last:  this.$el.find('[data-action*=last]'),
        $hide:  this.$el.find('[data-action*=hide]'),
        $tour_selector:  this.$el.find('[data-action="switchTour"]')
      });

      return this;
    },

    onTourStart: function(tour) {
      this.tour = tour;
      this.refresh();
    },

    show: function() {
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

    detachFromMarker: function(/*marker*/) {
      this.$container.removeClass('with-controls');
      this.$container = $();

      this.hide();
    },


    refresh: function() {
      var
      extTutor    = guide.getExtension('tutor'),
      extMarkers  = guide.getExtension('markers'),
      options     = this.getOptions();

      // this.remove();

      if (extMarkers && extMarkers.isEnabled() && options.inMarkers) {
        this.markerMode(extMarkers);
      }
      else if (extTutor && extTutor.isEnabled() && options.inTutor) {
        this.tutorMode(extTutor);
      }
      else {
        this.classicMode();
      }

      this.show();
    },

    classicMode: function() {
      var extTutor = guide.getExtension('tutor'),
          extMarkers  = guide.getExtension('markers');

      this.$container = guide.$el;

      if (extTutor) {
        extTutor.$el
          .addClass('without-controls')
          .removeClass('with-controls');
      }

      if (extMarkers) {
        guide.$
        .off('marking.gjs_markers.gjs_controls')
        .off('unmarking.gjs_markers.gjs_controls');
      }
    },

    markerMode: function(/*ext*/) {
      var that = this,
          marker;

      this.$container = $();

      guide.$
      .on('marking.gjs_markers.gjs_controls', function(e, marker) {
        that.attachToMarker(marker);
      })
      .on('unmarking.gjs_markers.gjs_controls', function(e, marker) {
        that.detachFromMarker(marker);
      });

      // if we're embedding into markers and a spot is currently marked,
      // attach ourselves to the marker
      if (guide.tour && guide.tour.current && guide.tour.current.marker) {
        marker = guide.tour.current.marker;

        _.defer(function() {
          marker.hide();
          that.attachToMarker(marker);
          marker.show();
        });
      }
    },

    tutorMode: function(ext) {
      this.$container = ext.$el;
      ext.$el.addClass('with-controls');
    },

    delegate: function(e) {
      var action = $(e.target).attr('data-action'),
          pair,
          target,
          method;

      if (!action) {
        return;
      }
      else if (action.indexOf('.') > -1) {
        pair    = action.split('.');
        target  = pair[0];
        method  = pair[1];

        if (this[target] && this[target][method]) {
          this[target][method]();
        }
      }
      else {
        if (this[action]) {
          this[action]();
        }
      }

      return $.consume(e);
    },

    toggleOverlay: function() {
      guide.setOptions({
        withOverlay: !guide.options.withOverlay
      });
    },

    refreshControls: function() {
      var tour = this.tour;

      this.$tour_selector.html(JST_TOUR_LIST({ tours: guide.tours }));
      this.$bwd.prop('disabled', !tour.hasPrev());
      this.$fwd.prop('disabled', !tour.hasNext());
      this.$first.prop('disabled', !tour.hasPrev());
      this.$last.prop('disabled', !tour.hasNext());
      this.$hide.toggle(!tour.hasNext());
      this.$tour_selector.find('[value="' + tour.id + '"]').prop('selected', true);
    },

    switchTour: function() {
      var tour = guide.getTour(this.$tour_selector.find(':selected').val());

      if (tour && !tour.isActive()) {
        tour.reset();
        guide.runTour(tour);
      }

      return true;
    }

  }); // Extension.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);