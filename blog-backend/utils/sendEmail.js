const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // mot de passe d'application Gmail
  },
});

/**
 * sendEmail({ to, subject, html })
 */
const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Your'Blog" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;