// backend/server.js
// Express + MongoDB backend for login tracking with registration, password, JWT and OTP rules.

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UAParser = require("ua-parser-js");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.set("trust proxy", 1);
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://login-tracking-system.vercel.app",
    "https://login-tracking-system-4aojd2xpp-kona-krupamanis-projects.vercel.app",
    "https://login-tracking-system-git-main-kona-krupamanis-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());

// ============ DATABASE CONNECTION ============
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/login_tracking", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ============ MODELS ============

// Login history schema
const loginHistorySchema = new mongoose.Schema({
  email: { type: String, required: true },
  browser: String,
  os: String,
  deviceType: String,
  ip: String,
  time: { type: Date, default: Date.now },
});

const LoginHistory = mongoose.model("LoginHistory", loginHistorySchema);

// User schema with password + OTP
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    otp: String,
    otpExpiresAt: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ============ EMAIL (OTP) TRANSPORTER ============
// Configure real email sending using Gmail or any SMTP provider.
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: send OTP email
async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Your Login OTP",
    text: `Your OTP for login is: ${otp}. It is valid for 10 minutes.`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("📧 OTP email sent:", info.response || info.messageId || info);
}

// Helper: get current hour in Asia/Kolkata
function getCurrentHourInIST() {
  const now = new Date();
  const options = { timeZone: "Asia/Kolkata", hour12: false, hour: "numeric" };
  const hourString = new Intl.DateTimeFormat("en-IN", options).format(now);
  return parseInt(hourString, 10);
}

// Helper: create JWT
function createToken(user) {
  const payload = { userId: user._id, email: user.email };
  const secret = process.env.JWT_SECRET || "dev_secret_change_me";
  return jwt.sign(payload, secret, { expiresIn: "2h" });
}

// Auth middleware for protected routes
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "UNAUTHORIZED", message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT error:", error.message);
    return res.status(401).json({ status: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}

// ============ ROUTES ============

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: "ERROR", message: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "User already exists. Please login." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
    });

    return res.json({
      status: "REGISTERED",
      message: "User registered successfully. You can now login.",
      email: user.email,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ status: "ERROR", message: "Server error" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, userAgent } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "User not found. Please register first." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || "");
    if (!isMatch) {
      return res.status(400).json({ status: "ERROR", message: "Invalid password" });
    }

    // Either use userAgent sent from frontend, or parse server-side UA string
    let browser, os, deviceType;

    if (userAgent && userAgent.browser && userAgent.os) {
      browser = userAgent.browser.name || "Unknown";
      os = userAgent.os.name || "Unknown";
      deviceType = userAgent.device && userAgent.device.type ? userAgent.device.type : "desktop";
    } else {
      const parser = new UAParser(req.headers["user-agent"]);
      const result = parser.getResult();
      browser = result.browser.name || "Unknown";
      os = result.os.name || "Unknown";
      deviceType = result.device.type || "desktop";
    }

    // Get IP address
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const ip = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : "";

    // Save login history (attempt)
    await LoginHistory.create({
      email,
      browser,
      os,
      deviceType,
      ip,
      time: new Date(),
    });

    // First: mobile device time restriction
    if (deviceType === "mobile") {
      const currentHourIST = getCurrentHourInIST();

      // Allow only between 10 (10:00) and 13 (12:59)
      if (currentHourIST < 10 || currentHourIST >= 13) {
        return res.json({
          status: "DENIED_TIME",
          message: "Mobile login allowed only between 10 AM and 1 PM (IST).",
        });
      }
    }

    // Browser-specific rules
    const browserName = (browser || "").toLowerCase();

    // Chrome → OTP required
    if (browserName.includes("chrome") && !browserName.includes("edge")) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      await sendOtpEmail(email, otp);
      console.log(`🔐 OTP for ${email}: ${otp}`);

      return res.json({
        status: "OTP_REQUIRED",
        message: "Chrome login detected. OTP sent to your email.",
        devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    }

    // Edge → allow without OTP
    if (browserName.includes("edge") || browserName.includes("microsoft edge")) {
      const token = createToken(user);
      return res.json({
        status: "LOGIN_SUCCESS",
        message: "Microsoft Edge login allowed without OTP.",
        token,
      });
    }

    // Default: allow login
    const token = createToken(user);
    return res.json({
      status: "LOGIN_SUCCESS",
      message: "Login allowed.",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: "ERROR", message: "Server error" });
  }
});

// POST /api/auth/verify-otp
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: "ERROR", message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.otp || !user.otpExpiresAt) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "No OTP found. Please login again." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ status: "ERROR", message: "Invalid OTP" });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ status: "ERROR", message: "OTP expired. Please login again." });
    }

    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = createToken(user);

    return res.json({
      status: "LOGIN_SUCCESS",
      message: "OTP verified. Login successful.",
      token,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ status: "ERROR", message: "Server error" });
  }
});

// GET /api/auth/login-history
app.get("/api/auth/login-history", authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;

    const history = await LoginHistory.find({ email }).sort({ time: -1 }).limit(50);
    return res.json({ status: "OK", data: history });
  } catch (error) {
    console.error("Login history error:", error);
    res.status(500).json({ status: "ERROR", message: "Server error" });
  }
});

// ============ START SERVER ============
app.get("/", (req, res) => {
  res.send("Login tracking backend is running.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
});
;
