describe("guide", function() {
  describe("Tour", function() {
    var tour, $target;

    beforeEach(function() {
      tour = guide.tour;
      $target = $('<div />');

      guide.setOptions({
        markers: { enabled: false },
        controls: { enabled: false }
      })
    });

    afterEach(function() {
      if (tour) {
        _.each(tour.spots, function(spot) {
          spot.$el.remove();
        });
      }
    });

    describe('Focusing', function() {
      it('should focus a spot', function() {
        mkVisibleSpot();
        mkVisibleSpot();

        guide.show({ noAutorun: true });
        expect( tour.isActive() ).toBeFalsy();

        expect( tour.start() ).toBeTruthy();
        expect( tour.isActive() ).toBeTruthy();
        expect( tour.spots[0].isFocused() ).toBeTruthy();

        expect( tour.focus(1) ).toBeTruthy();
        expect( tour.spots[1].isFocused() ).toBeTruthy();
      });
    });

    describe('Events', function() {

      it('should trigger #pre-focus', function() {
        var listener = {
          handler: function() {}
        };

        spyOn(listener, 'handler');

        mkVisibleSpot(null, null, {
          preFocus: listener.handler
        });

        expect(listener.handler).not.toHaveBeenCalled();

        tour.start({ spot: null });
        tour.focus(0);

        expect(listener.handler).toHaveBeenCalled();
      });

      it('should trigger #pre-focus, #focus, and #defocus', function() {
        var spies = [ 'onPrefocus', 'onFocus', 'onDefocus' ];
        var listener = {
        };

        _.each(spies, function(spy) {
          listener[spy] = function() {}
          spyOn(listener, spy);
        });

        mkVisibleSpot(null, null, {
          preFocus:   listener.onPrefocus,
          onFocus:    listener.onFocus,
          onDefocus:  listener.onDefocus
        });

        mkVisibleSpot();

        tour.start({ spot: null });
        tour.first();

        expect(listener.onPrefocus).toHaveBeenCalled();
        expect(listener.onFocus).toHaveBeenCalled();
        expect(listener.onDefocus).not.toHaveBeenCalled();

        _.each(spies, function(spy) { listener[spy].reset(); });

        tour.next();
        expect(listener.onPrefocus).not.toHaveBeenCalled();
        expect(listener.onFocus).not.toHaveBeenCalled();
        expect(listener.onDefocus).toHaveBeenCalled();

        _.each(spies, function(spy) { listener[spy].reset(); });

        tour.prev();
        expect(listener.onPrefocus).toHaveBeenCalled();
        expect(listener.onFocus).toHaveBeenCalled();
        expect(listener.onDefocus).not.toHaveBeenCalled();
      });
    });

    describe('Bouncing', function() {
      it('should bounce #backward', function() {
        var alt, anchor;

        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

        anchor = tour.spots[3];
        alt    = tour.__closest(anchor, anchor.getOption('bounce'));

        expect( alt ).toBeTruthy();
        expect( alt.index ).toEqual(2);

        anchor = tour.spots[2];
        anchor.setOption('bounce', 'backward');
        alt    = tour.__closest(anchor, anchor.getOption('bounce'));

        expect( alt ).toBeTruthy();
        expect( alt.index ).toEqual(1);

        anchor = tour.spots[0];
        anchor.setOption('bounce', 'backward');
        alt = tour.__closest(anchor, anchor.getOption('bounce'));

        expect( alt ).toBeFalsy();

        anchor.setOption('bounce', null);

        alt = tour.__closest(anchor, anchor.getOption('bounce'));
        expect( alt ).toBeTruthy();
        expect( alt.index ).toEqual(1);
      });

      it('should bounce #forward', function() {
        var alt, anchor;

        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

        anchor = tour.spots[0];
        alt    = tour.__closest(anchor, anchor.getOption('bounce'));

        expect( alt ).toBeTruthy();
        expect( alt.index ).toEqual(1);

        anchor = tour.spots[2];
        anchor.setOption('bounce', 'forward');
        alt    = tour.__closest(anchor, anchor.getOption('bounce'));

        expect( alt ).toBeTruthy();
        expect( alt.index ).toEqual(3);

        anchor = tour.spots[3];
        anchor.setOption('bounce', 'forward');
        alt = tour.__closest(anchor, anchor.getOption('bounce'));

        expect( alt ).toBeFalsy();

        anchor.setOption('bounce', null);

        alt = tour.__closest(anchor, anchor.getOption('bounce'));
        expect( alt ).toBeTruthy();
        expect( alt.index ).toEqual(2);
      });

      it('should bounce to an index', function() {
        var alt, anchor;

        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

        anchor = tour.spots[0];
        anchor.setOption('bounce', 3);
        alt = tour.__closest(anchor, anchor.getOption('bounce'));

        expect( alt ).toEqual( tour.spots[3] );
      });


    });

    describe('Navigation', function() {
      it('should go forward', function() {
        mkVisibleSpot();
        mkVisibleSpot();

        tour.start();
        tour.focus(0);

        expect(tour.cursor).toEqual(0);
        expect(tour.hasNext()).toBeTruthy();
        expect(tour.next()).toBeTruthy();
        expect(tour.cursor).toEqual(1);
        expect(tour.current.index).toEqual(1);

        // guide.hide();
      });

      it('should go backward', function() {
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

        xtour = tour;

        // throw '';
        tour.start();
        tour.focus(1);

        expect(tour.prev()).toBeTruthy();
        expect(tour.cursor).toEqual(0);
        expect(tour.current.index).toEqual(0);

        tour.focus(3);

        expect(tour.prev()).toBeTruthy();
        expect(tour.cursor).toEqual(2);
        expect(tour.current.index).toEqual(2);
      });

      it('should jump to first', function() {
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

        tour.start();
        tour.focus(3);

        expect(tour.first()).toBeTruthy();
        expect(tour.cursor).toEqual(0);
        expect(tour.current.index).toEqual(0);

        expect(tour.first()).toBeFalsy();
      });

      it('should jump to last', function() {
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

        tour.start();

        expect(tour.last()).toBeTruthy();
        expect(tour.cursor).toEqual(3);
        expect(tour.current.index).toEqual(3);

        expect(tour.last()).toBeFalsy();
      });

      it('should jump around like a monkey', function() {
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

        tour.start();

        expect(tour.last()).toBeTruthy();
        expect(tour.first()).toBeTruthy();
        expect(tour.last()).toBeTruthy();
        expect(tour.first()).toBeTruthy();
        expect(tour.last()).toBeTruthy();
      });

      it('should jump over an unavailable spot', function() {
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

        tour.spots[2].setOptions({ available: false });

        tour.start();

        expect(tour.next()).toBeTruthy();
        expect(tour.cursor).toEqual(1);
        expect(tour.next()).toBeTruthy();
        expect(tour.cursor).toEqual(3);
        expect(tour.prev()).toBeTruthy();
        expect(tour.cursor).toEqual(1);

        tour.spots[3].setOptions({ available: false });

        expect(tour.next()).toBeTruthy();
        expect(tour.cursor).toEqual(4);
        expect(tour.prev()).toBeTruthy();
        expect(tour.cursor).toEqual(1);
      });
    });

  });
})