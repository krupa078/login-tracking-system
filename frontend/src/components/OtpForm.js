// frontend/src/components/OtpForm.js
// OTP form: used after Chrome login.
import React, { useState } from "react";

function OtpForm({ email, onOtpSuccess }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setMessage("");

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (data.status === "LOGIN_SUCCESS") {
        setMessage(data.message || "OTP verified!");
        if (onOtpSuccess) {
          onOtpSuccess(data);
        }
      } else {
        setMessage(data.message || "OTP verification failed");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setMessage("Network or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} style={{ marginTop: "15px" }}>
      <label
        style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
      >
        Enter OTP (sent to {email}):
      </label>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="6-digit OTP"
        maxLength={6}
        required
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "4px",
          border: "none",
          background: "#28a745",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
      {message && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px",
            borderRadius: "4px",
            background: "#f8f9fa",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      )}
    </form>
  );
}

export default OtpForm;
