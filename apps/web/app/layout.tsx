import type { Metadata } from 'next';
import localFont from 'next/font/local';
import AuthSessionProvider from '@/components/auth/AuthSessionProvider';
import './globals.css';

const spaceGrotesk = localFont({
  src: './fonts/SpaceGrotesk-Variable.ttf',
  weight: '300 700',
  variable: '--font-space-grotesk',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
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
        className={`${spaceGrotesk.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
