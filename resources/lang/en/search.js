// Search results page — GET /search?q=
module.exports = {
    title: 'Search results',
    home: 'Home',
    // "12 results for “sofa”"
    resultsFor: (total, q) => `${total} result${total === 1 ? '' : 's'} for “${q}”`,
    empty: 'No matching products found.',
    emptyHint: 'Try a shorter keyword or check the spelling.',
    // When the user submits an empty search box
    noQuery: 'Enter a keyword to search',
    noQueryHint: 'Type a product name in the search box above.',
    backHome: 'Back to home',
};
