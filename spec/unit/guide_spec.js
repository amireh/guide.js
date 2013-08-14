describe("guide", function() {
  it("should accept an explicit Tour definition", function() {
    var tour = guide.defineTour('Mock Tour');
    expect(tour).toBeTruthy();
  });

  it("should not define multiple Tours with the same label", function() {
    var tour1 = guide.defineTour('Mock Tour'),
        tour2 = guide.defineTour('Mock Tour');

    expect(tour1).toBeTruthy();
    expect(tour1).toEqual(tour2);
  });

  it("#getTour", function() {
    var tour = guide.defineTour('Mock Tour');

    expect(guide.getTour('Mock Tour')).toEqual(tour);
    expect(guide.getTour(tour)).toEqual(tour);

    expect(guide.getTour('ABC')).toBeFalsy();
    expect(guide.getTour('Default Tour')).toBeTruthy();
  });

  describe('#fromDOM', function() {
    it("should build a Spot from DOM", function() {
      var $container = $('body').affix([
        'div',
        '[data-guide="Some text"]',
        '[data-guide-caption="Some caption"]',
        '[data-guide-options="marker.position:right"]'
      ].join(''));

      guide.fromDOM($('body'));

      expect(guide.tour.spots.length).toEqual(1);

      var spot = guide.tour.spots[0];

      expect(spot.$el[0]).toEqual($container[0]);

      expect(spot.text).toEqual('Some text');
      expect(spot.caption).toEqual('Some caption');
      expect(spot.getOption('marker')).toEqual({ position: 'right' });

      $container.remove();
    });

    it("should build a Spot from DOM by reference", function() {
      var $ref = affix('div'),
          $foo = affix("div#foo");

      $ref.attr('data-guide-spot', '#foo');
      $ref.html('<p>Hello World!</p>');

      guide.fromDOM($('body'));

      expect(guide.tour.spots.length).toEqual(1);
      expect(guide.tour.spots[0].text).toEqual($ref[0].outerHTML);

      $ref.remove();
      $foo.remove();
    });

    it("should build a Spot from DOM by reference and accept options", function() {
      var $ref = $('body').affix('div'),
          $foo = $('body').affix('#foo[data-guide-caption="Foobar"]');

      $ref.attr('data-guide-spot', '#foo');
      $ref.html('Hello World!');

      guide.fromDOM($('body'));

      expect(guide.tour.spots.length).toEqual(1);
      expect(guide.tour.spots[0].text).toEqual('<div>Hello World!</div>');
      expect(guide.tour.spots[0].caption).toEqual('Foobar');

      $ref.remove();
      $foo.remove();
    });

    it("should handle repetitive calls", function() {
      var entity = 'div[data-guide="Text"]',
          $elements = $();

      $elements = $elements.add( $('body').affix(entity) );

      guide.fromDOM($('body'));
      expect(guide.tours.length).toEqual(1);
      expect(guide.tour.spots.length).toEqual(1);

      guide.fromDOM($('body'));
      expect(guide.tours.length).toEqual(1);
      expect(guide.tour.spots.length).toEqual(1);

      $elements = $elements.add( $('body').affix(entity) );

      guide.fromDOM($('body'));
      expect(guide.tours.length).toEqual(1);
      expect(guide.tour.spots.length).toEqual(2);

      $elements.remove();
    });

    it('should define a tour', function() {
      var $container = $('<div data-guide-tour="Foobar" />'),
          nrTours    = guide.tours.length;

      guide.fromDOM($container);
      expect(guide.tours.length).toEqual(nrTours + 1);

      $container.remove();
    });

    it('should attach spots to a custom tour', function() {
      var $container = $('<div data-guide-tour="Foobar" />');

      $container.affix('div[data-guide="Something"]');
      $container.affix('div#foo');
      $container.append('<p data-guide-spot="#foo">Hello world.</p>');

      guide.fromDOM($container);

      expect(guide.getTour('Foobar').spots.length).toEqual(2);

      $container.remove();
    });

    it('should build a tour from a detached element', function() {
      var $container = $([
        '<div data-guide-tour="Some Tour">',
        '  <div data-guide-spot="#navbar_links" data-guide-options="marker.position:right">',
        '    <p>This is the navigation bar that allows you to take actions and',
        '      navigate around Pibi.',
        '    </p>',
        '',
        '    <p>This bar doesnt change no matter where you are in Pibi.</p>',
        '  </div>',
        '',
        '  <div data-guide-spot="#new_withdrawal" data-guide-options="marker.position:right">',
        '    <p>',
        '      Start tracking expenses by clicking this button to',
        '      show the transaction editor. Try it!',
        '    </p>',
        '  </div>',
        '  <div data-guide-spot="#new_deposit" data-guide-options="marker.position:right">',
        '    Here is the second item description. The number will appear to the right of the element.',
        '  </div>',
        '  <div data-guide-spot="#sidebar #save" data-guide-options="marker.position:top">',
        '    Save the transaction.',
        '  </div>',
        '</div>'
      ].join(''));

      guide.fromDOM($container);

      expect(guide.tours.length).toEqual(2);
      expect(guide.getTour('Some Tour')).toBeTruthy();
      expect(guide.getTour('Some Tour').spots.length).toEqual(4);

      $container.remove();
    });

  });

  describe('#fromJSON', function() {
    it('should build a Spot', function() {
      var spot = guide.addSpot($('<div />'), {
        text: 'Some text',
        caption: 'Some caption',
        marker: {
          position: 'right'
        }
      });

      expect(spot).toBeTruthy();
      expect(guide.tour.spots.length).toEqual(1);

      expect(spot.text).toEqual('Some text');
      expect(spot.caption).toEqual('Some caption');
      expect(spot.getOption('marker')).toEqual({
        position: 'right'
      });
    });
  });

  it('should #show', function() {
    expect(function() {
      guide.show();
    }).not.toThrow();

    expect(guide.isShown()).toBeTruthy();
  });

  it('should #hide', function() {
    expect(function() {
      guide.hide();
    }).not.toThrow();

    expect(guide.isShown()).toBeFalsy();
  });

  it ('should toggle', function() {
    expect(function() {
      guide.show().hide();
    }).not.toThrow();

    expect(guide.isShown()).toBeFalsy();
  })
});