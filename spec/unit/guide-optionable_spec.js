describe("Guide", function() {
  describe("Optionable", function() {
    var o;

    beforeEach(function() {
      o = new Object();
      _.extend(o, Guide.Optionable, {
        $: $(o),
        options: {}
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

        expect(o.getOptions()).toEqual({
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

      it('should scope per platform', function() {
        o.setOptions({
          foo: 'a'
        });

        expect( o.getOption('foo') ).toEqual('a');

        o.setOptions({
          foo: 'b',
          bar: {
            a: true,
            b: false
          }
        }, 'mobile');

        expect( o.getOption('foo') ).toEqual('a');
        expect( o.getOption('bar.a') ).toEqual(undefined);
        expect( o.getOption('bar.b') ).toEqual(undefined);

        Guide.platform = 'mobile';
        console.log(o.getOptions('bar.a'));
        expect( o.getOption('foo') ).toEqual('b');
        expect( o.getOption('bar.a') ).toEqual(true);
        expect( o.getOption('bar.b') ).toEqual(false);
      });

      it('should accept overrides', function() {
        o.setOptions({
          foo: 'a',
          overrides: {
            mobile: {
              foo: 'b',
              bar: {
                a: true,
                b: false
              }
            }
          }
        });

        Guide.platform = 'desktop';
        console.log(o.getOptions());
        expect( o.getOption('foo') ).toEqual('a');
        expect( o.getOption('bar.a') ).toEqual(undefined);
        expect( o.getOption('bar.b') ).toEqual(undefined);

        Guide.platform = 'mobile';

        console.log(o.getOptions());
        expect( o.getOption('foo') ).toEqual('b');
        expect( o.getOption('bar.a') ).toEqual(true);
        expect( o.getOption('bar.b') ).toEqual(false);
      })
    });

    describe('#getOptions', function() {
      it('should not mutate the original options', function() {
        o.options.default = { foo: true };

        expect(o.getOptions()).toEqual({ foo: true });
      });
    });

    it('#hasOption', function() {
      o.setOptions({
        foo: true,
        a: {
          b: 'xyz'
        }
      });

      expect(o.hasOption('foo')).toBeTruthy();
      expect(o.hasOption('a.b')).toBeTruthy();
      expect(o.hasOption('foo.bar')).toBeFalsy();
    });

    it('#isOptionOn', function() {
      o.setOptions({
        foo: true,
        bar: false
      });

      expect(o.isOptionOn('foo')).toBeTruthy();
      expect(o.isOptionOn('bar')).toBeFalsy();
      expect(o.isOptionOn('x.y.z')).toBeFalsy();
    })
  });
})