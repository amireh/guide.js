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
        targets:  [],
        cursor:   -1,
        current:  null,
        previous: null
      });

      console.log('guide.js: tour defined: ', this.id);

      return this;
    },

    addStep: function($el, options) {
      var target;

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
        tour: this,
        index: this.targets.length,
        options: options
      });

      this.targets.push(target);

      if (!this.current) {
        this.current = target;
      }

      $el.
        addClass(guide.entityKlass()).
        data('guideling', target);

      if (guide.isShown()) {
        target.highlight();
      }

      guide.$.triggerHandler('add', [ target ]);

      return true;
    },

    /**
     * Focuses the next target, if any.
     *
     * @see guide#focus
     */
    next: function() {
      if (!this.hasNext()) {
        return false;
      }

      return this.focus(this.cursor + 1);
    },

    hasNext: function() {
      var ln = this.targets.length;

      return ln != 1 && this.cursor < ln-1;
    },

    prev: function() {
      if (!this.hasPrev()) {
        return false;
      }

      return this.focus(this.cursor - 1);
    },

    hasPrev: function() {
      var ln = this.targets.length;

      return ln != 1 && this.cursor > 0;
    },

    first: function() {
      return this.focus(0);
    },

    last: function() {
      return this.focus(this.targets.length-1);
    },

    /**
     *
     * @emit defocus.gjs on the current (now previous) target, guide.previous.$el
     * @emit defocus [ prevTarget, currTarget, guide ] on guide.$
     *
     * @emit focus.gjs on the next (now current) target, guide.current.$el
     * @emit focus [ currTarget, guide ] on guide.$
     *
     * @return whether the target has been focused
     */
    focus: function(index) {
      var target  = this.getStep(index);

      if (!target) {
        throw "guide.js: bad target @ " + index + " to focus";
      }

      if (target.isCurrent()) {
        return false;
      }

      if (!this.isActive()) {
        this.runTour(this);
      }

      this.previous = this.current;
      this.pCursor = this.cursor;
      this.current = target;
      this.cursor  = target.index;
      // this.cursor  = this.indexOf(target);

      // de-focus the last target
      if (this.previous) {
        this.previous.defocus(target);
        guide.$.triggerHandler('defocus', [ this.previous, this.current, this ]);
      }

      target.focus(this.previous);
      guide.$.triggerHandler('focus', [ target, this ]);

      return true;
    },

    activate: function() {
      _.each(this.targets, function(target) {
        target.highlight();
      });

      if (this.current) {
        this.current.focus();
      }

      return this;
    },

    deactivate: function() {
      _.each(this.targets, function(target) {
        target.dehighlight({ force: true });
      });

      return this;
    },

    isActive: function() {
      return this == guide.tour;
    },

    refresh: function() {
      this.deactivate().activate();
    },

    getStep: function(index_or_el) {
      var index = index_or_el;

      if (typeof(index) == 'number') {
        return this.targets[index];
      }
      else if (!index) {
        return null;
      }

      console.log('looking up target:', arguments)

      // return _.find(this.targets || [], index);
      return index;
    },

    indexOf: function(target) {
      return _.indexOf(this.targets, target);
    }
  });

  guide.Tour = Tour;

  // The default tour
  guide.tour = guide.defineTour('Default Tour');
})(_, jQuery, window.guide);