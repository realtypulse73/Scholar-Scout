import './globals.css'

export const metadata = {
  title: 'ScholarScout',
  description: 'Rejection-free post-secondary discovery'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
