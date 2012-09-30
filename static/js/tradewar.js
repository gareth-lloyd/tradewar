var chooseByValue = function (possibleValues, value) {
    for (i = 0; i < possibleValues.length; i++) {
        var valueObj = possibleValues[i];
        if (valueObj.lim >= value)
            return valueObj.value
    }
    return valueObj.value;
};
var Good = Backbone.Model.extend({
    defaults: {
        picture: 'static/img/good.png'
    },
    nameCapital: function () {
        var name = this.get('name');
        return name.substr(0, 1).toUpperCase() + name.substr(1);
    }
});

var Tariff = Backbone.Model.extend({
    defaults: {
        rate: 0.0
    }
});

var TariffControlView = Backbone.View.extend({
    tagName: 'div',
    className: 'tariff',

    initialize: function() {
        this.model.bind("change", this.tariffChanged, this);
    },
    tariffChanged: function() {
        var rate = this.model.get('rate')
        this.$('.tariffValue').text(this.formatRate(rate));

        var price = this.options.country.actualPriceFor(this.options.good);
        var currency = this.options.country.get('currency');
        this.$('.priceValue').text(price.toFixed(2)  + ' ' + currency);
    },
    sliderMoved: function(event, ui) {
        this.model.set('rate', ui.value);
    },
    formatRate: function(rate) {
        rate *= 100;
        return rate.toFixed(0) + "%";
    },
    render: function() {
        var attrs = this.model.toJSON();
        attrs.nameCapital = this.options.good.nameCapital();
        attrs.picture = this.options.good.get('picture');
        var partnerRate = this.options.partnerTariff.get('rate');
        attrs.partnerRate = this.formatRate(partnerRate);
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
    moodColours: [
        {lim: -0.5, value: 'redBackground'},
        {lim: -0.2, value: 'orangeBackground'},
        {lim: 0, value: 'neutralBackground'},
        {lim: 0.2, value: 'paleGreenBackground'},
        {lim: 100, value: 'greenBackground'}
    ],
    moodWords: [
        {lim: -0.5, value: 'apoplectic'},
        {lim: -0.3, value: 'angry'},
        {lim: -0.2, value: 'unhappy'},
        {lim: 0, value: 'miffed'},
        {lim: 0.1, value: 'pleased'},
        {lim: 0.2, value: 'thrilled'},
        {lim: 100, value: 'ecstatic'}
    ],
    initialize: function() {
        this.historicMoods = new HistoricDataByGood();
        this.recordHistory();
    },
    recordHistory: function () {
        _(TradeWar.ALL_GOODS).each(function(good) {
            this.historicMoods.record(good, this.moodFor(good));
        }.bind(this));
    },
    moodWord: function (moodValue) {
        return chooseByValue(this.moodWords, moodValue);
    },
    moodColourClass: function (moodValue) {
        return chooseByValue(this.moodColours, moodValue);
    },
    expectedPriceOfConsumption: function(good) {
        var country = this.get('country');
        return (country.basePriceFor(good) * country.demandFor(good) *
            this.priceExpectationMultiplier);
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
    recentPriceChangeFor: function(good) {
        var prices = TradeWar.game.get('historicPrices');
        return prices.changeIn(good);
    },
    dampen: function(d) {
        return Math.sqrt(Math.abs(d));
    },
    averageMood: function() {
        var goods = _(TradeWar.ALL_GOODS);
        if (goods.size() < 0)
            return 0

        var total = goods.reduce(function(memo, good) {
            return memo + this.moodFor(good);
        }.bind(this), 0);
        return total / goods.size();
    },
    moodTextFor: function(good) {
        var priceChange = this.recentPriceChangeFor(good);
        var attrs = {
            mood: this.moodWord(this.moodChange(good)),
            priceChange: Math.abs(priceChange.toFixed(2)),
            goodName: good.get('name'),
            changeDir: (priceChange < 0) ? 'reduced': 'increased',
            currency: this.get('country').get('currency')
        }
        var text = "We are {{ mood }} that the price of " +
                "{{ goodName }} has {{ changeDir }} by {{ priceChange }} " +
                "{{ currency }}.";
        var text = Mustache.render(text, attrs);
        return text;
    }
});
var Citizens = InterestGroup.extend({
    priceExpectationMultiplier: 1.1,
    defaults: {
        'name': 'Citizens',
        'picture': 'static/img/citizens.png'
    },
    moodChange: function(good) {
        return TradeWar.game.get('historicCitizenMoods').changeIn(good);
    },
    moodFor: function(good) {
        return -this.percentDifferenceFromExpected(good);
    }
});

var Producers = InterestGroup.extend({
    priceExpectationMultiplier: 1.3,
    defaults: {
        'name': 'Producers',
        'picture': 'static/img/producers.png'
    },
    moodChange: function(good) {
        return TradeWar.game.get('historicProducerMoods').changeIn(good);
    },
    moodFor: function(good) {
        return this.percentDifferenceFromExpected(good);
    }
});

var Exporters = InterestGroup.extend({
    priceExpectationMultiplier: 1.3,
    name: 'exporters',
    defaults: {
        'name': 'Exporters',
        'picture': 'static/img/exporters.png'
    },
    moodChange: function(good) {
        return TradeWar.game.get('historicExporterMoods').changeIn(good);
    },
    moodFor: function(good) {
        var diff = -this.percentDifferenceFromExpected(good);
    }
});
var InterestGroupAverageView = Backbone.View.extend({
    className: 'averageMood span3',
    render: function() {
        var moodValue = this.model.averageMood();

        var attrs = this.model.toJSON();
        attrs.mood = Mustache.render("{{ name }} are {{ moodWord }}",
            {name: this.model.get('name'), moodWord: this.model.moodWord(moodValue)});

        $(this.el).append(ich.interestGroupMoodTemplate(attrs));
        $(this.el).addClass(this.model.moodColourClass(moodValue));
        console.log(this.model.get('name'), moodValue);
        return this;
    }
});
var InterestGroupGoodView = Backbone.View.extend({
    tagName: 'div',
    className: 'interestGroup well',
    render: function() {
        var attrs = this.model.toJSON();
        attrs.mood = this.model.moodTextFor(this.options.good);
        $(this.el).append(ich.interestGroupGoodTemplate(attrs));

        var moodValue = this.model.moodChange(this.options.good);
        $(this.el).addClass(this.model.moodColourClass(moodValue));
        return this;
    }
});
var Country = Backbone.Model.extend({
    initialize: function() {
        this.historicPrices = new HistoricDataByGood();
        this.historicTariffs = new HistoricDataByGood();
        this.recordHistory();
    },
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
        return basePrice + (rate * basePrice * sensitivity);
    },
    recordHistory: function () {
        _(TradeWar.ALL_GOODS).each(function(good) {
            this.historicPrices.record(good, this..actualPriceFor(good));
            this.historicTariffs.record(good, this.tariffFor(good).get('rate'));
        }.bind(this));
    }
});

var TradingPartner = Country.extend({
    urgency: function(good) {
        var counterpartRate = this.get('counterpart').tariffFor(good).get('rate');
        var ourRate = this.tariffFor(good).get('rate');
        var diff = counterpartRate - ourRate;
        return diff * (Math.random() + 0.5));
    },
    alterTariffsInResponse: function () {
        var goods = _(TradeWar.ALL_GOODS);
        goods.each(function(good) {
            var urgency = this.urgency(good);
            if (Math.abs(urgency) > 0.5) {
                this.alterTariff(good);
            }
        }.bind(this));
    },
    alterTariff: function (good, amount) {
        var tariff = this.tariffFor(good);
        tarriff.set('rate', this.getResponseTariff(good));
    },
    getResponseTariff: function(good) {
        var counterpartRate = this.get('counterpart').tariffFor(good);
        var wobble = (Math.Random() - 0.5) / 2;
        return Math.min(counterpartRate + wobble, 1);
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
        flag: '',
       'currency': 'INR',
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
          'shoes': 0.4,
        },
        'basePrices': {
          'tea': 17.241379,
          'soap': 17.723880597014925,
          'water': 12.911843276936776,
          'chicken': 107.502287282708143,
          'shoes': 1658.173076923076923
        },
        'demands': {
          'tea': 1.0,
          'chicken': 1.0,
          'soap': 1.0,
          'water': 1.0,
          'shoes': 1.0
       }
    }),
    CHINA: new TradingPartner({
        name: 'China',
        flag: '',
       'currency': 'RMB',
        'tariffs': {
          'tea': new Tariff({rate: 0.9}),
          'soap': new Tariff({rate: 0.2}),
          'water': new Tariff({rate: 0.2}),
          'chicken': new Tariff({rate: 0.4}),
          'shoes': new Tariff({rate: 0.05})
        },
        'sensitivities': {
          'tea': 0.45,
          'chicken': 0.31,
          'soap': 0.72,
          'water': 0.41,
          'shoes': 0.4,
        },
        'basePrices': {
          'tea': 17.241379,
          'soap': 17.723880597014925,
          'water': 12.911843276936776,
          'chicken': 107.502287282708143,
          'shoes': 1658.173076923076923
        },
        'demands': {
          'tea': 1.0,
          'chicken': 1.0,
          'soap': 1.0,
          'water': 1.0,
          'shoes': 1.0
       }
    })
}
TradeWar.ALL_GOODS = [TradeWar.TEA, TradeWar.SOAP, TradeWar.WATER,
    TradeWar.CHICKEN, TradeWar.SHOES];
