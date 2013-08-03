(function(_, $, guide) {
  'use strict';

  var Optionable = {
    defaults: {},

    addOption: function(key, default_value) {
      this.defaults[key] = default_value;

      if (this.options) {
        if (void 0 === this.options[key]) {
          this.options[key] = default_value;
        }
      }
    },

    setOptions: function(options) {
      // this.options = _.extend(this.getOptions(), options);
      this.options = _.extend(this.options, options);

      if (this.refresh) {
        this.refresh(this.getOptions());
      }

      if (this.$) {
        // console.log('guide.js:', this.id,'options changed, triggering refresh');

        this.$.triggerHandler('refresh', [ this.options, this ]);
      }

      return this;
    },

    getOptions: function() {
      return _.extend({}, this.options);
    }
  };

  // expose the Optionable interface for other components to re-use
  guide.Optionable = Optionable;

  _.extend(guide, Optionable);

})(_, jQuery, window.guide);