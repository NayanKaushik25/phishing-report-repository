"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { request } from "../lib/api";
import type { User, Role } from "../lib/types";

type DashboardLayoutProps = {
  user: User;
  role: Role;
  title: string;
  children: ReactNode;
};

export default function DashboardLayout({
  user,
  role,
  title,
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await request("/api/auth/logout", {
        method: "POST",
      });

      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role={role} />

      <div style={{ flex: 1, background: "#f9fafb" }}>
        <Header user={user} title={title} onLogout={handleLogout} />

        <main style={{ padding: "32px" }}>{children}</main>
      </div>
    </div>
  );
}
