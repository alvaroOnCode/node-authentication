"use strict";

const auth = require('./auth');
const user = require('./user');

const authenticate = require('../middlewares/authenticate');

module.exports = app => {
    app.get('/', (req, res) => {
        console.log("Welcome to the AUTHENTICATION API. Register or Login to test Authentication.");
        res.status(200).redirect(process.env.CLIENT_HOST_NAME + "login");
    });

    app.use('/api/auth', auth);
    app.use('/api/user', authenticate, user);
};