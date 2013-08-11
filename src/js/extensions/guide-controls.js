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
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,
      inMarkers:  false,
      inTutor:    false,
      withTourSelector: true
    },

    id: 'controls',

    constructor: function() {
      this.$container = guide.$el;
      this.guide = guide;
      this.tour = null;

      // this.refresh();

      guide.$
        .on('dismiss',  _.bind(this.remove, this))
        .on('focus',    _.bind(this.refreshControls, this));

      this.$el = $(JST_CONTROLS({}));
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

    onTourStop: function() {
      this.tour = null;
      this.hide();
    },

    show: function() {
      this.$el.appendTo(this.$container);
      this.refreshControls();
    },

    hide: function() {
      this.$el.detach();
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
      if (!marker.$el) {
        return this.hide();
      }

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
      tour        = guide.tour,
      extTutor    = guide.getExtension('tutor'),
      extMarkers  = guide.getExtension('markers'),
      options     = this.getOptions();

      // this.remove();

      if (extMarkers && extMarkers.isEnabled(tour) && options.inMarkers) {
        this.markerMode(extMarkers);
      }
      else if (extTutor && extTutor.isEnabled(tour) && options.inTutor) {
        this.tutorMode(extTutor);
      }
      else {
        this.classicMode();
      }

      this.show();
    },

    classicMode: function() {
      var extTutor    = guide.getExtension('tutor'),
          extMarkers  = guide.getExtension('markers');

      this.$container = guide.$el;

      if (extTutor) {
        extTutor.$el
          .addClass('without-controls')
          .removeClass('with-controls');
      }

      if (extMarkers) {
        guide.$
          .off(this.nsEvent('marking.gjs_markers'))
          .off(this.nsEvent('unmarking.gjs_markers'));
      }
    },

    markerMode: function(/*ext*/) {
      var that = this,
          marker;

      this.$container = $();

      guide.$
        .on(this.nsEvent('marking.gjs_markers'), function(e, marker) {
          that.attachToMarker(marker);
        })
        .on(this.nsEvent('unmarking.gjs_markers'), function(e, marker) {
          that.detachFromMarker(marker);
        });

      // if we're embedding into markers and a spot is currently marked,
      // attach ourselves to the marker
      if (guide.tour && guide.tour.current && guide.tour.current.marker) {
        marker = guide.tour.current.marker;

        _.defer(_.bind(this.attachToMarker, this, marker));
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


    refreshControls: function() {
      var tour = guide.tour;

      this.$bwd.prop('disabled',    !tour.hasPrev());
      this.$fwd.prop('disabled',    !tour.hasNext());
      this.$first.prop('disabled',  !tour.hasPrev());
      this.$last.prop('disabled',   !tour.hasNext());
      // this.$hide.toggle(            !tour.hasNext());
      this.$hide.show();

      if (this.getOptions().withTourSelector) {
        this.$tour_selector
          .html(JST_TOUR_LIST({ tours: guide.tours }))
          .toggle(guide.tours.length > 1)
          .find('[value="' + tour.id + '"]').prop('selected', true);
      }
      else {
        this.$tour_selector.hide();
      }
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