// Trang kết quả tìm kiếm — GET /search?q=
module.exports = {
    title: 'Kết quả tìm kiếm',
    home: 'Trang chủ',
    // "12 kết quả cho “ghế sofa”"
    resultsFor: (total, q) => `${total} kết quả cho “${q}”`,
    empty: 'Không tìm thấy sản phẩm nào phù hợp.',
    emptyHint: 'Thử từ khóa ngắn hơn hoặc kiểm tra lại chính tả.',
    // Khi người dùng bấm tìm với ô trống
    noQuery: 'Nhập từ khóa để tìm sản phẩm',
    noQueryHint: 'Gõ tên sản phẩm vào ô tìm kiếm phía trên.',
    backHome: 'Về trang chủ',
};
