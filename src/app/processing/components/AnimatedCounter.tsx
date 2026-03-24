'use client'

import { useState, useEffect, useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  className?: string
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const start = prevValue.current
    const end = value
    const duration = 500
    const startTime = Date.now()

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevValue.current = end
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return <span className={className}>{displayValue}</span>
}
