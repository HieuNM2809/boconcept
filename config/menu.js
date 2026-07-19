/**
 * Nhóm link phụ trong drawer menu (phần chữ nhỏ phía dưới danh mục).
 *
 * Chỉ để `key` ở đây, KHÔNG để nhãn — nhãn nằm trong resources/lang/{vi,en}/common.js
 * dưới `menu.links.<key>` để dịch được. Ghép bằng key nên không lệch như ghép theo index.
 *
 * Mọi href đều là anchor TUYỆT ĐỐI ("/#why" chứ không phải "#why"): drawer xuất hiện
 * trên mọi trang, "#why" ở /products/1 sẽ không nhảy đi đâu cả.
 */
module.exports = [
    {key: 'news', href: '/news'},
    {key: 'about', href: '/about'},
    {key: 'partners', href: '/#partners'},
    {key: 'support', href: '/#footer'},
    {key: 'findStore', href: '/#footer'},
];
