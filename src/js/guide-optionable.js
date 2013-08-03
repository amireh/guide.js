(function(_, $, guide) {
  'use strict';

  /**
   * @class Optionable
   * An interface for defining and updating options an object accepts.
   */
  var Optionable = {
    /**
     * The options the object accepts along with their default values.
     */
    defaults: {},

    /**
     * Assign option values to this object, overriding any existing values.
     *
     * If the object supports it, #refresh will be called with the new options
     * to give a chance for the object to reflect the new options.
     *
     * @fires refresh
     * @param {Object/String} options
     *  The set of options to override. If the parameter is a String, it will
     *  be parsed into an object using _#parseOptions if it's valid.
     */
    setOptions: function(options) {
      if (_.isString(options)) {
        options = _.parseOptions(options);
      }

      this.options = _.extend(this.options || {}, options);

      if (this.refresh) {
        this.refresh(this.getOptions());
      }

      if (this.$) {
        /**
         * @event refresh
         * Fired when an object's options are updated.
         *
         * **This event is triggered on the Optionable's #$ if set.**
         *
         * @param {jQuery.Event} event
         *  A default jQuery event.
         * @param {Object} options
         *  The the new set of options.
         * @param {Optionable} object
         *  The Optionable object that has been modified.
         */
        this.$.triggerHandler('refresh', [ this.options, this ]);
      }

      return this;
    },

    /**
     * Retrieve a mutable set of the current options of the object.
     */
    getOptions: function() {
      return _.extend({}, this.options);
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
        if (void 0 === this.options[key]) {
          this.options[key] = default_value;
        }
      }
    }
  };

  // expose the Optionable interface for other components to re-use
  guide.Optionable = Optionable;

  // guide itself requires this functionality so we add it manually
  _.extend(guide, Optionable);
})(_, jQuery, window.guide);