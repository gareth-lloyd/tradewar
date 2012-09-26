describe("Good", function() {
  var good;
  var tariff;

  beforeEach(function() {
    tariff = new Tariff();
    good = new Good({
      name: 'tea',
      basePrice: 4.0,
    });
  });

  it("should have a name", function() {
    expect(good.get('name')).toEqual('tea');
  });

  it("should have a base price", function() {
    expect(good.get('basePrice')).toEqual(4.0);
  });
});

describe("Tariff", function() {
  var tariff;

  beforeEach(function() {
    tariff = new Tariff({});
  });

  it("should have a varying rate", function() {
    expect(tariff.get('rate')).toEqual(0.0);
    tariff.set('rate', 0.1);
    expect(tariff.get('rate')).toEqual(0.1);
  });

});

describe("Country", function() {
  var country;
  var good;
  var tariff;

  beforeEach(function() {
    country = new Country();
    good = new Good({
      name: 'tea',
      basePrice: 4.0,
    });
  });

  it("has domestic price of base price without tariff", function() {
    expect(country.tariffForGood(good).get('rate')).toBe(0.0)
    expect(country.domesticPrice(good)).toBe(good.get('basePrice'));
  });

  it("can report tariff for any good", function() {
    expect(country.tariffForGood(good)).not.toBe(null);
  });

  it("stores tariff for particular good", function() {
    expect(country.tariffForGood(good).get('rate')).toBe(0.0)
    tariff = country.tariffForGood(good);
    tariff.set('rate', 0.1)
    expect(country.tariffForGood(good).get('rate')).toBe(0.1)
  });

  it("has domestic price greater than base price with tariff", function() {
    country.tariffForGood(good).set('rate', 0.1);
    expect(country.domesticPrice(good)).toBeGreaterThan(good.get('basePrice'));
  });

});
