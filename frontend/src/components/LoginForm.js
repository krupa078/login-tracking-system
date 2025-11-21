// frontend/src/components/LoginForm.js
// Login form: collects email + password and sends login request with device details.
import React, { useState } from "react";
import UAParser from "ua-parser-js";

function LoginForm({ onLoginResponse }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);

    try {
      // Detect browser, OS, device using UAParser on frontend
      const parser = new UAParser();
      const deviceInfo = parser.getResult();
      const API_URL = process.env.REACT_APP_API_URL;

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          userAgent: deviceInfo,
        }),
      });

      const data = await res.json();
      onLoginResponse(data, email);
    } catch (error) {
      console.error("Login error:", error);
      onLoginResponse(
        { status: "ERROR", message: "Network or server error" },
        email
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label
        style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
      >
        Email:
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      />

      <label
        style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
      >
        Password:
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
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
          background: "#007bff",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

export default LoginForm;
