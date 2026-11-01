"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { request } from "../lib/api";
import type { User } from "../lib/types";

import DashboardLayout from "../components/DashboardLayout";

export default function ReporterDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/api/auth/me")
      .then((data) => {
        if (data.user.role !== "REPORTER") {
          router.replace("/");
          return;
        }

        setUser(data.user);
      })
      .catch(() => router.replace("/"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user} role="REPORTER" title="Overview">
      <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
        Welcome, {user.name}!
      </h1>

      <p style={{ color: "#6b7280" }}>
        Here's an overview of your phishing reports.
      </p>
    </DashboardLayout>
  );
}
