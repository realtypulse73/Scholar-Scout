import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

export const metadata = {
  title: 'ScholarScout',
  description: 'Scholarship matching platform',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Georgia, serif' }}>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
