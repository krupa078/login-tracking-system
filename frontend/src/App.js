// frontend/src/App.js
// Main App: registration + login + OTP + JWT + login history display.
import React, { useState } from "react";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import OtpForm from "./components/OtpForm";
import LoginHistory from "./components/LoginHistory";

function App() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("login"); // "login" | "otp" | "loggedIn"
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [backendMessage, setBackendMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [history, setHistory] = useState([]);
  const [token, setToken] = useState("");

  const handleLoginResponse = (response, loginEmail) => {
    setEmail(loginEmail);
    setBackendMessage(response.message || "");
    setDevOtp(response.devOtp || "");

    if (response.status === "OTP_REQUIRED") {
      setStep("otp");
    } else if (response.status === "LOGIN_SUCCESS") {
      if (response.token) {
        setToken(response.token);
        window.localStorage.setItem("authToken", response.token);
      }
      setStep("loggedIn");
      fetchHistory(response.token || token);
    }
  };

  const handleRegistered = (registerResponse) => {
    setBackendMessage(registerResponse.message || "Registered successfully.");
    if (registerResponse.email) {
      setEmail(registerResponse.email);
    }
    setMode("login");
  };

  const fetchHistory = async (tokenToUse) => {
    try {
      const effectiveToken = tokenToUse || token || window.localStorage.getItem("authToken");
      if (!effectiveToken) return;

      const res = await fetch("http://localhost:5000/api/auth/login-history", {
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
        },
      });
      const data = await res.json();
      if (data.status === "OK") {
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleOtpSuccess = (otpResponse) => {
    if (otpResponse.token) {
      setToken(otpResponse.token);
      window.localStorage.setItem("authToken", otpResponse.token);
    }
    setBackendMessage(otpResponse.message || "OTP verified. Logged in.");
    setStep("loggedIn");
    fetchHistory(otpResponse.token || token);
  };

  const handleLogout = () => {
    setEmail("");
    setToken("");
    setHistory([]);
    setBackendMessage("");
    setDevOtp("");
    setStep("login");
    setMode("login");
    window.localStorage.removeItem("authToken");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "0 auto",
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
          Login Tracking System
        </h2>
        <p style={{ fontSize: "14px", color: "#555", textAlign: "center" }}>
          Features:
          <br />
          - Registration with email + password.
          <br />
          - Login with JWT token.
          <br />
          - Chrome: requires OTP (via real email).
          <br />
          - Microsoft Edge: allowed without OTP.
          <br />
          - Mobile devices: allowed only between 10 AM and 1 PM (IST).
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            margin: "10px 0 15px",
          }}
        >
          <button
            onClick={() => {
              setMode("login");
              setStep("login");
              setBackendMessage("");
              setDevOtp("");
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: mode === "login" ? "2px solid #007bff" : "1px solid #ccc",
              background: mode === "login" ? "#e7f1ff" : "#fff",
              cursor: "pointer",
            }}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode("register");
              setStep("login");
              setBackendMessage("");
              setDevOtp("");
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: mode === "register" ? "2px solid #007bff" : "1px solid #ccc",
              background: mode === "register" ? "#e7f1ff" : "#fff",
              cursor: "pointer",
            }}
          >
            Register
          </button>
        </div>

        {backendMessage && (
          <div
            style={{
              margin: "10px 0",
              padding: "10px",
              borderRadius: "4px",
              background: "#e8f4ff",
              fontSize: "14px",
            }}
          >
            {backendMessage}
            {devOtp && (
              <div style={{ marginTop: "5px", fontSize: "12px", color: "#555" }}>
                <strong>Dev OTP (for testing):</strong> {devOtp}
              </div>
            )}
          </div>
        )}

        {step === "login" && mode === "login" && (
          <LoginForm onLoginResponse={handleLoginResponse} />
        )}

        {step === "login" && mode === "register" && (
          <RegisterForm onRegistered={handleRegistered} />
        )}

        {step === "otp" && (
          <OtpForm email={email} onOtpSuccess={handleOtpSuccess} />
        )}

        {step === "loggedIn" && (
          <>
            <div
              style={{
                margin: "10px 0",
                padding: "8px",
                borderRadius: "4px",
                background: "#e7ffe8",
                fontSize: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>
                Logged in as <strong>{email}</strong>
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  background: "#dc3545",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Logout
              </button>
            </div>
            <LoginHistory history={history} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
