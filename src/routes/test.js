"use strict";

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = app => {
    app.get('/test/email', (req, res, next) => {
        const msg = {
            to: process.env.FROM_EMAIL,
            from: process.env.FROM_EMAIL,
            subject: 'Sending with Twilio SendGrid is Fun',
            text: 'and easy to do anywhere, even with Node.js',
            html: '<strong>and easy to do anywhere, even with Node.js</strong>',
        };

        sgMail.send(msg);

        res.status(200).send({ test: msg });
    });
}