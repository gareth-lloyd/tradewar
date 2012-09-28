
var Good = Backbone.Model.extend({
    nameCapital: function () {
        var name = this.get('name');
        return name.substr(0, 1).toUpperCase() + name.substr(1);
    }
});

var Tariff = Backbone.Model.extend({
    defaults: {
        rate: 0.0
    },
});

var TariffView = Backbone.View.extend({
    tagName: 'div',
    className: 'tariff',

    initialize: function() {
        this.model.bind("change", this.tariffChanged, this);
    },
    tariffChanged: function() {
        var rate = this.model.get('rate');
        rate *= 100;
        this.$('.tariffValue').text(rate + "%");

        var price = this.options.country.actualPriceFor(this.options.good);
        var currency = this.options.country.get('currency');
        this.$('.priceValue').text(price + ' ' + currency);
    },
    sliderMoved: function(event, ui) {
        this.model.set('rate', ui.value);
    },
    render: function() {
        var attrs = this.model.toJSON();
        attrs.nameCapital = this.options.good.nameCapital();
        $(this.el).append(ich.tariffTemplate(attrs));
        this.$('.slider').slider({
            min: 0.0,
            max: 1,
            step: 0.02,
            value: this.model.get('rate'),
            slide: this.sliderMoved.bind(this)
        });
        this.tariffChanged();
        return this;
    }
});

var InterestGroup = Backbone.Model.extend({
    expectedPriceOfConsumption: function(good) {
        var country = this.get('country');
        return (country.basePriceFor(good) * country.demandFor(good)) * this.priceExpectationMultiplier;
    },
    actualPriceOfConsumption: function(good) {
        var country = this.get('country');
        return (country.actualPriceFor(good) * country.demandFor(good));
    },
    percentDifferenceFromExpected: function(good) {
        var expected = this.expectedPriceOfConsumption(good);
        var actual = this.actualPriceOfConsumption(good);
        return (actual - expected) / expected;
    },
    dampen: function(d) {
        return Math.sqrt(Math.abs(d));
    },
    averageMood: function() {
        var goods = _(this.get('country').get('relevantGoods'));
        if (goods.size() < 0)
            return 0

        var total = goods.reduce(function(memo, good) {
            return memo + this.moodFor(good);
        }.bind(this), 0);
        return total / goods.size();
    }
});

var Citizens = InterestGroup.extend({
    priceExpectationMultiplier: 1.1,
    defaults: {
        'name': 'Citizens'
    },

    moodFor: function(good) {
        var diff = this.percentDifferenceFromExpected(good);
        var damped = this.dampen(diff);
        return (diff < 0) ? damped : -damped;
    }
});

var Producers = InterestGroup.extend({
    priceExpectationMultiplier: 1.3,
    defaults: {
        'name': 'Producers'
    },

    moodFor: function(good) {
        var diff = this.percentDifferenceFromExpected(good);
        var damped = this.dampen(diff);
        return (diff > 0) ? damped : -damped;
    }
});

var Exporters = InterestGroup.extend({
    priceExpectationMultiplier: 1.3,
    name: 'exporters',

    moodFor: function(good) {
        var diff = this.percentDifferenceFromExpected(good);
        var damped = this.dampen(diff);
        return (diff > 0) ? -damped : damped;
    }
});
var InterestGroupAverageView = Backbone.View.extend({
    render: function() {
        var attrs = this.model.toJSON();
        attrs.mood = this.model.averageMood();
        $(this.el).append(ich.interestGroupMoodTemplate(attrs));
        return this;
    }
});
var InterestGroupGoodView = Backbone.View.extend({
    tagName: 'div',
    className: 'interestGroup well',
    render: function() {
        var attrs = this.model.toJSON();
        attrs.mood = this.model.moodFor(this.options.good);
        attrs.good = this.options.good.get('name');
        $(this.el).append(ich.interestGroupGoodTemplate(attrs));
        return this;
    }
});
var Country = Backbone.Model.extend({
    basePriceFor: function(good) {
        return this.get('basePrices')[good.get('name')];
    },
    sensitivityFor: function(good) {
        return this.get('sensitivities')[good.get('name')];
    },
    tariffFor: function(good) {
        return this.get('tariffs')[good.get('name')];
    },
    demandFor: function(good) {
        return this.get('demands')[good.get('name')];
    },
    actualPriceFor: function(good) {
        var sensitivity = this.sensitivityFor(good);
        var tariff = this.tariffFor(good);
        var basePrice = this.basePriceFor(good);
        var rate = tariff.get('rate');
        return basePrice + ((rate * basePrice) * sensitivity);
    }
});


var TradeWar = {
    TEA: new Good({name: 'tea'}),
    SHOES: new Good({name: 'shoes'}),
    SOAP: new Good({name: 'soap'}),
    WATER: new Good({name: 'water'}),
    CHICKEN: new Good({name: 'chicken'}),
    INDIA: new Country({
        name: 'India',
        'tariffs': {
          'tea': new Tariff({rate: 1.0}),
          'soap': new Tariff({rate: 0.1}),
          'water': new Tariff({rate: 0.3}),
          'chicken': new Tariff({rate: 0.3}),
          'shoes': new Tariff({rate: 0.1})
        },
        'sensitivities': {
          'tea': 0.45,
          'chicken': 0.31,
          'soap': 0.72,
          'water': 0.41,
          'shoes': 0.1,
        },
        'basePrices': {
          'tea': 25,
          'soap': 19,
          'water': 14.5,
          'chicken': 117.5,
          'shoes': 1724.5
        },
        'demands': {
          'tea': 1.0,
          'chicken': 1.0,
          'soap': 1.0,
          'water': 1.0,
          'shoes': 1.0
       },
       'currency': 'INR'
    }),
}
TradeWar.ALL_GOODS = [TradeWar.TEA];
TradeWar.INDIAN_CITIZENS = new Citizens({country: TradeWar.INDIA});
TradeWar.INDIAN_PRODUCERS = new Producers({country: TradeWar.INDIA});
TradeWar.INDIAN_EXPORTERS = new Exporters({country: TradeWar.INDIA});
TradeWar.INDIA.set('relevantGoods', [TradeWar.TEA, TradeWar.SHOES,
    TradeWar.CHICKEN, TradeWar.SOAP, TradeWar.WATER]);

