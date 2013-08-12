var
  specCallbacks = this.specCallbacks,
  nr_nodes = 0,
  nr_nodes_sel = ':not(#HTMLReporter, #HTMLReporter *, #specContainer)';

beforeEach(function() {
  guide.options.withAnimations = false;
  guide.options.animeDuration = 0;
  guide.options.debug = true;

  if (!guide.$container.length) {
    guide.$container = $(guide.$container.selector);
  }

  nr_nodes = $(nr_nodes_sel).length;
});

afterEach(function() {
  _.each(specCallbacks, function(callback) {
    callback();
  });

  guide.reset();
  $('[data-spec]').remove();

  expect($(nr_nodes_sel).length).toEqual( nr_nodes );
});
