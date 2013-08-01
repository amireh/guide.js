(function(_, $, guide) {
  'use strict';

  var Extension = _.extend({}, guide.Optionable, {
    __initExtension: function() {
      var that = this;

      if (!this.id) {
        throw 'guide.js: bad extension, missing #id';
      }

      this.options = _.extend({}, this.defaults, { enabled: true }, this.options);

      guide.$
        .on(this.nsEvent('show'), function() {
          if (that.onGuideShow && that.isEnabled()) {
            that.onGuideShow();
          }
        })
        .on(this.nsEvent('hide'), function() {
          if (that.onGuideHide && that.isEnabled()) {
            that.onGuideHide();
          }
        })
        .on(this.nsEvent('start.tours'), function(e, tour) {
          if (that.onTourStart && that.isEnabled(tour)) {
            that.onTourStart(tour);
          }
        })
        .on(this.nsEvent('stop.tours'), function(e, tour) {
          if (that.onTourStop && that.isEnabled(tour)) {
            that.onTourStop(tour);
          }
        });
    },

    /**
     * An event namespaced to this specific extension.
     */
    nsEvent: function(event) {
      return [ event, 'gjs_extension', this.id ].join('.');
    },

    /**
     * Builds the option set from the Extension's current options (or defaults),
     * combined with global guide options and the current tour's overrides.
     *
     * The global options (guide's and tour's) are expected to be keyed by the
     * extension id. So for an extension IDed as 'foo', its options in the
     * global guide instance would be specified as:
     *
     *  guide.setOptions({ foo: { option: value }})
     *
     * The option set is prioritized as follows (from lowest to highest):
     *   1. the extensions' current options, or its defaults
     *   2. the extensions' options specified in the guide.js global option set
     *   3. the extensions' options specified in the current tour's option set
     */
    getOptions: function(tour) {
      var key = this.id;

      tour = tour || guide.tour;

      return _.extend({},
        this.options,
        guide.options[key],
        tour ? (tour.options || {})[key] : null);
    },

    isEnabled: function(tour) {
      if (tour) {
        var extOptions = (tour.options[this.id] || {});

        if (_.isBoolean(extOptions.enabled)) {
          return extOptions.enabled;
        }
      }

      // return !!this.options.enabled;
      return !!this.getOptions().enabled;
    }
  });

  guide.Extension = Extension;
})(_, jQuery, window.guide);