var HistoricDataByGood = Backbone.Model.extend({
    initialize: function () {
        this.set('data', {});
    },
    getData: function(good) {
        var name = good.get('name');
        var data = this.get('data');
        if (name in data)
            return this.get('data')[good.get('name')];
        else
            return [];
    },
    record: function(good, value) {
        var name = good.get('name');
        var data = this.get('data');
        if (! (name in data))
            data[name] = [];
        data[name].push(value);
    },
});
var GameModel = Backbone.Model.extend({
    defaults: {
        year: 1990,
        country: TradeWar.INDIA,
        goods: [TradeWar.TEA],
        citizens: TradeWar.INDIAN_CITIZENS,
        producers: TradeWar.INDIAN_PRODUCERS
    },
    initialize: function() {
        var historicPrices = new HistoricDataByGood();
        var historicTariffs = new HistoricDataByGood();
        this.set('historicPrices', historicPrices);
        this.set('historicTariffs', historicTariffs);

        // initialize historic data
        var country = this.get('country');
        var goods = _(country.get('relevantGoods'));
        goods.each(function(good) {
            historicPrices.record(good, country.actualPriceFor(good));
            historicTariffs.record(good, country.tariffFor(good).get('rate'));
        });

        this.on('nextTurn', this.advanceYear, this);
        this.on('nextTurn', this.recordHistory, this);
    },
    advanceYear: function() {
        this.set('year', this.get('year') + 1);
    },
    recordHistory: function() {
        var goods = _(this.get('country').get('relevantGoods'));
        var historicPrices = this.get('historicPrices');
        var historicTariffs = this.get('historicTariffs');
        goods.each(function(good) {
            historicPrices.record(good, this.get('country').actualPriceFor(good));
            historicTariffs.record(good, this.get('country').tariffFor(good).get('rate'));
        }.bind(this));
        this.detectChangedGoods();
    },
    detectChangedGoods: function() {
        var country = this.get('country');
        var goods = _(country.get('relevantGoods'));
        var historicTariffs = this.get('historicTariffs');
        var changed = [];
        goods.each(function(good) {
            var data = historicTariffs.getData(good);
            var last = data.length - 1;
            if (data[last] != data[last - 1])
                changed.push(good);
        });
        this.set('goodsChangedThisTurn', changed);
    }
});
var GameView = Backbone.View.extend({
    el: '#game',

    initialize: function(options) {
        this.country = this.model.get('country');
        this.goods = this.country.get('relevantGoods');
        this.changedGoods = this.model.get('goodsChangedThisTurn');
        this.citizens = this.model.get('citizens');
        this.producers = this.model.get('producers');

        this.render();
    }
});
var AdjustmentGameView = GameView.extend({
    render: function() {
        $(this.el).empty();
        $(this.el).append(ich.adjustTemplate(this.model.toJSON()));

        var controlsDiv = this.$('#controls');
        _(this.goods).each(function(good) {
            var tariff = this.country.tariffFor(good);
            var view = new TariffView({
                model: tariff,
                good: good,
                country: this.country
            });
            controlsDiv.append(view.render().el);
        }.bind(this));

        var moodDiv = this.$('#mood');
        moodDiv.append(new InterestGroupAverageView({model: this.citizens}).render().el);
        moodDiv.append(new InterestGroupAverageView({model: this.producers}).render().el);
        return this;
    }
});
var FeedbackGameView = GameView.extend({
    render: function() {
        $(this.el).empty();

        $(this.el).append(ich.feedbackTemplate(this.model.toJSON()));
        var feedbackDiv = this.$('#feedback');

        _(this.changedGoods).each(function(good) {
            var view = new InterestGroupGoodView({
                model: this.citizens, good: good});
            feedbackDiv.append(view.render().el);

            view = new InterestGroupGoodView({
                model: this.producers, good: good});
            feedbackDiv.append(view.render().el);
        }.bind(this));
        return this;
    }
});

var GameRouter = Backbone.Router.extend({
    routes: {
        'setup': 'setup',
        'adjust': 'adjust',
        'next': 'next',
        'feedback': 'feedback',
        'endgame': 'endgame'
    },
    setup: function() {
        TradeWar.game = new GameModel();
        this.navigate('adjust', true);
    },
    adjust: function() {
        new AdjustmentGameView({model: TradeWar.game});
    },
    next:  function() {
        TradeWar.game.trigger('nextTurn');
        this.navigate('feedback', true);
    },
    feedback:  function() {
        new FeedbackGameView({model: TradeWar.game});
    },
    endgame:  function() {
        console.log('endgame');
    },
});

$(function() {
    var router = new GameRouter();
    Backbone.history.start();
    router.navigate('setup', true);
});

