(function(_, $) {
  'use strict';

  var
  guide = function() {
    this.constructor.apply(this, arguments);

    return this;
  },

  Target = function(options) {
    _.extend(this, options);
    return this;
  },

  GRACEFUL = false,
  DEBUG    = true,
  DEFAULTS = {
    withOverlay: false,
    withAnimations: true
  },

  KLASS_VISIBLE     = 'with-guide',
  KLASS_OVERLAYED   = 'with-overlayed-guide',
  KLASS_ENTITY      = 'guide-entity',
  KLASS_TARGET      = 'guide-target',
  KLASS_FOCUSED     = 'guide-target-focused',
  ENTITY_ZINDEX     = 100;

  _.extend(guide.prototype, {
    $container: $('body'),
    $el:        $('<div class="guide-js" />'),

    entityKlass: function() {
      return KLASS_ENTITY;
    },

    entityZIndex: function() {
      return ENTITY_ZINDEX;
    },

    constructor: function() {
      _.extend(this, {
        options: _.clone(DEFAULTS),
        contexts:   [],
        extensions: [],
        context: null,
        cTarget: null,
        pTarget: null,
        cursor:  -1
      });

      // A default context
      this.context = this.defineContext('default', 'Guide').contexts[0];

      this.$ = $(this);
    },

    defineContext: function(id, optLabel, optTargets) {
      var context;

      if (!(context = this.__getContext(id))) {
        context = this.__mkContext(id, optLabel, this);
      }

      if (optTargets) {
        var that = this;

        if (!_.isArray(optTargets)) {
          throw "guide.js#defineContext: bad targets, expected array, got: " +
                typeof(optTargets);
        };

        this.fromJSON(optTargets);
      }

      return this;
    },

    switchContext: function(id) {
      var context;

      if (!(context = this.__getContext(id))) {
        throw [
          "guide.js: undefined context '",
          id,
          "', did you forget to call #defineContext()?"
        ].join('');
      }

      this.context = context;

      return this;
    },

    /**
     * @param <Object> options
     * {
     *   text:
     *   caption:
     *   context: defaults to the current context
     *   placement: [ 'inline', 'inline:before', 'inline:after', 'overlay' ]
     *   position: [ 'tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l' ]
     *
     *   onFocus: function($prevTarget) {}
     *   onDefocus: function($currentTarget) {}
     * }
     */
    addTarget: function($el, options) {
      var index,
          target  = {},
          context = options.context || this.context;

      // has the target been already defined? we can not handle duplicates
      if ($el.data('guideling')) {
        console.log('guide.js: [error] duplicate target:');
        console.log($el);

        if (GRACEFUL) {
          return false;
        }

        throw "guide.js: duplicate target, see console for more information";
      }

      target = new Target({
        $el:     $el,
        context: context,
        options: options
      });

      index = context.targets.push(target) - 1;

      $el.
        addClass(KLASS_ENTITY).
        data('guideling', target);

      if (this.isShown()) {
        $el.addClass(KLASS_TARGET);
      }

      this.$.trigger('target:add', [ target, this ]);

      return true;
    },

    addTargets: function(targets) {
      return this.fromJSON(targets);
    },

    fromJSON: function(targets) {
      targets = _.isArray(targets) ? targets : [ targets ];

      _.each(targets, function(definition) {
        this.addTarget(definition.$el, definition);
      }, this);

      return this;
    },

    /** TODO */
    fromDOM: function(selector_or_container) {
      var that = this,
          $container = $(selector_or_container);

      $container.find('[data-guide]').each(function() {
        var $this   = $(this),
            options = {
              text: $this.attr('data-guide'),
              caption: $this.attr('data-guide-caption'),
            },
            tokens  = ($this.attr('data-guide-options') || '').split(/\,?\s+\,?/);

        for (var i = 0; i < tokens.length; ++i) {
          var pair  = tokens[i].split(':'),
              k     = pair[0],
              v     = pair[1];

          _.assign(k, v, options);
        }

        that.addTarget($this, options);
      });

      $container.find('[data-guide-target]').each(function() {
        var $target = $($(this).attr('data-guide-target'));
        if ($target.length) {
          $(this).hide();
          that.addTarget($target, {
            text: $(this).html()
          });
        }
      })

      return this;
    },

    setOptions: function(options) {
      _.merge(this.options, options);

      return this;
    },

    getOptions: function(overrides) {
      return _.extend(_.clone(this.options), overrides || {});
    },

    show: function(options) {
      var that    = this,
          options = this.getOptions(options),
          klasses = [ KLASS_VISIBLE ];

      if (options.withOverlay) {
        klasses.push(KLASS_OVERLAYED);
      }

      this.$container.addClass(klasses.join(' '));
      this.$.trigger('show');

      _.each(this.context.targets, function(target) {
        target.$el.addClass(KLASS_TARGET);
      });

      this.$el.appendTo(this.$container);

      return this;
    },

    refresh: function() {
      _.each(this.extensions, function(e) {
        e.refresh && e.refresh();
      });

      return this;
    },

    hide: function() {
      this.$el.detach();

      this.$container.removeClass([
        KLASS_VISIBLE,
        KLASS_OVERLAYED
      ].join(' '));

      _.each(this.context.targets, function(target) {
        target.$el.removeClass(KLASS_TARGET);
      });

      if (this.cTarget) {
        this.cTarget.$el.removeClass(KLASS_FOCUSED);
      }

      this.$.trigger('hide');

      return this;
    },

    toggle: function() {
      return this.isShown() ?
        this.hide.apply(this, arguments) :
        this.show.apply(this, arguments);
    },

    isShown: function() {
      return this.$container.hasClass(KLASS_VISIBLE);
    },

    dismiss: function(optContextId) {
      this.$.trigger('dismiss');
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
      var ln = this.context.targets.length;

      return ln != 1 && this.cursor < ln-1;
    },

    prev: function() {
      if (!this.hasPrev()) {
        return false;
      }

      return this.focus(this.cursor - 1);
    },

    hasPrev: function() {
      var ln = this.context.targets.length;

      return ln != 1 && this.cursor > 0;
    },

    first: function() {
      return this.focus(0);
    },

    last: function() {
      return this.focus(this.context.targets.length-1);
    },

    /**
     *
     * @emit guide:defocus on the current (now previous) target, guide.pTarget.$el
     * @emit defocus [ prevTarget, currTarget, guide ] on guide.$
     *
     * @emit guide:focus on the next (now current) target, guide.cTarget.$el
     * @emit focus [ currTarget, guide ] on guide.$
     *
     * @return whether the target has been focused
     */
    focus: function(index) {
      var that    = this,
          target  = this.__getTarget(index),
          // target  =  this.context.targets[index],
          $el     = target && target.$el;

      if (!target) {
        throw "guide.js: bad target @ " + index + " to focus";
      }

      if (target == this.cTarget) {
        return false;
      }

      this.pTarget = this.cTarget;
      this.cTarget = target;
      this.pCursor = this.cursor;
      this.cursor  = this.__idxTarget(target);

      // de-focus the last target
      if (this.pTarget) {
        this.pTarget.$el.
          removeClass(KLASS_FOCUSED).
          trigger('guide:defocus', this.cTarget.$el);

        // this.onDefocus(this.pTarget.$el);
        this.$.trigger('defocus', [ this.pTarget, this.cTarget, this ]);
      }

      _.defer(function() {
        $el.
          addClass(KLASS_FOCUSED).
          trigger('guide:focus', (that.pTarget||{}).$el);

        that.$.trigger('focus', [ target, that ]);
      });

      return true;
    },

    /**
     * @private
     * @nodoc
     */
    __mkContext: function(id, label) {
      var context;

      if ((context = this.__getContext(id))) {
        console.log('guide.js: existing context: ', context.id)
        return context;
      }

      context = {
        id:       id,
        label:    label,
        guide:    this,
        options:  {},
        targets:  []
      };

      this.contexts.push(context);

      console.log('guide.js: context defined: ', context.id);

      return context;
    },

    addExtension: function(ext) {
      if (!ext.id) {
        throw 'guide.js: bad extension, no #id attribute defined';
      }

      this.extensions.push(ext);
    },

    getExtension: function(id) {
      return _.find(this.extensions, { id: id });
    },

    /**
     * @private
     * @nodoc
     */
    __getContext: function(id) {
      return _.find(this.contexts || [], { id: id });
    },

    __getTarget: function(index_or_el) {
      var index = index_or_el;

      if (typeof(index) == 'number') {
        return this.context.targets[index];
      }
      else if (!index) {
        return null;
      }

      console.log('looking up target:', arguments)

      return _.find(this.context.targets || [], index);
    },

    __idxTarget: function(target) {
      return _.indexOf(this.context.targets, target);
    }
  }); // guide.prototype

  _.extend(Target.prototype, {
    hasText: function() {
      return !!((this.options.text||'').length) || this.hasCaption();
    },
    hasCaption: function() {
      return !!(this.options.caption||'').length;
    }
  })

  /**
   * Convenience method for adding a jQuery selector element as a guide target.
   *
   * @example
   *   $('#my_button').guide({
   *     text: "Click me to build your own nuclear reactor in just a minute. FREE."
   *   })
   *
   * @see guide#addTarget for more info on options.
   */
  $.fn.guide = function(options) {
    var options   = options || {},
        instance  = window.guide;

    if (!instance) {
      throw "guide.js: bad $.fn.guide call, global guide has not been setup, " +
            "have you forgotten to initialize guide.js?";
    }

    instance.addTarget($(this), options);

    return $(this);
  };

  window.guide = new guide();
})(_, jQuery);