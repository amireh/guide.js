describe("guide", function() {
  describe("Tour", function() {
    var tour, $target;

    beforeEach(function() {
      guide.reset();
      tour = guide.tour;
      $target = $('<div />');
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
  });
})