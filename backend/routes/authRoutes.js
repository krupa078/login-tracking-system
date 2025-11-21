const sendEmail = require("../utils/emailSender");

// inside OTP logic:
await sendEmail(
  email,
  "Your Login OTP",
  `<p>Your OTP is <b>${otp}</b></p>`
);
