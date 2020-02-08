/**
 * Original Authentication API by Moses Esan found on Medium
 * Source: https://medium.com/swlh/how-to-build-a-node-js-authentication-api-with-email-verification-image-upload-and-password-reset-95e35fd46be1
 */

// Requires
const path = require('path');
const express = require('express');
const morgan = require('morgan');

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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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