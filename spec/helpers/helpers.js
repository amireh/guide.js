var
  GuideOptions = {
    withAnimations: false,
    animeDuration: 0,
    debug: true
  },
  specCallbacks = this.specCallbacks,
  nr_nodes = 0,
  nr_nodes_sel = ':not(#HTMLReporter, #HTMLReporter *, #specContainer)';

beforeEach(function() {
  _.extend(Guide.defaults, GuideOptions);
  Guide.setOptions(GuideOptions);

  if (!Guide.$container.length) {
    Guide.$container = $(Guide.$container.selector);
  }

  nr_nodes = $(nr_nodes_sel).length;
});

afterEach(function() {
  console.log('-- SPEC TEARDOWN --');

  _.each(specCallbacks, function(callback) {
    callback();
  });

  Guide.reset();

  $('[data-spec]').remove();

  // console.log($(nr_nodes_sel))
  expect($(nr_nodes_sel).length).toEqual( nr_nodes );
});
