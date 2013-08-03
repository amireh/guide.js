describe("Extensions", function() {
  describe("Markers", function() {
    var ext = guide.getExtension('markers');

    describe("Marker", function() {
      var spot, marker;

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

        it(':inline', function() {
          spot = mkVisibleSpot();

          marker  = ext.addMarker(null, spot, {
            options: {
              placement: 'inline'
            }
          });


          expect(marker.options.placement).toEqual('inline');
          expect(marker.isWrapped()).toBeFalsy();
          expect(marker.canShow()).toBeTruthy();

          marker.show();

          expect(marker.$el.parent().is(spot.$el)).toBeTruthy();
        });

        it(':sibling', function() {
          spot = mkSpot();
          spot.$el.appendTo($('body'));

          marker  = ext.addMarker(null, spot, {
            options: {
              placement: 'sibling'
            }
          });

          expect(marker.isWrapped()).toBeTruthy();
          expect(marker.canShow()).toBeTruthy();

          marker.show();

          expect(marker.$container[0]).toEqual(spot.$el.parent()[0]);
          expect(marker.$container[0]).toEqual(marker.$el.parent()[0]);

          spot.remove();
        });

        it(':overlay', function() {
          spot = mkVisibleSpot();

          marker  = ext.addMarker(null, spot, {
            options: {
              placement: 'overlay'
            }
          });

          expect(marker.isWrapped()).toBeFalsy();
          expect(marker.canShow()).toBeTruthy();

          marker.show();

          expect(marker.$el.parent()[0]).toEqual(guide.$el[0]);
        });

      });
    });
  });
});