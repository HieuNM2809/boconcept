const BaseController = require('../../app/Http/Controllers/BaseController');

function mockRes() {
    const res = {statusCode: null, body: null};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
}

describe('BaseController', () => {
    const controller = new BaseController();

    it('sendSuccessResponse trả về status 200 chuẩn hóa', () => {
        const res = mockRes();
        controller.sendSuccessResponse(res, {a: 1}, 'ok', {meta: {total: 1}});
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toEqual({a: 1});
        expect(res.body.meta).toEqual({total: 1});
    });

    it('sendErrorResponse trả về status code truyền vào', () => {
        const res = mockRes();
        controller.sendErrorResponse(res, new Error('boom'), 'failed', 400);
        expect(res.statusCode).toBe(400);
        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('failed');
        expect(res.body.error).toBe('boom');
    });

    it('không crash khi res = null (dùng trong CLI/job)', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => controller.sendSuccessResponse(null, {a: 1}, 'ok')).not.toThrow();
        expect(() => controller.sendErrorResponse(null, new Error('x'), 'y', 500)).not.toThrow();

        logSpy.mockRestore();
        errSpy.mockRestore();
    });
});
