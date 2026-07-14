const moment = require('moment-timezone');

class BaseJob {
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    nowVN() {
        return moment.tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
    }

    minutesAgoVN(minutes = 5) {
        return moment
            .tz('Asia/Ho_Chi_Minh')
            .subtract(minutes, 'minutes')
            .format('YYYY-MM-DD HH:mm:ss');
    }
}

module.exports = BaseJob;
