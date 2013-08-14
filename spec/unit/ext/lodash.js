describe("lodash", function() {
  it("_#dotAssign", function() {
    var o = {};

    expect(_.dotAssign('foo.bar', 123, o)).toEqual({
      foo: { bar: 123 }
    });

    expect(_.dotAssign('foo.bar', null, o)).toEqual({
      foo: { bar: null }
    });
  });

  it('_#dotGet', function() {
    var o = {
      foo: 'bar',
      a: {
        b: {
          c: true,
          d: 123,
          e: false
        }
      }
    };

    expect(_.dotGet('foo', o)).toEqual('bar');
    expect(_.dotGet('a.b', o)).toEqual(o.a.b);
    expect(_.dotGet('a.b.c', o)).toEqual(true);
    expect(_.dotGet('a.b.d', o)).toEqual(123);
    expect(_.dotGet('a.b.e', o)).toEqual(false);
    expect(_.dotGet('a.b.xyz', o)).toEqual(undefined);
  });

  it("_#dotAssign should implicitly create an object", function() {
    expect(_.dotAssign('foo.bar', 123, undefined)).toEqual({
      foo: { bar: 123 }
    });
  });

  describe("_#parseOptions", function() {

    it("should parse options", function() {
      expect(_.parseOptions('foo:bar')).toEqual({
        foo: 'bar'
      });
    });

    it("should parse multiple options", function() {
      expect(_.parseOptions('a:1, b:2, c:false')).toEqual({
        a: 1,
        b: 2,
        c: false
      });
    });

    it("should omit non-significant whitespace", function() {
      expect(_.parseOptions('a: 1 , b: 2')).toEqual({
        a: 1,
        b: 2
      });
    });

    it("should convert option values", function() {
      expect(_.parseOptions('foo:123')).toEqual({ foo: 123 })
      expect(_.parseOptions('foo:123')).not.toEqual({ foo: '123' })

      expect(_.parseOptions('foo:true')).toEqual({ foo: true })
      expect(_.parseOptions('foo:false')).toEqual({ foo: false })
    });

    it("should use a custom tokenizer", function() {
    });

    it("should use a custom sanitizer", function() {
    });

  });

})