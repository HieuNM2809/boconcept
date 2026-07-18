// Trang chi tiết sản phẩm
module.exports = {
    home: 'Trang chủ',
    variantLabel: 'Phân loại',
    sku: 'SKU',
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
    specsTitle: 'Thông số kỹ thuật',
    // Dùng khi sản phẩm CHƯA có thông số thật trong DB (kích thước/khối lượng/chất liệu)
    specs: [
        {label: 'Kích thước', value: '160 × 90 × 8.2 cm'},
        {label: 'Trọng lượng', value: '44.5 kg'},
        {label: 'Chất liệu', value: 'Gỗ công nghiệp phủ melamine'},
        {label: 'Xuất xứ', value: 'Việt Nam'},
        {label: 'Bảo hành', value: '24 tháng'},
    ],
    packagingDesc: 'Sản phẩm được đóng gói cẩn thận, kèm hướng dẫn lắp đặt và đầy đủ phụ kiện.',
    packaging: [
        {label: 'Quy cách', value: '1 kiện'},
        {label: 'Kích thước kiện', value: '184 × 105 × 6.2 cm'},
        {label: 'Trọng lượng', value: '44.5 kg'},
        {label: 'Thể tích', value: '0.121 m³'},
    ],
    faq: [
        {q: 'Sản phẩm có được lắp đặt tận nơi không?', a: 'Có, chúng tôi hỗ trợ giao và lắp đặt tại nhà trong khu vực nội thành.'},
        {q: 'Thời gian bảo hành bao lâu?', a: 'Bảo hành 24 tháng cho các lỗi từ nhà sản xuất.'},
        {q: 'Chính sách đổi trả thế nào?', a: 'Đổi trả trong vòng 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả.'},
    ],
    noDescription: 'Chưa có mô tả cho sản phẩm này.',
    notFound: 'Không tìm thấy sản phẩm.',
    backHome: 'Về trang chủ',
};
