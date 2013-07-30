describe("guide", function() {
  describe("Optionable", function() {
    var o;

    beforeEach(function() {
      o = new Object();
      _.extend(o, guide.Optionable);
    });

    it('#getOptions should accept overrides', function() {
      expect(o.getOptions({ foo: 123 })).toEqual({ foo: 123 });
      expect(o.getOptions()).toEqual({});
    });
  })
})