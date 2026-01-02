'use client'

import { VERSION } from '@/lib/version'

interface FooterProps {
  context?: string // e.g., "Audit for Acme Corp"
}

export function Footer({ context }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black text-white py-12 md:py-16">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">About this audit</h3>
            <p className="opacity-90 mb-4">
              This audit uses my proprietary messaging evaluation methodology, refined across 50+ B2B websites. The goal is simple: help you stop sounding like everyone else so buyers choose you for reasons other than price.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Questions?</h3>
            <p className="opacity-90 mb-4">
              <a href="mailto:hi@leefuhr.com" className="hover:underline">hi@leefuhr.com</a>
            </p>
            <p className="opacity-70 text-sm">
              Lee Fuhr · <a href="https://leefuhr.com" className="hover:underline">leefuhr.com</a>
            </p>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-8 text-sm text-center opacity-70 relative">
          <p>© {currentYear} Lee Fuhr Inc{context ? ` · ${context}` : ''}</p>
          <span className="absolute bottom-0 right-0 text-[10px] opacity-50 font-mono">v{VERSION}</span>
        </div>
      </div>
    </footer>
  )
}
