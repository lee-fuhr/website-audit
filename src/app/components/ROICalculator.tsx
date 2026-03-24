'use client'

import { useState } from 'react'

interface ROICalculatorProps {
  toolCost: number
}

export function ROICalculator({ toolCost }: ROICalculatorProps) {
  const [dealValue, setDealValue] = useState(250000)
  const [oppsPerYear, setOppsPerYear] = useState(20)
  const presets = [100000, 250000, 500000, 1000000, 2500000]
  const oppsOptions = [10, 20, 30, 50]

  // Calculate total opportunity and ROI from winning just 1 more
  const totalOpportunity = oppsPerYear * dealValue
  const additionalRevenue = dealValue // Win 1 more deal
  const roi = Math.round(additionalRevenue / toolCost)
  const formatK = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`

  return (
    <section className="px-4 md:px-8 lg:px-12 py-16 bg-[var(--accent)]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-white/80 text-sm font-bold mb-6 flex items-center justify-center gap-2">
          THE MATH
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" className="w-4 h-4" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.167 0.917c-0.017 4.187 2.019 6.563 6.667 6.666-4.31-0.017-6.448 2.294-6.667 6.667-0.042-4.125-1.885-6.673-6.667-6.667 4.277-0.06 6.65-2.125 6.667-6.666Z"/>
          </svg>
        </p>

        <p className="text-[var(--accent-foreground)] text-xl md:text-2xl leading-relaxed mb-4">
          You bid on{' '}
          <span className="inline-flex items-center gap-2">
            <select
              value={oppsPerYear}
              onChange={(e) => setOppsPerYear(Number(e.target.value))}
              className="bg-white text-[var(--accent)] px-3 py-1 font-bold text-xl md:text-2xl border-2 border-white cursor-pointer"
            >
              {oppsOptions.map((opps) => (
                <option key={opps} value={opps}>{opps}</option>
              ))}
            </select>
          </span>
          {' '}projects a year at{' '}
          <span className="inline-flex items-center gap-2">
            <select
              value={dealValue}
              onChange={(e) => setDealValue(Number(e.target.value))}
              className="bg-white text-[var(--accent)] px-3 py-1 font-bold text-xl md:text-2xl border-2 border-white cursor-pointer"
            >
              {presets.map((preset) => (
                <option key={preset} value={preset}>{formatK(preset)}</option>
              ))}
            </select>
          </span>
          {' '}each.{' '}
          <span className="text-white/80">({formatK(totalOpportunity)} in play)</span>
        </p>

        <p className="text-[var(--accent-foreground)] text-xl md:text-2xl leading-relaxed">
          Win just <span className="text-white font-bold">one more</span> because your website finally stands out?{' '}
          <span className="text-white font-bold">{formatK(additionalRevenue)}</span> →{' '}
          <span className="text-white font-bold">{roi.toLocaleString()}× ROI</span>.
        </p>
      </div>
    </section>
  )
}
