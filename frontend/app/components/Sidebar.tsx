"use client";

import Link from "next/link";
import type { Role } from "../lib/types";

type SidebarProps = {
  role: Role;
};

const navigation = {
  REPORTER: [
    { label: "Overview", href: "/reporter" },
    { label: "My Reports", href: "/reporter/reports" },
    { label: "Submit Report", href: "/reporter/submit" },
  ],
  ANALYST: [
    { label: "Overview", href: "/analyst" },
    { label: "All Reports", href: "/analyst/reports" },
    { label: "Investigation", href: "/analyst/investigation" },
    { label: "Semantic Search", href: "/analyst/search" },
  ],
  ADMIN: [
    { label: "Overview", href: "/admin" },
    { label: "All Reports", href: "/admin/reports" },
    { label: "Analyst Management", href: "/admin/analysts" },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  return (
    <aside
      style={{
        width: "250px",
        minHeight: "100vh",
        padding: "30px 20px",
        background: "#111827",
        color: "white",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginBottom: "8px" }}>PhishGuard</h2>

      <p
        style={{
          color: "#9ca3af",
          fontSize: "12px",
          marginBottom: "35px",
        }}
      >
        {role} WORKSPACE
      </p>

      <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {navigation[role].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              color: "#e5e7eb",
              textDecoration: "none",
              padding: "12px",
              borderRadius: "6px",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
