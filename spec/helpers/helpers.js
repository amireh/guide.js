var
  guideOptions = {
    withAnimations: false,
    animeDuration: 0,
    debug: true
  },
  specCallbacks = this.specCallbacks,
  nr_nodes = 0,
  nr_nodes_sel = ':not(#HTMLReporter, #HTMLReporter *, #specContainer)';

beforeEach(function() {
  _.extend(guide.defaults, guideOptions);
  guide.setOptions(guideOptions);

  if (!guide.$container.length) {
    guide.$container = $(guide.$container.selector);
  }

  nr_nodes = $(nr_nodes_sel).length;
});

afterEach(function() {
  console.log('-- SPEC TEARDOWN --');

  _.each(specCallbacks, function(callback) {
    callback();
  });

  guide.reset();

  $('[data-spec]').remove();

  // console.log($(nr_nodes_sel))
  expect($(nr_nodes_sel).length).toEqual( nr_nodes );
});
