const sendEmail = require("./sendEmail");

const sendResetPassswordEmail = async ({ email, token, origin }) => {
  const resetURL = `${origin}/user/reset-password?token=${token}&email=${email}`;
  const message = `<p>Please reset password by clicking on the link
  <a href="${resetURL}">Reset Password</a></p>`;
  const footer = "<br><p>Thanks,<br>XR Couture</p>";

  return sendEmail({
    to: email,
    subject: "Reset Password",
    html: `<h4>Hello</h4>
   ${message}
   ${footer}
   `,
  });
};

module.exports = sendResetPassswordEmail;
