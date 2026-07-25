// Product detail page
module.exports = {
    home: 'Home',
    variantLabel: 'Variant',
    categories: 'Categories',
    contact: 'Contact for advice',
    showMore: 'Show more',
    related: 'Related products',
    attrs: {size: 'Dimensions', weight: 'Weight', material: 'Material', color: 'Colour'},
    tabs: {
        additional: 'Additional information',
        packaging: 'Packaging & shipping',
        // FAQ tab removed per spec — "Packaging & shipping" is kept.
    },
    // Canned spec/packaging tables removed: both tabs now show only admin-authored
    // content, and size/weight/material/colour come straight from the DB column.
    faq: [
        {q: 'Do you offer on-site assembly?', a: 'Yes, we support home delivery and assembly within the inner city.'},
        {q: 'How long is the warranty?', a: '24 months against manufacturing defects.'},
        {q: 'What is the return policy?', a: 'Returns accepted within 7 days if the item is defective or not as described.'},
    ],
    noDescription: 'No description available for this product.',
    notFound: 'Product not found.',
    backHome: 'Back to home',
};
