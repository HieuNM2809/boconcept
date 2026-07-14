const crud = (label) => ({
    retrieved_all_success: `Lấy danh sách ${label} thành công.`,
    retrieved_one_success: `Lấy ${label} thành công.`,
    created_success: `Tạo ${label} thành công.`,
    updated_success: `Cập nhật ${label} thành công.`,
    deleted_success: `Xóa ${label} thành công.`,
    not_found: `Không tìm thấy ${label}.`,
    failed_get_all: `Lấy danh sách ${label} thất bại.`,
    failed_get_one: `Lấy ${label} thất bại.`,
    failed_create: `Tạo ${label} thất bại.`,
    failed_update: `Cập nhật ${label} thất bại.`,
    failed_delete: `Xóa ${label} thất bại.`,
});

module.exports = {
    example: crud('ví dụ'),
    category: crud('danh mục'),
    product: crud('sản phẩm'),
    auth: {
        invalid_credentials: 'Thông tin đăng nhập không hợp lệ.',
        token_issued: 'Đăng nhập thành công, token đã được cấp.',
        unauthorized: 'Không có quyền truy cập.',
    },
};
