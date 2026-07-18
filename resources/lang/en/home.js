// Homepage-specific UI strings
module.exports = {
    meta: {title: 'Huong Sơn entertaimain — Italian furniture design'},
    hero: [
        {badge: 'Danish design', title: 'End Season Sale: Now On'},
        {badge: 'New collection', title: 'Modern Living Spaces'},
        {badge: 'Bedroom', title: 'Rest, Redefined'},
    ],
    why: {
        title: 'Why 230,000 businesses build their store with us?',
        items: [
            {title: 'Boost brand trust', desc: 'A professional storefront that impresses and earns customer trust.'},
            {title: 'Reach more customers', desc: 'Sell anytime, anywhere — no time or geography limits.'},
            {title: 'Save time & cost', desc: 'Centralized product/order management, automated operations.'},
            {title: 'Higher conversion', desc: 'A smooth shopping journey that turns visits into orders.'},
        ],
    },
    categories: {title: 'Product categories', sub: 'Our furniture across Europe for the last 40 years.'},
    // "Style advice" image grid — text is HARDCODED per spec, not admin-editable.
    // Still lives in the lang files (not inline in the .ejs) so VI gets a translation.
    gallery: {
        title: 'Style advice. Buying guides. Expert tips.',
        sub: 'Everything you need to feel confident finding furniture that fits your style and space.',
    },
    // Defaults used when the matching field is left blank in /admin/content
    news: {
        title: 'Trends of the season',
        sub: 'Every season brings new inspiration for the home. Explore the trends shaping modern interiors, from expressive colour palettes to warm, contemporary design.',
        cta: 'Explore trends',
    },
    partners: {title: 'Our partners', sub: 'Our Partners'},
    featured: {title: 'Featured products', sub: 'HOME FURNITURE', productsWord: 'products'},
    certs: {
        title: 'Company certificates',
        items: [{title: 'Business license'}, {title: 'Quality certificate'}, {title: 'Certificate of origin'}],
    },
};
