var
  nr_nodes = 0,
  nr_nodes_sel = ':not(#HTMLReporter, #HTMLReporter *, #specContainer)';

beforeEach(function() {
  guide.options.withAnimations = false;
  guide.options.animeDuration = 0;

  if (!guide.$container.length) {
    guide.$container = $(guide.$container.selector);
  }

  nr_nodes = $(nr_nodes_sel).length;
});

afterEach(function() {
  guide.reset();
  $('[data-spec]').remove();

  expect($(nr_nodes_sel).length).toEqual( nr_nodes );
});
