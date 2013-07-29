(function(_, $, guide) {
  'use strict';

  var Extension = _.extend({}, guide.Optionable, {
    __initExtension: function() {
      var that = this;

      if (!this.id) {
        throw 'guide.js: bad extension, missing #id';
      }

      this.options = _.clone(this.defaults);

      guide.$
      .on('show', function() {
        if (that.onGuideShow) {
          that.onGuideShow();
        }
      })
      .on('hide', function() {
        if (that.onGuideHide) {
          that.onGuideHide();
        }
      })
      .on('start.tours.gjs_extension', function(e, tour) {
        tour.$.on('refresh.gjs_extension', function() {
          that.setOptions(that.getOptions());
        });

        that.setOptions(that.getOptions());

        if (that.onTourStart) {
          that.onTourStart(tour);
        }
      });
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
    getOptions: function(overrides) {
      var key = this.id;

      return _.extend({},
        this.options || this.defaults,
        key && guide.getOptions()[key],
        key && guide.tour ? guide.tour.getOptions()[key] : null,
        overrides);
    },

    isEnabled: function() {
      return !!this.getOptions().enabled;
    }
  });

  guide.Extension = Extension;
})(_, jQuery, window.guide);