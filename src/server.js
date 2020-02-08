/**
 * Original Authentication API by Moses Esan found on Medium
 * Source: https://medium.com/swlh/how-to-build-a-node-js-authentication-api-with-email-verification-image-upload-and-password-reset-95e35fd46be1
 */

// Requires
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');

// Get routes
const authRoute = require('./routes/auth');
const mainRoute = require('./routes/index');
const userRoute = require('./routes/user');

// Dotenv
require('dotenv').config({
  path: path.join(__dirname, 'env/.env'),
});

// Database connection
require('./database');

// New server
const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware > Passport
app.use(passport.initialize());
require("./middlewares/jwt")(passport);

// Set routes
app.use('/', mainRoute);
app.use('/auth', authRoute);
app.use('/user', userRoute);

// Static
app.use(express.static(path.join(__dirname, 'public')));

// Starting the server
(() => {
  try {
    app.listen(process.env.SERVER_PORT, () => {
      console.log(`Server on port ${process.env.SERVER_PORT}.`);
    });
  } catch (e) {
    console.error(e);
  }
})();
