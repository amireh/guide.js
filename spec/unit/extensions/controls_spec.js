describe("Extensions", function() {
  describe("Controls", function() {
    var ext = guide.getExtension('controls');
    var tour;

    var fixtureTour = function(nrSpots) {
      var nrSpots = nrSpots || 5,
          i = 0;

      tour = guide.defineTour('Controls Fixture');

      for (i = 0; i < nrSpots; ++i) {
        mkVisibleSpot(null, tour);
      }

      return tour;
    };

    afterEach(function() {
      if (tour) {
        _.each(tour.spots, function(spot) {
          spot.$el.remove();
        });
      }
    });

    it('should move forwards', function() {
      var tour = fixtureTour(3);

      tour.start();

      expect(tour.cursor).toEqual(0);
      ext.$fwd.click();
      expect(tour.cursor).toEqual(1);
    });

    it('should not move forwards if there are no following spots', function() {
      var tour = fixtureTour(3);

      tour.start();
      tour.focus(2);

      expect(ext.$fwd.is(":disabled")).toBeTruthy();
      ext.$fwd.click();
      expect(tour.cursor).toEqual(2);
    });

    it('should move backwards', function() {
      var tour = fixtureTour(3);

      tour.start();
      tour.focus(2);

      ext.$bwd.click();
      expect(tour.cursor).toEqual(1);
    });

    it('should not move backwards if there are no previous spots', function() {
      var tour = fixtureTour(3);

      tour.start();

      tour.focus(0);
      expect(ext.$bwd.is(":disabled")).toBeTruthy();

      ext.$bwd.click();
      expect(tour.cursor).toEqual(0);
    });

    it('should disable @next on last spot', function() {
      var tour = fixtureTour(5);

      tour.start();

      tour.focus(0);
      expect(ext.$fwd.is(":disabled")).toBeFalsy();

      tour.focus(1);
      expect(ext.$fwd.is(":disabled")).toBeFalsy();

      tour.focus(4);
      expect(ext.$fwd.is(":disabled")).toBeTruthy();
    });

    it('should disable @prev on first spot', function() {
      var tour = fixtureTour(5);

      tour.start();

      tour.focus(0);
      expect(ext.$bwd.is(":disabled")).toBeTruthy();

      tour.focus(1);
      expect(ext.$bwd.is(":disabled")).toBeFalsy();
    });

    it('should jump to @first', function() {
      var tour = fixtureTour(5);

      tour.start();

      tour.focus(0);
      expect(ext.$first.is(":disabled")).toBeTruthy();

      tour.focus(2);
      expect(ext.$first.is(":disabled")).toBeFalsy();

      ext.$first.click();
      expect(tour.cursor).toEqual(0);
      expect(tour.focus(0)).toBeFalsy();
    });

    it('should jump to @last', function() {
      var tour = fixtureTour(5);

      tour.start();

      tour.focus(0);
      expect(ext.$last.is(":disabled")).toBeFalsy();

      ext.$last.click();
      expect(tour.cursor).toEqual(4);
      expect(tour.focus(4)).toBeFalsy();

      // and should be disabled
      expect(ext.$last.is(":disabled")).toBeTruthy();
    });

  });
});