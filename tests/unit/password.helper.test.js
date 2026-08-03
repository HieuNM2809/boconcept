const passwords = require('../../app/Helpers/password.helper');

describe('password.helper (scrypt)', () => {
    it('hash + verify khớp đúng mật khẩu', () => {
        const stored = passwords.hash('secret123');
        expect(typeof stored).toBe('string');
        expect(stored.startsWith('scrypt$')).toBe(true);
        expect(passwords.verify('secret123', stored)).toBe(true);
    });

    it('verify trả false với mật khẩu sai', () => {
        const stored = passwords.hash('secret123');
        expect(passwords.verify('wrong-pass', stored)).toBe(false);
    });

    it('mỗi lần hash ra chuỗi khác nhau (salt ngẫu nhiên)', () => {
        expect(passwords.hash('same')).not.toBe(passwords.hash('same'));
    });

    it('verify KHÔNG ném với chuỗi lưu hỏng/không đúng định dạng', () => {
        expect(passwords.verify('x', '')).toBe(false);
        expect(passwords.verify('x', null)).toBe(false);
        expect(passwords.verify('x', undefined)).toBe(false);
        expect(passwords.verify('x', 'bcrypt$abc$def')).toBe(false); // scheme khác
        expect(passwords.verify('x', 'scrypt$onlyonepart')).toBe(false);
    });

    it('MIN_PASSWORD_LENGTH là số dương', () => {
        expect(typeof passwords.MIN_PASSWORD_LENGTH).toBe('number');
        expect(passwords.MIN_PASSWORD_LENGTH).toBeGreaterThan(0);
    });
});
