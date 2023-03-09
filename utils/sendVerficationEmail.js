const sendEmail = require("./sendEmail");

const sendVerificationEmail = async ({ email, verificationToken, origin }) => {
  const verifyEmail = `${origin}/user/verify-email?token=${verificationToken}&email=${email}`;

  const message = `<p>Welcome to XRCouture<br>Please confirm your email by clicking on the following link<br>
  <a href="${verifyEmail}">Verify Email</a> </p>`;
  const footer = "<br><p>Thanks,<br>XR Couture</p>";

  return sendEmail({
    to: email,
    subject: "Email Confirmation",
    html: `<h4>Hello</h4>
    ${message}
    ${footer}`,
  });
};

module.exports = sendVerificationEmail;
