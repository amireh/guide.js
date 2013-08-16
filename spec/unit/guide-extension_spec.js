describe("Guide", function() {
  describe("Extension", function() {
    var e;

    beforeEach(function() {
      Guide.reset();

      e = new Object();

      _.extend(e, Guide.Extension, {
        id: 'mock_extension'
      });

      e.__initExtension();
    });

    it("should enable and disable manually", function() {
      expect(e.isEnabled()).toBeTruthy();
      console.log(e.getOptions());
      e.setOptions({
        enabled: false
      });

      expect(e.isEnabled()).toBeFalsy();
    });

    it("should enable and disable based on Guide config", function() {
      expect(e.isEnabled()).toBeTruthy();

      Guide.setOptions({
        mock_extension: {
          enabled: false
        }
      });

      expect(e.isEnabled()).toBeFalsy();
    });

    it("should enable and disable based on current tour config", function() {
      var tour = Guide.tour;

      expect(e.isEnabled()).toBeTruthy();

      tour.setOptions({
        mock_extension: {
          enabled: false
        }
      });

      tour.addSpot($('<div />'), { text: 'Hello' });

      Guide.runTour('Default Tour');

      expect(e.isEnabled()).toBeFalsy();
    });

    it("should enable and disable based on any tour config", function() {
      var tour = Guide.tour;

      expect(e.isEnabled()).toBeTruthy();

      tour.setOptions({
        mock_extension: {
          enabled: false
        }
      });

      expect(e.isEnabled(tour)).toBeFalsy();
    });

    it("should prioritize options", function() {
      var tour = Guide.tour;

      // Guide config > self config
      e.setOptions({ enabled: false });
      expect(e.isEnabled()).toBeFalsy();
      Guide.setOptions({ mock_extension: { enabled: true } });
      expect(e.isEnabled()).toBeTruthy();
      Guide.setOptions({ mock_extension: { enabled: false } });
      e.setOptions({ enabled: true });
      expect(e.isEnabled()).toBeFalsy();

      // tour config > Guide config
      tour.setOptions({ mock_extension: { enabled: true } });
      Guide.setOptions({ mock_extension: { enabled: false } });
      e.setOptions({ enabled: false });
      expect(e.isEnabled(tour)).toBeTruthy();

      tour.setOptions({ mock_extension: { enabled: false } });
      Guide.setOptions({ mock_extension: { enabled: true } });
      e.setOptions({ enabled: true });
      expect(e.isEnabled(tour)).toBeFalsy();
    });

  });
})