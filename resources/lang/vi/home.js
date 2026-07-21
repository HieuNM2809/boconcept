// Chuỗi UI riêng cho trang chủ
module.exports = {
    meta: {title: 'Huong Sơn entertaimain — Nội thất thiết kế Ý'},
    // Slideshow giờ chỉ còn ảnh + MỘT dòng tên thương hiệu đứng yên phía trên.
    // Badge/tiêu đề theo từng slide đã bỏ, nên mảng chuỗi mẫu cũ ở đây cũng bỏ luôn.
    // Tên thương hiệu KHÔNG dịch — hai file vi/en cố ý để y hệt nhau.
    hero: {brand: 'HƯƠNG SƠN ENTERTAIMAIN'},
    // Dải giới thiệu doanh nghiệp — tiêu đề + 1 đoạn văn, căn giữa.
    // CHỈ LÀ FALLBACK: chữ thật lấy từ trang hệ thống `about` trong DB
    // (title_* + excerpt_*, sửa ở /admin/pages). Hai chuỗi dưới chỉ hiện khi
    // chưa có bản ghi, trang bị ẩn, hoặc cột để trống — sửa ở đây KHÔNG đổi
    // được nội dung đang chạy.
    why: {
        title: 'Chúng tôi chuyên về Nội thất và Chậu gốm',
        body: 'Công ty TNHH Quốc tế Hương Sơn là nhà sản xuất và xuất khẩu tại Việt Nam, chuyên về nội thất và gốm sứ. Chúng tôi cam kết mang đến những sản phẩm chất lượng cao, kết hợp tay nghề thủ công tinh xảo, thiết kế hiện đại và độ bền lâu dài. Phục vụ khách hàng trên toàn thế giới, chúng tôi cung cấp dịch vụ sản xuất tin cậy, kiểm soát chất lượng nghiêm ngặt và dịch vụ xuất khẩu chuyên nghiệp, đáp ứng nhu cầu đa dạng của thị trường quốc tế. Sứ mệnh của chúng tôi là tạo ra sản phẩm giàu giá trị, đồng thời xây dựng quan hệ hợp tác lâu dài dựa trên sự tin cậy, chất lượng và tính bền vững.',
    },
    categories: {
        title: 'Chất lượng thấy được, sự thoải mái cảm nhận được.',
        sub: 'Chúng tôi kết hợp vật liệu tự nhiên, tay nghề thủ công và thiết kế chỉn chu để tạo nên những món nội thất nâng tầm không gian sống của bạn.',
    },
    // Lưới ảnh "Style advice" — chữ ĐÓNG CỨNG theo yêu cầu, admin KHÔNG sửa được.
    // Vẫn để ở file ngôn ngữ (không hardcode trong .ejs) để trang VI có bản dịch.
    gallery: {
        title: 'Tư vấn phong cách. Cẩm nang mua sắm. Lời khuyên chuyên gia.',
        sub: 'Mọi thứ bạn cần để tự tin chọn được món nội thất hợp phong cách và không gian của mình.',
    },
    // Chữ khối "Tin tức" — cố định trong code (màn /admin/content đã gỡ)
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
