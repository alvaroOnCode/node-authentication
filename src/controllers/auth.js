"use strict";

// Nodemailer Transporter
const transporter = require('../config/nodemailer');

// Models
const User = require('../models/user');
const Token = require('../models/token');



// @route POST api/auth/register
// @desc Register user
// @access Public
exports.register = async (req, res) => {
    try {
        const { email } = req.body;

        // Make sure this account doesn't already exist
        const user = await User.findOne({ email });

        if (user) {
            console.log("The email address you have entered is already associated with another account.");
            return res.status(401).json({
                success: false,
                message: 'The email address you have entered is already associated with another account.'
            });
        }

        const newUser = new User({ ...req.body, role: "basic" });
        const user_ = await newUser.save();

        sendEmailNodemailer(user_, req, res);
    } catch (error) {
        console.error("register:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// @route POST api/auth/login
// @desc Login user and return JWT token
// @access Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            console.log("The email address " + email + " is not associated with any account. Double-check your email address and try again.");
            return res.status(401).json({
                success: false,
                message: 'The email address ' + email + ' is not associated with any account. Double-check your email address and try again.'
            });
        }

        // Validate password
        if (!user.comparePassword(password)) {
            console.log("Invalid email or password.");
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Make sure the user has been verified
        if (!user.isVerified) {
            console.log("Your account has not been verified.");
            return res.status(401).json({
                success: false,
                message: 'Your account has not been verified.'
            });
        }

        // Login successful, write token and send back user
        return res.status(200).json({
            success: true,
            token: user.generateJWT(),
            user: user
        });
    } catch (error) {
        console.error("login:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// ===EMAIL VERIFICATION
// @route GET api/verify/:token
// @desc Verify token
// @access Public
exports.verify = async (req, res) => {
    if (!req.params.token) {
        console.log("No token in params.");
        return res.status(400).redirect(process.env.CLIENT_HOST_NAME + "not-found");
    }

    try {
        // Find a matching token
        const token = await Token.findOne({ token: req.params.token });

        if (!token) {
            console.log("We were unable to find a valid token. Your token may have expired.");
            return res.status(400).redirect(process.env.CLIENT_HOST_NAME + "expired");
        }

        // If we found a token, find a matching user
        User.findOne({ _id: token.userId }, (err, user) => {
            if (!user) {
                console.log("We were unable to find a user for this token.");
                return res.status(400).redirect(process.env.CLIENT_HOST_NAME + "not-found");
            }

            if (user.isVerified) {
                console.log("This user has already been verified.");
                return res.status(400).redirect(process.env.CLIENT_HOST_NAME + "verify/verified");
            }

            // Verify and save the user
            user.isVerified = true;

            user.save(function (err) {
                if (err) {
                    console.error("verify:", err);
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                return res.status(200).redirect(process.env.CLIENT_HOST_NAME + "verify");
            });
        });
    } catch (error) {
        console.error("verify:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// @route POST api/resend
// @desc Resend Verification Token
// @access Public
exports.resendToken = async (req, res) => {
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

        if (user.isVerified) {
            console.log("This account has already been verified. Please log in.");
            return res.status(400).json({
                success: false,
                message: 'This account has already been verified. Please log in.'
            });
        }

        sendEmailNodemailer(user, req, res);
    } catch (error) {
        console.error("resendToken:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



function sendEmailNodemailer(user, req, res) {
    const token = user.generateVerificationToken();

    // Save the verification token
    token.save(function (err) {
        if (err) {
            console.error("sendEmailNodemailer:", err);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        const link = "http://" + req.headers.host + "/api/auth/verify/" + token.token;

        const mailOptions = {
            from: process.env.NODEMAILER_FROM_EMAIL,
            to: user.email,
            subject: 'Account Verification Token',
            text: `Hi, ${user.username}!\n\n
                    Please click on the following link to verify your account:\n\n
                    ${link}\n\n
                    If you did not request this, please ignore this email.\n\n
                    Cheers!\n\n`,
            html: `Hi, <strong>${user.username}!</strong><br/><br/>
                    Please click on the following link to verify your account:<br/><br/>
                    ${link}<br/><br/>
                    If you did not request this, please ignore this email.<br/><br/>
                    Cheers!<br/><br/>`,

            auth: {
                user: process.env.NODEMAILER_FROM_EMAIL,
                refreshToken: process.env.GOOGLE_API_OAUTH2_REFRESH_TOKEN,
                accessToken: process.env.GOOGLE_API_OAUTH2_ACCESS_TOKEN,
                expires: 1484314697598
            }
        };

        transporter.sendMail(mailOptions)
            .then(data => {
                return res.status(200).json({
                    success: true,
                    message: 'A verification email has been sent to ' + user.email + '.'
                });
            })
            .catch(error => {
                if (error) {
                    console.error("sendEmailNodemailer:", error);
                    return res.status(500).json({
                        success: false,
                        message: error.message
                    });
                }
            });
    });
}