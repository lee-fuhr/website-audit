import type { Metadata } from 'next'
import { Albert_Sans, Literata, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const albertSans = Albert_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-display',
  display: 'swap',
})

const literata = Literata({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Website Messaging Audit | Lee Fuhr',
  description: 'A comprehensive analysis of your website messaging and positioning.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${albertSans.variable} ${literata.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script async src="https://plausible.io/js/pa-MmvI_ybenMPTMiObP2XJo.js"></script>
        <script dangerouslySetInnerHTML={{__html: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
