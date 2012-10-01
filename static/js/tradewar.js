var average = function(series) {
    series = _(series);
    var size = series.size();
    if (size == 0)
        return NaN;

    var total = series.reduce(function(memo, num) {
        return memo + num;
    }, 0);
    return total / size;
};
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

var GOODS = {
    TEA: new Good({name: 'tea', picture: 'static/img/tea.png'}),
    SHOES: new Good({name: 'shoes', picture: 'static/img/shoes.png'}),
    SOAP: new Good({name: 'soap', picture: 'static/img/soap.png'}),
    WATER: new Good({name: 'water', picture: 'static/img/water.png'}),
    CHICKEN: new Good({name: 'chicken', picture: 'static/img/chicken.png'}),
}

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
    getPercent: function(good) {
        return _(this.getData(good)).map(function(val) { return val * 100 });
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
    changedGoods: function(allGoods) {
        return _(allGoods).filter(function(good) {
            return this.changeIn(good) != 0;
        }.bind(this));
    },
    average: function(good) {
        var data = this.getData(good);
        var avg = average(data);
        return avg;
    }
});
var Tariff = Backbone.Model.extend({
    defaults: {
        rate: 0.0
    }
});

var TariffControlView = Backbone.View.extend({
    tagName: 'tr',
    className: 'tariff',

    initialize: function() {
        this.model.bind("change", this.tariffChanged, this);
    },
    tariffChanged: function() {
        var rate = this.model.get('rate')
        this.$('.tariffValue').text(this.formatRate(rate));

        var currentPrice = this.options.country.currentPriceFor(this.options.good);
        var currency = this.options.country.get('currency');
        this.$('.actualPriceValue').text(currentPrice.toFixed(2)  + ' ' + currency);

        var predictedPrice = this.options.country.predictedPriceFor(this.options.good);
        var currency = this.options.country.get('currency');
        this.$('.predictedPriceValue').text(predictedPrice.toFixed(2)  + ' ' + currency);
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
var TariffChangeView = Backbone.View.extend({
    tagName: 'div',
    className: 'tariffChange',
    render: function() {
        var historicPrices = this.options.country.historicPrices;
        var change = historicPrices.changeIn(this.options.good).toFixed(2);
        var attrs = {
            change: Math.abs(change),
            changeDir: (change < 0) ? 'reduced' : 'increased',
            currency: this.options.country.get('currency'),
            picture: this.options.good.get('picture'),
            goodName: this.options.good.get('name')
        };
        $(this.el).append(ich.tariffChangeTemplate(attrs));
        var graphDiv = this.$('.graph')[0];
        new Highcharts.Chart({
             chart: {
                renderTo: graphDiv,
                type: 'line',
                height: '200'
             },
             yAxis: {
                title: {
                   text: this.options.country.get('currency')
                }
             },
             title: {text: null},
             series: [{
                showInLegend: false,
                data: this.options.country.historicPrices.getData(this.options.good)
             }]
         });
        return this;
    }
});

var InterestGroup = Backbone.Model.extend({
    moodColours: [
        {lim: -0.35, value: 'redBackground'},
        {lim: -0.15, value: 'redBackground'},
        {lim: -0.09, value: 'orangeBackground'},
        {lim: -0.01, value: 'orangeBackground'},
        {lim: 0.05, value: 'neutralBackground'},
        {lim: 0.1, value: 'paleGreenBackground'},
        {lim: 0.2, value: 'greenBackground'},
        {lim: 100, value: 'greenBackground'}
    ],
    moodWords: [
        {lim: -0.35, value: 'apoplectic'},
        {lim: -0.15, value: 'angry'},
        {lim: -0.09, value: 'unhappy'},
        {lim: -0.01, value: 'grumbling'},
        {lim: 0.05, value: 'pleased'},
        {lim: 0.1, value: 'happy'},
        {lim: 0.2, value: 'thrilled'},
        {lim: 100, value: 'ecstatic'}
    ],
    initialize: function() {
        this.historicMoods = new HistoricDataByGood();
        this.recordHistory();
    },
    recordHistory: function () {
        this.get('country').goods.each(function(good) {
            this.historicMoods.record(good, this.moodFor(good));
        }.bind(this));
    },
    moodWord: function (moodValue) {
        return chooseByValue(this.moodWords, moodValue);
    },
    moodColourClass: function (moodValue) {
        return chooseByValue(this.moodColours, moodValue);
    },
    recentMoodChangeFor: function(good) {
        return this.historicMoods.changeIn(good);
    },
    recentPriceChangeFor: function(good) {
        var prices = this.get('country').historicPrices;
        return prices.changeIn(good);
    },
    expectedPriceOfConsumption: function(good) {
        var country = this.get('country');
        return (country.basePriceFor(good) *
                this.priceExpectationMultiplier);
    },
    actualPriceOfConsumption: function(good) {
        var country = this.get('country');
        return country.currentPriceFor(good);
    },
    percentDifferenceFromExpected: function(good) {
        var expected = this.expectedPriceOfConsumption(good);
        var actual = this.actualPriceOfConsumption(good);
        var diff = (actual - expected) / expected;
        return diff;
    },
    dampen: function(d) {
        return Math.sqrt(Math.abs(d));
    },
    averageMood: function() {
        var goods = this.get('country').goods;
        if (goods.size() < 0)
            return 0

        var total = goods.reduce(function(memo, good) {
            return memo + this.moodFor(good);
        }.bind(this), 0);
        return total / goods.size();
    }
});
var Citizens = InterestGroup.extend({
    priceExpectationMultiplier: 1.15,
    defaults: {
        'name': 'Citizens',
        'picture100': 'static/img/citizens100.png',
        'picture50': 'static/img/citizens50.png'
    },
    moodFor: function(good) {
        return -this.percentDifferenceFromExpected(good);
    },
    moodTextFor: function(good) {
        var priceChange = this.recentPriceChangeFor(good);
        var attrs = {
            mood: this.moodWord(this.recentMoodChangeFor(good)),
            goodName: good.get('name'),
            changeDir: (priceChange < 0) ? 'less': 'more',
        }
        var text = "We now pay {{ changeDir }} for {{ goodName }}! We're {{mood}}.";
        var text = Mustache.render(text, attrs);
        return text;
    }
});

var Producers = InterestGroup.extend({
    priceExpectationMultiplier: 1.17,
    defaults: {
        'name': 'Producers',
        'picture100': 'static/img/producers100.png',
        'picture50': 'static/img/producers50.png'
    },
    moodFor: function(good) {
        return this.percentDifferenceFromExpected(good);
    },
    moodTextFor: function(good) {
        var priceChange = this.recentPriceChangeFor(good);
        var attrs = {
            mood: this.moodWord(this.recentMoodChangeFor(good)),
            goodName: good.get('name'),
            changeDir: (priceChange > 0) ? 'less': 'more',
        }
        var text = "We now face {{ changeDir }} foreign competition on {{ goodName }}! We're {{mood}}.";
        var text = Mustache.render(text, attrs);
        return text;
    }
});

var Exporters = InterestGroup.extend({
    priceExpectationMultiplier: 1.10,
    name: 'exporters',
    defaults: {
        'name': 'Exporters',
        'picture100': 'static/img/exporters100.png',
        'picture50': 'static/img/exporters50.png'
    },
    moodFor: function(good) {
        return -this.percentDifferenceFromExpected(good);
    },
    moodTextFor: function(good) {
        var priceChange = this.recentPriceChangeFor(good);
        var rate = this.get('country').tariffFor(good).get('rate') * 100;
        var attrs = {
            rate: rate.toFixed(0),
            countryName: this.get('country').get('name'),
            mood: this.moodWord(this.recentMoodChangeFor(good)),
            goodName: good.get('name'),
            changeDir: (priceChange < 0) ? 'lower': 'higher',
        }
        var text = "We now pay a {{ changeDir }} tariff to sell {{ goodName }} in {{ countryName }}! We're {{mood}}.";
        var text = Mustache.render(text, attrs);
        return text;
    }
});
var InterestGroupAverageView = Backbone.View.extend({
    className: 'averageMood span3',
    render: function() {
        var moodValue = this.model.averageMood();

        var attrs = this.model.toJSON();
        attrs.mood = Mustache.render("Your {{ name }} are {{ moodWord }}",
            {name: this.model.get('name'), moodWord: this.model.moodWord(moodValue)});
        attrs.picture = this.model.get('picture50');

        $(this.el).append(ich.interestGroupMoodTemplate(attrs));
        this.$('img').addClass(this.model.moodColourClass(moodValue));
        return this;
    }
});
var InterestGroupGoodView = Backbone.View.extend({
    tagName: 'div',
    className: 'interestGroup row',
    render: function() {
        var attrs = this.model.toJSON();
        attrs.mood = this.model.moodTextFor(this.options.good);
        attrs.picture = this.model.get('picture100');
        $(this.el).append(ich.interestGroupGoodTemplate(attrs));

        var moodValue = this.model.recentMoodChangeFor(this.options.good);
        this.$('img').addClass(this.model.moodColourClass(moodValue));

        return this;
    }
});
var Country = Backbone.Model.extend({
    initialize: function() {
        this.historicPrices = new HistoricDataByGood();
        this.historicTariffs = new HistoricDataByGood();
        this.goods = _([]);
        this.set({basePrices: {}, sensitivities: {}, tariffs: {}});
        _(this.get('goodDescriptions')).each(function (desc) {
            var goodName = desc.good.get('name');
            this.goods.push(desc.good);
            this.get('basePrices')[goodName] = desc.basePrice;
            this.get('sensitivities')[goodName] = desc.sensitivity;
            this.get('tariffs')[goodName] = desc.tariff;
        }.bind(this));
        console.log(this.get('tariffs'));
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
    currentPriceFor: function(good) {
        return this.historicPrices.currentVal(good);
    },
    actualPriceFor: function(good) {
        // Assume the sensitivity changes randomly to in a range +/- 0.1
        var wobble = (Math.random() - 0.5) / 5;
        return this.calcPrice(good, wobble);
    },
    predictedPriceFor: function(good) {
        return this.calcPrice(good, 0);
    },
    calcPrice: function(good, wobble) {
        var sensitivity = this.sensitivityFor(good) + wobble;
        var tariff = this.tariffFor(good);
        var basePrice = this.basePriceFor(good);
        var rate = tariff.get('rate');
        return basePrice + (rate * basePrice * sensitivity);
    },
    recordHistory: function () {
        this.goods.each(function(good) {
            this.historicPrices.record(good, this.actualPriceFor(good));
            this.historicTariffs.record(good, this.tariffFor(good).get('rate'));
        }.bind(this));
    },
});

var TradingPartner = Country.extend({
    urgency: function(good) {
        var counterpartRate = this.get('counterpart').tariffFor(good).get('rate');
        var ourRate = this.tariffFor(good).get('rate');
        var diff = counterpartRate - ourRate;
        return diff * (Math.random() + 0.5);
    },
    alterTariffsInResponse: function () {
        this.goods.each(function(good) {
            var urgency = this.urgency(good);
            if (Math.abs(urgency) > 0.3) {
                this.alterTariff(good);
            }
        }.bind(this));
    },
    alterTariff: function (good, amount) {
        var tariff = this.tariffFor(good);
        tariff.set('rate', this.getResponseTariff(good));
    },
    getResponseTariff: function(good) {
        var counterpartRate = this.get('counterpart').tariffFor(good).get('rate');
        var wobble = (Math.random() - 0.5) / 2;
        var rate = counterpartRate + wobble;
        if (rate < 0)
            return 0;
        else
            return Math.min(counterpartRate + wobble, 1);
    }
});
var TradingPartnerResponseView = Backbone.View.extend({
    className: 'row partnerResponse',
    render: function () {
        var newTariff= this.model.historicTariffs.currentVal(this.options.good) * 100;
        var oldTariff= this.model.historicTariffs.previousVal(this.options.good) * 100;
        attrs = {
            newTariff: newTariff.toFixed(0) + "%",
            oldTariff: oldTariff.toFixed(0) + "%",
            countryName: this.model.get('name'),
            goodName: this.options.good.get('name'),
            picture: this.options.good.get('picture'),
            flag: this.model.get('flag50')
        }
        $(this.el).append(ich.responseTemplate(attrs));
        var exporterResponse = new InterestGroupGoodView({
            model: this.options.exporters,
            good: this.options.good
        }).render();
        this.$('.exporterResponse').append(exporterResponse.el);
        var graphDiv = this.$('.graph')[0];
        new Highcharts.Chart({
                 chart: {
                    renderTo: graphDiv,
                    type: 'line',
                    height: '200'
                 },
                 yAxis: {
                    title: {
                       text: '%'
                    }
                 },
                 title: {text: null},
                 series: [{
                    showInLegend: false,
                    data: this.model.historicTariffs.getPercent(this.options.good)
                 }]
              });
        return this;
    }
});

var INDIA = new Country({
    name: 'India',
    flag100: 'static/img/india100.png',
    flag50: 'static/img/india50.png',
    flag25: 'static/img/india25.png',
    currency: 'Rs',
    goodDescriptions: [
        {good: GOODS.TEA, sensitivity: 0.45, basePrice: 17.241379,
                tariff: new Tariff({rate: 1.0})},
        {good: GOODS.SOAP, sensitivity: 0.72, basePrice: 17.723880597014925,
                tariff: new Tariff({rate: 0.1})},
        {good: GOODS.WATER, sensitivity: 0.41, basePrice: 12.911843276936776,
                tariff: new Tariff({rate: 0.3})},
        {good: GOODS.SHOES, sensitivity: 0.4, basePrice: 1658.173076923076923,
                tariff: new Tariff({rate: 0.1})},
        {good: GOODS.CHICKEN, sensitivity: 0.31, basePrice: 107.502287282708143,
                tariff: new Tariff({rate: 0.3})}
    ]
});
CHINA = new TradingPartner({
    name: 'China',
    flag100: 'static/img/china100.png',
    flag50: 'static/img/china50.png',
    flag25: 'static/img/china25.png',
    currency: 'RMB',
    goodDescriptions: [
        {good: GOODS.TEA, sensitivity: 0.45, basePrice: 17.241379,
                tariff: new Tariff({rate: 0.65})},
        {good: GOODS.SOAP, sensitivity: 0.72, basePrice: 17.723880597014925,
                tariff: new Tariff({rate: 0.2})},
        {good: GOODS.WATER, sensitivity: 0.41, basePrice: 12.911843276936776,
                tariff: new Tariff({rate: 0.25})},
        {good: GOODS.SHOES, sensitivity: 0.4, basePrice: 1658.173076923076923,
                tariff: new Tariff({rate: 0.15})},
        {good: GOODS.CHICKEN, sensitivity: 0.31, basePrice: 107.502287282708143,
                tariff: new Tariff({rate: 0.1})}
    ]
});
INDIAN_CITIZENS = new Citizens({country: INDIA});
INDIAN_PRODUCERS = new Producers({country: INDIA});
INDIAN_EXPORTERS = new Exporters({country: CHINA});
CHINA.set('counterpart', INDIA);
var GameModel = Backbone.Model.extend({
    scoreWords: [
        {lim: -.2, value: 'detested'},
        {lim: -.05, value: 'disliked'},
        {lim: .05, value: 'tolerated'},
        {lim: .1, value: 'esteemed'},
        {lim: 10, value: 'beloved'}
    ],
    overallScoreWords: [
        {lim: -.2, value: 'dismayed'},
        {lim: -.05, value: 'unimpressed'},
        {lim: .05, value: 'somewhat pleased'},
        {lim: .1, value: 'happy'},
        {lim: 10, value: 'over the moon'}
    ],
    // Central event dispatcher and holder of game state
    defaults: {
        year: 2012,
        country: INDIA,
        partner: CHINA,
        goods: [GOODS.TEA],
        citizens: INDIAN_CITIZENS,
        producers: INDIAN_PRODUCERS,
        exporters: INDIAN_EXPORTERS
    },
    initialize: function() {
        this.on('playerTurnOver', this.advanceYear, this);
        this.on('gameOver', this.finalizeScores, this);

        var country = this.get('country');
        this.on('playerTurnOver', country.recordHistory, country);
        var citizens = this.get('citizens');
        this.on('playerTurnOver', citizens.recordHistory, citizens);
        var producers = this.get('producers');
        this.on('playerTurnOver', producers.recordHistory, producers);

        var partner = this.get('partner');
        this.on('compTurnStart', partner.alterTariffsInResponse, partner);
        this.on('compTurnOver', partner.recordHistory, partner);
        var exporters = this.get('exporters');
        this.on('compTurnOver', exporters.recordHistory, exporters);
    },
    advanceYear: function() {
        this.set('year', this.get('year') + 1);
    },
    score: function(name) {
        var moods = this.get(name).historicMoods;
        var averages = this.get('country').goods.map(function(good) {
            return moods.average(good);
        });
        return average(averages);
    },
    finalizeScores: function () {
        this.set('citizensScore', this.score('citizens'));
        this.set('citizensScoreWord',
                chooseByValue(this.scoreWords, this.get('citizensScore')));

        this.set('producersScore', this.score('producers'));
        this.set('producersScoreWord',
                chooseByValue(this.scoreWords, this.get('producersScore')));

        this.set('exportersScore', this.score('exporters'));
        this.set('exportersScoreWord',
                chooseByValue(this.scoreWords, this.get('exportersScore')));

        this.set('overall', average([
            this.get('citizensScore'),
            this.get('exportersScore'),
            this.get('producersScore')
        ]));
        this.set('overallWord', chooseByValue(this.overallScoreWords, this.get('overall')));

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
var EndGameView = GameView.extend({
    render: function() {
        $(this.el).empty();
        attrs = this.model.toJSON();
        attrs.countryPicture = this.country.get('flag100');
        attrs.countryName = this.country.get('name');
        $(this.el).append(ich.endGameTemplate(attrs));
        return this;
    }
});
var IntroGameView = GameView.extend({
    render: function() {
        $(this.el).empty();
        attrs = this.model.toJSON();
        attrs.countryPicture = this.country.get('flag100');
        attrs.countryName = this.country.get('name');
        attrs.partnerPicture = this.partner.get('flag100');
        attrs.partnerName = this.partner.get('name');
        var template = this.options.template;
        $(this.el).append(ich[template](attrs));
        return this;
    }
});
var AdjustmentGameView = GameView.extend({
    render: function() {
        $(this.el).empty();
        attrs = this.model.toJSON();
        attrs.countryPicture = this.country.get('flag25');
        attrs.countryName = this.country.get('name');
        attrs.partnerPicture = this.partner.get('flag25');
        attrs.partnerName = this.partner.get('name');
        $(this.el).append(ich.adjustTemplate(attrs));

        var controlsDiv = this.$('#controls');
        this.country.goods.each(function(good) {
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
        var feedbackDiv = this.$('#domesticFeedback');
        var partnerFeedbackDiv = this.$('#partnerFeedback');

        var partnerChangedGoods = this.partner.historicTariffs.changedGoods(
            this.partner.goods);
        _(partnerChangedGoods).each(function(good) {
            var view = new TradingPartnerResponseView({
                model: this.partner, good: good, exporters: this.exporters});
            partnerFeedbackDiv.append(view.render().el);
        }.bind(this));

        var changedGoods = this.country.historicTariffs.changedGoods(
            this.country.goods);
        _(changedGoods).each(function(good) {
            var tariffChangeView = new TariffChangeView({
                tariff: this.country.tariffFor(good),
                country: this.country,
                good: good
            }).render();

            var div = tariffChangeView.$('.interestGroupFeedback');
            var view = new InterestGroupGoodView({
                model: this.citizens, good: good});
            div.append(view.render().el);

            view = new InterestGroupGoodView({
                model: this.producers, good: good});
            div.append(view.render().el);

            feedbackDiv.append(tariffChangeView.el);
        }.bind(this));
        if (changedGoods.length == 0 && partnerChangedGoods.length == 0) {
            feedbackDiv.text(" You didn't make any changes. Yawn." );
        }
        return this;
    }
});

var GameRouter = Backbone.Router.extend({
    routes: {
        'countryIntro': 'countryIntro',
        'partnerIntro': 'partnerIntro',
        'adjust': 'adjust',
        'next': 'next',
        'feedback': 'feedback',
        'endgame': 'endgame'
    },
    initialize: function(options) {
        this.game = this.options.game;
    },
    countryIntro: function() {
        new IntroGameView({
            model: this.options.game,
            template: 'countryIntroTemplate'
        });
    },
    partnerIntro: function() {
        new IntroGameView({
            model: this.options.game,
            template: 'partnerIntroTemplate'
        });
    },
    adjust: function() {
        this.options.game.trigger('playerTurnStart');
        new AdjustmentGameView({model: this.options.game});
    },
    next:  function() {
        this.options.game.trigger('playerTurnOver');
        this.options.game.trigger('compTurnStart');
        if (this.options.game.get('year') == 2022)
            this.navigate('endgame', true);
        else
            this.navigate('feedback', true);
    },
    feedback:  function() {
        this.options.game.trigger('compTurnOver');
        new FeedbackGameView({model: this.options.game});
    },
    endgame:  function() {
        this.options.game.trigger('gameOver');
        new EndGameView({model: this.options.game});
    },
});
