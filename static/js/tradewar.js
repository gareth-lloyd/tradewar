var Good = Backbone.Model.extend({
    defaults: {
        basePrice: 1.0
    }
});

var TEA = new Good({name: 'tea', basePrice: 2.0});
var ALL_GOODS = [TEA];

var Tariff = Backbone.Model.extend({
    defaults: {
        rate: 0.0
    }
});
var TariffControlView = Backbone.View.extend({
    tagName: 'div',
    className: 'tariff',

    render: function() {
        $(this.el).append(ich.tariff(this.model.toJSON()));
        $(this.$('.slider')[0].slider());
        return this;
    }
});

var Country = Backbone.Model.extend({
    defaults: {
        tariffs: {},
        sensitivities: {}
    },

    initialize: function() {
    },

    sensitivityForGood: function(good) {
        var sensitivities = this.get('sensitivities');
        var sensitivity = sensitivities[good];
        if (sensitivity === undefined) {
            sensitivity = 1.0;
            sensitivities[good] = sensitivity;
        }
        return sensitivity;
    },

    tariffForGood: function(good) {
        var tariffs = this.get('tariffs');
        var tariff = tariffs[good];
        if (tariff === undefined) {
            tariff = new Tariff();
            tariffs[good] = tariff;
        }
        return tariff;
    },

    domesticPrice: function(good) {
        var sensitivity = this.sensitivityForGood(good);
        var tariff = this.tariffForGood(good);
        var rate = tariff.get('rate');
        var basePrice = good.get('basePrice');
        return basePrice + ((rate * basePrice) * sensitivity);
    }
});

$(function() {
    controls = $('#controls');
    var india = new Country({name: 'India'});

    controls.append(_(ALL_GOODS).map(function(good) {
        var tariff = india.tariffForGood(good);
        return new TariffControlView({model: tariff}).render().el;
    }));
});