TradeWar.INDIAN_CITIZENS = new Citizens({country: TradeWar.INDIA});
TradeWar.INDIAN_PRODUCERS = new Producers({country: TradeWar.INDIA});
TradeWar.CHINA.set('counterpart', TradeWar.INDIA);

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
    currentVal: function(good) {
        var data = this.getData(good);
        if (data.length)
            return data[data.length - 1]
    },
    previousVal: function(good) {
        var data = this.getData(good);
        if (data.length > 1)
            return data[data.length - 2]
    },
    changeIn: function(good) {
        var currentVal = this.currentVal(good);
        var lastVal = this.previousVal(good);
        return currentVal - lastVal;
    },
    percentageChange: function(good) {
        var currentVal = this.currentVal(good);
        var lastVal = this.previousVal(good);
        return (currentVal - lastVal) / lastVal;
    },
});
var GameModel = Backbone.Model.extend({
    // Central event dispatcher and holder of game state
    defaults: {
        year: 1990,
        country: TradeWar.INDIA,
        partner: TradeWar.CHINA,
        goods: [TradeWar.TEA],
        citizens: TradeWar.INDIAN_CITIZENS,
        producers: TradeWar.INDIAN_PRODUCERS,
        exporters: new Exporters({country: TradeWar.CHINA})
    },
    initialize: function() {
        this.on('playerTurnOver', this.advanceYear, this);

        var country = this.get('country');
        this.on('playerTurnOver', country.recordHistory, country);
        var citizens = this.get('citizens');
        this.on('playerTurnOver', citizens.recordHistory, citizens);
        var producers = this.get('producers');
        this.on('playerTurnOver', producers.recordHistory, producers);
        var exporters = this.get('exporters');
        this.on('playerTurnOver', exporters.recordHistory, exporters);

        var partner = this.get('partner');
        this.on('compTurnStart', partner.alterTariffsInResponse, partner);
        this.on('compTurnOver', partner.recordHistory, partner);
    },
    advanceYear: function() {
        this.set('year', this.get('year') + 1);
    }
});
var GameView = Backbone.View.extend({
    el: '#game',

    initialize: function(options) {
        this.country = this.model.get('country');
        this.partner = this.model.get('partner');
        this.citizens = this.model.get('citizens');
        this.producers = this.model.get('producers');
        this.exporters = this.model.get('exporters');
        this.render();
    }
});
var AdjustmentGameView = GameView.extend({
    render: function() {
        $(this.el).empty();
        $(this.el).append(ich.adjustTemplate(this.model.toJSON()));

        var controlsDiv = this.$('#controls');
        _(TradeWar.ALL_GOODS).each(function(good) {
            var ourTariff = this.country.tariffFor(good);
            var partnerTariff = this.partner.tariffFor(good);
            var view = new TariffControlView({
                model: ourTariff,
                partnerTariff: partnerTariff,
                good: good,
                country: this.country
            });
            controlsDiv.append(view.render().el);
        }.bind(this));

        var moodDiv = this.$('#mood');
        moodDiv.append(new InterestGroupAverageView({model: this.citizens}).render().el);
        moodDiv.append(new InterestGroupAverageView({model: this.producers}).render().el);
        moodDiv.append(new InterestGroupAverageView({model: this.exporters}).render().el);
        return this;
    }
});
var FeedbackGameView = GameView.extend({
    render: function() {
        $(this.el).empty();

        $(this.el).append(ich.feedbackTemplate(this.model.toJSON()));
        var feedbackDiv = this.$('#feedback');

        _(this.).each(function(good) {
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
        this.navigate('adjust', true);
    },
    adjust: function() {
        new AdjustmentGameView({model: TradeWar.game});
    },
    next:  function() {
        TradeWar.game.trigger('playerTurnOver');
        TradeWar.game.trigger('compTurnStart');
        TradeWar.game.trigger('compTurnOver');
        this.navigate('feedback', true);
    },
    feedback:  function() {
        new FeedbackGameView({model: TradeWar.game});
    },
    endgame:  function() {
    },
});

$(function() {
    TradeWar.game = new GameModel();
    var router = new GameRouter();
    Backbone.history.start();
    router.navigate('setup', true);
});

