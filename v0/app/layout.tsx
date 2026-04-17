import type { Metadata } from 'next'
import { Outfit, Share_Tech_Mono } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' })
const shareTechMono = Share_Tech_Mono({ subsets: ['latin'], weight: '400', variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'NeonBeat — Browser Rhythm Game',
  description: 'A falling-note rhythm game playable in the browser. 6 lanes, keyboard & touch input.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${outfit.variable} ${shareTechMono.variable} bg-background`}>
      <body className="font-sans antialiased overflow-hidden">
        {children}
      </body>
    </html>
  )
}
