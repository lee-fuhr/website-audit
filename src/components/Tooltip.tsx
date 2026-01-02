'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    // Show tooltip after 150ms delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      // Small delay to ensure DOM is ready before fade in
      requestAnimationFrame(() => {
        setShowContent(true)
      })
    }, 150)
  }

  const handleMouseLeave = () => {
    // Clear pending show timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    // Start fade out
    setShowContent(false)
    // Hide element after fade completes
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <span
          className={`
            absolute z-50 px-3 py-2 text-xs font-normal normal-case tracking-normal
            bg-gray-900 text-white rounded shadow-lg whitespace-normal
            max-w-xs left-1/2 -translate-x-1/2
            transition-opacity duration-150 ease-in-out
            ${showContent ? 'opacity-100' : 'opacity-0'}
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
          style={{ minWidth: '200px' }}
        >
          {content}
          {/* Arrow */}
          <span
            className={`
              absolute left-1/2 -translate-x-1/2 w-0 h-0
              border-l-4 border-r-4 border-transparent
              ${position === 'top'
                ? 'top-full border-t-4 border-t-gray-900'
                : 'bottom-full border-b-4 border-b-gray-900'}
            `}
          />
        </span>
      )}
    </span>
  )
}
