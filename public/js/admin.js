(function () {
    'use strict';
    // Xác nhận trước khi submit form có data-confirm (vd: xóa slide)
    document.querySelectorAll('form[data-confirm]').forEach(function (f) {
        f.addEventListener('submit', function (e) {
            if (!window.confirm(f.dataset.confirm)) e.preventDefault();
        });
    });
})();
