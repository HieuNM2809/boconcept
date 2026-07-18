// Shared UI strings for ALL pages (header, footer, buttons, ...)
module.exports = {
    // Brand name is NOT translated — identical in vi/en. Single source of truth:
    // header, footer, <title> and controller pageTitles all read from here.
    brand: 'Huong Sơn entertaimain',
    brandMain: 'Huong Sơn',   // bold part
    brandSub: 'entertaimain', // regular part
    tagline: 'Timeless Italian furniture design.',
    findStore: 'Find store',
    actions: {
        shopNow: 'Shop now',
        viewDetail: 'View company details',
        search: 'Search',
        searchPlaceholder: 'What can we help you find?',
        more: 'More',
        menu: 'Product categories',
        prev: 'Previous image',
        next: 'Next image',
    },
    menu: {
        promo: 'Get styling advice',
        promoCta: 'Make an appointment',
        close: 'Close menu',
        back: 'Back',
        viewAllIn: (name) => `View all ${name}`,
        links: {
            news: 'News',
            featured: 'Featured collections',
            about: 'About us',
            partners: 'Partners',
            support: 'Customer service',
            findStore: 'Find store',
        },
    },
    // Locale-independent labels — used by the two-way language switch.
    // (Dropped the old `langLabel`: it only ever returned the ACTIVE locale, and
    //  the 🇻🇳/🇬🇧 flags do not render on Windows — Chrome/Edge show "VN"/"GB".)
    langNames: {vi: 'VI', en: 'EN'},
    empty: 'No data yet.',
    footer: {
        contact: 'Contact information',
        services: 'Services & support',
        hotline: 'Hotline',
        address: 'Address: 123 ABC Street, District 1, HCMC',
        email: 'Email: contact@webfurniture.vn',
        website: 'Website: webfurniture.vn',
        tax: 'Tax code: 0312345678',
        phone: 'Phone: 1900 588 880',
        svcList: ['Privacy policy', 'Warranty policy', 'Return policy', 'FAQ', 'Payment policy'],
        rights: 'All rights reserved.',
        admin: 'Admin',
        company: 'Company information',
        mapTitle: 'Map',
        // Clean address for Google Maps (no "Address:" prefix).
        // Uses /maps?q=...&output=embed so NO API key is required.
        mapQuery: '123 ABC Street, District 1, HCMC',
    },
};
