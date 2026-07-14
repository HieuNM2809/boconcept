const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '../../.env')});

const express = require('express');
const cron = require('node-cron');
const {logger} = require('../../config/log4js');
const ExampleJob = require('../Jobs/example.Job');

// Tiến trình chạy nền: đăng ký các cron job + endpoint health check.
class Kernel {
    constructor() {
        this.app = express();
        this.port = process.env.PORT_SCHEDULE || 3005;

        this.exampleJob = new ExampleJob();

        this.setupHealthCheck();
        this.schedule();
    }

    schedule() {
        // Chạy mỗi 5 phút (giờ Việt Nam)
        cron.schedule('*/5 * * * *', () => {
            this.exampleJob.handle();
        }, {timezone: 'Asia/Ho_Chi_Minh'});

        // Ví dụ job chạy hằng ngày lúc 0h:
        // cron.schedule('0 0 * * *', () => { ... }, {timezone: 'Asia/Ho_Chi_Minh'});
    }

    setupHealthCheck() {
        this.app.get('/schedule/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            });
        });
    }

    start() {
        this.app.listen(this.port, () => {
            logger.info(`Schedule runner đang chạy tại http://localhost:${this.port}`);
        });
    }
}

if (require.main === module) {
    new Kernel().start();
}

module.exports = Kernel;
