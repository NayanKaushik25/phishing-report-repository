"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { request } from "../lib/api";
import type { User } from "../lib/types";

import DashboardLayout from "../components/DashboardLayout";

export default function AnalystDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/api/auth/me")
      .then((data) => {
        if (data.user.role !== "ANALYST") {
          router.replace("/");
          return;
        }

        setUser(data.user);
      })
      .catch(() => router.replace("/"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <p>Loading dashboard...</p>;
  if (!user) return null;

  return (
    <DashboardLayout user={user} role="ANALYST" title="Overview">
      <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
        Welcome, {user.name}!
      </h1>

      <p style={{ color: "#6b7280" }}>
        Monitor phishing reports and manage investigations.
      </p>
    </DashboardLayout>
  );
}
