function mkSpot($inEl, inTour) {
  var $el   = $inEl || $('<div [data-spec]>Fixture</div>')
      tour  = inTour || guide.tour;

  return tour.addSpot($el, {});
};

function mkVisibleSpot($el, tour) {
  var spot = mkSpot($el, tour);

  spot.$el.appendTo($('body'));

  return spot;
};

function mkBlankSpot($inEl, inTour) {
  var $el = $inEl || $('<div [data-spec]>Fixture</div>')
      tour = inTour || guide.tour;

  return new guide.Spot($el, tour, tour.spots.length);
};
