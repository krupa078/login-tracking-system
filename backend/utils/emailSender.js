const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("Email sent:", response);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}

module.exports = sendEmail;
