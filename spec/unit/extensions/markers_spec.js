describe("Extensions", function() {
  describe("Markers", function() {
    var ext = guide.getExtension('markers');

    describe("Marker", function() {
      var spot, tour, marker;

      afterEach(function() {
        if (spot) { spot.remove(); spot.$el.remove(); }
      });

      it('should be created', function() {
        spot = mkSpot();
        marker = ext.addMarker(null, spot);

        expect(marker).toBeTruthy();
      });

      it('should be removed when spot is removed', function() {
        spot    = mkVisibleSpot();
        marker  = ext.addMarker(null, spot);

        expect(marker.$el).toBeTruthy();
        spot.remove();
        expect(marker.$el).toBeFalsy();
      });

      it('should restore the target\'s classes on removal', function() {
        spot = mkVisibleSpot();

        var klasses = spot.$el[0].className;

        marker = ext.addMarker(null, spot);
        marker.options.smart = false;

        expect(spot.$el[0].className).toEqual(klasses);

        marker.show();
        expect(spot.$el[0].className).not.toEqual(klasses);

        marker.remove();
        expect(spot.$el[0].className).toEqual(klasses);
      });

      describe('Placement modes', function() {
        it('should respect the @placement option', function() {
          spot = mkSpot();
          marker = ext.addMarker(null, spot, {
            options: {
              placement: 'inline'
            }
          });

          expect(marker.options.placement).toEqual('inline');

          marker.remove();

          marker = ext.addMarker(null, spot, {
            options: {
              placement: 'sibling'
            }
          });

          expect(marker.options.placement).toEqual('sibling');
        });

        it('should respect the @placement option from the spot', function() {
          spot = mkSpot();

          spot.setOptions('marker.placement: inline');
          marker = ext.addMarker(null, spot);
          expect(marker.options.placement).toEqual('inline');

          marker.remove();

          spot.setOptions('marker.placement: sibling');
          marker = ext.addMarker(null, spot);
          expect(marker.options.placement).toEqual('sibling');
        });

        it('should respect the @placement option from the tour', function() {
          spot = mkSpot();
          tour = spot.tour;

          tour.setOptions('marker.placement: inline');
          marker = ext.addMarker(null, spot);
          expect(marker.options.placement).toEqual('inline');

          marker.remove();

          tour.setOptions('marker.placement: sibling');
          marker = ext.addMarker(null, spot);
          expect(marker.options.placement).toEqual('sibling');
        });

        it(':inline', function() {
          spot = mkVisibleSpot(null, null, {
            marker: {
              placement: 'inline'
            }
          });

          marker = spot.marker;

          marker.spot.tour.start();

          expect(marker.options.placement).toEqual('inline');
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
});