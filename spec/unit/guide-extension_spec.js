describe("guide", function() {
  describe("Extension", function() {
    var e;

    beforeEach(function() {
      guide.reset();

      e = new Object();

      _.extend(e, guide.Extension, {
        id: 'mock_extension'
      });

      e.__initExtension();
    });

    it("should enable and disable manually", function() {
      expect(e.isEnabled()).toBeTruthy();

      e.setOptions({
        enabled: false
      });

      expect(e.isEnabled()).toBeFalsy();
    });

    it("should enable and disable based on guide config", function() {
      expect(e.isEnabled()).toBeTruthy();

      guide.setOptions({
        mock_extension: {
          enabled: false
        }
      });

      expect(e.isEnabled()).toBeFalsy();
    });

    it("should enable and disable based on current tour config", function() {
      var tour = guide.tour;

      expect(e.isEnabled()).toBeTruthy();

      tour.setOptions({
        mock_extension: {
          enabled: false
        }
      });

      tour.addSpot($('<div />'), { text: 'Hello' });

      guide.runTour('Default Tour');

      expect(e.isEnabled()).toBeFalsy();
    });

    it("should enable and disable based on any tour config", function() {
      var tour = guide.tour;

      expect(e.isEnabled()).toBeTruthy();

      tour.setOptions({
        mock_extension: {
          enabled: false
        }
      });

      expect(e.isEnabled(tour)).toBeFalsy();
    });

    it("should prioritize options", function() {
      var tour = guide.tour;

      // guide config > self config
      e.setOptions({ enabled: false });
      expect(e.isEnabled()).toBeFalsy();
      guide.setOptions({ mock_extension: { enabled: true } });
      expect(e.isEnabled()).toBeTruthy();
      guide.setOptions({ mock_extension: { enabled: false } });
      e.setOptions({ enabled: true });
      expect(e.isEnabled()).toBeFalsy();

      // tour config > guide config
      tour.setOptions({ mock_extension: { enabled: true } });
      guide.setOptions({ mock_extension: { enabled: false } });
      e.setOptions({ enabled: false });
      expect(e.isEnabled(tour)).toBeTruthy();

      tour.setOptions({ mock_extension: { enabled: false } });
      guide.setOptions({ mock_extension: { enabled: true } });
      e.setOptions({ enabled: true });
      expect(e.isEnabled(tour)).toBeFalsy();
    });

  });
})