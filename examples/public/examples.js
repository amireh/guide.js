!function ($) {
  "use strict"; // jshint ;_;

  var Collapsible = function (element, options) {
    this.init('collapsible', element, options)
  }

  Collapsible.prototype = {
    constructor: Collapsible

  , init: function (type, element, options) {
      this.type = type;
      this.$element = $(element);
      this.options = this.getOptions(options)
      this.toggle_proxy = $.proxy(this.toggle, this);
      this.$element.on('click.' + this.type, this.options.selector, this.toggle_proxy);
    },

    consume: function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    },

    getOptions: function (options) {
      return $.extend({}, $.fn[this.type].defaults, this.$element.data(), options);
    },

    toggle: function (e) {
      var $element = $(e.currentTarget),
          $target  = $element.nextAll('[data-collapsible]:first'),
          $both    = $element.add($target),
          is_collapsed = $target.is(":hidden"),
          attr     = $element.attr("data-collapser"),
          animated = attr.search(/collapsed|no\-animation/) > -1 ?
            false :
            this.options.animation;

      if (!animated) {
        $target.toggle();
      } else {
        $target['slide' + (is_collapsed ? 'Down' : 'Up')]();
      }

      $both
        .toggleClass("collapsed",!is_collapsed)
        .toggleClass('expanded', is_collapsed);

      $both.trigger(is_collapsed ? 'collapsed' : 'expanded', []);
    }
  }

  var old = $.fn.collapsible;

  $.fn.collapsible = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapsible')
        , options = typeof option == 'object' && option
      if (!data) $this.data('collapsible', (data = new Collapsible(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapsible.Constructor = Collapsible;
  $.fn.collapsible.defaults = {
    animation: true,
    selector: '[data-collapser]',
    trigger: 'click'
  };

  $.fn.collapsible.noConflict = function () {
    $.fn.collapsible = old
    return this
  }

  $.fn.collapse = function(show) {
    $(this).find('[data-collapser]').filter(function() {
      var eligible = $(this).attr('data-collapser').search('collapsed') > -1;
      if (eligible) {
        if (!show) { return true; }

        return !$(this).is(".collapsed");
      }

      return false;
    }).click();
  }
}(window.jQuery);

$(document.body).collapsible({
  selector: '[data-collapser]',
  animation: false,
  trigger:   'click'
});

$(function() {
  $('[data-collapser]').on('collapsed expanded', function() {
    // guide.tour.refresh();
  });
})