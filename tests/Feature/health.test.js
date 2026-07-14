const request = require('supertest');
const app = require('../../index');

describe('Health endpoints', () => {
    it('GET / trả về status ok', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('GET /api/examples không có token -> 401', async () => {
        const res = await request(app).get('/api/examples');
        expect(res.status).toBe(401);
        expect(res.body.status).toBe('error');
    });
});
