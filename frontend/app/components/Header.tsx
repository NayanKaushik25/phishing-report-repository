"use client";

import type { User } from "../lib/types";

type HeaderProps = {
  user: User;
  title: string;
  onLogout: () => void;
};

export default function Header({ user, title, onLogout }: HeaderProps) {
  return (
    <header
      style={{
        height: "75px",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <h2 style={{ fontSize: "20px", color: "#111827" }}>{title}</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontWeight: 600, color: "#111827" }}>{user.name}</p>
          <p style={{ fontSize: "12px", color: "#6b7280" }}>{user.role}</p>
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: "9px 16px",
            background: "#fee2e2",
            color: "#991b1b",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
