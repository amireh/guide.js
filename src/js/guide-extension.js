(function(_, $, guide) {
  'use strict';

  /**
   * @class Guide.Extension
   * @mixins Guide.Optionable
   * @inheritable
   *
   * An interface, and some helpers, for extensions to mount inside guide.js.
   */
  var Extension = _.extend({}, guide.Optionable, {
    __initExtension: function() {
      if (!this.id) {
        throw 'guide.js: bad extension, missing #id';
      }

      // Make sure an `enabled` option always exists
      _.defaults(this.defaults, { enabled: true });

      _.extend(this, {
        $:        $(this),
        options:  _.extend({}, this.defaults, this.options)
      });

      guide.$.on(this.nsEvent('dismiss'), _.bind(this.remove, this));

      if (this.onGuideShow) {
        guide.$.on(this.nsEvent('show'), _.bind(function() {
          if (this.isEnabled()) {
            this.onGuideShow();
            this._shouldHide = true;
          }
        }, this));
      }

      if (this.onGuideHide) {
        guide.$.on(this.nsEvent('hide'), _.bind(function() {
          if (this._shouldHide) {
            this.onGuideHide();
            this._shouldHide = false;
          }
        }, this));
      }

      if (this.onTourStart) {
        guide.$.on(this.nsEvent('start.tours'), _.bind(function(e, tour) {
          if (this.isEnabled(tour)) {
            this.onTourStart(tour);
            tour.$.one('stop', _.bind(this.onTourStop, this, tour));
          }
        }, this));
      }
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

    /**
     * Whether the extension is available for use in the passed tour.
     *
     * If the tour does not explicitly specify an #enabled option for this extension,
     * the global guide options is then queried, and if not set there either,
     * the default value is used (which is `true`).
     */
    isEnabled: function(tour) {
      var tourExtOptions;

      if (tour) {
        tourExtOptions = tour.options[this.id] || {};

        if (_.isBoolean(tourExtOptions.enabled)) {
          return tourExtOptions.enabled;
        }
      }

      return !!this.getOptions().enabled;
    },

    /**
     * Handle the extension options, re-render nodes, or re-install event handlers.
     *
     * Behaviour of #refresh is heavily extension-specific and so no stock
     * implementation exists.
     *
     * This method is implicitly called in Guide#refresh and Optionable#setOptions.
     */
    refresh: function() {
    },

    /**
     * Restore all internal state/context of the extension to the point where
     * guide.js has not been used yet.
     *
     * The stock #reset behaviour merely resets the Extension's options to
     * their defaults.
     */
    reset: function() {
      this.options = _.clone(this.defaults);
    },

    remove: function() {}
  });

  guide.Extension = Extension;
})(_, jQuery, window.guide);