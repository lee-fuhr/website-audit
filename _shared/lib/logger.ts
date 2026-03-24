// Structured logger for all lfi-tools
// Replaces bare console.log in API routes
// Bible Rule XII: observe everything
// Why: webhook and API routes were using bare console.log with no context. Structured format enables log aggregation (Vercel log drains, Datadog) and makes errors grep-able.

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  tool?: string
  fn?: string
  [key: string]: unknown
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }
  // In production, emit JSON for log aggregators
  // In development, pretty-print for readability
  if (process.env.NODE_ENV === 'production') {
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](JSON.stringify(entry))
  } else {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, message, context ?? '')
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
  debug: (message: string, context?: LogContext) => log('debug', message, context),
}
