// Trang chi tiết sản phẩm
module.exports = {
    home: 'Trang chủ',
    variantLabel: 'Phân loại',
    categories: 'Danh mục',
    contact: 'Liên hệ tư vấn',
    showMore: 'Xem thêm ảnh',
    related: 'Sản phẩm liên quan',
    attrs: {size: 'Kích thước', weight: 'Trọng lượng', material: 'Chất liệu', color: 'Màu sắc'},
    tabs: {
        additional: 'Thông tin thêm',
        packaging: 'Đóng gói & vận chuyển',
        // Bỏ tab "Câu hỏi thường gặp" theo yêu cầu — giữ lại "Đóng gói & vận chuyển".
    },
    // Bảng thông số/đóng gói dựng sẵn đã bỏ: hai tab chỉ hiện nội dung admin soạn,
    // còn kích thước/trọng lượng/chất liệu/màu sắc lấy thẳng từ DB ở cột phải.
    faq: [
        {q: 'Sản phẩm có được lắp đặt tận nơi không?', a: 'Có, chúng tôi hỗ trợ giao và lắp đặt tại nhà trong khu vực nội thành.'},
        {q: 'Thời gian bảo hành bao lâu?', a: 'Bảo hành 24 tháng cho các lỗi từ nhà sản xuất.'},
        {q: 'Chính sách đổi trả thế nào?', a: 'Đổi trả trong vòng 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả.'},
    ],
    noDescription: 'Chưa có mô tả cho sản phẩm này.',
    notFound: 'Không tìm thấy sản phẩm.',
    backHome: 'Về trang chủ',
};
