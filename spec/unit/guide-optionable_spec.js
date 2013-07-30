describe("guide", function() {
  describe("Optionable", function() {
    var o;

    beforeEach(function() {
      o = new Object();
      _.extend(o, guide.Optionable, {
        $: $(o)
      });
    });

    describe('#getOptions', function() {
      it('should accept overrides', function() {
        expect(o.getOptions({ foo: 123 })).toEqual({ foo: 123 });
        expect(o.getOptions()).toEqual({});
      });
    });

    describe('#setOptions', function() {
      it('should #refresh on option changes', function() {
        o.refresh = function() {}
        spyOn(o, 'refresh');

        o.setOptions({
          a: 1
        });

        expect(o.refresh).toHaveBeenCalled();
      });

      it('should emit an event on option changes', function() {
        o.handler = function() {}
        spyOn(o, 'handler');

        o.$.on('refresh', $.proxy(o.handler, o));
        o.setOptions({
          a: 1
        });

        expect(o.handler).toHaveBeenCalled();
      });
    });
  });
})