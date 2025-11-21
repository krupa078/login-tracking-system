const sendEmail = require("../utils/emailSender");
// Generate OTP
const otp = Math.floor(100000 + Math.random() * 900000);

// Save OTP in DB
user.loginOtp = otp;
user.otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 mins expiry
await user.save();

// Send OTP using Resend
await sendEmail(
  email,
  "Your Login OTP",
  `Your OTP for login is: <b>${otp}</b>`
);

return res.json({
  status: "OTP_SENT",
  message: "OTP sent to your email",
});
