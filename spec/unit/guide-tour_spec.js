describe("guide", function() {
  describe("Tour", function() {
    var tour, $target;

    beforeEach(function() {
      guide.reset();
      tour = guide.tour;
      $target = $('<div />');
    });

    afterEach(function() {
      if (tour) {
        _.each(tour.spots, function(spot) {
          spot.$el.remove();
        });
      }
    });

    describe('#addSpot', function() {
      it('should reject building multiple spots for the same $target', function() {
        expect(tour.addSpot($target)).toBeTruthy();

        expect(function() {
          tour.addSpot($target);
        }).toThrow('guide.js: duplicate spot, see console for more information');

        expect(guide.tour.spots.length).toEqual(1);
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
      });

      it('should go backwards', function() {
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();
        mkVisibleSpot();

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
    });

  });
})