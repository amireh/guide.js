var specCallbacks = this.specCallbacks,
    cleanupQueue  = []

if (!specCallbacks) {
  specCallbacks = [];
}

specCallbacks.push(function() {
  _.invoke(cleanupQueue, 'remove');

  cleanupQueue = [];
});

function mkSpot($inEl, inTour, options) {
  var $el   = $inEl,
      tour  = inTour || Guide.tour;

  if (!$el) {
    $el = $('<div [data-spec]>Fixture</div>');
    cleanupQueue.push($el);
  }

  return tour.addSpot($el, options || {});
};

function mkVisibleSpot($el, tour, options) {
  var spot = mkSpot($el, tour, options);

  spot.$el.appendTo($('body'));

  return spot;
};

function mkBlankSpot($inEl, inTour) {
  var $el = $inEl || $('<div [data-spec]>Fixture</div>')
      tour = inTour || Guide.tour;

  return new Guide.Spot($el, tour, tour.spots.length);
};
