
var Good = Backbone.Model.extend({
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
        this.$('.value').text(rate + "%");
    },
    sliderMoved: function(event, ui) {
        this.model.set('rate', ui.value);
    },
    render: function() {
        $(this.el).append(ich.tariffTemplate());
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
    expectedPriceFor: function(good) {
        var country = this.get('country');
        return country.basePriceFor(good) * this.priceExpectationMultiplier;
    },
    differenceFromExpected: function(good) {
        var country = this.get('country');
        return this.expectedPriceFor(good) - country.actualPriceFor(good);
    },
    dampen: function(d) {
        return Math.sqrt(Math.abs(d));
    }
});

var Citizens = InterestGroup.extend({
    priceExpectationMultiplier: 1.1,
    name: 'citizens',

    moodFor: function(good) {
        var diff = this.differenceFromExpected(good);
        var damped = this.dampen(diff);
        return (diff < 0) ? -damped : damped;
    }
});

var Producers = InterestGroup.extend({
    priceExpectationMultiplier: 1.3,
    name: 'producers',

    moodFor: function(good) {
        var diff = this.differenceFromExpected(good);
        var damped = this.dampen(diff);
        return (diff > 0) ? -damped : damped;
    }
});

var Exporters = InterestGroup.extend({
    priceExpectationMultiplier: 1.3,
    name: 'exporters',

    moodFor: function(good) {
        var diff = this.differenceFromExpected(good);
        var damped = this.dampen(diff);
        return (diff > 0) ? -damped : damped;
    }
});

var InterestGroupGoodView = Backbone.View.extend({
    tagName: 'div',
    className: 'interestGroup',
    render: function() {
        var attrs = this.model.toJSON();
        attrs.mood = this.model.moodFor(this.options.good);
        attrs.name = this.model.name;
        attrs.good = this.options.good.get('name');
        $(this.el).append(ich.interestGroupTemplate(attrs));
        return this;
    }
});
var Country = Backbone.Model.extend({
    defaults: {
        tariffs: {},
        sensitivities: {},
        basePrices: {},
        demands: {}
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
        return basePrice + ((rate * basePrice) * sensitivity);
    }
});


var TradeWar = {
    TEA: new Good({name: 'tea'}),
    INDIA: new Country({
        name: 'India',
        tariffs: {tea: new Tariff({rate: 1.0})},
        sensitivities: {tea: 1.0},
        basePrices: {tea: 1},
        demands: {tea: 1}
    }),
}
TradeWar.ALL_GOODS = [TradeWar.TEA];
TradeWar.INDIAN_CITIZENS = new Citizens({country: TradeWar.INDIA});
TradeWar.INDIAN_PRODUCERS = new Producers({country: TradeWar.INDIA});
TradeWar.INDIAN_EXPORTERS = new Exporters({country: TradeWar.INDIA});
var GameModel = Backbone.Model.extend({
    defaults: {
        country: TradeWar.INDIA,
        goods: [TradeWar.TEA],
        citizens: TradeWar.INDIAN_CITIZENS,
        producers: TradeWar.INDIAN_PRODUCERS
    }
});
var GameView = Backbone.View.extend({
    el: '#game',

    initialize: function(options) {
        this.render();
    }
});
var AdjustmentGameView = GameView.extend({
    render: function() {
        $(this.el).empty();

        var controls = [];
        var goods = this.model.get('goods');
        var country = this.model.get('country');
        _(goods).map(function(good) {
            var tariff = country.tariffFor(good);
            controls.push(new TariffView({model: tariff}).render().el);
        }.bind(this));

        $(this.el).append(ich.adjustTemplate());
        this.controlsDiv = this.$('#controls');
        this.controlsDiv.append(controls);
        return this;
    }
});
var FeedbackGameView = GameView.extend({
    render: function() {
        $(this.el).empty();

        $(this.el).append(ich.feedbackTemplate());
        var feedbackDiv = this.$('#feedback');
        var goods = this.model.get('goods');
        var citizens = this.model.get('citizens');
        var producers = this.model.get('producers');
        _(goods).each(function(good) {
            var view = new InterestGroupGoodView({
                model: citizens,
                good: good});
            feedbackDiv.append(view.render().el);

            view = new InterestGroupGoodView({
                model: producers,
                good: good});
            feedbackDiv.append(view.render().el);
        });
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
        console.log('next');
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

