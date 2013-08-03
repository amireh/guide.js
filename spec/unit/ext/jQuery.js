describe("jQuery", function() {
  var $el;

  beforeEach(function() {
    $el = $('<div />');
  });

  afterEach(function() {
    $el.remove();
  });

  it(':in_viewport', function() {

    $(function() {
      var offset;

      $el.appendTo($('body'));

      offset = $el.offset();

      console.log('offset:' , offset.top, offset.left);

      expect($el.is(':in_viewport')).toEqual(true);

      $el.detach();
      expect($el.is(':in_viewport')).toEqual(false);

      $el.appendTo($('body'));
      expect($el.is(':in_viewport')).toEqual(true);

      $el.css({ position: 'fixed' });
      $el.offset({
        top:  -9999,
        left: -9999
      });

      expect($el.is(':in_viewport')).toEqual(false);

      $el.remove();
    });
  });

  it('$.consume()', function() {
    var
    listener = {
      will_pass: function() {},
      wont_pass: function() {}
    };

    spyOn(listener, 'will_pass');
    spyOn(listener, 'wont_pass');

    $el.on('some_evt', $.proxy(listener.will_pass, listener));

    $el.trigger('some_evt');

    expect(listener.will_pass).toHaveBeenCalled();

    // now install a $.consume-ing() handler

    $el.on('some_evt', function(e) { return $.consume(e); });
    $el.on('some_evt', $.proxy(listener.wont_pass, listener));

    $el.trigger('some_evt');

    // shouldn't get through:
    expect(listener.wont_pass).not.toHaveBeenCalled();
  });


})