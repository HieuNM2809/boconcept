// Chuỗi UI riêng cho trang chủ
module.exports = {
    meta: {title: 'Huong Sơn entertaimain — Nội thất thiết kế Ý'},
    hero: [
        {badge: 'Thiết kế Đan Mạch', title: 'Ưu đãi cuối mùa: Đang diễn ra'},
        {badge: 'Bộ sưu tập mới', title: 'Không gian sống hiện đại'},
        {badge: 'Phòng ngủ', title: 'Giấc ngủ trọn vẹn mỗi ngày'},
    ],
    why: {
        title: 'Tại sao 230.000 doanh nghiệp chọn thiết kế website với chúng tôi?',
        items: [
            {title: 'Tăng uy tín thương hiệu', desc: 'Website chuyên nghiệp giúp doanh nghiệp gây ấn tượng và tạo niềm tin với khách hàng.'},
            {title: 'Mở rộng tiếp cận khách hàng', desc: 'Bán hàng mọi lúc mọi nơi, không giới hạn thời gian và địa lý.'},
            {title: 'Tiết kiệm thời gian, chi phí', desc: 'Quản lý sản phẩm, đơn hàng tập trung, tự động hóa vận hành.'},
            {title: 'Tăng tỷ lệ chuyển đổi', desc: 'Trải nghiệm mua sắm mượt mà giúp tăng đơn hàng thành công.'},
        ],
    },
    categories: {title: 'Loại sản phẩm', sub: 'Nội thất của chúng tôi trên khắp châu Âu suốt 40 năm qua.'},
    // Lưới ảnh "Style advice" — chữ ĐÓNG CỨNG theo yêu cầu, admin KHÔNG sửa được.
    // Vẫn để ở file ngôn ngữ (không hardcode trong .ejs) để trang VI có bản dịch.
    gallery: {
        title: 'Tư vấn phong cách. Cẩm nang mua sắm. Lời khuyên chuyên gia.',
        sub: 'Mọi thứ bạn cần để tự tin chọn được món nội thất hợp phong cách và không gian của mình.',
    },
    // Chữ mặc định khi admin để trống ô tương ứng ở /admin/content
    news: {
        title: 'Xu hướng của mùa',
        sub: 'Mỗi mùa mang đến nguồn cảm hứng mới cho ngôi nhà. Khám phá những xu hướng đang định hình nội thất hiện đại, từ bảng màu biểu cảm đến thiết kế đương đại ấm áp.',
        cta: 'Khám phá xu hướng',
    },
    partners: {title: 'Đối tác hợp tác', sub: 'Our Partners'},
    featured: {title: 'Thông tin sản phẩm nổi bật', sub: 'NỘI THẤT GIA ĐÌNH', productsWord: 'sản phẩm'},
    certs: {
        title: 'Giấy chứng nhận công ty',
        items: [{title: 'Giấy phép kinh doanh'}, {title: 'Chứng nhận chất lượng'}, {title: 'Chứng nhận xuất xứ'}],
    },
};
