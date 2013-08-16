describe("Extensions", function() {
  describe("Smart Markers", function() {
    var ext = guide.getExtension('smart_markers');
    var spot, tour, marker;

    beforeEach(function() {
      guide.setOptions({
        markers: {
          enabled: true
        },
        smart_markers: {
          enabled: true,
          adjustArrows: true
        },
        tours: {
          spots: {
            withMarker: true
          }
        }
      });
    });

    it('should centre an arrow', function() {
      spot = mkVisibleSpot(null, null, {
        text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
        marker: {
          position: 'top',
          placement: 'sibling',
          width: 240
        }
      });

      tour = spot.tour;

      marker = spot.marker;

      spot.$el.css({
        display: 'inline-block',
        width: '40px',
        height: '40px',
        position: 'relative'
      }).offset({
        left: 40
      });

      tour.start({ spot: spot });

      expect( marker.canShow() ).toBeTruthy();
      expect( ext.adjustArrows(null, marker) ).toBeTruthy();
      expect( marker.$el.hasClass('no-arrow') ).toBeTruthy();

      var expectedOffset = 60 - ext.getOption('arrowDim') / 2;

      expect( marker.$arrow.offset().left ).toBeGreaterThan( expectedOffset -1 );
      expect( marker.$arrow.offset().left ).toBeLessThan( expectedOffset + 1 );
    });
  });
});