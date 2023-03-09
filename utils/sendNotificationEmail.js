const sendEmail = require("./sendEmail");

const sendNotificationEmail = async (to, message, mailSubject) => {
  const footer = "<br><p>Thanks,<br>XR Couture</p>";

  return sendEmail({
    to,
    subject: mailSubject,
    html: `<h4>Hello</h4>
   ${message}
   ${footer}
   `,
  });
};

module.exports = sendNotificationEmail;
