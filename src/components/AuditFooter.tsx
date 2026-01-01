'use client'

const VERSION = '0.4.0'

export function AuditFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black text-white py-8">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm relative">
          <p className="opacity-70">
            © {currentYear} Lee Fuhr Inc
          </p>
          <div className="flex items-center gap-6 opacity-70">
            <a href="https://leefuhr.com" className="hover:underline">leefuhr.com</a>
            <a href="mailto:hi@leefuhr.com" className="hover:underline">hi@leefuhr.com</a>
          </div>
          <span className="absolute bottom-0 right-0 text-[10px] opacity-50 font-mono">v{VERSION}</span>
        </div>
      </div>
    </footer>
  )
}
