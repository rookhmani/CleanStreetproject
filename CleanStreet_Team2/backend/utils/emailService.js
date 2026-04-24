const nodemailer = require('nodemailer');
const { getClientUrl } = require('./config');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendPasswordResetEmail = async (email, resetToken) => {
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
        console.log('Email service not configured - skipping password reset email');
        return;
    }

    // Frontend URL where user will reset password
    const resetUrl = `${getClientUrl()}/reset-password/${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h1>You have requested to reset your password</h1>
            <p>Please click on the following link to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully');
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Error sending password reset email');
    }
};

module.exports = {
    sendPasswordResetEmail
};
