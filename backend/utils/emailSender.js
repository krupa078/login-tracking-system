const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, message) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: `<p>${message}</p>`,
    });

    console.log("Email sent:", to);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

module.exports = sendEmail;
