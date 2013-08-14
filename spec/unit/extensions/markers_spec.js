describe("Extensions", function() {
  describe("Markers", function() {
    var ext = guide.getExtension('markers');
    var spot, tour, marker;

    it('should be created', function() {
      spot = mkSpot();

      marker = ext.addMarker(null, spot);

      expect(marker).toBeTruthy();
    });

    describe('Removal', function() {
      var klasses; // the spot's original CSS classes
      var children; // the spot's original children
      var parent; // the spot's original parent

      beforeEach(function() {
        spot = mkVisibleSpot(null, null, {
          withMarker: false
        });

        expect(spot.marker).toBeFalsy();

        spot.setOption('withMarker', true);

        spot.$el.append('<div />');
        spot.$el.append('<ul><li></li></ul>');

        klasses   = spot.$el[0].className;
        children  = spot.$el.children().map(function() { return this; });
        parent    = spot.$el.parent()[0];
      });

      var test = function test(placement) {
        spot.setOptions({
          marker: {
            placement: placement
          }
        });

        expect(spot.isOn('withMarker')).toBeTruthy();
        marker = ext.addMarker(null, spot);

        expect(marker).toBeTruthy();
        expect(spot.marker).toBeTruthy();
        expect(spot.$el[0].className).toEqual(klasses);

        marker.remove();

        expect(spot.marker).toBeFalsy();
        expect(spot.$el[0].className).toEqual(klasses);
        expect(spot.$el.parent()[0]).toEqual(parent);
        expect(spot.$el.children().map(function() {
          return this;
        })).toEqual(children);

        return test;
      };

      _.each([ 'inline', 'overlay', 'sibling' ], function(pmt) {
        it('it should remove itself cleanly as @' + pmt, function() {
          test(pmt);
        });
      });

      it('should be removed when spot is removed', function() {
        marker = ext.addMarker(null, spot);

        spyOn(marker, 'remove').andCallThrough();

        spot.$el.remove();
        spot.remove();

        expect(marker.remove).toHaveBeenCalled();
        expect(marker.$el).toBeFalsy();
        expect(spot.marker).toBeFalsy();
      });

      it('should restore the target\'s classes', function() {
        marker = ext.addMarker(null, spot);

        spot.tour.setOption('alwaysMark', false);
        spot.setOption('withMarker', false);

        spot.tour.start({ spot: spot });

        klasses = spot.$el[0].className;

        spot.setOption('withMarker', true);
        marker.show();
        expect(spot.$el[0].className).not.toEqual(klasses);

        marker.hide({ completely: true });
        expect(spot.$el[0].className).toEqual(klasses);

        marker.show();
        expect(spot.$el[0].className).not.toEqual(klasses);

        marker.remove();
        expect(spot.$el[0].className).toEqual(klasses);
      });
    });

    it('should show when spot is focused', function() {
      var spot = mkVisibleSpot(null, null, {
        withMarker: true
      });

      spyOn(spot.marker, 'show').andCallThrough();
      spyOn(spot.marker, 'hide').andCallThrough();

      expect(spot.marker.hide).not.toHaveBeenCalled();

      spot.tour.setOptions({
        alwaysHighlight: false,
        alwaysMark: false
      });

      spot.focus();
      expect(spot.marker.show).toHaveBeenCalled();

      spot.defocus();
      expect(spot.marker.hide).toHaveBeenCalled();
    });

    it('should focus spot when clicked', function() {
      // We need two spots for this:
      var someSpot = mkVisibleSpot();
      var spot = mkVisibleSpot(null, null, {
        withMarker: true
      });

      spot.tour.setOptions({
        alwaysHighlight: true,
        alwaysMark: true
      });

      spot.tour.start();
      expect(spot.marker.$el).toBeTruthy();
      expect(spot.isFocused()).toBeFalsy();
      spot.marker.$el.click();
      expect(spot.isFocused()).toBeTruthy();
    });

    describe('Placement modes', function() {
      it('should respect the @placement option', function() {
        spot = mkSpot();
        marker = ext.addMarker(null, spot, {
          options: {
            placement: 'inline'
          }
        });

        expect(marker.getOption('placement')).toEqual('inline');

        marker.remove();

        marker = ext.addMarker(null, spot, {
          options: {
            placement: 'sibling'
          }
        });

        expect(marker.getOption('placement')).toEqual('sibling');
      });

      it('should respect the @placement option from the spot', function() {
        spot = mkSpot();

        spot.setOptions('marker.placement: inline');
        marker = ext.addMarker(null, spot);
        expect(marker.getOption('placement')).toEqual('inline');

        marker.remove();

        spot.setOptions('marker.placement: sibling');
        marker = ext.addMarker(null, spot);
        expect(marker.getOption('placement')).toEqual('sibling');
      });

      it('should respect the @placement option from the tour', function() {
        spot = mkSpot();
        tour = spot.tour;

        tour.setOptions('marker.placement: inline');
        marker = ext.addMarker(null, spot);
        expect(marker.getOption('placement')).toEqual('inline');

        marker.remove();

        tour.setOptions('marker.placement: sibling');
        marker = ext.addMarker(null, spot);
        expect(marker.getOption('placement')).toEqual('sibling');
      });

      it(':inline', function() {
        spot = mkVisibleSpot(null, null, {
          marker: {
            placement: 'inline'
          }
        });

        marker = spot.marker;

        marker.spot.tour.start();

        expect(marker.getOption('placement')).toEqual('inline');
        expect(marker.isWrapped()).toBeFalsy();
        expect(marker.canShow()).toBeTruthy();

        marker.show();

        expect(marker.$el.parent().is(spot.$el)).toBeTruthy();
      });

      it(':sibling', function() {
        spot = mkVisibleSpot(null, null, {
          marker: {
            placement: 'sibling'
          }
        });

        marker = spot.marker;
        marker.spot.tour.start();

        expect(marker.isWrapped()).toBeTruthy();
        expect(marker.canShow()).toBeTruthy();

        marker.show();

        expect(marker.$container[0]).toEqual(spot.$el.parent()[0]);
        expect(marker.$container[0]).toEqual(marker.$el.parent()[0]);
      });

      it(':overlay', function() {
        spot = mkVisibleSpot(null, null, {
          marker: {
            placement: 'overlay'
          }
        });

        marker = spot.marker;
        marker.spot.tour.start();

        expect(marker.isWrapped()).toBeFalsy();
        expect(marker.canShow()).toBeTruthy();

        marker.show();

        expect(marker.$el.parent()[0]).toEqual(guide.$el[0]);
      });

    });
  });
});