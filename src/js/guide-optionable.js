(function(_, $, guide) {
  'use strict';

  /**
   * @class Guide.Optionable
   * An interface for defining and updating options an object accepts.
   *
   * @alternateClassName Optionable
   */
  var
  Guide = guide,
  Optionable = {

    /**
     * The options the object accepts along with their default values.
     */
    defaults: {},

    /**
     * Assign option values to this object, overriding any existing values.
     *
     * If the object supports it, #refresh will be called to give a chance for
     * the object to reflect the new options.
     *
     * @fires refresh
     * @param {Object/String} options
     * The set of options to override. If the parameter is a String, it will
     * be parsed into an object using _#parseOptions if it's valid.
     */
    setOptions: function(options, platform, silent) {
      var _platform;

      if (_.isString(options)) {
        options = _.parseOptions(options);
      }
      else if (!_.isObject(options)) {
        throw 'guide.js: bad options passed to #setOptions; expected an Object' +
              ' or a String, but got: ' + typeof(options);
      }

      if (!this.options) {
        this.options = {};
      }

      if (options.overrides) {
        for (_platform in options.overrides) {
          this.setOptions(options.overrides[_platform], _platform, true);
        }

        delete options.overrides;
      }

      _platform = platform || 'default';
      this.options[_platform] = _.extend(this.options[_platform] || {}, options);

      if (!silent && this.refresh) {
        this.refresh();
      }

      if (!silent && this.$) {
        /**
         * @event refresh
         * Fired when an object's options are updated.
         *
         * **This event is triggered on the Optionable's #$ if set.**
         *
         * @param {jQuery.Event} event
         * A default jQuery event.
         * @param {Object} options
         * The the new set of options.
         * @param {Optionable} object
         * The Optionable object that has been modified.
         */
        this.$.triggerHandler('refresh', [ this ]);
      }

      return this;
    },

    setOption: function(key, value, platform, silent) {
      var option = {};
      option[key] = value;

      return this.setOptions(option, platform, silent);
    },

    /**
     * Retrieve a mutable set of the current options of the object.
     */
    getOptions: function(scope, source) {
      var set,
          platform = Guide.platform;

      source = source || this.options;

      set = _.extend({}, source['default'], source[platform]);

      if (set.overrides) {
        _.extend(set, set.overrides[platform]);
        delete set.overrides;
      }

      if (scope) {
        return this.getOption(scope, set);
      }

      return set;
    },

    getOption: function(key, set) {
      return _.dotGet(key, set || this.getOptions());
    },

    /**
     * Check if an option is set, regardless of its value.
     */
    hasOption: function(key, set) {
      return this.getOption(key, set) !== void 0;
    },

    /**
     * Check if an option is set and evaluates to true.
     */
    isOptionOn: function(key, set) {
      var option = this.getOption(key, set);
      return _.isBoolean(option) && option;
    },

    isOn: function() {
      return this.isOptionOn.apply(this, arguments);
    },

    /**
     * Define a new option that the object will understand from now on.
     *
     * This is useful for extensions that enable new options to be assigned on
     * core guide.js entities.
     *
     * @param {String} key          The option key.
     * @param {Mixed} default_value The default, *and initial*, value to assign.
     */
    addOption: function(key, default_value) {
      this.defaults[key] = default_value;

      if (this.options) {
        this.setOption(key, default_value);
      }
    }
  };

  // expose the Optionable interface for other components to re-use
  guide.Optionable = Optionable;

  // guide itself requires this functionality so we add it manually
  _.extend(guide, _.omit(Optionable, 'defaults'));
  guide.setOptions(guide.defaults);
})(_, jQuery, window.guide);