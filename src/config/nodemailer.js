const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: xoauth2.createXOAuth2Generator({
        type: 'OAuth2',
        clientId: process.env.GOOGLE_API_OAUTH2_CLIENT_ID,
        clientSecret: process.env.GOOGLE_API_OAUTH2_CLIENT_SECRET
    })
});

module.exports = transporter;