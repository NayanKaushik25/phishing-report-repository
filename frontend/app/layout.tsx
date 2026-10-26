import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalDesk | Phishing Intelligence",
  description: "Investigate and manage phishing reports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
