const SlideService = require('../../Services/Api/slide.service');
const {logger} = require('../../../config/log4js');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));

// GET /admin/slides
async function slidesIndex(req, res) {
    try {
        const slides = await SlideService.getAll();
        res.render('admin/slides', {
            pageTitle: 'Quản lý Slideshow',
            slides: toPlain(slides),
            flash: req.query.msg || null,
        });
    } catch (err) {
        logger.error('admin slidesIndex', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được danh sách slide.');
    }
}

// GET /admin/slides/new
function slideNew(req, res) {
    res.render('admin/slide-form', {pageTitle: 'Thêm slide', slide: null, action: '/admin/slides'});
}

// GET /admin/slides/:id/edit
async function slideEdit(req, res) {
    const s = await SlideService.getById(parseInt(req.params.id, 10));
    if (!s) return res.redirect('/admin/slides?msg=notfound');
    res.render('admin/slide-form', {
        pageTitle: `Sửa slide #${s.id}`,
        slide: s.get({plain: true}),
        action: `/admin/slides/${s.id}`,
    });
}

// POST /admin/slides
async function slideCreate(req, res) {
    try {
        await SlideService.create(req.body);
        res.redirect('/admin/slides?msg=created');
    } catch (err) {
        res.status(err.status || 400).send(`Lỗi tạo slide: ${err.message}`);
    }
}

// POST /admin/slides/:id
async function slideUpdate(req, res) {
    try {
        await SlideService.update(parseInt(req.params.id, 10), req.body);
        res.redirect('/admin/slides?msg=updated');
    } catch (err) {
        res.status(err.status || 400).send(`Lỗi cập nhật slide: ${err.message}`);
    }
}

// POST /admin/slides/:id/delete
async function slideDelete(req, res) {
    try {
        await SlideService.delete(parseInt(req.params.id, 10));
        res.redirect('/admin/slides?msg=deleted');
    } catch (err) {
        res.status(err.status || 400).send(`Lỗi xóa slide: ${err.message}`);
    }
}

module.exports = {slidesIndex, slideNew, slideEdit, slideCreate, slideUpdate, slideDelete};
