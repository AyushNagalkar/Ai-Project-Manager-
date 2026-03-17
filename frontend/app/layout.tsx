import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AgentSidebar from './components/AgentSidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartPM - AI Project Manager',
  description: 'Agentic AI Project Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} page-bg`}>
        <AgentSidebar />
        <main className="min-h-screen" style={{ paddingLeft: 'var(--sidebar-width, 260px)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
