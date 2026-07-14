// Product detail page
module.exports = {
    home: 'Home',
    variantLabel: 'Variant',
    sku: 'SKU',
    categories: 'Categories',
    contact: 'Contact for advice',
    tabs: {
        additional: 'Additional information',
        packaging: 'Packaging & shipping',
        faq: 'FAQ',
    },
    specsTitle: 'Specifications',
    // Placeholder — TODO: add spec columns to the products table for real data
    specs: [
        {label: 'Dimensions', value: '160 × 90 × 8.2 cm'},
        {label: 'Weight', value: '44.5 kg'},
        {label: 'Material', value: 'Melamine-coated engineered wood'},
        {label: 'Origin', value: 'Vietnam'},
        {label: 'Warranty', value: '24 months'},
    ],
    packagingDesc: 'The product is carefully packaged with assembly instructions and all required hardware.',
    packaging: [
        {label: 'Packaging', value: '1 packet'},
        {label: 'Package size', value: '184 × 105 × 6.2 cm'},
        {label: 'Weight', value: '44.5 kg'},
        {label: 'Volume', value: '0.121 m³'},
    ],
    faq: [
        {q: 'Do you offer on-site assembly?', a: 'Yes, we support home delivery and assembly within the inner city.'},
        {q: 'How long is the warranty?', a: '24 months against manufacturing defects.'},
        {q: 'What is the return policy?', a: 'Returns accepted within 7 days if the item is defective or not as described.'},
    ],
    noDescription: 'No description available for this product.',
    notFound: 'Product not found.',
    backHome: 'Back to home',
};
