const nodemailer = require('nodemailer');

const sendVerificationEmail = async (userEmail, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Email Verification',
        html: `<h1>Email Verification</h1>
               <p>Authentication code to verify your email:</p>
               <p>${otp}</p>`,
    };

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };