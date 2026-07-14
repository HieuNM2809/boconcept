class BaseController {
    /**
     * Trả về response thành công chuẩn hóa.
     * @param {object} res - Express response (nếu null sẽ log ra console — tiện khi gọi từ CLI/job)
     * @param {*} data
     * @param {string} message
     * @param {object|null} more - các field bổ sung (vd: meta phân trang)
     */
    sendSuccessResponse(res, data, message = 'Success', more = null) {
        if (!res) {
            console.log(message, data);
            return;
        }
        res.status(200).json({
            status: 'success',
            message,
            data,
            ...more,
        });
    }

    /**
     * Trả về response lỗi chuẩn hóa.
     * Lưu ý: KHÔNG gọi process.exit khi thiếu res (khác với bản gốc) để tránh
     * kill cả tiến trình khi controller được gọi ngoài HTTP context.
     */
    sendErrorResponse(res, error, message = 'An error occurred', statusCode = 500) {
        if (!res) {
            console.error(`Error: ${message} -`, error);
            return;
        }
        res.status(statusCode).json({
            status: 'error',
            message,
            error: typeof error === 'string' ? error : (error && error.message) || null,
        });
    }
}

module.exports = BaseController;
