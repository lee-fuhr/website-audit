import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <head>
        <script async src="https://plausible.io/js/pa-MmvI_ybenMPTMiObP2XJo.js"></script>
        <script dangerouslySetInnerHTML={{__html: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
