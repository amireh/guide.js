(function(_, $, guide) {
  'use strict';

  var
  Tour = function() {
    return this.constructor.apply(this, arguments);
  };

  _.extend(Tour.prototype, guide.Optionable, {
    defaults: {
      alwaysHighlight: true
    },

    constructor: function(label) {
      this.$ = $(this);

      _.extend(this, {
        id:       label,
        options:  _.defaults({}, this.defaults),
        targets:  []
      });

      console.log('guide.js: tour defined: ', this.id);

      return this;
    },

    addStep: function($el, options) {
      var index,
          target  = {},
          tour    = this;

      // has the target been already defined? we can not handle duplicates
      if ($el.data('guideling')) {
        console.log('guide.js: [error] duplicate target:');
        console.log($el);

        if (true || GRACEFUL) {
          return false;
        }

        throw "guide.js: duplicate target, see console for more information";
      }

      target = new guide.Target({
        $el: $el,

        // the element that will be used as an indicator of the target's position
        // when scrolling the element into view, could be modified by extensions
        $scrollAnchor: $el,

        tour: tour,

        options: options
      });

      index = tour.targets.push(target) - 1;

      $el.
        addClass(guide.entityKlass()).
        data('guideling', target);

      if (guide.isShown()) {
        target.highlight();
      }

      guide.$.triggerHandler('add', [ target ]);

      return true;
    },

    activate: function() {
      _.each(this.targets, function(target) {
        target.highlight();
      });

      return this;
    },

    deactivate: function() {
      _.each(this.targets, function(target) {
        target.dehighlight();
      });

      return this;
    },

    isActive: function() {
      return this == guide.tour;
    },

    refresh: function() {
      this.deactivate().activate();
    }
  });

  guide.Tour = Tour;

  // The default tour
  guide.tour = guide.defineTour('Default Tour');
})(_, jQuery, window.guide);