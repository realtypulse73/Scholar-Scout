import type { Metadata } from "next";
import localFont from "next/font/local";
import AuthSessionProvider from "@/components/auth/AuthSessionProvider";
import AmbientCampusBackdrop from "@/components/layout/AmbientCampusBackdrop";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ScholarScout – Find Your Path",
  description:
    "A rejection-free post-secondary discovery platform that matches students with programmes that fit their goals, budget, and life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AmbientCampusBackdrop />
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
