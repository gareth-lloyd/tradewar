var CountryChoiceView = Backbone.View.extend({
    el: '#game',
    initialize: function(options) {
        this.render();
    },
    render: function() {
        $(this.el).empty();
        attrs = {
            countries: _(COUNTRIES).values().map(function(country) {
                return {
                    name: country.get('name'),
                    flag: country.get('flag50'),
                    description: country.get('description')
                };
            })
        };
        $(this.el).append(ich.countryChoiceTemplate(attrs));
    }
});

var GameRouter = Backbone.Router.extend({
    routes: {
        'gameIntro': 'gameIntro',
        'countryIntro/:country': 'countryIntro',
        'partnerIntro': 'partnerIntro',
        'adjust': 'adjust',
        'next': 'next',
        'feedback': 'feedback',
        'endgame': 'endgame'
    },
    initialize: function(options) {
        this.game = options.game;
    },
    gameIntro: function() {
        new CountryChoiceView({
            model: this.game,
        });
    },
    countryIntro: function(countryName) {
        var country = COUNTRIES[countryName];
        var partner = PARTNERS[countryName];
        this.game.setUpGame(country, partner);

        new IntroGameView({
            model: this.game,
            template: 'countryIntroTemplate'
        });
    },
    partnerIntro: function() {
        new IntroGameView({
            model: this.game,
            template: 'partnerIntroTemplate'
        });
    },
    adjust: function() {
        this.game.trigger('playerTurnStart');
        new AdjustmentGameView({model: this.game});
    },
    next:  function() {
        this.game.trigger('playerTurnOver');
        this.game.trigger('compTurnStart');
        if (this.game.get('year') == 2022)
            this.navigate('endgame', true);
        else
            this.navigate('feedback', true);
    },
    feedback:  function() {
        this.game.trigger('compTurnOver');
        new FeedbackGameView({model: this.game});
    },
    endgame:  function() {
        this.game.trigger('gameOver');
        new EndGameView({model: this.game});
    },
});
