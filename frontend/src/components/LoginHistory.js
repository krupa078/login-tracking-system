// frontend/src/components/LoginHistory.js
// Shows the login history table for the logged-in user.
import React from "react";

function LoginHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ marginTop: "20px", fontSize: "14px" }}>
        No login history found.
      </div>
    );
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ marginBottom: "10px" }}>Login History</h3>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={thStyle}>Time (IST)</th>
              <th style={thStyle}>Browser</th>
              <th style={thStyle}>OS</th>
              <th style={thStyle}>Device</th>
              <th style={thStyle}>IP</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item._id}>
                <td style={tdStyle}>
                  {new Date(item.time).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </td>
                <td style={tdStyle}>{item.browser}</td>
                <td style={tdStyle}>{item.os}</td>
                <td style={tdStyle}>{item.deviceType}</td>
                <td style={tdStyle}>{item.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "8px",
  borderBottom: "1px solid #ddd",
  textAlign: "left",
};

const tdStyle = {
  padding: "8px",
  borderBottom: "1px solid #eee",
};

export default LoginHistory;
