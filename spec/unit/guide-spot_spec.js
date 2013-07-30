describe("guide", function() {
  describe("Spot", function() {
    var tour, $target;

    beforeEach(function() {
      guide.reset();
      tour = guide.tour;
      $target = $('<div />');
    });

    describe('#constructur', function() {
      it('should accept a blank definition', function() {
        expect(function() {
          new guide.Spot();
        }).toThrow('guide.js: expected #tour to be specified for a new Spot, got none');
      });
    });
  });
})