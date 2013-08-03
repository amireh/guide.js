describe("guide", function() {
  describe("Optionable", function() {
    var o;

    beforeEach(function() {
      o = new Object();
      _.extend(o, guide.Optionable, {
        $: $(o)
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

      it('should accept a string of options', function() {
        o.setOptions('a:1, foo.bar:true');

        expect(o.options).toEqual({
          a: 1,
          foo: {
            bar: true
          }
        });
      });

      it('should reject bad input', function() {
        expect(function() {
          o.setOptions(true);
        }).toThrow();

        expect(function() {
          o.setOptions(undefined);
        }).toThrow();

        expect(function() {
          o.setOptions(null);
        }).toThrow();

      });
    });

    describe('#getOptions', function() {
      it('should not mutate the original options', function() {
        o.options = { foo: true };
        var options = o.getOptions();

        expect(options).toEqual(o.options);

        options.foo = false;
        expect(o.options).toEqual({ foo: true });
        expect(o.getOptions()).toEqual({ foo: true });
      });
    });
  });
})