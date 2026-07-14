const apiRoutes = require('./api.route');
const webRoutes = require('./web.route');

module.exports = function registerRoutes(app) {
    app.use('/api', apiRoutes);
    app.use('/', webRoutes);
};
