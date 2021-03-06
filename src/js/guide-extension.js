(function(_, $, Guide) {
  'use strict';

  /**
   * @class Guide.Extension
   * @mixins Guide.Optionable
   * @inheritable
   * @abstract
   *
   * An interface, and some helpers, for extensions to mount inside Guide.js.
   *
   * @alternateClassName Extension
   */
  var
  Extension = _.extend({}, Guide.Optionable, {
    __initExtension: function() {
      if (!this.id) {
        throw 'Guide.js: bad extension, missing #id';
      }

      // Make sure an `enabled` option always exists
      this.defaults = _.defaults(this.defaults || {}, { enabled: true });

      // An event delegator.
      this.$ = $(this);

      this.options = {};
      this.setOptions(_.extend({}, this.defaults));

      // Uninstall extension on Guide.js dismissal
      Guide.$.on(this.nsEvent('dismiss'), _.bind(this.remove, this));

      // Refresh it on option updates
      Guide.$.on(this.nsEvent('refresh'), _.bind(this.refresh, this));

      // If implemented, hook into Guide#show and Guide#hide:
      //
      // The handlers will be invoked only if the extension is enabled.
      if (this.onGuideShow) {
        Guide.$.on(this.nsEvent('show'), _.bind(function() {
          if (this.isEnabled()) {
            this.onGuideShow();

            // Bind the clean-up handler to the guide hide event, if implemented:
            if (this.onGuideHide) {
              Guide.$.one(this.nsEvent('hide'), _.bind(this.onGuideHide, this));
            }
          }
        }, this));
      }

      // If implemented, hook into Tour#start and Tour#stop:
      //
      // The handlers will be invoked only if the extension has not been explicitly
      // disabled for the active tour. This saves the extension from doing the
      // needed tests in the handlers.
      if (this.onTourStart) {
        Guide.$.on(this.nsEvent('start.tours'), _.bind(function(e, tour) {
          if (this.isEnabled(tour)) {
            this.onTourStart(tour);

            // Bind the clean-up handler to the tour stop event, if implemented:
            if (this.onTourStop) {
              tour.$.one(this.nsEvent('stop'), _.bind(this.onTourStop, this, tour));
            }
          }
        }, this));
      }

      if (this.install) {
        this.install();
      }
    },

    /**
     * Namespace an event to this extension.
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
     *  Guide.setOptions({ foo: { option: value }})
     *
     * The option set is prioritized as follows (from lowest to highest):
     *   1. the extensions' current options, or its defaults
     *   2. the extensions' options specified in the Guide.js global option set
     *   3. the extensions' options specified in the current tour's option set
     */
    getOptions: function(tour) {
      var set,
          key = this.id;

      tour = tour || Guide.tour;

      set = _.extend({},
        this.options['default'],
        this.options[Guide.platform],
        Guide.getOptions()[key],
        tour ? tour.getOptions()[key] : null);

      if (set.overrides) {
        _.extend(set, set.overrides[Guide.platform]);
        delete set.overrides;
      }

      return set;
    },

    /**
     * Whether the extension is available for use in the passed tour.
     *
     * If the tour does not explicitly specify an #enabled option for this extension,
     * the global guide options is then queried, and if not set there either,
     * the default value is used (which is `true`).
     */
    isEnabled: function(tour) {
      var scopedOption = [ this.id, 'enabled' ].join('.');

      if (tour) {
        if (tour.hasOption(scopedOption)) {
          return tour.isOptionOn(scopedOption);
        }
      }

      return this.isOptionOn('enabled');
    },

    /**
     * Handle the extension options, re-render nodes, or re-install event handlers.
     *
     * Behaviour of #refresh is heavily extension-specific and so no stock
     * implementation exists.
     *
     * This method is implicitly called in Guide#refresh and Optionable#setOptions.
     *
     * @template
     */
    refresh: function() {
    },

    /**
     * Restore all internal state/context of the extension to the point where
     * Guide.js has not been used yet.
     *
     * The stock #reset behaviour merely resets the Extension's options to
     * their defaults.
     *
     * @template
     */
    reset: function() {
      this.options = {};
      this.setOptions(this.defaults);
    },

    /**
     * Uninstall the extension.
     *
     * @template
     */
    remove: function() {
    }
  });

  Guide.Extension = Extension;
})(_, jQuery, this.Guide);