import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wedding Photo Wall',
  description: 'Share your wedding memories',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#f0ece6' }}>
        {children}
      </body>
    </html>
  )
}
