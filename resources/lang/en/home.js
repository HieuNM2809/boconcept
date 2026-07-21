// Homepage-specific UI strings
module.exports = {
    meta: {title: 'Huong Sơn entertaimain — Italian furniture design'},
    // Brand name is NOT translated — kept identical to vi/home.js on purpose.
    hero: {brand: 'HƯƠNG SƠN ENTERTAIMAIN'},
    // Company intro strip — heading + a single centered paragraph.
    // FALLBACK ONLY: the live copy comes from the `about` system page in the DB
    // (title_* + excerpt_*, edited at /admin/pages). These two strings show only
    // when that row is missing, hidden, or blank — editing here does NOT change
    // what the site currently renders.
    why: {
        title: 'We Specialize in Furniture and Pottery Planter',
        body: 'Huong Son International Co., Ltd. is a Vietnam-based manufacturer and exporter specializing in furniture and ceramic pottery. We are committed to delivering high-quality products that combine excellent craftsmanship, modern design, and lasting durability. Serving customers worldwide, we offer reliable manufacturing, strict quality control, and professional export services to meet the diverse needs of global markets. Our mission is to provide value-driven products while building long-term partnerships based on trust, quality, and sustainability.',
    },
    categories: {
        title: 'Quality You Can See, Comfort You Can Feel.',
        sub: 'We blend natural materials, expert craftsmanship, and thoughtful design to create furniture that enhances the way you live.',
    },
    // "Style advice" image grid — text is HARDCODED per spec, not admin-editable.
    // Still lives in the lang files (not inline in the .ejs) so VI gets a translation.
    gallery: {
        title: 'Style advice. Buying guides. Expert tips.',
        sub: 'Everything you need to feel confident finding furniture that fits your style and space.',
    },
    // "News" block copy — fixed in code (the /admin/content screen was removed)
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
