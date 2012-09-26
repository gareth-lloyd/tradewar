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
    good = new Good({
      name: 'tea',
    });
    tariff = new Tariff({rate: 0.0});

    country = new Country({
        'tariffs': {'tea': tariff},
        'sensitivities': {'tea': 1.0},
        'basePrices': {'tea': 1},
        'demands': {'tea': 1}
    });
  });

  it("reports tariff for a good", function() {
    expect(country.tariffFor(good)).toBe(tariff);
  });

  it("reports sensitivity for a good", function() {
    expect(country.sensitivityFor(good)).toBe(1.0);
  });

  it("reports basePrice for a good", function() {
    expect(country.basePriceFor(good)).toBe(1);
  });

  it("reports demand for a good", function() {
    expect(country.demandFor(good)).toBe(1);
  });

  it("has actual price of base price without tariff", function() {
    country.tariffFor(good).set('rate', 0.0);
    expect(country.actualPriceFor(good)).toBe(country.basePriceFor(good));
  });

  it("has actual price greater than base price with tariff", function() {
    country.tariffFor(good).set('rate', 0.1);
    expect(country.actualPriceFor(good)).toBeGreaterThan(country.basePriceFor(good));
  });

  it("has higher prices with higher tariff", function() {
    country.tariffFor(good).set('rate', 0.1);
    var price1 = country.actualPriceFor(good);
    country.tariffFor(good).set('rate', 0.2);
    var price2 = country.actualPriceFor(good);
    expect(price2).toBeGreaterThan(price1);
  });

  it("has higher prices with higher sensitivity", function() {
    country.tariffFor(good).set('rate', 0.1);
    var price1 = country.actualPriceFor(good);
    country.get('sensitivities')[good.get('name')] = 2.0;
    var price2 = country.actualPriceFor(good);
    expect(price2).toBeGreaterThan(price1);
  });
});

describe("Citizens", function() {
  var country;
  var citizens;
  var good;

  beforeEach(function() {
    good = new Good({name: 'tea'});
    country = new Country({
        'tariffs': {'tea': new Tariff({rate: 0.05})},
        'sensitivities': {'tea': 1.0},
        'basePrices': {'tea': 1},
        'demands': {'tea': 1}
    });
    citizens = new Citizens({country: country});
  });

  it("has an expected price for its consumption", function() {
    expect(citizens.expectedPriceFor(good)).toBe(1.1);
  });

  it("will be happy if expected price is more than actual", function() {
    expect(citizens.expectedPriceFor(good)).toBeGreaterThan(country.actualPriceFor(good));
    expect(citizens.moodFor(good)).toBeGreaterThan(0);
  });

  it("will be sad if expected price is less than actual", function() {
    country.tariffFor(good).set('rate', 1.5);
    expect(citizens.expectedPriceFor(good)).toBeLessThan(country.actualPriceFor(good));
    expect(citizens.moodFor(good)).toBeLessThan(0);
  });
});

describe("Business", function() {
  var country;
  var business;
  var good;

  beforeEach(function() {
    good = new Good({name: 'tea'});
    country = new Country({
        'tariffs': {'tea': new Tariff({rate: 0.05})},
        'sensitivities': {'tea': 1.0},
        'basePrices': {'tea': 1},
        'demands': {'tea': 1}
    });
    business = new Business({country: country});
  });

  it("will be sad if expected price is more than actual", function() {
    expect(business.expectedPriceFor(good)).toBeGreaterThan(country.actualPriceFor(good));
    expect(business.moodFor(good)).toBeLessThan(0);
  });

  it("will be sad if expected price is less than actual", function() {
    country.tariffFor(good).set('rate', 1.5);
    expect(business.expectedPriceFor(good)).toBeLessThan(country.actualPriceFor(good));
    expect(business.moodFor(good)).toBeGreaterThan(0);
  });
});
