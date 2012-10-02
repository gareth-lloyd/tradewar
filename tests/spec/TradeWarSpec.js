describe("TradeWar", function () {
  var goodA;
  var goodB;
  var tariffA;
  var tariffB;
  var country;

  beforeEach(function() {
    goodA = new Good({name: 'a'});
    goodB = new Good({name: 'b'});
    tariffA = new Tariff({rate: 0.1});
    tariffB = new Tariff({rate: 0.2});
    country = new Country({
        goodDescriptions: [
            {good: goodA, sensitivity: 1.0, basePrice: 1, tariff: tariffA},
            {good: goodB, sensitivity: 1.0, basePrice: 1, tariff: tariffB}
        ]
    });
  });

  describe("Good", function() {
    it("should have a name", function() {
      expect(goodA.get('name')).toEqual('a');
    });
  });

  describe("Tariff", function() {
    it("should have a varying rate", function() {
      expect(tariffA.get('rate')).toEqual(0.1);
      tariffA.set('rate', 0.2);
      expect(tariffA.get('rate')).toEqual(0.2);
    });
  });

  describe("Country", function() {
    it("should initialize historic data", function() {
      expect(country.historicPrices.getData(goodA).length).toEqual(1);
    });
    it("reports tariff for a good", function() {
      expect(country.tariffFor(goodA)).toBe(tariffA);
    });
    it("reports sensitivity for a good", function() {
      expect(country.sensitivityFor(goodA)).toBe(1.0);
    });
    it("reports basePrice for a good", function() {
      expect(country.basePriceFor(goodA)).toBe(1);
    });
    it("has actual price of base price without tariff", function() {
      country.tariffFor(goodA).set('rate', 0.0);
      expect(country.predictedPriceFor(goodA)).toBe(country.basePriceFor(goodA));
    });
    it("has actual price greater than base price with tariff", function() {
      country.tariffFor(goodA).set('rate', 0.1);
      expect(country.predictedPriceFor(goodA)).toBeGreaterThan(
          country.basePriceFor(goodA));
    });
    it("has higher prices with higher tariff", function() {
      country.tariffFor(goodA).set('rate', 0.1);
      var price1 = country.predictedPriceFor(goodA);
      country.tariffFor(goodA).set('rate', 0.2);
      expect(country.predictedPriceFor(goodA)).toBeGreaterThan(price1);
    });
    it("has higher prices with higher sensitivity", function() {
      country.tariffFor(goodA).set('rate', 0.1);
      var price1 = country.predictedPriceFor(goodA);
      country.get('sensitivities')[goodA.get('name')] = 2.0;
      expect(country.predictedPriceFor(goodA)).toBeGreaterThan(price1);
    });
  });

  describe("Citizens", function() {
    var citizens;
    beforeEach(function() {
        citizens = new Citizens({country: country});
    });
    it("has an expected price for its consumption", function() {
      expect(citizens.expectedPriceOfConsumption(goodA)).toBeGreaterThan(
          country.basePriceFor(goodA));
    });
    it("will be happy if expected price is more than actual", function() {
      expect(citizens.expectedPriceOfConsumption(goodA)).toBeGreaterThan(
          country.currentPriceFor(goodA));
      expect(citizens.moodFor(goodA)).toBeGreaterThan(0);
    });
    it("will produce mood words according to moods", function() {
      expect(citizens.moodWord(-1)).toEqual('apoplectic');
      expect(citizens.moodWord(0)).toEqual('pleased');
      expect(citizens.moodWord(1)).toEqual('ecstatic');
    });
    it("will produce mood colours according to moods", function() {
      expect(citizens.moodColourClass(-1)).toEqual('redBackground');
      expect(citizens.moodColourClass(1)).toEqual('greenBackground');
    });
    it("will be sad if expected price is less than actual", function() {
      country.tariffFor(goodA).set('rate', 1.5);
      country.recordHistory();
      expect(citizens.expectedPriceOfConsumption(goodA)).toBeLessThan(
          country.currentPriceFor(goodA));
      expect(citizens.moodFor(goodA)).toBeLessThan(0);
    });
    it("will have an average mood based on individual moods", function() {
      expect(citizens.moodFor(goodB)).toBeLessThan(citizens.moodFor(goodA));
      expect(citizens.averageMood()).toBeLessThan(citizens.moodFor(goodA));
      expect(citizens.averageMood()).toBeGreaterThan(citizens.moodFor(goodB));
    });
  });

  describe("Producers", function() {
    var producers;

    beforeEach(function() {
      producers = new Producers({country: country});
    });
    it("will be sad if expected price is more than actual", function() {
      country.recordHistory();
      expect(producers.expectedPriceOfConsumption(goodA)).toBeGreaterThan(
          country.actualPriceFor(goodA));
      expect(producers.moodFor(goodA)).toBeLessThan(0);
    });
    it("will be happy if expected price is less than actual", function() {
      country.tariffFor(goodA).set('rate', 1.5);
      country.recordHistory();
      expect(producers.expectedPriceOfConsumption(goodA)).toBeLessThan(
          country.actualPriceFor(goodA));
      expect(producers.moodFor(goodA)).toBeGreaterThan(0);
    });
  });

  describe("GameModel", function() {
    var game;
    var citizens;
    var exporters;
    var producers;

    beforeEach(function() {
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

    it("should advance the year on playerTurnOver", function() {
      var year = game.get('year');
      game.trigger('playerTurnOver');
      expect(game.get('year')).toEqual(year + 1);
    });
  });

  describe("HistoricDataByGood", function() {
    var hdbg;
    beforeEach(function() {
      hdbg = new HistoricDataByGood();
    });
    it("should record the data against a particular good", function() {
      expect(hdbg.getData(goodA)).toEqual([]);
      hdbg.record(goodA, 1.0);
      expect(hdbg.getData(goodA)).toEqual([1.0]);
    });
    it("should report data in order of insertion", function() {
      hdbg.record(goodA, 1.0);
      expect(hdbg.getData(goodA)).toEqual([1.0]);
      hdbg.record(goodA, 2.0);
      expect(hdbg.getData(goodA)).toEqual([1.0, 2.0]);
    });
    it("should report current value", function() {
      hdbg.record(goodA, 1.0);
      expect(hdbg.currentVal(goodA)).toEqual(1.0);
      hdbg.record(goodA, 3.0);
      expect(hdbg.currentVal(goodA)).toEqual(3.0);
    });
    it("should report previous value", function() {
      hdbg.record(goodA, 1.0);
      hdbg.record(goodA, 3.0);
      expect(hdbg.previousVal(goodA)).toEqual(1.0);
    });
    it("should report no change if data is same", function() {
      hdbg.record(goodA, 1.0);
      hdbg.record(goodA, 1.0);
      expect(hdbg.changeIn(goodA)).toEqual(0);
    });
    it("should report price changes", function() {
      hdbg.record(goodA, 1.0);
      hdbg.record(goodA, 3.0);
      expect(hdbg.changeIn(goodA)).toEqual(2);
    });
    it("should report changed", function() {
      var all = [goodA, goodB];
      hdbg.record(goodA, 1.0);
      hdbg.record(goodB, 2.0);
      hdbg.record(goodA, 1.0);
      hdbg.record(goodB, 2.0);
      expect(hdbg.changedGoods(all)).toEqual([]);
      hdbg.record(goodA, 3.0);
      expect(hdbg.changedGoods(all)).toEqual([goodA]);
      hdbg.record(goodB, 4.0);
      expect(hdbg.changedGoods(all)).toEqual([goodA, goodB]);
    });
  });
});

