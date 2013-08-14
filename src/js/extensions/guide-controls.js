(function(_, $, guide) {
  'use strict';

  var
  /**
   * @class Guide.Controls
   * @extends Guide.Extension
   *
   * A widget that provides tour navigation controls, like going forward and
   * backward, jumping to first or last spot, or closing the tour.
   *
   * **This extension can integrate with Guide.Tutor and Guide.Markers.**
   */
  Extension = function() {
    return this.constructor();
  };

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,
      inMarkers:  false,
      inTutor:    false,
      withTourSelector: true,
      withJumps: true,
      withClose: true
    },

    id: 'controls',

    templates: {
      controls: _.template([
        '<div id="gjs_controls">',
          '<button data-action="tour.first">First</button>',
          '<button data-action="tour.prev">&lt;</button>',
          '<button data-action="tour.next">&gt;</button>',
          '<button data-action="tour.last">Last</button>',
          '<button data-action="guide.hide">Close</button>',
          '<select name="tour" data-action="switchTour"></select>',
        '</div>'
      ].join('')),

      tourList: _.template([
        '<% _.forEach(tours, function(tour) { %>',
          '<% if (tour.spots.length) { %>',
            '<option value="<%= tour.id %>"><%= tour.id %></option>',
          '<% } %>',
        '<% }); %>'
      ].join(''))
    },

    constructor: function() {
      this.$container = guide.$el;
      this.guide = guide;
      this.tour = null;

      this.$el = $(this.templates.controls({}));
      this.$el.addClass(guide.entityKlass());

      _.extend(this, {
        $bwd:   this.$el.find('[data-action*=prev]'),
        $fwd:   this.$el.find('[data-action*=next]'),
        $first: this.$el.find('[data-action*=first]'),
        $last:  this.$el.find('[data-action*=last]'),
        $hide:  this.$el.find('[data-action*=hide]'),
        $tour_selector:  this.$el.find('[data-action="switchTour"]')
      });

      guide.$
        .on(this.nsEvent('focus'), _.bind(function() {
          this.$el.on(this.nsEvent('click'), '[data-action]', _.bind(this.proxy, this));
        }, this))
        .on(this.nsEvent('defocus'), _.bind(function() {
          this.$el.off(this.nsEvent('click'), '[data-action]');
        }, this));

      return this;
    },

    onTourStart: function(tour) {
      this.tour = tour;
      this.tour.$.on(this.nsEvent('focus'), _.bind(this.refreshControls, this));
      this.tour.$.on(this.nsEvent('add'), _.bind(this.refreshControls, this));

      this.refresh();
    },

    onTourStop: function() {

      this.tour.$.off(this.nsEvent('focus'));
      this.tour = null;
      this.hide();
    },

    show: function() {
      if (!this.tour) {
        return false;
      }

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
          .off(this.nsEvent('marking.gjs_markers'))
          .off(this.nsEvent('unmarking.gjs_markers'));
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

      // If we're embedding into markers and a spot is currently marked,
      // attach ourselves to the marker.
      if (guide.tour && guide.tour.current && guide.tour.current.marker) {
        marker = guide.tour.current.marker;

        this.attachToMarker(marker);

        // We've to refresh its position as its width might have changed.
        marker.place();
      }
    },

    tutorMode: function(ext) {
      this.$container = ext.$el;
      ext.$el.addClass('with-controls');
    },

    proxy: function(e) {
      var action = $(e.target).attr('data-action'),
          pair,
          target,
          method;

      if (!action) {
        return $.consume(e);
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
      var tour    = this.tour,
          options = this.getOptions(tour);

      this.$bwd.prop('disabled',    !tour.hasPrev());
      this.$fwd.prop('disabled',    !tour.hasNext());
      this.$first.prop('disabled',  !tour.hasPrev()).toggle(options.withJumps);
      this.$last.prop('disabled',   !tour.hasNext()).toggle(options.withJumps);
      this.$hide.toggle(options.withClose);

      if (options.withTourSelector) {
        this.$tour_selector
          .html(this.templates.tourList({ tours: guide.tours }))
          .toggle(guide.tours.length > 1)
          .find('[value="' + tour.id + '"]').prop('selected', true);

        if (this.$tour_selector.children().length === 1) {
          this.$tour_selector.hide();
        }
      }
      else {
        this.$tour_selector.hide();
      }
    },

    switchTour: function() {
      var tour = guide.getTour(this.$tour_selector.find(':selected').val());

      if (tour && !tour.isActive()) {
        tour.reset();
        return guide.runTour(tour);
      }

      return false;
    }

  }); // Extension.prototype

  guide.addExtension(new Extension());
})(_, jQuery, window.guide);