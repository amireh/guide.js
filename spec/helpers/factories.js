var specCallbacks     = this.specCallbacks,
    spotCleanupQueue  = []

if (!specCallbacks) {
  specCallbacks = [];
}

specCallbacks.push(function() {
  _.each(spotCleanupQueue, function(spot) {
    spot.$el.remove();
    spot.remove();
  });

  spotCleanupQueue = [];
});

function mkSpot($inEl, inTour, options) {
  var $el   = $inEl || $('<div [data-spec]>Fixture</div>')
      tour  = inTour || guide.tour;

  return tour.addSpot($el, options || {});
};

function mkVisibleSpot($el, tour, options) {
  var spot = mkSpot($el, tour, options);

  spot.$el.appendTo($('body'));

  spotCleanupQueue.push(spot);

  return spot;
};

function mkBlankSpot($inEl, inTour) {
  var $el = $inEl || $('<div [data-spec]>Fixture</div>')
      tour = inTour || guide.tour;

  return new guide.Spot($el, tour, tour.spots.length);
};
