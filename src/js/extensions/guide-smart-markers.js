(function(_, $, guide, MarkersExt) {
  'use strict';

  if (!MarkersExt) {
    throw 'guide.js: Smart Markers requires the Markers extension to be loaded.';
  }

  var
  /**
   * @class Guide.Extensions.SmartMarkers
   * @extends Guide.Extension
   *
   * A an extension that adds a "smartness" layer to {@link Guide.Marker guide.js markers}.
   */
  Extension = function() {
    return this.constructor();
  },
  JST_ARROW = _.template([
    '<div class="gjs-arrow"></div>'
  ].join(''));

  _.extend(Extension.prototype, guide.Extension, {
    defaults: {
      enabled: true,

      /**
       * @cfg {Boolean} [adjustArrows=true]
       * Re-position the marker's arrow to always point at the middle of the
       * target.
       */
      adjustArrows: true,

      arrowDim: 15
    },

    id: 'smart_markers',

    constructor: function() {
      return this;
    },

    install: function() {
      guide.$.on(this.nsEvent('starting.tours'), _.bind(function(e, tour) {
        if (this.isEnabled(tour)) {
          this.onTourStarting(tour);

          // Bind the clean-up handler to the tour stop event, if implemented:
          if (this.onTourStop) {
            tour.$.one(this.nsEvent('stop'), _.bind(this.onTourStop, this, tour));
          }
        }
      }, this));
    },

    onTourStarting: function() {
      if (this.isOn('adjustArrows')) {
        guide.$.on(this.nsEvent('marked.gjs_markers'), _.bind(function(e, marker) {
          _.defer(_.bind(this.adjustArrows, this, e, marker));
        }, this));
      }
    },

    onTourStop: function() {
      guide.$.off(this.nsEvent('marked.gjs_markers'));
    },

    adjustArrows: function(e, marker) {
      if (!marker.canShow() || !marker.$el) {
        return false;
      }

      var
      adjusted = false,
      // the arrow we might be creating and aligning
      $arrow,
      // the size of the arrow
      arrowDim = this.getOption('arrowDim'),
      $marker = marker.$el,
      $spot = marker.spot.$el,
      // a query object we'll be using later
      q = {},
      // the marker's position
      position = marker.positionToString(marker.position);

      if (_.contains([ 'top', 'bottom' ], position)) {
        $arrow = $marker.$arrow;

        q = {
          marker: {
            width: $marker.outerWidth(),
            offset: $marker.offset()
          },
          spot: {
            width: $spot.outerWidth(),
            offset: $spot.offset()
          }
        };

        // If the marker's centre point is farther to the right than where the
        // target is (from a horizontal axis, offset.left),
        // then we need to move the arrow to the center of the target.
        //
        if (q.marker.offset.left + q.marker.width / 2 + arrowDim >= q.spot.offset.left ) {
          if (!$arrow) {
            $arrow = $( JST_ARROW({}) ).addClass(position).appendTo($marker);
            $marker.addClass('no-arrow');

            // We'll keep a reference so we don't re-create the arrow
            marker.$arrow = $arrow;
          }

          // Centre the arrow
          $arrow.css('left', (q.spot.offset.left - q.marker.offset.left) + q.spot.width / 2);
          adjusted = true;
        } else {
          if ($arrow) {
            $marker.removeClass('no-arrow');
            $arrow.remove();

            delete marker.$arrow;
          }
        }
      }

      return adjusted;
    }
  });

  guide.addExtension(new Extension());
})(_, jQuery, window.guide, window.guide.getExtension('markers'));