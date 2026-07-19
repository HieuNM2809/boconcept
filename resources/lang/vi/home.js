// Chuỗi UI riêng cho trang chủ
module.exports = {
    meta: {title: 'Huong Sơn entertaimain — Nội thất thiết kế Ý'},
    hero: [
        {badge: 'Thiết kế Đan Mạch', title: 'Ưu đãi cuối mùa: Đang diễn ra'},
        {badge: 'Bộ sưu tập mới', title: 'Không gian sống hiện đại'},
        {badge: 'Phòng ngủ', title: 'Giấc ngủ trọn vẹn mỗi ngày'},
    ],
    // Dải giới thiệu doanh nghiệp — tiêu đề + 1 đoạn văn, căn giữa.
    why: {
        title: 'Chúng tôi chuyên về Nội thất và Chậu gốm',
        body: 'Công ty TNHH Quốc tế Hương Sơn là nhà sản xuất và xuất khẩu tại Việt Nam, chuyên về nội thất và gốm sứ. Chúng tôi cam kết mang đến những sản phẩm chất lượng cao, kết hợp tay nghề thủ công tinh xảo, thiết kế hiện đại và độ bền lâu dài. Phục vụ khách hàng trên toàn thế giới, chúng tôi cung cấp dịch vụ sản xuất tin cậy, kiểm soát chất lượng nghiêm ngặt và dịch vụ xuất khẩu chuyên nghiệp, đáp ứng nhu cầu đa dạng của thị trường quốc tế. Sứ mệnh của chúng tôi là tạo ra sản phẩm giàu giá trị, đồng thời xây dựng quan hệ hợp tác lâu dài dựa trên sự tin cậy, chất lượng và tính bền vững.',
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
