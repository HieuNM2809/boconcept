// Chuỗi UI dùng chung cho MỌI trang (header, footer, nút, ...)
module.exports = {
    // Tên thương hiệu KHÔNG dịch — giữ giống nhau ở vi/en. Đây là nguồn duy nhất:
    // header, footer, <title> và pageTitle của controller đều đọc từ đây.
    brand: 'Huong Sơn entertaimain',
    brandMain: 'Huong Sơn',   // phần in đậm
    brandSub: 'entertaimain', // phần thường
    tagline: 'Nội thất thiết kế Ý bền vững với thời gian.',
    findStore: 'Tìm cửa hàng',
    actions: {
        shopNow: 'Mua ngay',
        viewDetail: 'Xem chi tiết công ty',
        search: 'Tìm kiếm',
        searchPlaceholder: 'Bạn đang tìm gì?',
        more: 'Xem thêm',
        menu: 'Danh mục sản phẩm',
        prev: 'Ảnh trước',
        next: 'Ảnh tiếp theo',
    },
    menu: {
        promo: 'Cần tư vấn thiết kế?',
        promoCta: 'Đặt lịch hẹn',
        close: 'Đóng menu',
        back: 'Quay lại',
        viewAllIn: (name) => `Xem tất cả ${name}`,
        links: {
            news: 'Tin tức',
            featured: 'Bộ sưu tập nổi bật',
            about: 'Về chúng tôi',
            partners: 'Đối tác',
            support: 'Dịch vụ & hỗ trợ',
            findStore: 'Tìm cửa hàng',
        },
    },
    // Nhãn độc lập với locale hiện tại — dùng cho nút chuyển đổi hai chiều.
    // (Bỏ `langLabel` cũ: nó chỉ trả về locale ĐANG dùng, và cờ 🇻🇳/🇬🇧 không
    //  render trên Windows — Chrome/Edge hiện ra chữ "VN"/"GB".)
    langNames: {vi: 'VI', en: 'EN'},
    // Tên đầy đủ: dùng cho title/aria-label của nút cờ (link chỉ có icon).
    langFull: {vi: 'Tiếng Việt', en: 'English'},
    empty: 'Chưa có dữ liệu.',
    footer: {
        contact: 'Thông tin liên hệ',
        services: 'Dịch vụ và hỗ trợ',
        hotline: 'Hotline',
        address: 'Địa chỉ: 123 Đường ABC, Quận 1, TP. HCM',
        email: 'Email: contact@webfurniture.vn',
        website: 'Website: webfurniture.vn',
        tax: 'MST: 0312345678',
        phone: 'SĐT: 1900 588 880',
        svcList: ['Chính sách bảo mật', 'Chính sách bảo hành', 'Chính sách đổi trả', 'Câu hỏi thường gặp', 'Chính sách thanh toán'],
        rights: 'Bảo lưu mọi quyền.',
        admin: 'Quản trị',
        company: 'Thông tin công ty',
        mapTitle: 'Bản đồ',
        // Địa chỉ SẠCH cho Google Maps (không có tiền tố "Địa chỉ:").
        // Dùng /maps?q=...&output=embed nên KHÔNG cần API key.
        mapQuery: '123 Đường ABC, Quận 1, TP. HCM',
    },
};
