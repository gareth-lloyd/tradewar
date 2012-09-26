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

    moodFor: function(good) {
        var diff = this.differenceFromExpected(good);
        var damped = this.dampen(diff);
        return (diff < 0) ? -damped : damped;
    }
});
var Business = InterestGroup.extend({
    priceExpectationMultiplier: 1.3,

    moodFor: function(good) {
        var diff = this.differenceFromExpected(good);
        var damped = this.dampen(diff);
        return (diff > 0) ? -damped : damped;
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

var TEA = new Good({name: 'tea'});
var ALL_GOODS = [TEA];
var INDIA = new Country({
    name: 'India',
    tariffs: {tea: new Tariff({rate: 1.0})},
    sensitivities: {tea: 1.0},
    basePrices: {tea: 1},
    demands: {tea: 1}
});
var INDIANS = new Citizens({country: INDIA});
var INDIAN_BUSINESS = new Business({country: INDIA});

$(function() {
    controls = $('#controls');
    _(ALL_GOODS).map(function(good) {
        var tariff = INDIA.tariffFor(good);
        controls.append(new TariffView({model: tariff}).render().el);
    });
});
