const fs = require('fs');
const path = require('path');

// Thời gian hiện tại theo giờ Việt Nam, dạng "dd/mm/yyyy HH:mm:ss"
function getVietnamTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    return formatter.format(now).replace(',', '');
}

function getLogFilePath(name = 'app') {
    if (typeof name === 'object') name = 'app';
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(__dirname, `../../storage/logs/${formattedDate}_${name}.log`);
}

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, {recursive: true});
    }
}

// Ghi 1 dòng log ra file (append). Dùng cho log nghiệp vụ cần lưu ổ đĩa.
function logToFile(msg, fileName = 'app') {
    const logFilePath = getLogFilePath(fileName);
    ensureDirectoryExistence(logFilePath);
    const logMessage = `${getVietnamTime()} - ${msg}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error('Error writing to log file:', err);
    });
}

function toJsonLog(payload) {
    try {
        return JSON.stringify(payload);
    } catch (error) {
        return JSON.stringify({error: 'Cannot stringify payload'});
    }
}

// Log gọn request/response ra stdout (được log4js gom lại)
function logRequestResponse(title, request, response) {
    console.log(toJsonLog({title, request, response}));
}

module.exports = {
    getVietnamTime,
    logToFile,
    toJsonLog,
    logRequestResponse,
    ensureDirectoryExistence,
};
