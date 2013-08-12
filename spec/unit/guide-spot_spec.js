describe("guide", function() {
  describe("Spot", function() {
    var tour, $target;

    beforeEach(function() {
      tour = guide.tour;
      $target = $('<div />');
    });

    afterEach(function() {
      $target.remove();
    });

    describe('#constructor', function() {
      it('should require an $element', function() {
        expect(function() {
          new guide.Spot();
        }).toThrow('guide.js: expected `$el` to be specified for a new Spot, got none');
      });

      it('should require a tour', function() {
        expect(function() {
          new guide.Spot($());
        }).toThrow('guide.js: expected `tour` to be specified for a new Spot, got none');
      });
    });

    it('should be created', function() {
      $target.appendTo($('body'));

      var spot = new guide.Spot($target, tour);

      expect(spot).toBeTruthy();
      expect(spot.isVisible()).toBeTruthy();
    });

    it('should be created with a detached element', function() {
      var spot = new guide.Spot($target, tour);

      expect(spot).toBeTruthy();
      expect(spot.isVisible()).toBeFalsy();
    });

    it('should cleanly remove itself', function() {
      var spot = mkSpot(), $el = spot.$el;

      expect($el.data()).toEqual({
        gjsSpot: spot
      });

      spot.remove();

      expect($el.data()).toEqual({});
    });

    describe('Highlighting', function() {
      var spot;

      beforeEach(function() {
        spot = mkVisibleSpot();
      });

      it('should be highlighted', function() {
        expect(spot.highlight()).toBeTruthy();
      });

      it('should respect the @highlight option', function() {
        expect(spot.highlight()).toBeTruthy();
        spot.setOptions({ highlight: false });
        expect(spot.highlight()).toBeFalsy();
      });

      it('should respect the tour @alwaysHighlight option', function() {
        spot.tour.setOptions({ alwaysHighlight: false });
        spot.setOptions({
          highlight: true
        });

        // make sure it isn't focused, as that would override the tour option
        spot.tour.current = null;

        expect(spot.isFocused()).toBeFalsy();
        expect(spot.highlight()).toBeFalsy();

        spot.tour.setOptions({ alwaysHighlight: true });

        expect(spot.highlight()).toBeTruthy();
      });

      it('should be highlighted when focused', function() {
        spot.tour.setOptions({
          alwaysHighlight: false
        });

        spot.setOptions({
          highlight: true
        });

        tour.start({ spot: spot });

        expect(spot.isFocused()).toBeTruthy();
        expect(spot.highlight()).toBeTruthy();
      });

      it('should apply the positioning fix on non-relative elements', function() {
        spot.$el.css({ position: 'static' });

        expect(spot.highlight()).toBeTruthy();
        expect(spot.$el.hasClass("gjs-positioning-fix")).toBeTruthy();

        spot.$el
          .css({ position: 'relative' })
          .removeClass('gjs-positioning-fix');

        expect(spot.highlight()).toBeTruthy();
        expect(spot.$el.hasClass("gjs-positioning-fix")).toBeFalsy();
      });

      it('should respect the @noPositioningFix option', function() {
        spot.setOptions({ noPositioningFix: true });
        spot.$el.css({ position: 'static' });

        expect(spot.highlight()).toBeTruthy();
        expect(spot.$el.hasClass("gjs-positioning-fix")).toBeFalsy();
      });

      it('should restore the target\'s classes on dehighlight', function() {
        var klasses = spot.$el[0].className;

        expect(spot.highlight()).toBeTruthy();
        expect(spot.$el[0].className).not.toEqual(klasses);
        expect(spot.dehighlight({ force: true })).toBeTruthy();
        expect(spot.$el[0].className).toEqual(klasses);
      });

      it('should refresh its target on #highlight', function() {
        var spot = mkSpot($('#__temp__'));

        expect(spot.$el.length).toEqual(0);
        expect(spot.isVisible()).toBeFalsy();
        expect(spot.highlight()).toBeFalsy();

        $target = $('body').affix('div#__temp__');

        expect(spot.highlight()).toBeTruthy();
        expect(spot.$el.length).toEqual(1);
        expect(spot.isVisible()).toBeTruthy();
      });

      it('should handle its target being re-made', function() {
        var spot;

        $target = $('body').affix('div#__temp__');
        spot = mkSpot($('#__temp__'));
        expect(spot.highlight()).toBeTruthy();

        $target.remove();
        expect(spot.highlight()).toBeFalsy();

        $target = $('body').affix('div#__temp__');
        expect(spot.highlight()).toBeTruthy();
      });
    });

    it('#isVisible', function() {
      var spot = mkSpot($target);

      $target.detach();
      expect(spot.isVisible()).toBeFalsy();

      $target.appendTo($('body'));
      expect(spot.isVisible()).toBeTruthy();

      $target.hide();
      expect(spot.isVisible()).toBeFalsy();
      $target.show();
      expect(spot.isVisible()).toBeTruthy();
    });

  });
})