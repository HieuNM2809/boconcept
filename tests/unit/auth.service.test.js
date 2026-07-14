process.env.JWT_SECRET = 'test-secret';
process.env.TOKEN_EXPIRES_IN = '1h';

const AuthService = require('../../app/Services/Api/auth.service');

describe('AuthService (token)', () => {
    it('issueToken + verifyToken hoạt động đúng', () => {
        const {accessToken, expiresIn, expiresAt} = AuthService.issueToken({
            client_id: 'abc',
            service_name: 'svc',
        });

        expect(typeof accessToken).toBe('string');
        expect(typeof expiresIn).toBe('number');
        expect(typeof expiresAt).toBe('string');

        const payload = AuthService.verifyToken(accessToken);
        expect(payload.client_id).toBe('abc');
        expect(payload.service).toBe('svc');
    });

    it('verifyToken ném lỗi với token sai', () => {
        expect(() => AuthService.verifyToken('not-a-token')).toThrow();
    });
});
