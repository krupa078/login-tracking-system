// frontend/src/components/RegisterForm.js
// Registration form: email + password.
import React, { useState } from "react";

function RegisterForm({ onRegistered }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirm) return;

    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.status === "REGISTERED") {
        setMessage(data.message || "Registered successfully.");
        if (onRegistered) {
          onRegistered(data);
        }
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Register error:", error);
      setMessage("Network or server error");
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
        placeholder="Enter password"
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
        Confirm Password:
      </label>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm password"
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
        {loading ? "Registering..." : "Register"}
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

export default RegisterForm;
