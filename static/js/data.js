// There are five goods that are subject to trade policy in this
// scenario.
var GOODS = {
    TEA: new Good({name: 'tea', picture: 'static/img/tea.png'}),
    SHOES: new Good({name: 'shoes', picture: 'static/img/shoes.png'}),
    SOAP: new Good({name: 'soap', picture: 'static/img/soap.png'}),
    WATER: new Good({name: 'water', picture: 'static/img/water.png'}),
    CHICKEN: new Good({name: 'chicken', picture: 'static/img/chicken.png'}),
}

var INDIA = new Country({
    name: 'India',
    description: "India is a rapidly developing economy. They follow a mixed trade policy," +
        " with some goods subject to large import duties. India's major trading partner is China.",
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
    counterpart: INDIA,
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

var CANADA = new Country({
    name: 'Canada',
    description: "Canada is a modern, efficient economy. Canada follows free trade policies, " +
        "with a low tariff levels across the board. Canada's main trading partner is the USA.",
    flag100: 'static/img/canada100.png',
    flag50: 'static/img/canada50.png',
    flag25: 'static/img/canada25.png',
    currency: 'dollars',
    goodDescriptions: [
        {good: GOODS.TEA, sensitivity: 0.5, basePrice: 1.77,
                tariff: new Tariff({rate: 0})},
        {good: GOODS.SOAP, sensitivity: 0.2, basePrice: 1.2,
                tariff: new Tariff({rate: 0.0325})},
        {good: GOODS.WATER, sensitivity: 0.2, basePrice: 2.5,
                tariff: new Tariff({rate: 0.11})},
        {good: GOODS.SHOES, sensitivity: 0.2, basePrice: 170,
                tariff: new Tariff({rate: 0.18})},
        {good: GOODS.CHICKEN, sensitivity: 0.2, basePrice: 5.5,
                tariff: new Tariff({rate: 0.08})}
    ]
});
USA = new TradingPartner({
    counterpart: CANADA,
    name: 'America',
    flag100: 'static/img/america100.png',
    flag50: 'static/img/america50.png',
    flag25: 'static/img/america25.png',
    currency: 'dollars',
    goodDescriptions: [
        {good: GOODS.TEA, sensitivity: 0.5, basePrice: 1.77,
                tariff: new Tariff({rate: 0})},
        {good: GOODS.SOAP, sensitivity: 0.2, basePrice: 1.2,
                tariff: new Tariff({rate: 0.0325})},
        {good: GOODS.WATER, sensitivity: 0.2, basePrice: 2.5,
                tariff: new Tariff({rate: 0.3})},
        {good: GOODS.SHOES, sensitivity: 0.2, basePrice: 170,
                tariff: new Tariff({rate: 0.5})},
        {good: GOODS.CHICKEN, sensitivity: 0.2, basePrice: 5.5,
                tariff: new Tariff({rate: 0.08})}
    ]
});

var NIGERIA = new Country({
    name: 'Nigeria',
    description: "Nigeria is one of the fastest growing economies of Africa, partly due to " + 
        "its significant oil reserves. It has generally moderate tariffs.",
    flag100: 'static/img/nigeria100.png',
    flag50: 'static/img/nigeria50.png',
    flag25: 'static/img/nigeria25.png',
    currency: 'nairas',
    goodDescriptions: [
        {good: GOODS.TEA, sensitivity: 0.5, basePrice: 1.77,
                tariff: new Tariff({rate: 0.1})},
        {good: GOODS.SOAP, sensitivity: 0.2, basePrice: 1.2,
                tariff: new Tariff({rate: 0.2})},
        {good: GOODS.WATER, sensitivity: 0.2, basePrice: 2.5,
                tariff: new Tariff({rate: 0.2})},
        {good: GOODS.SHOES, sensitivity: 0.2, basePrice: 170,
                tariff: new Tariff({rate: 0.15})},
        {good: GOODS.CHICKEN, sensitivity: 0.2, basePrice: 5.5,
                tariff: new Tariff({rate: 0.2})}
    ]
});
UK = new TradingPartner({
    counterpart: NIGERIA,
    name: 'United Kingdom',
    flag100: 'static/img/uk100.png',
    flag50: 'static/img/uk50.png',
    flag25: 'static/img/uk25.png',
    currency: 'pounds',
    goodDescriptions: [
        {good: GOODS.TEA, sensitivity: 0.5, basePrice: 1.77,
                tariff: new Tariff({rate: 0})},
        {good: GOODS.SOAP, sensitivity: 0.2, basePrice: 1.2,
                tariff: new Tariff({rate: 0.0325})},
        {good: GOODS.WATER, sensitivity: 0.2, basePrice: 2.5,
                tariff: new Tariff({rate: 0.3})},
        {good: GOODS.SHOES, sensitivity: 0.2, basePrice: 170,
                tariff: new Tariff({rate: 0.5})},
        {good: GOODS.CHICKEN, sensitivity: 0.2, basePrice: 5.5,
                tariff: new Tariff({rate: 0.08})}
    ]
});

var COUNTRIES = {
    'India': INDIA,
    'Canada': CANADA,
    'Nigeria': NIGERIA
};
var PARTNERS = {
    'India': CHINA,
    'Canada': USA,
    'Nigeria': UK
};
