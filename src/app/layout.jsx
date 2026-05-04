import './globals.css'

export const metadata = {
  title: 'CampusCare — You\'re Not Alone',
  description: 'AI-powered student wellbeing support for Indian colleges. Share how you feel during placement season — a real counsellor will call you.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
