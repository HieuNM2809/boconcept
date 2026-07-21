const request = require('supertest');
const app = require('../../index');

describe('Health endpoints', () => {
    // /health là READINESS, không phải liveness: Railway dùng chính nó để quyết
    // định có cho bản deploy mới thay bản đang chạy hay không. Trả 200 lúc DB
    // còn chết = đẩy một site 500 toàn tập ra cho khách, và mất luôn bản cũ.
    afterEach(() => { delete app.locals.dbReady; });

    it('GET /health khi DB chưa nối được -> 503', async () => {
        app.locals.dbReady = false;
        const res = await request(app).get('/health');
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('db_unavailable');
        expect(res.body.db).toBe('down');
    });

    it('GET /health khi chưa ai đặt cờ (app vừa boot) -> 503', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(503);
    });

    it('GET /health khi DB đã nối -> 200 ok', async () => {
        app.locals.dbReady = true;
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.db).toBe('up');
    });

    it('GET /api/examples không có token -> 401', async () => {
        const res = await request(app).get('/api/examples');
        expect(res.status).toBe(401);
        expect(res.body.status).toBe('error');
    });
});
