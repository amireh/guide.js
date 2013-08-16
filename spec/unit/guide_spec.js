describe("Guide", function() {
  it("should accept an explicit Tour definition", function() {
    var tour = Guide.defineTour('Mock Tour');
    expect(tour).toBeTruthy();
  });

  it("should not define multiple Tours with the same label", function() {
    var tour1 = Guide.defineTour('Mock Tour'),
        tour2 = Guide.defineTour('Mock Tour');

    expect(tour1).toBeTruthy();
    expect(tour1).toEqual(tour2);
  });

  it("#getTour", function() {
    var tour = Guide.defineTour('Mock Tour');

    expect(Guide.getTour('Mock Tour')).toEqual(tour);
    expect(Guide.getTour(tour)).toEqual(tour);

    expect(Guide.getTour('ABC')).toBeFalsy();
    expect(Guide.getTour('Default Tour')).toBeTruthy();
  });

  describe('#fromDOM', function() {
    it("should build a Spot from DOM", function() {
      var $container = $('body').affix([
        'div',
        '[data-Guide="Some text"]',
        '[data-Guide-caption="Some caption"]',
        '[data-Guide-options="marker.position:right"]'
      ].join(''));

      Guide.fromDOM($('body'));

      expect(Guide.tour.spots.length).toEqual(1);

      var spot = Guide.tour.spots[0];

      expect(spot.$el[0]).toEqual($container[0]);

      expect(spot.text).toEqual('Some text');
      expect(spot.caption).toEqual('Some caption');
      expect(spot.getOption('marker')).toEqual({ position: 'right' });

      $container.remove();
    });

    it("should build a Spot from DOM by reference", function() {
      var $ref = affix('div'),
          $foo = affix("div#foo");

      $ref.attr('data-Guide-spot', '#foo');
      $ref.html('<p>Hello World!</p>');

      Guide.fromDOM($('body'));

      expect(Guide.tour.spots.length).toEqual(1);
      expect(Guide.tour.spots[0].text).toEqual($ref[0].outerHTML);

      $ref.remove();
      $foo.remove();
    });

    it("should build a Spot from DOM by reference and accept options", function() {
      var $ref = $('body').affix('div'),
          $foo = $('body').affix('#foo[data-Guide-caption="Foobar"]');

      $ref.attr('data-Guide-spot', '#foo');
      $ref.html('Hello World!');

      Guide.fromDOM($('body'));

      expect(Guide.tour.spots.length).toEqual(1);
      expect(Guide.tour.spots[0].text).toEqual('<div>Hello World!</div>');
      expect(Guide.tour.spots[0].caption).toEqual('Foobar');

      $ref.remove();
      $foo.remove();
    });

    it("should handle repetitive calls", function() {
      var entity = 'div[data-Guide="Text"]',
          $elements = $();

      $elements = $elements.add( $('body').affix(entity) );

      Guide.fromDOM($('body'));
      expect(Guide.tours.length).toEqual(1);
      expect(Guide.tour.spots.length).toEqual(1);

      Guide.fromDOM($('body'));
      expect(Guide.tours.length).toEqual(1);
      expect(Guide.tour.spots.length).toEqual(1);

      $elements = $elements.add( $('body').affix(entity) );

      Guide.fromDOM($('body'));
      expect(Guide.tours.length).toEqual(1);
      expect(Guide.tour.spots.length).toEqual(2);

      $elements.remove();
    });

    it('should define a tour', function() {
      var $container = $('<div data-Guide-tour="Foobar" />'),
          nrTours    = Guide.tours.length;

      Guide.fromDOM($container);
      expect(Guide.tours.length).toEqual(nrTours + 1);

      $container.remove();
    });

    it('should attach spots to a custom tour', function() {
      var $container = $('<div data-Guide-tour="Foobar" />');

      $container.affix('div[data-Guide="Something"]');
      $container.affix('div#foo');
      $container.append('<p data-Guide-spot="#foo">Hello world.</p>');

      Guide.fromDOM($container);

      expect(Guide.getTour('Foobar').spots.length).toEqual(2);

      $container.remove();
    });

    it('should build a tour from a detached element', function() {
      var $container = $([
        '<div data-Guide-tour="Some Tour">',
        '  <div data-Guide-spot="#navbar_links" data-Guide-options="marker.position:right">',
        '    <p>This is the navigation bar that allows you to take actions and',
        '      navigate around Pibi.',
        '    </p>',
        '',
        '    <p>This bar doesnt change no matter where you are in Pibi.</p>',
        '  </div>',
        '',
        '  <div data-Guide-spot="#new_withdrawal" data-Guide-options="marker.position:right">',
        '    <p>',
        '      Start tracking expenses by clicking this button to',
        '      show the transaction editor. Try it!',
        '    </p>',
        '  </div>',
        '  <div data-Guide-spot="#new_deposit" data-Guide-options="marker.position:right">',
        '    Here is the second item description. The number will appear to the right of the element.',
        '  </div>',
        '  <div data-Guide-spot="#sidebar #save" data-Guide-options="marker.position:top">',
        '    Save the transaction.',
        '  </div>',
        '</div>'
      ].join(''));

      Guide.fromDOM($container);

      expect(Guide.tours.length).toEqual(2);
      expect(Guide.getTour('Some Tour')).toBeTruthy();
      expect(Guide.getTour('Some Tour').spots.length).toEqual(4);

      $container.remove();
    });

  });

  describe('#fromJSON', function() {
    it('should build a Spot', function() {
      var spot = Guide.addSpot($('<div />'), {
        text: 'Some text',
        caption: 'Some caption',
        marker: {
          position: 'right'
        }
      });

      expect(spot).toBeTruthy();
      expect(Guide.tour.spots.length).toEqual(1);

      expect(spot.text).toEqual('Some text');
      expect(spot.caption).toEqual('Some caption');
      expect(spot.getOption('marker')).toEqual({
        position: 'right'
      });
    });
  });

  it('should #show', function() {
    expect(function() {
      Guide.show();
    }).not.toThrow();

    expect(Guide.isShown()).toBeTruthy();
  });

  it('should #hide', function() {
    expect(function() {
      Guide.hide();
    }).not.toThrow();

    expect(Guide.isShown()).toBeFalsy();
  });

  it ('should toggle', function() {
    expect(function() {
      Guide.show().hide();
    }).not.toThrow();

    expect(Guide.isShown()).toBeFalsy();
  })
});