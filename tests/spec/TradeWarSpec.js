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
  var good1;
  var good2;

  beforeEach(function() {
    good1 = new Good({name: 'tea'});
    good2 = new Good({name: 'coffee'});
    country = new Country({
        'relevantGoods': [good1, good2],
        'tariffs': {
          'tea': new Tariff({rate: 0.05}),
          'coffee': new Tariff({rate: 0.1})
        },
        'sensitivities': {
          'tea': 1.0,
          'coffee': 1.0
        },
        'basePrices': {
          'tea': 1,
          'coffee': 1
        },
        'demands': {
          'tea': 1,
          'coffee': 1
       }
    });
    citizens = new Citizens({country: country});
  });

  it("has an expected price for its consumption", function() {
    expect(citizens.expectedPriceOfConsumption(good1)).toBe(1.1);
  });

  it("will be happy if expected price is more than actual", function() {
    expect(citizens.expectedPriceOfConsumption(good1)).toBeGreaterThan(country.actualPriceFor(good1));
    expect(citizens.moodFor(good1)).toBeGreaterThan(0);
  });
 
  it("will produce mood words according to moods", function() {
    expect(citizens.moodWord(-1)).toEqual('apoplectic');
    expect(citizens.moodWord(-0.5)).toEqual('apoplectic');
    expect(citizens.moodWord(-0.499)).toEqual('angry');
    expect(citizens.moodWord(-0.1)).toEqual('miffed');
    expect(citizens.moodWord(0.09)).toEqual('pleased');
    expect(citizens.moodWord(1)).toEqual('ecstatic');
  });
  it("will produce mood colours according to moods", function() {
    expect(citizens.moodColourClass(-1)).toEqual('redBackground');
    expect(citizens.moodColourClass(-0.5)).toEqual('redBackground');
    expect(citizens.moodColourClass(-0.499)).toEqual('orangeBackground');
    expect(citizens.moodColourClass(-0.1)).toEqual('neutralBackground');
    expect(citizens.moodColourClass(0.09)).toEqual('paleGreenBackground');
    expect(citizens.moodColourClass(1)).toEqual('greenBackground');
  });
  it("will be sad if expected price is less than actual", function() {
    country.tariffFor(good1).set('rate', 1.5);
    expect(citizens.expectedPriceOfConsumption(good1)).toBeLessThan(country.actualPriceFor(good1));
    expect(citizens.moodFor(good1)).toBeLessThan(0);
  });

  it("will have an average mood based on individual moods", function() {
    expect(citizens.moodFor(good2)).toBeLessThan(citizens.moodFor(good1));
    expect(citizens.averageMood()).toBeLessThan(citizens.moodFor(good1));
    expect(citizens.averageMood()).toBeGreaterThan(citizens.moodFor(good2));
  });
});

describe("Producers", function() {
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
    business = new Producers({country: country});
  });

  it("will be sad if expected price is more than actual", function() {
    expect(business.expectedPriceOfConsumption(good)).toBeGreaterThan(country.actualPriceFor(good));
    expect(business.moodFor(good)).toBeLessThan(0);
  });

  it("will be sad if expected price is less than actual", function() {
    country.tariffFor(good).set('rate', 1.5);
    expect(business.expectedPriceOfConsumption(good)).toBeLessThan(country.actualPriceFor(good));
    expect(business.moodFor(good)).toBeGreaterThan(0);
  });
});

describe("GameModel", function() {
  var game;
  var citizens;
  var exporters;
  var producers;
  var goodA = new Good({name: 'a'});
  var goodB = new Good({name: 'b'});

  beforeEach(function() {
    country = new Country({
        'tariffs': {
          'a': new Tariff({'rate': 0.0}),
          'b': new Tariff({'rate': 0.0})
        },
        'basePrices': {
          'a': 1,
          'a': 1,
        },
        'demands': {
          'a': 1,
          'a': 1,
        },
        'sensitivities': {
          'a': 1,
          'a': 1,
        },
        'relevantGoods': [goodA, goodB],
    });
    citizens = new Citizens({country: country});
    producers = new Producers({country: country});
    exporters = new Exporters({country: country});
    game = new GameModel({
        country: country,
        citizens: citizens,
        producers: producers,
        exporters: exporters
    });
  });

  it("should initialize historic data", function() {
    expect(game.get('historicPrices').getData(goodA).length).toEqual(1);
  });

  it("should advance the year on playerTurnOver", function() {
    var year = game.get('year');
    game.trigger('playerTurnOver');
    expect(game.get('year')).toEqual(year + 1);
  });

  it("should record detect goods changed this turn", function() {
    game.trigger('playerTurnOver');
    expect(game.get('goodsChangedThisTurn')).toEqual([]);
    game.get('country').tariffFor(goodA).set('rate', 1.0);
    game.trigger('playerTurnOver');
    expect(game.get('goodsChangedThisTurn')).toEqual([goodA]);
  });
});

describe("HistoricDataByGood", function() {
  var hdbg;
  var good = new Good({name: 'tea'});
  beforeEach(function() {
    hdbg = new HistoricDataByGood();
  });

  it("should record the data against a particular good", function() {
    expect(hdbg.getData(good)).toEqual([]);
    hdbg.record(good, 1.0);
    expect(hdbg.getData(good)).toEqual([1.0]);
  });

  it("should report data in order of insertion", function() {
    hdbg.record(good, 1.0);
    expect(hdbg.getData(good)).toEqual([1.0]);
    hdbg.record(good, 2.0);
    expect(hdbg.getData(good)).toEqual([1.0, 2.0]);
  });
  it("should report current value", function() {
    hdbg.record(good, 1.0);
    expect(hdbg.currentVal(good)).toEqual(1.0);
    hdbg.record(good, 3.0);
    expect(hdbg.currentVal(good)).toEqual(3.0);
  });
  it("should report previous value", function() {
    hdbg.record(good, 1.0);
    hdbg.record(good, 3.0);
    expect(hdbg.previousVal(good)).toEqual(1.0);
  });
  it("should report no change if data is same", function() {
    hdbg.record(good, 1.0);
    hdbg.record(good, 1.0);
    expect(hdbg.changeIn(good)).toEqual(0);
  });
  it("should report price changes", function() {
    hdbg.record(good, 1.0);
    hdbg.record(good, 3.0);
    expect(hdbg.changeIn(good)).toEqual(2);
  });
  it("should report percentage changed", function() {
    hdbg.record(good, 1.0);
    hdbg.record(good, 2.0);
    expect(hdbg.percentageChange(good)).toEqual(1);
    hdbg.record(good, 1.0);
    expect(hdbg.percentageChange(good)).toEqual(-.5);

  });
});
