"use strict";

// Config
const transporter = require('../config/nodemailer');

// Models
const User = require('../models/user');



// @route POST api/auth/recover
// @desc Recover Password - Generates token and Sends password reset email
// @access Public
exports.recover = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            console.log("The email address " + req.body.email + " is not associated with any account. Double-check your email address and try again.");
            return res.status(401).json({
                success: false,
                message: 'The email address ' + req.body.email + ' is not associated with any account. Double-check your email address and try again.'
            });
        }

        // Generate and set password reset token
        user.generatePasswordReset();

        // Save the updated user object
        user.save()
            .then(user => {
                const link = "http://" + req.headers.host + "/api/auth/reset/" + user.resetPasswordToken;

                const mailOptions = {
                    to: user.email,
                    from: process.env.FROM_EMAIL,
                    subject: "Password change request",
                    text: `Hi, ${user.username}\n\n
                            Please click on the following link to reset your password:\n\n\n
                            ${link}\n\n\n
                            If you did not request this, please ignore this email and your password will remain unchanged.\n\n`,
                    html: `Hi, <strong>${user.username}</strong>!<br/><br/>
                            Please click on the following link to reset your password:<br/><br/><br/>
                            ${link}<br/><br/><br/>
                            If you did not request this, please ignore this email and your password will remain unchanged.<br/><br/>`,
                };

                transporter.sendMail(mailOptions)
                    .then(data => {
                        return res.status(200).json({
                            success: true,
                            message: 'A reset email has been sent to ' + user.email + '.'
                        });
                    })
                    .catch(error => {
                        if (error) {
                            console.error("recover:", error);
                            return res.status(500).json({
                                success: false,
                                message: error.message
                            });
                        }
                    });
            })
            .catch(error => {
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// @route POST api/auth/reset
// @desc Reset Password - Validate password reset token and shows the password reset view
// @access Public
exports.reset = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Password reset token is invalid or has expired.'
            });
        }

        // Redirect user to form with the email address
        return res.status(200).redirect(process.env.CLIENT_HOST_NAME + "reset-password/" + token);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// @route POST api/auth/reset
// @desc Reset Password
// @access Public
exports.resetPassword = (req, res) => {
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    })
        .then((user) => {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Password reset token is invalid or has expired.'
                });
            }

            // Set the new password
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.isVerified = true;

            // Save
            user.save((err) => {
                if (err) {
                    return res.status(500).json({
                        success: false, message: err.message
                    });
                }

                // send email
                const mailOptions = {
                    to: user.email,
                    from: process.env.FROM_EMAIL,
                    subject: "Your password has been changed",
                    text: `Hi, ${user.username}!\n\n
                            This is a confirmation that the password for your account ${user.email} has just been changed.\n\n`,
                    html: `Hi, <strong>${user.username}!</strong><br/><br/>
                            This is a confirmation that the password for your account ${user.email} has just been changed.<br/><br/>`
                };

                sgMail.send(mailOptions, (error, result) => {
                    if (error) {
                        return res.status(500).json({
                            success: false,
                            message: error.message
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Your password has been changed.'
                    });
                });
            });
        })
        .catch(error => {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        });
};