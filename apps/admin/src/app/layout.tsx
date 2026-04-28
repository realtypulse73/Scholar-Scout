import { ReactNode } from 'react';

export const metadata = {
  title: 'ScholarScout Admin',
  description: 'Internal ScholarScout operations dashboard',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

