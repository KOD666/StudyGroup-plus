import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyGroup+",
  description: "Collaborative Study Group Workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
