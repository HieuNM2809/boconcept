const BaseJob = require('./BaseJob');
const {logger} = require('../../config/log4js');

// Job mẫu chạy theo lịch (xem app/Console/Kernel.js).
class ExampleJob extends BaseJob {
    async handle() {
        try {
            logger.info(`[ExampleJob] Bắt đầu chạy job định kỳ lúc ${this.nowVN()}`);

            // TODO: đặt business logic ở đây (đọc DB, gọi API, đồng bộ dữ liệu, ...)

            logger.info('[ExampleJob] Hoàn tất');
        } catch (err) {
            logger.error('[ExampleJob] Lỗi khi chạy job', {
                error: {message: err.message, stack: err.stack},
            });
        }
    }
}

module.exports = ExampleJob;
